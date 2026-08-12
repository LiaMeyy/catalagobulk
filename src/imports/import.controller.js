class ImportController {
  async process(req, res) {
    return res.status(200).json({ message: 'Importación iniciada' });
  }
}

module.exports = new ImportController();
