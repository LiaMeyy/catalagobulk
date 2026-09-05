const fs = require('fs')
const path = require('path')

const TOTAL_FILAS = 120000
const OUTPUT = path.join(__dirname, 'catalogo-prueba.csv')

const proveedores = ['acme-corp', 'bina', 'nbc']

const categorias = ['ropa', 'hogar', 'electronica', 'deportes', 'juguetes']

// Imágenes reales de Unsplash por categoría
const imagenesPorCategoria = {
  ropa: [
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400',
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400',
  ],
  hogar: [
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=400',
    'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    'https://images.unsplash.com/photo-1550581190-9c1c48d21d6c?w=400',
  ],
  electronica: [
    'https://images.unsplash.com/photo-1585298723682-7115561c51b7?w=400',
    'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400',
    'https://images.unsplash.com/photo-1593344484962-796055d4a3a4?w=400',
    'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=400',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
  ],
  deportes: [
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400',
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
    'https://images.unsplash.com/photo-1593164842264-854604db2260?w=400',
  ],
  juguetes: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400',
    'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400',
    'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400',
    'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=400',
    'https://images.unsplash.com/photo-1563901935883-cb61f5d49be4?w=400',
  ],
}

const productosPorCategoria = {
  ropa: ['Camiseta', 'Camisa', 'Pantalón', 'Chaqueta', 'Vestido', 'Blusa', 'Sudadera', 'Shorts', 'Falda', 'Abrigo', 'Jeans', 'Polo', 'Cárdigan', 'Parka', 'Leggings'],
  hogar: ['Lámpara LED', 'Cojín decorativo', 'Silla ergonómica', 'Estante', 'Espejo', 'Florero', 'Cortina', 'Alfombra', 'Organizador', 'Portavelas', 'Mesa auxiliar', 'Cuadro', 'Tapete', 'Cesta', 'Reloj de pared'],
  electronica: ['Audífonos', 'Parlante Bluetooth', 'Teclado', 'Mouse', 'Cargador', 'Cable USB-C', 'Soporte tablet', 'Hub USB', 'Webcam', 'Micrófono', 'Smartwatch', 'Power bank', 'Funda laptop', 'Lámpara escritorio LED', 'Adaptador HDMI'],
  deportes: ['Balón de fútbol', 'Guantes de box', 'Rodilleras', 'Mancuernas', 'Colchoneta yoga', 'Botella deportiva', 'Maletín gym', 'Cuerda de saltar', 'Banda elástica', 'Zapatillas running', 'Gorra deportiva', 'Medias deportivas', 'Toalla microfibra', 'Cinturón lumbar', 'Guantes ciclismo'],
  juguetes: ['Rompecabezas', 'Bloques construcción', 'Muñeca', 'Auto control remoto', 'Set pinturas', 'Juego de mesa', 'Pelota espuma', 'Dinosaurio figura', 'Cocina juguete', 'Telescopio infantil', 'Kit experimentos', 'Marioneta', 'Xilófono', 'Pizarrón magnético', 'Cubo mágico'],
}

const atributos = ['Pro', 'Ultra', 'Max', 'Plus', 'Classic', 'Sport', 'Premium', 'Eco', 'Elite', 'Basic', 'Mini', 'XL', 'Slim', 'Deluxe', 'Lite']
const colores   = ['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Gris', 'Plata', 'Beige', 'Rosado', 'Naranja', 'Morado', 'Café']

// Precios base en pesos colombianos por categoría
const preciosPorCategoria = {
  ropa:        [25000, 35000, 45000, 55000, 65000, 80000, 95000, 120000, 150000, 200000],
  hogar:       [30000, 45000, 60000, 80000, 100000, 130000, 160000, 200000, 250000, 320000],
  electronica: [50000, 80000, 120000, 180000, 250000, 350000, 450000, 600000, 800000, 1200000],
  deportes:    [20000, 35000, 50000, 70000, 90000, 120000, 150000, 200000, 280000, 380000],
  juguetes:    [15000, 25000, 38000, 52000, 70000, 90000, 110000, 140000, 180000, 250000],
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)]
}

function generarSku(index) {
  const prefijos = ['PROD', 'ART', 'COD', 'REF', 'ITEM']
  const prefijo  = pick(prefijos)
  const num      = String(index).padStart(6, '0')
  return `${prefijo}-${num}`
}

function generarNombre(categoria) {
  const base  = pick(productosPorCategoria[categoria])
  const atr   = pick(atributos)
  const color = pick(colores)
  return `${base} ${atr} ${color}`
}

function generarPrecio(categoria) {
  const base     = pick(preciosPorCategoria[categoria])
  const variacion = randomInt(-5000, 5000)
  return Math.max(5000, base + variacion)
}

function generarDescripcion(nombre, categoria) {
  const descripciones = [
    `${nombre} de alta calidad para uso diario.`,
    `Excelente ${nombre} con materiales premium.`,
    `${nombre} ideal para la categoría ${categoria}.`,
    `Producto ${nombre} con garantía de satisfacción.`,
    `${nombre} resistente y duradero, perfecto para el hogar.`,
    '',
  ]
  return pick(descripciones)
}

console.log(`Generando ${TOTAL_FILAS} filas en ${OUTPUT}...`)

const stream = fs.createWriteStream(OUTPUT)
stream.write('sku,nombre,precio,stock,categoria,proveedor,descripcion,imagenUrl\n')

for (let i = 1; i <= TOTAL_FILAS; i++) {
  const categoria  = pick(categorias)
  const sku        = generarSku(i)
  const nombre     = generarNombre(categoria)
  const precio     = generarPrecio(categoria)
  const stock      = randomInt(0, 500)
  const proveedor  = pick(proveedores)
  const descripcion = generarDescripcion(nombre, categoria).replace(/,/g, ';')
  const imagenUrl  = pick(imagenesPorCategoria[categoria])

  stream.write(`${sku},"${nombre}",${precio},${stock},${categoria},${proveedor},"${descripcion}",${imagenUrl}\n`)

  if (i % 10000 === 0) console.log(`  → ${i} filas generadas...`)
}

stream.end(() => {
  console.log(`✓ Archivo generado: ${OUTPUT}`)
})