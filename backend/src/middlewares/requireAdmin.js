// =====================================================================
// Solo para rutas del Panel de Admin. Va DESPUÉS de requireAuth (usa
// req.usuario). Ocultar el menú en el frontend no alcanza: el bloqueo
// real es este 403.
// =====================================================================
function requireAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: { message: 'Acceso solo para administradores' } });
  }
  next();
}

module.exports = requireAdmin;
