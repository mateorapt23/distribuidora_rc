const pool = require('../config/db');

/**
 * Registra una acción en la tabla logs_actividad.
 * Se llama desde cualquier controller después de una operación exitosa.
 *
 * @param {object} req   - Request de Express (para sacar usuario e IP)
 * @param {object} datos - { accion, modulo, descripcion, referencia_id? }
 */
const registrarLog = async (req, { accion, modulo, descripcion, referencia_id = null }) => {
  try {
    const usuario_id    = req.usuario?.id     || null;
    const usuario_nombre = req.usuario?.nombre || 'Sistema';
    const ip = (
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket?.remoteAddress ||
      'desconocida'
    );

    await pool.query(
      `INSERT INTO logs_actividad (usuario_id, usuario_nombre, accion, modulo, descripcion, referencia_id, ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [usuario_id, usuario_nombre, accion, modulo, descripcion, referencia_id, ip]
    );
  } catch (err) {
    // El log nunca debe romper la operación principal
    console.error('Error al registrar log:', err.message);
  }
};

module.exports = { registrarLog };