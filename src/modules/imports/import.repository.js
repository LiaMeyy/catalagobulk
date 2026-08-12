class ImportRepository {
  async findAll() {
    return [];
  }

  async create(data) {
    return data;
  }
}

module.exports = new ImportRepository();
