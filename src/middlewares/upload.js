const multer = require('multer')
const path = require('path')
const { MAX_FILE_SIZE_MB } = require('../config/env')
const AppError = require('../errors/AppError')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${unique}${path.extname(file.originalname)}`)
  },
})

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext === '.csv' || ext === '.json') {
    cb(null, true)
  } else {
    cb(new AppError('Extensión no permitida. Solo .csv o .json', 400, 'EXTENSION_INVALIDA'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
})

module.exports = upload