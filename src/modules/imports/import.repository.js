const ImportJob = require('./importJob.model')

async function crear(datos) {
  return ImportJob.create(datos)
}

async function findById(id) {
  return ImportJob.findById(id)
}

async function findAll({ page = 1, limit = 20 }) {
  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    ImportJob.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    ImportJob.countDocuments(),
  ])
  return { data, page, limit, total }
}

async function updateById(id, datos) {
  return ImportJob.findByIdAndUpdate(id, datos, { new: true })
}

module.exports = { crear, findById, findAll, updateById }