const swaggerUi = require('swagger-ui-express')

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'CatálogoBulk API',
    version: '1.0.0',
    description: 'Sistema de importación masiva de productos con procesamiento asíncrono',
  },
  servers: [{ url: 'http://localhost:3000/api' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              codigo: { type: 'string' },
              mensaje: { type: 'string' },
            },
          },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          rol: { type: 'string', enum: ['admin', 'user'] },
        },
      },
      Producto: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          sku: { type: 'string' },
          nombre: { type: 'string' },
          precio: { type: 'number' },
          stock: { type: 'integer' },
          categoria: { type: 'string' },
          descripcion: { type: 'string', nullable: true },
          imagenUrl: { type: 'string', nullable: true },
          proveedorId: { type: 'string' },
          disponible: { type: 'boolean' },
        },
      },
      Proveedor: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          nombre: { type: 'string' },
          slug: { type: 'string' },
          contactoEmail: { type: 'string', nullable: true },
          logoUrl: { type: 'string', nullable: true },
          activo: { type: 'boolean' },
        },
      },
      Categoria: {
        type: 'object',
        properties: {
          _id: { type: 'string' },
          slug: { type: 'string' },
          nombre: { type: 'string' },
          descripcion: { type: 'string', nullable: true },
          imagenUrl: { type: 'string', nullable: true },
        },
      },
      ImportJob: {
        type: 'object',
        properties: {
          importJobId: { type: 'string' },
          proveedorId: { type: 'string' },
          estado: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed'] },
          total: { type: 'integer', nullable: true },
          procesados: { type: 'integer' },
          exitosos: { type: 'integer' },
          fallidos: { type: 'integer' },
          porcentaje: { type: 'integer' },
          errores: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fila: { type: 'integer' },
                sku: { type: 'string', nullable: true },
                motivo: { type: 'string' },
              },
            },
          },
          startedAt: { type: 'string', format: 'date-time', nullable: true },
          finishedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      },
    },
  },
  paths: {
    // ── AUTH ────────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuario',
        description: 'Público. rol es opcional (default: user).',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@demo.com' },
                  password: { type: 'string', example: 'secreta123' },
                  rol: { type: 'string', enum: ['admin', 'user'], example: 'admin' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Usuario creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Usuario' } } } },
          409: { description: 'Email ya registrado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Público. Rate limit estricto.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'admin@demo.com' },
                  password: { type: 'string', example: 'secreta123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Token JWT', content: { 'application/json': { schema: { type: 'object', properties: { token: { type: 'string' } } } } } },
          401: { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },

    // ── PRODUCTOS ───────────────────────────────────────────────────────────
    '/productos': {
      get: {
        tags: ['Productos'],
        summary: 'Listar productos',
        description: 'Autenticado (cualquier rol).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          { name: 'categoria', in: 'query', schema: { type: 'string' } },
          { name: 'proveedor', in: 'query', schema: { type: 'string' }, description: 'slug o id' },
          { name: 'disponible', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'Lista paginada',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: { type: 'array', items: { $ref: '#/components/schemas/Producto' } },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                  },
                },
              },
            },
          },
          401: { description: 'No autenticado' },
        },
      },
      post: {
        tags: ['Productos'],
        summary: 'Crear producto',
        description: 'Solo admin.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sku', 'nombre', 'precio', 'stock', 'categoria', 'proveedorId'],
                properties: {
                  sku: { type: 'string' },
                  nombre: { type: 'string' },
                  precio: { type: 'number' },
                  stock: { type: 'integer' },
                  categoria: { type: 'string' },
                  proveedorId: { type: 'string' },
                  descripcion: { type: 'string' },
                  imagenUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Producto creado' },
          400: { description: 'Validación fallida' },
          403: { description: 'Solo admin' },
          404: { description: 'Proveedor no existe' },
          409: { description: 'SKU duplicado' },
        },
      },
    },
    '/productos/stats': {
      get: {
        tags: ['Productos'],
        summary: 'Estadísticas de productos',
        description: 'Autenticado (cualquier rol).',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalProductos: { type: 'integer' },
                    precioPromedio: { type: 'number' },
                    porCategoria: { type: 'array', items: { type: 'object', properties: { categoria: { type: 'string' }, count: { type: 'integer' } } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/productos/{id}': {
      get: {
        tags: ['Productos'],
        summary: 'Obtener producto por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Producto', content: { 'application/json': { schema: { $ref: '#/components/schemas/Producto' } } } },
          404: { description: 'No existe' },
        },
      },
      put: {
        tags: ['Productos'],
        summary: 'Actualizar producto',
        description: 'Solo admin.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Producto' } } } },
        responses: {
          200: { description: 'Actualizado' },
          403: { description: 'Solo admin' },
          404: { description: 'No existe' },
          409: { description: 'SKU duplicado' },
        },
      },
      delete: {
        tags: ['Productos'],
        summary: 'Eliminar producto',
        description: 'Solo admin.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Eliminado' },
          403: { description: 'Solo admin' },
          404: { description: 'No existe' },
        },
      },
    },

    // ── PROVEEDORES ─────────────────────────────────────────────────────────
    '/proveedores': {
      get: {
        tags: ['Proveedores'],
        summary: 'Listar proveedores',
        description: 'Autenticado (cualquier rol).',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'activo', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: { 200: { description: 'Lista paginada' } },
      },
      post: {
        tags: ['Proveedores'],
        summary: 'Crear proveedor',
        description: 'Solo admin.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre', 'slug'],
                properties: {
                  nombre: { type: 'string' },
                  slug: { type: 'string', example: 'acme-corp' },
                  contactoEmail: { type: 'string' },
                  logoUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Creado' },
          403: { description: 'Solo admin' },
          409: { description: 'Nombre o slug duplicado' },
        },
      },
    },
    '/proveedores/{id}': {
      get: {
        tags: ['Proveedores'],
        summary: 'Obtener proveedor por ID',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Proveedor', content: { 'application/json': { schema: { $ref: '#/components/schemas/Proveedor' } } } },
          404: { description: 'No existe' },
        },
      },
      put: {
        tags: ['Proveedores'],
        summary: 'Actualizar proveedor',
        description: 'Solo admin. Permite activo: false para desactivar.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Proveedor' } } } },
        responses: { 200: { description: 'Actualizado' }, 403: { description: 'Solo admin' }, 404: { description: 'No existe' } },
      },
      delete: {
        tags: ['Proveedores'],
        summary: 'Eliminar proveedor',
        description: 'Solo admin. Falla si tiene productos asociados.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          204: { description: 'Eliminado' },
          403: { description: 'Solo admin' },
          404: { description: 'No existe' },
          409: { description: 'Tiene productos asociados' },
        },
      },
    },

    // ── CATEGORÍAS ──────────────────────────────────────────────────────────
    '/categorias': {
      get: {
        tags: ['Categorías'],
        summary: 'Listar categorías',
        description: 'Autenticado (cualquier rol). Sin paginar.',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Lista de categorías', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Categoria' } } } } } },
      },
    },
    '/categorias/{slug}': {
      get: {
        tags: ['Categorías'],
        summary: 'Obtener categoría por slug',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'Categoría', content: { 'application/json': { schema: { $ref: '#/components/schemas/Categoria' } } } },
          404: { description: 'No existe' },
        },
      },
    },
    '/categorias/{id}': {
      put: {
        tags: ['Categorías'],
        summary: 'Actualizar categoría',
        description: 'Solo admin. El slug no se edita (se usa :id en path, no slug).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  descripcion: { type: 'string' },
                  imagenUrl: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Actualizada' }, 403: { description: 'Solo admin' }, 404: { description: 'No existe' } },
      },
      delete: {
        tags: ['Categorías'],
        summary: 'Eliminar categoría (opcional)',
        description: 'Solo admin. No borra productos que la referencian.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Eliminada' }, 403: { description: 'Solo admin' }, 404: { description: 'No existe' } },
      },
    },

    // ── IMPORTS ─────────────────────────────────────────────────────────────
    '/imports': {
      post: {
        tags: ['Imports'],
        summary: 'Subir archivo de catálogo',
        description: 'Solo admin. Multipart. Rate limit estricto. Responde en milisegundos.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['archivo', 'proveedorId'],
                properties: {
                  archivo: { type: 'string', format: 'binary', description: '.csv o .json' },
                  proveedorId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          202: { description: 'Job encolado', content: { 'application/json': { schema: { type: 'object', properties: { importJobId: { type: 'string' }, estado: { type: 'string' } } } } } },
          400: { description: 'Sin archivo / extensión inválida / falta proveedorId' },
          403: { description: 'Solo admin' },
          404: { description: 'Proveedor no existe' },
          409: { description: 'Proveedor inactivo' },
          413: { description: 'Archivo muy grande' },
        },
      },
      get: {
        tags: ['Imports'],
        summary: 'Listar import jobs',
        description: 'Solo admin.',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { 200: { description: 'Lista paginada' } },
      },
    },
    '/imports/{id}': {
      get: {
        tags: ['Imports'],
        summary: 'Obtener estado de import',
        description: 'Autenticado (dueño o admin).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          200: { description: 'ImportJob', content: { 'application/json': { schema: { $ref: '#/components/schemas/ImportJob' } } } },
          403: { description: 'Sin permiso' },
          404: { description: 'No existe' },
        },
      },
    },
  },
}

module.exports = { swaggerUi, swaggerDocument }