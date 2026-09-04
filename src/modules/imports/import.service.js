import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import chain from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';
import { env } from '../../config/env.js';
import AppError from '../../errors/AppError.js';
import importRepository from './import.repository.js';
import importQueue from '../../queues/import.queue.js';

// Lógica de negocio del módulo imports: detección de formato, parseo en streaming,
// validación por fila, normalización y orquestación del procesamiento.
// NO toca Mongoose directamente: todo el acceso a datos va por ImportRepository.
class ImportService {
  // --- 1. Detección de formato -------------------------------------------
  static detectarFormato(nombreArchivo) {
    const ext = path.extname(nombreArchivo).toLowerCase();
    if (ext === '.csv') return 'csv';
    if (ext === '.json') return 'json';
    throw new AppError(
      400,
      'Extensión de archivo inválida (solo .csv o .json)',
      'FORMATO_INVALIDO'
    );
  }

  // --- 2. Lectura en streaming (nunca carga el archivo completo) ----------
  // Devuelve un async iterable de filas/objetos crudos (sin validar).
  static leerFilas(ruta, formato) {
    if (formato === 'csv') {
      const stream = fs.createReadStream(ruta).pipe(
        csv({
          // quita BOM (si lo hubiera) y normaliza los nombres de columnas
          mapHeaders: ({ header }) => String(header).replace(/^\uFEFF/, '').trim(),
        })
      );
      return stream;
    }
    // JSON: arreglo de objetos en el nivel raíz, emitido elemento por elemento.
    const pipeline = chain([fs.createReadStream(ruta), parser(), streamArray()]);
    return {
      async *[Symbol.asyncIterator]() {
        for await (const { value } of pipeline) {
          yield value;
        }
      },
    };
  }

  // --- Conteo de filas (pasada rápida, previa al procesamiento) ----------
  // Devuelve el total de filas/registros del archivo sin validar ni parsear campos.
  static contarFilas(ruta, formato) {
    return formato === 'csv'
      ? ImportService.contarFilasCSV(ruta)
      : ImportService.contarFilasJSON(ruta);
  }

  // CSV: cuenta filas con csv-parser (el mismo parser del streaming real), en modo
  // descarte. Soporta saltos de línea embebidos en campos entre comillas.
  static async contarFilasCSV(ruta) {
    return new Promise((resolve, reject) => {
      let contador = 0;
      fs.createReadStream(ruta)
        .pipe(csv())
        .on('data', () => {
          contador += 1;
        })
        .on('end', () => resolve(contador))
        .on('error', reject);
    });
  }

  // JSON: cuenta los elementos del arreglo raíz por tokens, sin materializar
  // el arreglo completo ni ensamblar cada objeto.
  static async contarFilasJSON(ruta) {
    const esInicioDeValor = (nombre) =>
      [
        'startObject',
        'startArray',
        'startString',
        'startNumber',
        'startTrue',
        'startFalse',
        'startNull',
      ].includes(nombre);

    let cuenta = 0;
    let depth = 0;

    const pipeline = chain([
      fs.createReadStream(ruta),
      parser(),
      (token) => {
        if (token.name === 'startArray' || token.name === 'startObject') {
          if (depth === 1 && esInicioDeValor(token.name)) cuenta += 1;
          depth += 1;
        } else if (token.name === 'endArray' || token.name === 'endObject') {
          depth -= 1;
        } else if (esInicioDeValor(token.name) && depth === 1) {
          cuenta += 1;
        }
        return null;
      },
    ]);

    for await (const _token of pipeline) {
      // solo drena el pipeline; el conteo ocurre en el handler
    }
    return cuenta;
  }

  // --- Helpers de validación ---------------------------------------------
  static esNoVacio(valor) {
    return valor !== null && valor !== undefined && String(valor).trim() !== '';
  }

  static esNumero(valor) {
    return (
      valor !== null &&
      valor !== undefined &&
      valor !== '' &&
      Number.isFinite(Number(valor))
    );
  }

  static esUrlValida(valor) {
    try {
      const url = new URL(valor);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  static capitalizar(texto) {
    if (!texto) return texto;
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  // --- 3. Validación por fila --------------------------------------------
  // Devuelve { valida, error?, advertencia?, skuCanonico? }.
  // Nunca aborta el proceso: la fila inválida se devuelve con su motivo.
  static validarFila(raw, numeroFila, vistos) {
    const skuTexto = raw?.sku === null || raw?.sku === undefined ? null : String(raw.sku);

    if (!ImportService.esNoVacio(raw?.sku)) {
      return {
        valida: false,
        error: { fila: numeroFila, sku: skuTexto, motivo: 'sku vacío' },
      };
    }
    if (!ImportService.esNoVacio(raw?.nombre)) {
      return {
        valida: false,
        error: { fila: numeroFila, sku: skuTexto, motivo: 'nombre vacío' },
      };
    }
    if (!ImportService.esNumero(raw?.precio) || Number(raw.precio) < 0) {
      return {
        valida: false,
        error: { fila: numeroFila, sku: skuTexto, motivo: 'precio inválido' },
      };
    }
    const stock = Number(raw?.stock);
    if (
      !ImportService.esNumero(raw?.stock) ||
      Number.isNaN(stock) ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      return {
        valida: false,
        error: { fila: numeroFila, sku: skuTexto, motivo: 'stock inválido' },
      };
    }
    if (!ImportService.esNoVacio(raw?.categoria)) {
      return {
        valida: false,
        error: { fila: numeroFila, sku: skuTexto, motivo: 'categoria vacía' },
      };
    }

    // Dedupe por sku normalizado (mayúsculas) para que "abc" y "ABC" colisionen.
    const skuCanonico = skuTexto.trim().toUpperCase();
    if (vistos.has(skuCanonico)) {
      return {
        valida: false,
        error: { fila: numeroFila, sku: skuTexto, motivo: 'sku duplicado' },
      };
    }
    vistos.add(skuCanonico);

    // Caso especial: imagenUrl inválida NO rechaza la fila, solo se advierte.
    const imagenRaw = raw?.imagenUrl;
    let advertencia = null;
    if (imagenRaw !== null && imagenRaw !== undefined && String(imagenRaw).trim() !== '') {
      if (!ImportService.esUrlValida(String(imagenRaw).trim())) {
        advertencia = {
          fila: numeroFila,
          sku: skuTexto,
          motivo: 'imagenUrl inválida, ignorada',
        };
      }
    }

    return { valida: true, advertencia, skuCanonico };
  }

  // --- 4. Normalización (solo filas ya validadas) -------------------------
  static normalizarFila(raw, proveedorId) {
    const stock = Math.trunc(Number(raw.stock));
    const precio = Math.round((Number(raw.precio) + Number.EPSILON) * 100) / 100;

    const nombre = String(raw.nombre).trim().replace(/\s+/g, ' ');

    const descripcionRaw =
      raw.descripcion === null || raw.descripcion === undefined
        ? ''
        : String(raw.descripcion).trim();
    const descripcion = descripcionRaw === '' ? null : descripcionRaw;

    const imagenRaw =
      raw.imagenUrl === null || raw.imagenUrl === undefined
        ? ''
        : String(raw.imagenUrl).trim();
    const imagenUrl =
      imagenRaw === '' || !ImportService.esUrlValida(imagenRaw) ? null : imagenRaw;

    return {
      sku: String(raw.sku).trim().toUpperCase(),
      nombre,
      precio,
      stock,
      categoria: String(raw.categoria).trim().toLowerCase(),
      descripcion,
      imagenUrl,
      disponible: stock > 0,
      proveedorId,
    };
  }

  // --- Registro del import (usado por el controller) ----------------------
  static async registrarImport({ usuarioId, proveedorId, archivoNombre, archivoRuta }) {
    const proveedor = await importRepository.findProveedorById(proveedorId);
    if (!proveedor) {
      throw new AppError(404, 'proveedorId no existe', 'PROVEEDOR_NO_ENCONTRADO');
    }
    if (proveedor.activo === false) {
      throw new AppError(
        409,
        'El proveedor está inactivo, no puede recibir importaciones',
        'PROVEEDOR_INACTIVO'
      );
    }

    const importJob = await importRepository.create({

      usuarioId,
      proveedorId,
      archivoNombre,
      archivoRuta,
      estado: 'pending',
    });

    const job = await importQueue.add('procesar-import', {
      importJobId: importJob._id.toString(),
    });
    await importRepository.setBullJobId(importJob._id, job.id);

    return { importJobId: importJob._id, estado: importJob.estado };
  }

  static async obtenerImport(id) {
    const importJob = await importRepository.findById(id);
    if (!importJob) {
      throw new AppError(404, 'Import job no encontrado', 'IMPORT_NO_ENCONTRADO');
    }
    return importJob;
  }

  static async listarImports({ page = 1, limit = 20 }) {
    return importRepository.findAll({ page, limit });
  }

  // --- Procesamiento completo (lo llama el worker) ------------------------
  static async procesarImport(importJobId) {
    const importJob = await importRepository.findById(importJobId);
    if (!importJob) {
      throw new AppError(404, 'ImportJob no encontrado', 'IMPORT_NO_ENCONTRADO');
    }

    let total;
    let formato;
    try {
      formato = ImportService.detectarFormato(importJob.archivoRuta);
      total = await ImportService.contarFilas(importJob.archivoRuta, formato);
      await importRepository.marcarProcesando(importJobId, total);
    } catch (error) {
      await importRepository.marcarFallido(importJobId, error.message);
      throw error;
    }

    const vistos = new Set();
    const categorias = new Set();
    const advertencias = [];

    let lote = [];
    let procesados = 0;
    let exitosos = 0;
    let fallidos = 0;

    // Deltas pendientes de persistir en el ImportJob.
    let dProcesados = 0;
    let dExitosos = 0;
    let dFallidos = 0;
    const erroresPendientes = [];

    const agregarError = (error) => {
      if (erroresPendientes.length < env.IMPORT_ERRORS_CAP) {
        erroresPendientes.push(error);
      }
    };

    const flushProgreso = async () => {
      if (!dProcesados && !erroresPendientes.length) return;
      await importRepository.actualizarProgreso(importJobId, {
        procesados: dProcesados,
        exitosos: dExitosos,
        fallidos: dFallidos,
        errores: erroresPendientes,
      });
      dProcesados = 0;
      dExitosos = 0;
      dFallidos = 0;
      erroresPendientes.length = 0;
    };

    const insertarLote = async () => {
      if (!lote.length) return;

      const skus = lote.map((item) => item.producto.sku);
      const existentes = new Set(await importRepository.findSkusExistentes(skus));

      const aInsertar = [];
      for (const item of lote) {
        if (existentes.has(item.producto.sku)) {
          fallidos += 1;
          dFallidos += 1;
          agregarError({
            fila: item.fila,
            sku: item.producto.sku,
            motivo: 'sku duplicado (ya existente en BD)',
          });
        } else {
          aInsertar.push(item.producto);
        }
      }

      if (aInsertar.length) {
        try {
          const docs = await importRepository.insertarLoteProductos(aInsertar);
          exitosos += docs.length;
          dExitosos += docs.length;
        } catch (error) {
          // Con ordered:false un duplicado de carrera no tira el resto del lote.
          const insertadosParcial = error?.insertedDocs?.length ?? 0;
          exitosos += insertadosParcial;
          dExitosos += insertadosParcial;
          for (const we of error?.writeErrors ?? []) {
            const doc = aInsertar[we.index];
            fallidos += 1;
            dFallidos += 1;
            agregarError({
              fila: doc?.fila,
              sku: doc?.sku,
              motivo: 'error de inserción (posible sku duplicado)',
            });
          }
        }
      }

      lote = [];
    };

    try {
      for await (const raw of ImportService.leerFilas(importJob.archivoRuta, formato)) {
        procesados += 1;
        dProcesados += 1;

        const resultado = ImportService.validarFila(raw, procesados, vistos);

        if (!resultado.valida) {
          fallidos += 1;
          dFallidos += 1;
          agregarError(resultado.error);
        } else {
          if (resultado.advertencia) advertencias.push(resultado.advertencia);

          const producto = ImportService.normalizarFila(raw, importJob.proveedorId);
          categorias.add(producto.categoria);
          lote.push({ fila: procesados, producto });

          if (lote.length >= env.BATCH_SIZE) {
            await insertarLote();
          }
        }

        // Persistir progreso periódicamente (no solo al final).
        if (procesados % env.BATCH_SIZE === 0) {
          await flushProgreso();
        }
      }

      await insertarLote();
      await flushProgreso();

      await importRepository.upsertCategorias(
        [...categorias].map((slug) => ({ slug, nombre: ImportService.capitalizar(slug) }))
      );

      await importRepository.marcarCompletado(importJobId, {
        procesados,
        exitosos,
        fallidos,
      });

      return {
        total,
        procesados,
        exitosos,
        fallidos,
        advertencias: advertencias.length,
      };
    } catch (error) {
      await importRepository.marcarFallido(importJobId, error.message);
      throw error;
    }
  }
}

export default ImportService;
