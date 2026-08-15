class ImportService {
  static async process(file) {
    return {
      file,
      status: 'queued',
    };
  }
}

export default ImportService;
