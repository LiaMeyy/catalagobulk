const fs = require('fs')
const path = require('path')

const TOTAL_FILAS = 120000
const OUTPUT = path.join(__dirname, '../../catalogo-prueba.csv')

const categorias = ['ropa', 'Ropa', 'ROPA', 'hogar', 'Hogar', 'electronica', 'Electronica', 'deportes', 'Deportes', 'juguetes']
const nombres = ['Camiseta azul', 'Taza cerámica', 'Audífonos BT', 'Zapatos deportivos', 'Pelota de fútbol', 'Lámpara LED', 'Mochila escolar', 'Reloj digital', 'Gafas de sol', 'Silla ergonómica']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomCategoria() {
  return categorias[randomInt(0, categorias.length - 1)]
}

function randomNombre() {
  const base = nombres[randomInt(0, nombres.length - 1)]
  // Suciedad: espacios extra, mayúsculas inconsistentes
  const variantes = [base, base.toUpperCase(), base.toLowerCase(), `  ${base}  `, base.replace(' ', '   ')]
  return variantes[randomInt(0, variantes.length - 1)]
}

function randomPrecio() {
  const tipo = randomInt(0, 5)
  if (tipo === 0) return ''                          // vacío (inválido)
  if (tipo === 1) return 'abc'                       // texto (inválido)
  if (tipo === 2) return `-${randomInt(1, 100)}`     // negativo (inválido)
  return (Math.random() * 500).toFixed(randomInt(0, 4)) // válido con decimales variables
}

function randomStock() {
  const tipo = randomInt(0, 4)
  if (tipo === 0) return ''                          // vacío (inválido)
  if (tipo === 1) return randomInt(-10, -1)          // negativo (inválido)
  return randomInt(0, 1000)
}

function randomImagenUrl() {
  const tipo = randomInt(0, 4)
  if (tipo === 0) return ''
  if (tipo === 1) return 'url-invalida'              // URL inválida (advertencia)
  if (tipo === 2) return `https://cdn.demo.com/img/sku-${randomInt(1, 9999)}.jpg`
  return ''
}

function generarSku(index) {
  // ~5% duplicados
  if (randomInt(1, 20) === 1) return `SKU-${randomInt(1, 500)}`
  // Suciedad: minúsculas, espacios
  const variantes = [
    `SKU-${index}`,
    `sku-${index}`,
    ` SKU-${index} `,
    `Sku-${index}`,
  ]
  return variantes[randomInt(0, variantes.length - 1)]
}

console.log(`Generando ${TOTAL_FILAS} filas en ${OUTPUT}...`)

const stream = fs.createWriteStream(OUTPUT)
stream.write('sku,nombre,precio,stock,categoria,descripcion,imagenUrl\n')

for (let i = 1; i <= TOTAL_FILAS; i++) {
  // ~3% filas con sku vacío (inválido)
  const sku = randomInt(1, 33) === 1 ? '' : generarSku(i)
  const nombre = randomInt(1, 20) === 1 ? '' : randomNombre()
  const precio = randomPrecio()
  const stock = randomStock()
  const categoria = randomInt(1, 20) === 1 ? '' : randomCategoria()
  const descripcion = randomInt(0, 1) === 0 ? `Descripción del producto ${i}` : ''
  const imagenUrl = randomImagenUrl()

  stream.write(`${sku},${nombre},${precio},${stock},${categoria},${descripcion},${imagenUrl}\n`)
}

stream.end(() => {
  console.log(`✓ Archivo generado: ${OUTPUT}`)
})