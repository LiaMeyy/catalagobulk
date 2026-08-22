const request = require('supertest')
const mongoose = require('mongoose')
const app = require('../src/app')
const Usuario = require('../src/modules/auth/usuario.model')
const Proveedor = require('../src/modules/proveedores/proveedor.model')
const Producto = require('../src/modules/productos/producto.model')
const { conectarDB } = require('../src/config/db')
const { conectarRedis, redisClient } = require('../src/config/redis')

describe('Fase 1: Auth y CRUDs (Pruebas de Integración)', () => {
  let userToken = ''
  let adminToken = ''
  let proveedorId = ''
  let proveedorBetaId = ''
  let productoId = ''

  beforeAll(async () => {
    await conectarDB()
    await conectarRedis()

    // Limpiar colecciones de prueba
    await Usuario.deleteMany({})
    await Proveedor.deleteMany({})
    await Producto.deleteMany({})
  })

  afterAll(async () => {
    await Usuario.deleteMany({})
    await Proveedor.deleteMany({})
    await Producto.deleteMany({})
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
    if (redisClient.isOpen) {
      await redisClient.quit()
    }
  })

  describe('0. Health Check (/health)', () => {
    it('Debe devolver 200 OK con el estado de mongo y redis en "up"', async () => {
      const res = await request(app).get('/health')
      expect(res.status).toBe(200)
      expect(res.body).toEqual({
        status: 'ok',
        mongo: 'up',
        redis: 'up',
      })
    })
  })

  describe('1. Autenticación (/api/auth)', () => {
    it('Debe registrar un usuario con rol "user" por defecto y NO devolver password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'usuario@test.com', password: 'password123' })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('id')
      expect(res.body.email).toBe('usuario@test.com')
      expect(res.body.rol).toBe('user')
      expect(res.body.password).toBeUndefined()
    })

    it('Debe registrar un usuario admin explicitando el rol', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'admin@test.com', password: 'adminpassword', rol: 'admin' })

      expect(res.status).toBe(201)
      expect(res.body.rol).toBe('admin')
      expect(res.body.password).toBeUndefined()
    })

    it('Debe devolver 409 al registrar un email ya existente', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'usuario@test.com', password: 'otrapassword' })

      expect(res.status).toBe(409)
      expect(res.body.error.codigo).toBe('EMAIL_DUPLICADO')
    })

    it('Debe permitir login y retornar un token JWT', async () => {
      // Login usuario normal
      const resUser = await request(app)
        .post('/api/auth/login')
        .send({ email: 'usuario@test.com', password: 'password123' })

      expect(resUser.status).toBe(200)
      expect(resUser.body).toHaveProperty('token')
      userToken = resUser.body.token

      // Login admin
      const resAdmin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'adminpassword' })

      expect(resAdmin.status).toBe(200)
      expect(resAdmin.body).toHaveProperty('token')
      adminToken = resAdmin.body.token
    })

    it('Debe devolver 401 para credenciales incorrectas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'usuario@test.com', password: 'password_erronea' })

      expect(res.status).toBe(401)
      expect(res.body.error.codigo).toBe('CREDENCIALES_INVALIDAS')
    })
  })

  describe('2. Control de Acceso por Roles (403 Forbidden)', () => {
    it('Usuario normal recibe 403 al intentar crear un proveedor', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nombre: 'Proveedor Test', slug: 'proveedor-test' })

      expect(res.status).toBe(403)
      expect(res.body.error.codigo).toBe('SIN_PERMISO')
    })

    it('Usuario normal recibe 403 al intentar crear un producto', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          sku: 'SKU-TEST-001',
          nombre: 'Producto Test',
          precio: 10,
          stock: 5,
          categoria: 'ropa',
          proveedorId: new mongoose.Types.ObjectId().toString(),
        })

      expect(res.status).toBe(403)
      expect(res.body.error.codigo).toBe('SIN_PERMISO')
    })
  })

  describe('3. CRUD de Proveedores (/api/proveedores)', () => {
    it('Admin crea proveedor y queda activo: true por defecto', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Proveedor Alfa',
          slug: 'proveedor-alfa',
          contactoEmail: 'contacto@alfa.com',
        })

      expect(res.status).toBe(201)
      expect(res.body).toHaveProperty('_id')
      expect(res.body.nombre).toBe('Proveedor Alfa')
      expect(res.body.slug).toBe('proveedor-alfa')
      expect(res.body.activo).toBe(true)
      proveedorId = res.body._id
    })

    it('Retorna 409 si se intenta crear proveedor con nombre o slug duplicado', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Proveedor Alfa',
          slug: 'proveedor-alfa',
        })

      expect(res.status).toBe(409)
      expect(res.body.error.codigo).toBe('PROVEEDOR_DUPLICADO')
    })

    it('Admin crea un segundo proveedor para validar duplicados en actualización', async () => {
      const res = await request(app)
        .post('/api/proveedores')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Proveedor Beta',
          slug: 'proveedor-beta',
        })

      expect(res.status).toBe(201)
      proveedorBetaId = res.body._id
    })

    it('Retorna 409 tipado al actualizar proveedor con nombre o slug duplicado', async () => {
      const res = await request(app)
        .put(`/api/proveedores/${proveedorBetaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nombre: 'Proveedor Alfa',
          slug: 'proveedor-beta',
        })

      expect(res.status).toBe(409)
      expect(res.body.error.codigo).toBe('PROVEEDOR_DUPLICADO')
    })
  })

  describe('4. CRUD de Productos (/api/productos)', () => {
    it('Admin crea producto exitosamente', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'SKU-001',
          nombre: 'Camiseta Azul',
          precio: 25.5,
          stock: 10,
          categoria: 'ropa',
          proveedorId,
        })

      expect(res.status).toBe(201)
      expect(res.body.sku).toBe('SKU-001')
      expect(res.body.disponible).toBe(true)
      productoId = res.body._id
    })

    it('Retorna 400 si imagenUrl de producto no es http(s)', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'SKU-URL-INVALIDA',
          nombre: 'Producto con URL inválida',
          precio: 10,
          stock: 1,
          categoria: 'ropa',
          proveedorId,
          imagenUrl: 'ftp://cdn.demo.com/producto.jpg',
        })

      expect(res.status).toBe(400)
      expect(res.body.error.codigo).toBe('ERROR_VALIDACION')
    })

    it('Retorna 409 tipado al intentar crear producto con SKU duplicado', async () => {
      const res = await request(app)
        .post('/api/productos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'SKU-001',
          nombre: 'Camiseta Roja',
          precio: 30,
          stock: 5,
          categoria: 'ropa',
          proveedorId,
        })

      expect(res.status).toBe(409)
      expect(res.body.error.codigo).toBe('SKU_DUPLICADO')
    })

    it('Filtrar productos por slug de proveedor inexistente devuelve lista vacía', async () => {
      const res = await request(app)
        .get('/api/productos?proveedor=proveedor-inexistente')
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(0)
      expect(res.body.total).toBe(0)
    })
  })

  describe('5. Integridad Referencial al eliminar Proveedor', () => {
    it('Retorna 409 al intentar eliminar un proveedor con productos asociados', async () => {
      const res = await request(app)
        .delete(`/api/proveedores/${proveedorId}`)
        .set('Authorization', `Bearer ${adminToken}`)

      expect(res.status).toBe(409)
      expect(res.body.error.codigo).toBe('PROVEEDOR_CON_PRODUCTOS')
    })
  })

  describe('6. Documentación Swagger', () => {
    it('GET /api/docs expone la documentación API', async () => {
      const res = await request(app).get('/api/docs/')
      expect([200, 301, 302]).toContain(res.status)
    })
  })
})
