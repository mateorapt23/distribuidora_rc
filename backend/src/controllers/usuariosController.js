const pool = require('../config/db');
const bcrypt = require('bcrypt');

const listar = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, username, rol, email, activo, creado_en FROM usuarios ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
};

const crear = async (req, res) => {
  const { nombre, username, password, rol, email } = req.body;

  if (!nombre || !username || !password || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }
  if (!['admin', 'bodeguero'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, username, password, rol, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, username, rol, email, activo, creado_en`,
      [nombre, username, hash, rol, email || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El username ya existe' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const actualizar = async (req, res) => {
  const { nombre, rol, activo, password, email } = req.body;

  try {
    let hash = undefined;
    if (password) hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `UPDATE usuarios SET
        nombre = COALESCE($1, nombre),
        rol    = COALESCE($2, rol),
        activo = COALESCE($3, activo),
        email  = $5
        ${hash ? ', password = $6' : ''}
       WHERE id = $4
       RETURNING id, nombre, username, rol, email, activo`,
      hash
        ? [nombre, rol, activo, req.params.id, email ?? null, hash]
        : [nombre, rol, activo, req.params.id, email ?? null]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

const eliminar = async (req, res) => {
  if (parseInt(req.params.id) === req.usuario.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }
  try {
    await pool.query('UPDATE usuarios SET activo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Usuario desactivado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

module.exports = { listar, crear, actualizar, eliminar };