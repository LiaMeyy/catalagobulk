const mongoose = require('mongoose');

const importJobSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    status: { type: String, default: 'pending' },
    totalRows: { type: Number, default: 0 },
    processedRows: { type: Number, default: 0 },
    filePath: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ImportJob', importJobSchema);
