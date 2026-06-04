// backend/src/controllers/sriController.js
// Parsea el XML de una factura electrónica del SRI subida directamente por el usuario.
// El emisor (proveedor) está obligado por ley a enviar el XML + RIDE al receptor.
// Este controller recibe ese archivo .xml via multipart/form-data y extrae sus datos.

/**
 * Extrae el valor de una etiqueta XML simple (primer match).
 */
function getTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

/**
 * Extrae todos los bloques <detalle>...</detalle> del XML del comprobante.
 */
function getDetalles(xml) {
  const items = [];
  const re = /<detalle>([\s\S]*?)<\/detalle>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const bloque = m[1];
    const descripcion     = getTag(bloque, 'descripcion');
    const cantidad        = parseFloat(getTag(bloque, 'cantidad'))       || 1;
    const precioUnitario  = parseFloat(getTag(bloque, 'precioUnitario')) || 0;
    const codigoPrincipal = getTag(bloque, 'codigoPrincipal');

    // IVA: busca dentro de <impuesto> con codigo 2 (IVA)
    let ivaPorcentaje = 0;
    const impuestosBloque = bloque.match(/<impuesto>([\s\S]*?)<\/impuesto>/gi) || [];
    for (const imp of impuestosBloque) {
      const codigoImp = getTag(imp, 'codigo');
      if (codigoImp === '2') {
        const tarifa = parseFloat(getTag(imp, 'tarifa'));
        if (!isNaN(tarifa)) ivaPorcentaje = tarifa;
      }
    }

    items.push({
      codigo:      codigoPrincipal,
      descripcion,
      cantidad,
      costo:       precioUnitario,
      iva:         ivaPorcentaje,
      subtotal:    cantidad * precioUnitario * (1 + ivaPorcentaje / 100),
    });
  }
  return items;
}

/**
 * POST /api/compras/sri/xml
 * Recibe un archivo .xml (multipart/form-data, campo "archivo") con la factura
 * electrónica autorizada por el SRI y devuelve los datos estructurados.
 */
const parsearXMLFactura = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Debes subir un archivo XML.' });
  }

  // multer guarda el buffer en req.file.buffer (usamos memoryStorage)
  const xmlStr = req.file.buffer.toString('utf-8');

  if (!xmlStr || xmlStr.trim().length === 0) {
    return res.status(400).json({ error: 'El archivo XML está vacío.' });
  }

  // El XML del SRI puede venir en tres formatos:
  //   1. XML del comprobante directamente (formato limpio del proveedor)
  //   2. Respuesta SOAP con <comprobante><![CDATA[...]]></comprobante>
  //   3. Respuesta de autorización del SRI con <comprobante> HTML-escapado
  //      (el contenido lleva &lt;factura&gt; en vez de <factura>)
  let comprobanteXML = xmlStr;

  // Caso 2: CDATA
  const cdataMatch = xmlStr.match(/<comprobante><!\[CDATA\[([\s\S]*?)\]\]><\/comprobante>/i);
  if (cdataMatch) {
    comprobanteXML = cdataMatch[1];
  } else {
    // Caso 3: contenido HTML-escapado dentro de <comprobante>
    const escapedMatch = xmlStr.match(/<comprobante>([\s\S]*?)<\/comprobante>/i);
    if (escapedMatch && escapedMatch[1].includes('&lt;')) {
      comprobanteXML = escapedMatch[1]
        .replace(/&lt;/g,   '<')
        .replace(/&gt;/g,   '>')
        .replace(/&amp;/g,  '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
    }
  }

  // Validar que tenga estructura de factura electrónica
  const tipoComprobante = getTag(comprobanteXML, 'codDoc') || getTag(comprobanteXML, 'tipoComprobante');
  const claveAcceso = getTag(comprobanteXML, 'claveAcceso');

  if (!claveAcceso && !getTag(comprobanteXML, 'ruc')) {
    return res.status(422).json({
      error: 'El archivo no parece ser una factura electrónica del SRI válida. Verifica que sea el XML del comprobante.',
    });
  }

  // ── Datos del emisor (proveedor) ──────────────────────────────────────
  const razonSocial   = getTag(comprobanteXML, 'razonSocial');
  const ruc           = getTag(comprobanteXML, 'ruc');
  const fechaEmision  = getTag(comprobanteXML, 'fechaEmision'); // dd/MM/yyyy
  const numeroFactura = [
    getTag(comprobanteXML, 'estab'),
    getTag(comprobanteXML, 'ptoEmi'),
    getTag(comprobanteXML, 'secuencial'),
  ].filter(Boolean).join('-');

  // ── Totales ───────────────────────────────────────────────────────────
  const importeTotal     = parseFloat(getTag(comprobanteXML, 'importeTotal'))     || 0;
  const totalSinImpuesto = parseFloat(
    getTag(comprobanteXML, 'totalSinImpuestos') ||
    getTag(comprobanteXML, 'subtotalSinImpuestos')
  ) || 0;

  // ── Fecha en formato yyyy-MM-dd ────────────────────────────────────────
  let fechaISO = '';
  if (fechaEmision) {
    const partes = fechaEmision.split('/');
    if (partes.length === 3) {
      fechaISO = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
  }

  // ── Detalle de productos ──────────────────────────────────────────────
  const detalle = getDetalles(comprobanteXML);

  if (detalle.length === 0) {
    return res.status(422).json({
      error: 'No se encontraron productos en el XML. Verifica que sea una factura de compra.',
    });
  }

  console.log(`[SRI-XML] Factura parseada: ${razonSocial} | ${numeroFactura} | ${detalle.length} ítems`);

  res.json({
    proveedor:   razonSocial,
    ruc,
    factura_ref: numeroFactura,
    fecha:       fechaISO,
    total:       importeTotal,
    subtotal:    totalSinImpuesto,
    detalle,
  });
};

module.exports = { parsearXMLFactura };