const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { registrarLog } = require('./logHelper');
const { validarEmail } = require('../utils/validaciones');

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
  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El correo electrónico no es válido' });
    }
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, username, password, rol, email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, username, rol, email, activo, creado_en`,
      [nombre, username, hash, rol, email || null]
    );

    await registrarLog(req, {
      accion: 'crear_usuario',
      modulo: 'usuarios',
      descripcion: `Creó el usuario "${username}" con rol ${rol}`,
      referencia_id: rows[0].id,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El username ya existe' });
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

const actualizar = async (req, res) => {
  const { nombre, rol, activo, password, email } = req.body;

  if (password && password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }
  if (email && !validarEmail(email)) {
    return res.status(400).json({ error: 'El correo electrónico no es válido' });
  }

  try {
    let hash = undefined;
    if (password) hash = await bcrypt.hash(password, 10);

    const { rows } = await pool.query(
      `UPDATE usuarios SET
        nombre = COALESCE($1, nombre),
        rol    = COALESCE($2, rol),
        activo = COALESCE($3, activo),
        email  = COALESCE($5, email)
        ${hash ? ', password = $6' : ''}
       WHERE id = $4
       RETURNING id, nombre, username, rol, email, activo`,
      hash
        ? [nombre ?? null, rol ?? null, activo ?? null, req.params.id, email ?? null, hash]
        : [nombre ?? null, rol ?? null, activo ?? null, req.params.id, email ?? null]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const cambios = [];
    if (nombre)  cambios.push(`nombre: "${nombre}"`);
    if (rol)     cambios.push(`rol: ${rol}`);
    if (activo !== undefined) cambios.push(`activo: ${activo}`);
    if (password) cambios.push('contraseña actualizada');

    await registrarLog(req, {
      accion: 'editar_usuario',
      modulo: 'usuarios',
      descripcion: `Editó usuario "${rows[0].username}" — ${cambios.join(', ') || 'sin cambios'}`,
      referencia_id: rows[0].id,
    });

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
    // Obtenemos el nombre antes de eliminar para el log
    const { rows } = await pool.query(
      'SELECT username FROM usuarios WHERE id = $1', [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    await pool.query('DELETE FROM usuarios WHERE id = $1', [req.params.id]);

    await registrarLog(req, {
      accion: 'eliminar_usuario',
      modulo: 'usuarios',
      descripcion: `Eliminó permanentemente el usuario "${rows[0].username}"`,
      referencia_id: parseInt(req.params.id),
    });

    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

module.exports = { listar, crear, actualizar, eliminar };