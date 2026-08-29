const fs = require('fs')
const path = require('path')

const TOTAL_FILAS = 120000
const OUTPUT = path.join(__dirname, '../../catalogo-prueba.csv')

const categorias = ['ropa', 'Ropa', 'ROPA', 'hogar', 'Hogar', 'electronica', 'Electronica', 'deportes', 'Deportes', 'juguetes']
const productosBase = [
  'Camiseta', 'Taza cerámica', 'Audífonos BT', 'Zapatos deportivos', 'Pelota de fútbol',
  'Lámpara LED', 'Mochila escolar', 'Reloj digital', 'Gafas de sol', 'Silla ergonómica',
  'Teclado mecánico', 'Mouse gamer', 'Monitor 27"', 'Botella térmica', 'Chaqueta polar'
]
const atributos = ['Pro', 'Ultra', 'Max', 'Plus', 'Classic', 'Sport', 'Premium', 'Eco', 'Elite']
const colores = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris', 'Plata']

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomCategoria() {
  // ~1% vacía (inválida)
  if (Math.random() < 0.01) return ''
  const cat = categorias[randomInt(0, categorias.length - 1)]
  // Suciedad: espacios extra, mayúsculas inconsistentes (normalizables)
  const variantes = [cat, cat.toUpperCase(), cat.toLowerCase(), `  ${cat}  `]
  return variantes[randomInt(0, variantes.length - 1)]
}

function randomNombre(index) {
  // ~1% vacío (inválido)
  if (Math.random() < 0.01) return ''
  const prod = productosBase[randomInt(0, productosBase.length - 1)]
  const atr = atributos[randomInt(0, atributos.length - 1)]
  const col = colores[randomInt(0, colores.length - 1)]
  const base = `${prod} ${atr} ${col} #${index}`
  // Suciedad: espacios extra, mayúsculas inconsistentes (normalizables)
  const variantes = [base, base.toUpperCase(), base.toLowerCase(), `  ${base}  `, base.replace(' ', '   ')]
  return variantes[randomInt(0, variantes.length - 1)]
}

function randomPrecio() {
  const r = Math.random()
  if (r < 0.01) return ''                          // ~1% vacío (inválido)
  if (r < 0.02) return 'abc'                       // ~1% texto (inválido)
  if (r < 0.03) return `-${randomInt(1, 100)}`     // ~1% negativo (inválido)
  // ~97% válido: normalizable con decimales variables
  return (Math.random() * 500).toFixed(randomInt(0, 4))
}

function randomStock() {
  const r = Math.random()
  if (r < 0.01) return ''                          // ~1% vacío (inválido)
  if (r < 0.02) return randomInt(-50, -1)          // ~1% negativo (inválido)
  // ~98% válido
  return randomInt(0, 1000)
}

function randomImagenUrl() {
  const r = Math.random()
  if (r < 0.04) return 'url-invalida'              // ~4% URL inválida (advertencia, no rechazo)
  if (r < 0.40) return `https://cdn.demo.com/img/sku-${randomInt(1, 9999)}.jpg`
  return ''                                        // ~60% vacía (opcional)
}

function generarSku(index) {
  const r = Math.random()
  if (r < 0.01) return ''                          // ~1% vacío (inválido)
  if (r < 0.025 && index > 10) {
    // ~1.5% duplicados intencionales
    return `SKU-${randomInt(1, Math.min(index - 1, 500))}`
  }
  // ~97.5% válido con suciedad: minúsculas, espacios (normalizables)
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
  const sku = generarSku(i)
  const nombre = randomNombre(i)
  const precio = randomPrecio()
  const stock = randomStock()
  const categoria = randomCategoria()
  const descripcion = randomInt(0, 1) === 0 ? `Descripción del producto ${i}` : ''
  const imagenUrl = randomImagenUrl()

  stream.write(`${sku},${nombre},${precio},${stock},${categoria},${descripcion},${imagenUrl}\n`)
}

stream.end(() => {
  console.log(`✓ Archivo generado: ${OUTPUT}`)
})