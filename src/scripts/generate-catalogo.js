const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'catalogo.csv');

const rows = Array.from({ length: 100 }, (_, index) => ({
  sku: `SKU-${index + 1}`,
  nombre: `Producto ${index + 1}`,
  precio: (index + 1) * 10,
}));

const csv = ['sku,nombre,precio'];
for (const row of rows) {
  csv.push(`${row.sku},${row.nombre},${row.precio}`);
}

fs.writeFileSync(outputPath, csv.join('\n'));
console.log(`Archivo generado: ${outputPath}`);
