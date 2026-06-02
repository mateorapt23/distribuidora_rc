const pool = require('../config/db');
const xlsx = require('xlsx');
const fs   = require('fs');
const { registrarLog } = require('./logHelper');

// ── Listar ────────────────────────────────────────────────
const listar = async (req, res) => {
  const { buscar, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE activo = TRUE';
  const params = [];

  if (buscar) {
    params.push(`%${buscar}%`);
    where += ` AND (identificacion ILIKE $${params.length} OR nombre ILIKE $${params.length} OR telefono ILIKE $${params.length} OR email ILIKE $${params.length})`;
  }

  try {
    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM clientes ${where}`, params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT * FROM clientes ${where} ORDER BY nombre ASC
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
    console.error(err);
    res.status(500).json({ error: 'Error al listar clientes' });
  }
};

// ── Buscar (para autocomplete en Tabla) ──────────────────
const buscar = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) return res.json([]);

  try {
    const { rows } = await pool.query(
      `SELECT id, identificacion, tipo, nombre, direccion, telefono, email
       FROM clientes
       WHERE activo = TRUE
         AND (nombre ILIKE $1 OR identificacion ILIKE $1)
       ORDER BY nombre ASC
       LIMIT 10`,
      [`%${q.trim()}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
};

// ── Obtener uno ───────────────────────────────────────────
const obtener = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM clientes WHERE id = $1', [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

// ── Crear ─────────────────────────────────────────────────
const crear = async (req, res) => {
  const { identificacion, tipo, nombre, direccion, telefono, email } = req.body;

  if (!identificacion || !tipo || !nombre) {
    return res.status(400).json({ error: 'Identificación, tipo y nombre son requeridos' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO clientes (identificacion, tipo, nombre, direccion, telefono, email)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [identificacion.trim(), tipo, nombre.trim(), direccion || null, telefono || null, email || null]
    );

    await registrarLog(req, {
      accion: 'crear_cliente',
      modulo: 'clientes',
      descripcion: `Creó cliente "${nombre.trim()}" (${tipo}: ${identificacion.trim()})`,
      referencia_id: rows[0].id,
    });

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'La identificación ya existe' });
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

// ── Actualizar ────────────────────────────────────────────
const actualizar = async (req, res) => {
  const { identificacion, tipo, nombre, direccion, telefono, email } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE clientes SET
        identificacion = COALESCE($1, identificacion),
        tipo           = COALESCE($2, tipo),
        nombre         = COALESCE($3, nombre),
        direccion      = $4,
        telefono       = $5,
        email          = $6
       WHERE id = $7 AND activo = TRUE RETURNING *`,
      [
        identificacion?.trim() || null,
        tipo || null,
        nombre?.trim() || null,
        direccion || null,
        telefono || null,
        email || null,
        req.params.id,
      ]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });

    await registrarLog(req, {
      accion: 'editar_cliente',
      modulo: 'clientes',
      descripcion: `Editó cliente "${rows[0].nombre}" (${rows[0].identificacion})`,
      referencia_id: rows[0].id,
    });

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'La identificación ya existe' });
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

// ── Eliminar (soft delete) ────────────────────────────────
const eliminar = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT nombre, identificacion FROM clientes WHERE id = $1', [req.params.id]
    );

    await pool.query('UPDATE clientes SET activo = FALSE WHERE id = $1', [req.params.id]);

    await registrarLog(req, {
      accion: 'eliminar_cliente',
      modulo: 'clientes',
      descripcion: `Eliminó cliente "${rows[0]?.nombre || ''}" (${rows[0]?.identificacion || req.params.id})`,
      referencia_id: parseInt(req.params.id),
    });

    res.json({ mensaje: 'Cliente eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};

// ── Importar Excel ────────────────────────────────────────
const importarExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet    = workbook.Sheets[workbook.SheetNames[0]];
    const raw      = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const headerRowIdx = raw.findIndex(row =>
      row.some(cell => typeof cell === 'string' && cell.trim() !== '')
    );
    if (headerRowIdx === -1)
      return res.status(400).json({ error: 'No se encontraron encabezados en el archivo' });

    const headers  = raw[headerRowIdx].map(h => (h || '').toString().trim());
    const dataRows = raw.slice(headerRowIdx + 1);

    const filas = dataRows
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
        return obj;
      })
      .filter(obj => headers.some(h => obj[h] !== ''));

    const g = (fila, ...keys) => {
      for (const k of keys) {
        const found = Object.keys(fila).find(fk => fk.trim().toLowerCase() === k.toLowerCase());
        if (found !== undefined && fila[found] !== '' && fila[found] !== null) return fila[found];
      }
      return '';
    };

    const normalizarTipo = (raw) => {
      const v = (raw || '').toString().toUpperCase().trim();
      if (v.includes('RUC'))       return 'RUC';
      if (v.includes('CED'))       return 'CEDULA';
      if (v.includes('PAS'))       return 'PASAPORTE';
      return 'OTRO';
    };

    const client = await pool.connect();
    let insertados = 0, actualizados = 0;
    const errores = [];

    try {
      await client.query('BEGIN');

      for (const fila of filas) {
        const identificacion = g(fila, 'Identificacion', 'Identificación', 'identificacion', 'RUC/CI', 'CI/RUC')
          .toString().replace(/^\|/, '').trim();
        const tipo    = normalizarTipo(g(fila, 'Tipo', 'tipo'));
        const nombre  = g(fila, 'Cliente', 'Nombre', 'cliente', 'nombre').toString().trim();
        const direccion = g(fila, 'Dirección', 'Direccion', 'direccion').toString().trim() || null;
        const telefono  = g(fila, 'Teléfono', 'Telefono', 'telefono').toString().trim() || null;
        const email     = g(fila, 'Email', 'email').toString().trim() || null;

        if (!identificacion || !nombre) {
          errores.push(`Fila sin identificación o nombre: ${JSON.stringify(fila)}`);
          continue;
        }

        const { rows } = await client.query(
          'SELECT id FROM clientes WHERE identificacion = $1', [identificacion]
        );

        if (rows.length > 0) {
          await client.query(
            `UPDATE clientes SET tipo=$1, nombre=$2, direccion=$3, telefono=$4, email=$5, activo=TRUE
             WHERE identificacion=$6`,
            [tipo, nombre, direccion, telefono, email, identificacion]
          );
          actualizados++;
        } else {
          await client.query(
            `INSERT INTO clientes (identificacion, tipo, nombre, direccion, telefono, email)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [identificacion, tipo, nombre, direccion, telefono, email]
          );
          insertados++;
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
      fs.unlinkSync(req.file.path);
    }

    await registrarLog(req, {
      accion: 'importar_clientes',
      modulo: 'clientes',
      descripcion: `Importó Excel de clientes: ${insertados} creados, ${actualizados} actualizados`,
    });

    res.json({ mensaje: 'Importación completada', insertados, actualizados, errores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al importar Excel: ' + err.message });
  }
};

// ── Exportar Excel ────────────────────────────────────────
const exportarExcel = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT identificacion, tipo, nombre, direccion, telefono, email
       FROM clientes WHERE activo = TRUE ORDER BY nombre`
    );

    const datos = rows.map(c => ({
      'Identificacion': c.identificacion,
      'Tipo':           c.tipo,
      'Cliente':        c.nombre,
      'Dirección':      c.direccion || '',
      'Teléfono':       c.telefono  || '',
      'Email':          c.email     || '',
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(datos);
    xlsx.utils.book_append_sheet(wb, ws, 'Clientes');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=clientes.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar' });
  }
};

module.exports = { listar, buscar, obtener, crear, actualizar, eliminar, importarExcel, exportarExcel };