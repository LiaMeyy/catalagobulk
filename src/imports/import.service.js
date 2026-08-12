class ImportService {
  static async process(file) {
    return {
      file,
      status: 'queued',
    };
  }
}

module.exports = ImportService;
