import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
