const pool = require('../config/db');
const xlsx = require('xlsx');
const fs = require('fs');

const listar = async (req, res) => {
  const { buscar, stock_bajo, page = 1, limit = 50 } = req.query;
  const offset = (page - 1) * limit;

  let where = 'WHERE activo = TRUE';
  const params = [];

  if (buscar) {
    params.push(`%${buscar}%`);
    where += ` AND (codigo ILIKE $${params.length} OR descripcion ILIKE $${params.length})`;
  }

  if (stock_bajo === 'true') {
    where += ' AND inventariable = TRUE AND stock <= stock_minimo';
  }

  try {
    const { rows: total } = await pool.query(
      `SELECT COUNT(*) FROM productos ${where}`, params
    );

    params.push(limit, offset);
    const { rows } = await pool.query(
      `SELECT * FROM productos ${where} ORDER BY descripcion ASC 
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
    res.status(500).json({ error: 'Error al listar productos' });
  }
};

const obtener = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM productos WHERE id = $1', [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

const crear = async (req, res) => {
  const { codigo, descripcion, inventariable = true, stock = 0, stock_minimo = 0, iva = 0, pvp1 = 0, pvp2 = 0 } = req.body;

  if (!codigo || !descripcion) {
    return res.status(400).json({ error: 'Código y descripción son requeridos' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO productos (codigo, descripcion, inventariable, stock, stock_minimo, iva, pvp1, pvp2)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [codigo, descripcion, inventariable, stock, stock_minimo, iva, pvp1, pvp2]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El código ya existe' });
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

const actualizar = async (req, res) => {
  const { codigo, descripcion, inventariable, stock_minimo, iva, pvp1, pvp2 } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE productos SET
        codigo = COALESCE($1, codigo),
        descripcion = COALESCE($2, descripcion),
        inventariable = COALESCE($3, inventariable),
        stock_minimo = COALESCE($4, stock_minimo),
        iva = COALESCE($5, iva),
        pvp1 = COALESCE($6, pvp1),
        pvp2 = COALESCE($7, pvp2)
       WHERE id = $8 AND activo = TRUE RETURNING *`,
      [codigo, descripcion, inventariable, stock_minimo, iva, pvp1, pvp2, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'El código ya existe' });
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

const eliminar = async (req, res) => {
  try {
    await pool.query('UPDATE productos SET activo = FALSE WHERE id = $1', [req.params.id]);
    res.json({ mensaje: 'Producto eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

const ajusteStock = async (req, res) => {
  const { producto_id, cantidad, motivo } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'SELECT stock FROM productos WHERE id = $1 FOR UPDATE', [producto_id]
    );
    if (rows.length === 0) throw new Error('Producto no encontrado');

    const stockAnterior = parseFloat(rows[0].stock);
    const stockNuevo = stockAnterior + parseFloat(cantidad);

    if (stockNuevo < 0) throw new Error('El stock no puede quedar negativo');

    await client.query('UPDATE productos SET stock = $1 WHERE id = $2', [stockNuevo, producto_id]);

    await client.query(
      `INSERT INTO movimiento_stock (producto_id, tipo, cantidad, stock_anterior, stock_nuevo, referencia_tipo, usuario_id)
       VALUES ($1,'ajuste_manual',$2,$3,$4,$5,$6)`,
      [producto_id, parseFloat(cantidad), stockAnterior, stockNuevo, motivo || 'Ajuste manual', req.usuario.id]
    );

    await client.query('COMMIT');
    res.json({ mensaje: 'Stock ajustado', stock_nuevo: stockNuevo });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

const importarExcel = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Buscar la fila que contiene los headers reales (puede haber filas vacías al inicio)
    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const headerRowIdx = raw.findIndex(row =>
      row.some(cell => typeof cell === 'string' && cell.trim() !== '')
    );
    if (headerRowIdx === -1) return res.status(400).json({ error: 'No se encontraron encabezados en el archivo' });

    const headers = raw[headerRowIdx].map(h => (h || '').toString().trim());
    const dataRows = raw.slice(headerRowIdx + 1);

    // Convertir cada fila en objeto usando los headers encontrados
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
        if (found !== undefined && fila[found] !== '' && fila[found] !== null && fila[found] !== undefined) return fila[found];
      }
      return undefined;
    };

    const mapearFila = (fila) => ({
      codigo:        (g(fila, 'Código', 'Codigo', 'codigo', 'CODIGO') || '').toString().trim(),
      descripcion:   (g(fila, 'Descripción', 'Descripcion', 'descripcion', 'DESCRIPCION') || '').toString().replace(/[\t\n\r]+/g, ' ').trim(),
      inventariable: (() => {
        const v = (g(fila, 'Inventariable', 'inventariable') || '').toString().trim().toUpperCase();
        return v === 'SI' || v === 'SÍ' || v === 'YES' || v === '1' || v === 'TRUE';
      })(),
      stock:        parseFloat(g(fila, 'Stock', 'stock') || 0) || 0,
      stock_minimo: parseFloat(g(fila, 'Stock Mínimo', 'Stock Minimo', 'stock_minimo') || 0) || 0,
      iva:          parseFloat(g(fila, 'Iva(%)', 'IVA(%)', 'IVA', 'iva', 'iva(%)') || 0) || 0,
      pvp1:         parseFloat(g(fila, 'Pvp1', 'PVP1', 'pvp1', 'Precio 1', 'precio1') || 0) || 0,
      pvp2:         parseFloat(g(fila, 'Pvp2', 'PVP2', 'pvp2', 'Precio 2', 'precio2') || 0) || 0,
    });

    const client = await pool.connect();
    let insertados = 0, actualizados = 0;
    const errores = [];

    try {
      await client.query('BEGIN');

      for (const fila of filas) {
        const p = mapearFila(fila);
        if (!p.codigo || !p.descripcion) {
          errores.push(`Fila sin código o descripción: ${JSON.stringify(fila)}`);
          continue;
        }

        const { rows } = await client.query(
          'SELECT id FROM productos WHERE codigo = $1', [p.codigo]
        );

        if (rows.length > 0) {
          await client.query(
            `UPDATE productos SET descripcion=$1, inventariable=$2, stock=$3, stock_minimo=$4,
             iva=$5, pvp1=$6, pvp2=$7, activo=TRUE WHERE codigo=$8`,
            [p.descripcion, p.inventariable, p.stock, p.stock_minimo, p.iva, p.pvp1, p.pvp2, p.codigo]
          );
          actualizados++;
        } else {
          await client.query(
            `INSERT INTO productos (codigo, descripcion, inventariable, stock, stock_minimo, iva, pvp1, pvp2)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [p.codigo, p.descripcion, p.inventariable, p.stock, p.stock_minimo, p.iva, p.pvp1, p.pvp2]
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

    res.json({ mensaje: 'Importación completada', insertados, actualizados, errores });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al importar Excel: ' + err.message });
  }
};

const exportarExcel = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT codigo, descripcion, inventariable, stock, stock_minimo, iva, pvp1, pvp2 FROM productos WHERE activo = TRUE ORDER BY descripcion'
    );

    const datos = rows.map(p => ({
      'Código': p.codigo,
      'Descripción': p.descripcion,
      'Inventariable': p.inventariable ? 'SI' : 'NO',
      'Stock': p.stock,
      'Stock Mínimo': p.stock_minimo,
      'IVA': p.iva,
      'PVP1': p.pvp1,
      'PVP2': p.pvp2,
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(datos);
    xlsx.utils.book_append_sheet(wb, ws, 'Productos');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: 'Error al exportar' });
  }
};

module.exports = { listar, obtener, crear, actualizar, eliminar, ajusteStock, importarExcel, exportarExcel };