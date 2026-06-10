const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { registrarLog } = require('./logHelper');
const Brevo = require('@getbrevo/brevo');

// ── LOGIN ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM usuarios WHERE username = $1 AND activo = TRUE',
      [username]
    );

    if (rows.length === 0) {
      // Log intento fallido — usuario no existe
      await pool.query(
        `INSERT INTO logs_actividad (usuario_nombre, accion, modulo, descripcion, ip)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          username,
          'login_fallido',
          'auth',
          `Intento de login fallido para el usuario "${username}" (no existe o inactivo)`,
          req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'desconocida',
        ]
      );
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      // Log intento fallido — contraseña incorrecta
      await pool.query(
        `INSERT INTO logs_actividad (usuario_id, usuario_nombre, accion, modulo, descripcion, ip)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          usuario.id,
          usuario.nombre,
          'login_fallido',
          'auth',
          `Contraseña incorrecta para "${usuario.username}"`,
          req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'desconocida',
        ]
      );
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    // Log login exitoso
    await pool.query(
      `INSERT INTO logs_actividad (usuario_id, usuario_nombre, accion, modulo, descripcion, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        usuario.id,
        usuario.nombre,
        'login',
        'auth',
        `Inicio de sesión exitoso (${usuario.rol})`,
        req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'desconocida',
      ]
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        username: usuario.username,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error('Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PERFIL ────────────────────────────────────────────────────────────────────
const perfil = async (req, res) => {
  res.json({ usuario: req.usuario });
};

// ── PASO 1: Solicitar código de recuperación ──────────────────────────────────
const solicitarRecuperacion = async (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'El nombre de usuario es requerido' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, email FROM usuarios WHERE username = $1 AND activo = TRUE',
      [username]
    );

    if (rows.length === 0 || !rows[0].email) {
      return res.json({ mensaje: 'Si el usuario existe y tiene email registrado, recibirás un código.' });
    }

    const usuario = rows[0];

    await pool.query(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE usuario_id = $1 AND usado = FALSE',
      [usuario.id]
    );

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      'INSERT INTO password_reset_tokens (usuario_id, token) VALUES ($1, $2)',
      [usuario.id, codigo]
    );

    const brevo = new Brevo.TransactionalEmailsApi();
    brevo.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

    await brevo.sendTransacEmail({
      sender: { email: process.env.BREVO_SENDER_EMAIL, name: 'Distribuidora RC' },
      to: [{ email: usuario.email }],
      subject: 'Código de recuperación de contraseña',
      htmlContent: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 12px;">
          <h2 style="color: #0D111C; margin-bottom: 8px;">Recuperación de contraseña</h2>
          <p style="color: #444; margin-bottom: 24px;">Hola <strong>${usuario.nombre}</strong>, usa el siguiente código para restablecer tu contraseña:</p>
          <div style="background: #0D111C; color: #F5C400; font-size: 36px; font-weight: 800; letter-spacing: 12px; text-align: center; padding: 24px; border-radius: 10px;">
            ${codigo}
          </div>
          <p style="color: #888; font-size: 13px; margin-top: 24px;">Este código expira en <strong>15 minutos</strong>. Si no solicitaste esto, ignora este correo.</p>
        </div>
      `,
    });

    res.json({ mensaje: 'Si el usuario existe y tiene email registrado, recibirás un código.' });
  } catch (err) {
    console.error('Error en solicitarRecuperacion:', err);
    res.status(500).json({ error: 'Error al enviar el código. Intenta más tarde.' });
  }
};

// ── PASO 2: Verificar código ──────────────────────────────────────────────────
const verificarCodigo = async (req, res) => {
  const { username, codigo } = req.body;

  if (!username || !codigo) {
    return res.status(400).json({ error: 'Usuario y código son requeridos' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT prt.id
       FROM password_reset_tokens prt
       JOIN usuarios u ON u.id = prt.usuario_id
       WHERE u.username = $1
         AND prt.token = $2
         AND prt.usado = FALSE
         AND prt.expira_en > NOW()`,
      [username, codigo]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El código es incorrecto o ya expiró' });
    }

    res.json({ valido: true });
  } catch (err) {
    console.error('Error en verificarCodigo:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PASO 3: Establecer nueva contraseña ───────────────────────────────────────
const nuevaPassword = async (req, res) => {
  const { username, codigo, nuevaPassword } = req.body;

  if (!username || !codigo || !nuevaPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT prt.id, u.id AS usuario_id, u.nombre
       FROM password_reset_tokens prt
       JOIN usuarios u ON u.id = prt.usuario_id
       WHERE u.username = $1
         AND prt.token = $2
         AND prt.usado = FALSE
         AND prt.expira_en > NOW()`,
      [username, codigo]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'El código es incorrecto o ya expiró' });
    }

    const { id: tokenId, usuario_id, nombre } = rows[0];

    const hash = await bcrypt.hash(nuevaPassword, 10);

    await pool.query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [hash, usuario_id]
    );

    await pool.query(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE id = $1',
      [tokenId]
    );

    // Log cambio de contraseña
    await pool.query(
      `INSERT INTO logs_actividad (usuario_id, usuario_nombre, accion, modulo, descripcion)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuario_id, nombre, 'cambio_password', 'auth', 'Contraseña restablecida via recuperación']
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en nuevaPassword:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login, perfil, solicitarRecuperacion, verificarCodigo, nuevaPassword };