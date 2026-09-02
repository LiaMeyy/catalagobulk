import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'catalogo.csv');
const FILAS = 120000;

// TODO: generar ≥120.000 filas "sucias" para probar el parser/validador del worker:
// precio negativo, stock decimal, imagenUrl inválida, sku duplicado, campos vacíos, etc.
const header = 'sku,nombre,precio,stock,categoria,descripcion,imagenUrl';
const lines = [header];

for (let i = 1; i <= FILAS; i++) {
  lines.push(`SKU-${i},Producto ${i},${(i * 10).toFixed(2)},${i % 100},categoria ${i % 10},,`);
}

fs.writeFileSync(outputPath, lines.join('\n'));
console.log(`Archivo generado: ${outputPath} (${FILAS} filas)`);
