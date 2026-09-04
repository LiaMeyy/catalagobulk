import Proveedor from './proveedor.model.js';

class ProveedorRepository {
  async findById(id) {
    return Proveedor.findById(id);
  }

  async findAll() {
    return [];
  }

  async create(data) {
    return data;
  }
}

export default new ProveedorRepository();
