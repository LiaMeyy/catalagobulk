require('dotenv').config()
require('../config/env')

const { Worker } = require('bullmq')
const mongoose = require('mongoose')
const fs = require('fs')
const readline = require('readline')
const { redisClient, conectarRedis } = require('../config/redis')
const { MONGO_URI, BATCH_SIZE, IMPORT_ERRORS_CAP } = require('../config/env')
const ImportJob = require('../modules/imports/importJob.model')
const Producto = require('../modules/productos/producto.model')
const Categoria = require('../modules/categorias/categoria.model')

// ── Validación ──────────────────────────────────────────────────────────────
function esUrlValida(url) {
  return /^https?:\/\/.+/.test(url)
}

function validarFila(fila, index) {
  const errores = []

  if (!fila.sku || !fila.sku.trim()) errores.push('sku vacío')
  if (!fila.nombre || !fila.nombre.trim()) errores.push('nombre vacío')
  if (fila.precio === '' || isNaN(Number(fila.precio)) || Number(fila.precio) < 0) errores.push('precio inválido')
  if (fila.stock === '' || isNaN(Number(fila.stock)) || Number(fila.stock) < 0) errores.push('stock inválido')
  if (!fila.categoria || !fila.categoria.trim()) errores.push('categoria vacía')

  return errores
}

// ── Normalización ────────────────────────────────────────────────────────────
function normalizarFila(fila, proveedorId) {
  const imagenUrl = fila.imagenUrl && fila.imagenUrl.trim() && esUrlValida(fila.imagenUrl.trim())
    ? fila.imagenUrl.trim()
    : null

  const descripcion = fila.descripcion && fila.descripcion.trim()
    ? fila.descripcion.trim()
    : null

  const stock = Math.trunc(Number(fila.stock))

  return {
    sku: fila.sku.trim().toUpperCase(),
    nombre: fila.nombre.trim().replace(/\s+/g, ' '),
    precio: Math.round(Number(fila.precio) * 100) / 100,
    stock,
    categoria: fila.categoria.trim().toLowerCase(),
    descripcion,
    imagenUrl,
    proveedorId,
    disponible: stock > 0,
  }
}

function parseCSVLine(line) {
  const result = []
  let start = 0
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      let val = line.substring(start, i).trim()
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.substring(1, val.length - 1).replace(/""/g, '"')
      }
      result.push(val)
      start = i + 1
    }
  }
  let val = line.substring(start).trim()
  if (val.startsWith('"') && val.endsWith('"')) {
    val = val.substring(1, val.length - 1).replace(/""/g, '"')
  }
  result.push(val)
  return result
}

// ── Parsear CSV ──────────────────────────────────────────────────────────────
async function* leerCSV(ruta) {
  const rl = readline.createInterface({ input: fs.createReadStream(ruta), crlfDelay: Infinity })
  let headers = null
  for await (const line of rl) {
    if (!line.trim()) continue
    if (!headers) { headers = parseCSVLine(line); continue }
    const valores = parseCSVLine(line)
    const fila = {}
    headers.forEach((h, i) => { fila[h.trim()] = valores[i] !== undefined ? valores[i] : '' })
    yield fila
  }
}

// ── Parsear JSON ─────────────────────────────────────────────────────────────
async function* leerJSON(ruta) {
  const contenido = fs.readFileSync(ruta, 'utf8')
  const data = JSON.parse(contenido)
  for (const fila of data) yield fila
}

// ── Procesar job ─────────────────────────────────────────────────────────────
async function procesarImport(job) {
  const { importJobId, archivoRuta, proveedorId } = job.data

  await ImportJob.findByIdAndUpdate(importJobId, {
    estado: 'processing',
    startedAt: new Date(),
  })

  const ext = archivoRuta.split('.').pop().toLowerCase()
  const generador = ext === 'csv' ? leerCSV(archivoRuta) : leerJSON(archivoRuta)

  let procesados = 0
  let exitosos = 0
  let fallidos = 0
  let errores = []
  let lote = []
  const skusVistos = new Set()
  const categoriasNuevas = new Set()

  for await (const fila of generador) {
    procesados++
    const numFila = procesados
    const erroresFila = validarFila(fila, numFila)

    if (erroresFila.length > 0) {
      fallidos++
      if (errores.length < IMPORT_ERRORS_CAP) {
        errores.push({ fila: numFila, sku: fila.sku || null, motivo: erroresFila.join(', ') })
      }
      continue
    }

    const skuNorm = fila.sku.trim().toUpperCase()

    // Duplicado dentro del archivo
    if (skusVistos.has(skuNorm)) {
      fallidos++
      if (errores.length < IMPORT_ERRORS_CAP) {
        errores.push({ fila: numFila, sku: skuNorm, motivo: 'sku duplicado' })
      }
      continue
    }
    skusVistos.add(skuNorm)

    // Advertencia imagenUrl inválida
    if (fila.imagenUrl && fila.imagenUrl.trim() && !esUrlValida(fila.imagenUrl.trim())) {
      if (errores.length < IMPORT_ERRORS_CAP) {
        errores.push({ fila: numFila, sku: skuNorm, motivo: 'imagenUrl inválida, ignorada' })
      }
    }

    const producto = normalizarFila(fila, proveedorId)
    categoriasNuevas.add(producto.categoria)
    lote.push(producto)

    // Insertar por lotes
    if (lote.length >= BATCH_SIZE) {
      const resultado = await insertarLote(lote, errores, fallidos, numFila, IMPORT_ERRORS_CAP)
      exitosos += resultado.exitosos
      fallidos += resultado.fallidos
      errores = resultado.errores
      lote = []

      // Reportar progreso
      await ImportJob.findByIdAndUpdate(importJobId, { procesados, exitosos, fallidos, errores })
      await job.updateProgress({ importJobId, procesados, exitosos, fallidos })
    }
  }

  // Lote final
  if (lote.length > 0) {
    const resultado = await insertarLote(lote, errores, fallidos, procesados, IMPORT_ERRORS_CAP)
    exitosos += resultado.exitosos
    fallidos += resultado.fallidos
    errores = resultado.errores
  }

  // Upsert categorías nuevas
  for (const slug of categoriasNuevas) {
    const nombre = slug.charAt(0).toUpperCase() + slug.slice(1)
    await Categoria.findOneAndUpdate(
      { slug },
      { $setOnInsert: { slug, nombre, descripcion: null, imagenUrl: null } },
      { upsert: true }
    )
  }

  await ImportJob.findByIdAndUpdate(importJobId, {
    estado: 'completed',
    total: procesados,
    procesados,
    exitosos,
    fallidos,
    errores,
    finishedAt: new Date(),
  })

  return { importJobId, procesados, exitosos, fallidos }
}

async function insertarLote(lote, errores, fallidos, numFila, cap) {
  try {
    await Producto.insertMany(lote, { ordered: false })
    return { exitosos: lote.length, fallidos, errores }
  } catch (err) {
    let exitososLote = lote.length
    if (err.writeErrors) {
      for (const we of err.writeErrors) {
        exitososLote--
        fallidos++
        const prod = lote[we.index]
        if (errores.length < cap) {
          errores.push({ fila: numFila, sku: prod?.sku || null, motivo: 'sku duplicado' })
        }
      }
    }
    return { exitosos: exitososLote, fallidos, errores }
  }
}

// ── Arrancar worker ──────────────────────────────────────────────────────────
async function start() {
  await mongoose.connect(MONGO_URI)
  console.log('✓ Worker: MongoDB conectado')

  await conectarRedis()
  console.log('✓ Worker: Redis conectado')

  const worker = new Worker('import', procesarImport, {
    connection: redisClient,
    concurrency: 1,
  })

  worker.on('completed', (job) => console.log(`✓ Job ${job.id} completado`))
  worker.on('failed', (job, err) => console.error(`✗ Job ${job.id} falló:`, err.message))

  console.log('✓ Worker escuchando jobs de importación...')
}

start().catch((err) => {
  console.error('Error arrancando worker:', err)
  process.exit(1)
})