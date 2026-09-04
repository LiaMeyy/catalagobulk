function rolMiddleware(rolesPermitidos = []) {
  const permitidos = Array.isArray(rolesPermitidos)
    ? rolesPermitidos
    : [rolesPermitidos];

  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    if (!permitidos.includes(user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }

    return next();
  };
}

export default rolMiddleware;
