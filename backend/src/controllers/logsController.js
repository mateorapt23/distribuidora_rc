const pool = require('../config/db');

/**
 * GET /logs
 * Query params: usuario_id, modulo, fecha_desde, fecha_hasta, page, limit
 * Solo accesible por admin (se controla en la ruta).
 */
const listar = async (req, res) => {
  const { usuario_id, modulo, fecha_desde, fecha_hasta, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  const params = [];

  if (usuario_id) {
    params.push(usuario_id);
    where += ` AND l.usuario_id = $${params.length}`;
  }
  if (modulo) {
    params.push(modulo);
    where += ` AND l.modulo = $${params.length}`;
  }
  if (fecha_desde) {
    params.push(fecha_desde);
    where += ` AND l.creado_en >= $${params.length}::date`;
  }
  if (fecha_hasta) {
    params.push(fecha_hasta);
    where += ` AND l.creado_en < ($${params.length}::date + INTERVAL '1 day')`;
  }

  try {
    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM logs_actividad l ${where}`, params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT
          l.id,
          l.usuario_id,
          l.usuario_nombre,
          l.accion,
          l.modulo,
          l.descripcion,
          l.referencia_id,
          l.ip,
          l.creado_en
       FROM logs_actividad l
       ${where}
       ORDER BY l.creado_en DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({
      data: rows,
      total: parseInt(total[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('Error al listar logs:', err);
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
};

/**
 * GET /logs/usuarios — lista simplificada de usuarios para el filtro del frontend
 */
const listarUsuariosLog = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT DISTINCT usuario_id AS id, usuario_nombre AS nombre
       FROM logs_actividad
       WHERE usuario_id IS NOT NULL
       ORDER BY usuario_nombre`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

module.exports = { listar, listarUsuariosLog };