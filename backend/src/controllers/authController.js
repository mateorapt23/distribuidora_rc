const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

// ── Transporter de email ──────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = rows[0];
    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.nombre },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
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
// Recibe: { username }
// Busca el usuario, genera un código de 6 dígitos, lo guarda y lo envía al email
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

    // Respuesta genérica para no revelar si el usuario existe o no
    if (rows.length === 0 || !rows[0].email) {
      return res.json({ mensaje: 'Si el usuario existe y tiene email registrado, recibirás un código.' });
    }

    const usuario = rows[0];

    // Invalidar tokens anteriores del mismo usuario que aún no hayan sido usados
    await pool.query(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE usuario_id = $1 AND usado = FALSE',
      [usuario.id]
    );

    // Generar código de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Guardar el token en la base de datos (expira en 15 minutos por DEFAULT de la tabla)
    await pool.query(
      'INSERT INTO password_reset_tokens (usuario_id, token) VALUES ($1, $2)',
      [usuario.id, codigo]
    );

    // Enviar email
    await transporter.sendMail({
      from: `"Distribuidora Rodríguez-Carrión" <${process.env.EMAIL_USER}>`,
      to: usuario.email,
      subject: 'Código de recuperación de contraseña',
      html: `
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
// Recibe: { username, codigo }
// Verifica que el código sea válido, no esté usado y no haya expirado
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
// Recibe: { username, codigo, nuevaPassword }
// Verifica el código una vez más, actualiza la contraseña y marca el token como usado
const nuevaPassword = async (req, res) => {
  const { username, codigo, nuevaPassword } = req.body;

  if (!username || !codigo || !nuevaPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (nuevaPassword.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    // Verificar el código una vez más antes de cambiar la contraseña
    const { rows } = await pool.query(
      `SELECT prt.id, u.id AS usuario_id
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

    const { id: tokenId, usuario_id } = rows[0];

    // Hashear la nueva contraseña
    const hash = await bcrypt.hash(nuevaPassword, 10);

    // Actualizar la contraseña del usuario
    await pool.query(
      'UPDATE usuarios SET password = $1 WHERE id = $2',
      [hash, usuario_id]
    );

    // Marcar el token como usado para que no pueda reutilizarse
    await pool.query(
      'UPDATE password_reset_tokens SET usado = TRUE WHERE id = $1',
      [tokenId]
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error en nuevaPassword:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login, perfil, solicitarRecuperacion, verificarCodigo, nuevaPassword };