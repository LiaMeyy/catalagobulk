import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'catalogo.csv');
// Genera 120.000 filas base + 1.000 extra para superar el mínimo con holgura.
const FILAS = 121000;

// Genera ≥120.000 filas "sucias" para probar el parser/validador del worker.
// Cada caso de suciedad se dispara de forma determinística según el índice i
// (módulo), de modo que el archivo es reproducible y la distribución es estable.
//
// Casos que el validador RECHAZA (fila inválida):
//   i % 7  === 0  → sku vacío
//   i % 11 === 0  → nombre vacío
//   i % 13 === 0  → precio negativo
//   i % 17 === 0  → stock decimal
//   i % 19 === 0  → stock negativo
//   i % 23 === 0  → categoria vacía
//   i % 29 === 0  → sku duplicado (repite un sku ya emitido)
//   i % 31 === 0  → precio no numérico (texto)
//   i % 37 === 0  → stock no numérico (texto)
//
// Casos que NO rechazan la fila (solo advertencia o normalización):
//   i % 41 === 0  → imagenUrl inválida (advertencia, se guarda null)
//   i % 43 === 0  → nombre con espacios extra (normalización: colapsa espacios)
//   i % 47 === 0  → sku en minúsculas (normalización: trim + mayúsculas)
//   i % 53 === 0  → categoria con mayúsculas (normalización: minúsculas)
//   i % 59 === 0  → precio con >2 decimales (normalización: redondea a 2)
//   i % 61 === 0  → descripcion vacía (se guarda null)
//   i % 67 === 0  → imagenUrl válida (se conserva)
//
// El resto de filas son limpias/válidas.

const header = 'sku,nombre,precio,stock,categoria,descripcion,imagenUrl';
const lines = [header];

// Categorías realistas para que el upsert de categorías tenga variedad.
const CATEGORIAS = [
  'Electrónica',
  'Hogar',
  'Ropa',
  'Deportes',
  'Juguetes',
  'Libros',
  'Alimentos',
  'Belleza',
  'Herramientas',
  'Mascotas',
];

function skuBase(i) {
  return `SKU-${i}`;
}

function categoriaDe(i) {
  return CATEGORIAS[i % CATEGORIAS.length];
}

function escaparCSV(valor) {
  // Si el valor contiene comas, comillas o saltos de línea, lo envuelve en comillas.
  if (/[",\n\r]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

for (let i = 1; i <= FILAS; i++) {
  let sku = skuBase(i);
  let nombre = `Producto ${i}`;
  let precio = (i * 10 + 0.5).toFixed(2); // precio con decimales .50
  let stock = String(i % 500);
  let categoria = categoriaDe(i);
  let descripcion = `Descripción del producto ${i}`;
  let imagenUrl = `https://cdn.example.com/img/${i}.jpg`;

  // --- Casos que RECHAZAN la fila --------------------------------------
  if (i % 7 === 0) {
    // sku vacío
    sku = '';
  } else if (i % 11 === 0) {
    // nombre vacío
    nombre = '';
  } else if (i % 13 === 0) {
    // precio negativo
    precio = `-${(i * 10 + 0.5).toFixed(2)}`;
  } else if (i % 17 === 0) {
    // stock decimal (no entero)
    stock = `${(i % 500) + 0.75}`;
  } else if (i % 19 === 0) {
    // stock negativo
    stock = `-${i % 500}`;
  } else if (i % 23 === 0) {
    // categoria vacía
    categoria = '';
  } else if (i % 29 === 0) {
    // sku duplicado: repite el sku de una fila anterior.
    // i - 28 garantiza que el primer caso (i=29) apunte a SKU-1 (existente).
    sku = skuBase(i - 28);

  } else if (i % 31 === 0) {
    // precio no numérico (texto)
    precio = 'no-es-un-numero';
  } else if (i % 37 === 0) {
    // stock no numérico (texto)
    stock = 'abc';
  }

  // --- Casos que NO rechazan (advertencia o normalización) -------------
  else if (i % 41 === 0) {
    // imagenUrl inválida → advertencia, se guarda null
    imagenUrl = 'no-es-una-url';
  } else if (i % 43 === 0) {
    // nombre con espacios extra → normalización colapsa espacios
    nombre = `  Producto   ${i}   con   espacios  `;
  } else if (i % 47 === 0) {
    // sku en minúsculas → normalización trim + mayúsculas
    sku = `sku-${i}`;
  } else if (i % 53 === 0) {
    // categoria con mayúsculas → normalización minúsculas
    categoria = categoria.toUpperCase();
  } else if (i % 59 === 0) {
    // precio con >2 decimales → normalización redondea a 2
    precio = (i * 10 + 0.123456).toFixed(6);
  } else if (i % 61 === 0) {
    // descripcion vacía → se guarda null
    descripcion = '';
  } else if (i % 67 === 0) {
    // imagenUrl válida (se conserva tal cual)
    imagenUrl = `https://cdn.example.com/img/${i}.jpg`;
  }

  // --- Fila limpia (default) -------------------------------------------
  // (ya está inicializada arriba)

  const fila = [
    escaparCSV(sku),
    escaparCSV(nombre),
    escaparCSV(precio),
    escaparCSV(stock),
    escaparCSV(categoria),
    escaparCSV(descripcion),
    escaparCSV(imagenUrl),
  ].join(',');

  lines.push(fila);
}

fs.writeFileSync(outputPath, lines.join('\n'));
console.log(`Archivo generado: ${outputPath} (${FILAS} filas)`);
