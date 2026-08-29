import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

import { env } from '../../config/env.js';
import AppError from '../../errors/AppError.js';
import Proveedor from '../../modules/proveedores/proveedor.model.js';

import {
  crearImportJob,
  obtenerImportJobPorId,
  listarImportJobs,
  marcarJobProcesando,
  marcarJobCompletado,
  marcarJobFallido,
  registrarProgresoLote,
  obtenerSkusExistentes,
  insertarLoteProductos,
  upsertCategoriasFaltantes,
} from './import.repository.js';

// =============================================================================
// Parser: deteccion de tipo, lectura, validacion (6.3) y normalizacion (6.4)
// =============================================================================

const COLUMNAS_OBLIGATORIAS = ['sku', 'nombre', 'precio', 'stock', 'categoria'];
const COLUMNAS_OPCIONALES = ['descripcion', 'imagenUrl'];

export function detectarTipoArchivo(nombreArchivo) {
  const extension = path.extname(nombreArchivo).toLowerCase();
  if (extension === '.csv') return 'csv';
  if (extension === '.json') return 'json';
  return null;
}

function leerFilasCsv(rutaArchivo) {
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');

  const primeraLinea = contenido.split(/\r?\n/, 1)[0] || '';
  const encabezados = primeraLinea.split(',').map((h) => h.trim());

  const faltantes = COLUMNAS_OBLIGATORIAS.filter((col) => !encabezados.includes(col));
  if (faltantes.length > 0) {
    throw new Error(`Header CSV invalido: faltan columnas obligatorias (${faltantes.join(', ')})`);
  }

  const columnasDesconocidas = encabezados.filter(
    (col) => !COLUMNAS_OBLIGATORIAS.includes(col) && !COLUMNAS_OPCIONALES.includes(col)
  );
  if (columnasDesconocidas.length > 0) {
    throw new Error(`Header CSV invalido: columnas desconocidas (${columnasDesconocidas.join(', ')})`);
  }

  try {
    return parse(contenido, { columns: true, skip_empty_lines: true, trim: false });
  } catch (error) {
    throw new Error(`Archivo CSV ilegible: ${error.message}`);
  }
}

function leerFilasJson(rutaArchivo) {
  const contenido = fs.readFileSync(rutaArchivo, 'utf-8');

  let datos;
  try {
    datos = JSON.parse(contenido);
  } catch (error) {
    throw new Error(`Archivo JSON ilegible: ${error.message}`);
  }

  if (!Array.isArray(datos)) {
    throw new Error('El archivo JSON debe contener un array de productos');
  }

  return datos;
}

function leerFilasCrudas(rutaArchivo, tipo) {
  if (tipo === 'csv') return leerFilasCsv(rutaArchivo);
  if (tipo === 'json') return leerFilasJson(rutaArchivo);
  throw new Error(`Tipo de archivo no soportado: ${tipo}`);
}

function esNumeroValido(valor) {
  if (valor === null || valor === undefined || valor === '') return false;
  return Number.isFinite(Number(valor));
}

function esUrlHttpValida(valor) {
  if (valor === null || valor === undefined || valor === '') return false;
  try {
    const url = new URL(String(valor).trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function textoNoVacio(valor) {
  return typeof valor === 'string' ? valor.trim().length > 0 : Boolean(valor);
}

/**
 * Valida una fila cruda contra las reglas de negocio (6.3).
 * skusVistos: SKUs (mayusculas) ya vistos en este archivo.
 * skusExistentes: SKUs que ya existen en la base de datos.
 */
function validarFila(fila, skusVistos, skusExistentes) {
  if (!textoNoVacio(fila.sku)) return { valida: false, motivo: 'sku vacio' };
  if (!textoNoVacio(fila.nombre)) return { valida: false, motivo: 'nombre vacio' };
  if (!esNumeroValido(fila.precio) || Number(fila.precio) < 0) {
    return { valida: false, motivo: 'precio invalido' };
  }
  if (!esNumeroValido(fila.stock) || Number(fila.stock) < 0) {
    return { valida: false, motivo: 'stock invalido' };
  }
  if (!textoNoVacio(fila.categoria)) return { valida: false, motivo: 'categoria vacia' };

  const skuNormalizado = String(fila.sku).trim().toUpperCase();
  if (skusVistos.has(skuNormalizado) || skusExistentes.has(skuNormalizado)) {
    return { valida: false, motivo: 'sku duplicado' };
  }

  // imagenUrl invalida NO rechaza la fila: es advertencia (6.3).
  const tieneImagen = textoNoVacio(fila.imagenUrl);
  const advertenciaImagen = tieneImagen && !esUrlHttpValida(fila.imagenUrl);

  return { valida: true, advertenciaImagen };
}

/**
 * Normaliza una fila YA VALIDADA (6.4). No vuelve a chequear reglas.
 */
function normalizarFila(fila, proveedorId) {
  const sku = String(fila.sku).trim().toUpperCase();
  const nombre = String(fila.nombre).trim().replace(/\s+/g, ' ');
  const precio = Math.round(Number(fila.precio) * 100) / 100;
  const stock = Math.trunc(Number(fila.stock));
  const categoria = String(fila.categoria).trim().toLowerCase();

  const descripcionCruda = typeof fila.descripcion === 'string' ? fila.descripcion.trim() : '';
  const descripcion = descripcionCruda.length > 0 ? descripcionCruda : null;

  const imagenUrlCruda = typeof fila.imagenUrl === 'string' ? fila.imagenUrl.trim() : '';
  const imagenUrl = imagenUrlCruda.length > 0 && esUrlHttpValida(imagenUrlCruda) ? imagenUrlCruda : null;

  return {
    sku,
    nombre,
    precio,
    stock,
    categoria,
    descripcion,
    imagenUrl,
    proveedorId,
    disponible: stock > 0,
  };
}

// =============================================================================
// Creacion del job (llamado desde el controller, antes de encolar)
// =============================================================================

export async function crearImport({ usuarioId, proveedorId, archivoNombre, archivoRuta }) {
  const proveedor = await Proveedor.findById(proveedorId);

  if (!proveedor) {
    throw new AppError('El proveedor indicado no existe', 404, 'PROVEEDOR_NO_EXISTE');
  }

  if (!proveedor.activo) {
    throw new AppError('El proveedor esta inactivo, no puede recibir importaciones', 409, 'PROVEEDOR_INACTIVO');
  }

  const tipo = detectarTipoArchivo(archivoNombre);
  if (!tipo) {
    throw new AppError('Extension de archivo no soportada (solo .csv o .json)', 400, 'ARCHIVO_INVALIDO');
  }

  return crearImportJob({
    usuarioId,
    proveedorId,
    archivoNombre,
    archivoRuta,
    estado: 'pending',
  });
}

export async function obtenerImport(id) {
  const job = await obtenerImportJobPorId(id);
  if (!job) {
    throw new AppError('Import job no encontrado', 404, 'IMPORT_NO_ENCONTRADO');
  }
  return job;
}

export async function listarImports({ page = 1, limit = 20 }) {
  return listarImportJobs({ page: Number(page), limit: Number(limit) });
}

// =============================================================================
// Procesamiento (llamado desde el worker)
// =============================================================================

/**
 * Procesa un ImportJob de punta a punta: lee el archivo, valida y
 * normaliza fila por fila, inserta en lotes, hace upsert de categorias
 * y deja el job en "completed" o "failed".
 *
 * onProgreso(job) es opcional: se llama despues de cada lote para que
 * el worker pueda emitirlo por Socket.io (sockets/index.js).
 */
export async function procesarImport(importJobId, { onProgreso } = {}) {
  const job = await obtenerImportJobPorId(importJobId);
  if (!job) {
    throw new AppError('Import job no encontrado', 404, 'IMPORT_NO_ENCONTRADO');
  }

  const tipo = detectarTipoArchivo(job.archivoNombre);

  let filasCrudas;
  try {
    filasCrudas = leerFilasCrudas(job.archivoRuta, tipo);
  } catch (error) {
    await marcarJobFallido(importJobId, error.message);
    throw error;
  }

  const total = filasCrudas.length;
  await marcarJobProcesando(importJobId, { total, bullJobId: job.bullJobId });

  const skusExistentes = await obtenerSkusExistentes();
  const skusVistosEnArchivo = new Set();
  const categoriasVistas = new Set();

  let procesados = 0;
  let exitosos = 0;
  let fallidos = 0;

  let loteActual = [];
  let erroresLote = [];

  const flushLote = async () => {
    if (loteActual.length === 0 && erroresLote.length === 0) return;

    const { insertados, erroresPorSku } = await insertarLoteProductos(loteActual);

    exitosos += insertados;
    fallidos += erroresPorSku.size;

    const erroresParaGuardar = [...erroresLote];
    for (const [sku, motivo] of erroresPorSku) {
      erroresParaGuardar.push({ fila: -1, sku, motivo });
    }

    await registrarProgresoLote(importJobId, {
      procesados,
      exitosos,
      fallidos,
      erroresNuevos: erroresParaGuardar,
      cap: env.IMPORT_ERRORS_CAP,
    });

    if (onProgreso) {
      await onProgreso({ importJobId, total, procesados, exitosos, fallidos });
    }

    loteActual = [];
    erroresLote = [];
  };

  for (let indice = 0; indice < filasCrudas.length; indice += 1) {
    const filaCruda = filasCrudas[indice];
    const numeroFila = indice + 2; // +1 por index 0-based, +1 por la fila de header

    const resultado = validarFila(filaCruda, skusVistosEnArchivo, skusExistentes);

    if (!resultado.valida) {
      fallidos += 1;
      erroresLote.push({
        fila: numeroFila,
        sku: filaCruda.sku ? String(filaCruda.sku).trim() : null,
        motivo: resultado.motivo,
      });
    } else {
      const skuNormalizado = String(filaCruda.sku).trim().toUpperCase();
      skusVistosEnArchivo.add(skuNormalizado);

      const productoNormalizado = normalizarFila(filaCruda, job.proveedorId);
      categoriasVistas.add(productoNormalizado.categoria);
      loteActual.push(productoNormalizado);

      if (resultado.advertenciaImagen) {
        erroresLote.push({
          fila: numeroFila,
          sku: skuNormalizado,
          motivo: 'imagenUrl invalida, ignorada',
        });
      }
    }

    procesados += 1;

    if (loteActual.length >= env.BATCH_SIZE) {
      await flushLote();
    }
  }

  await flushLote();

  await upsertCategoriasFaltantes([...categoriasVistas]);

  return marcarJobCompletado(importJobId, { exitosos, fallidos, procesados });
}