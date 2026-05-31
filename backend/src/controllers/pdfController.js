const puppeteer = require('puppeteer');

const generarPDF = async (req, res) => {
  const { html, nombre, margins } = req.body;
  if (!html) return res.status(400).json({ error: 'HTML requerido' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top:    margins?.top    ?? '10mm',
        right:  margins?.right  ?? '0mm',
        bottom: margins?.bottom ?? '0mm',
        left:   margins?.left   ?? '0mm',
      },
    });

    await browser.close();

    const filename = (nombre || 'documento.pdf').replace(/[^a-zA-Z0-9.\-_]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('Error generando PDF:', err);
    res.status(500).json({ error: 'Error al generar el PDF' });
  }
};

const generarCaptura = async (req, res) => {
  const { html, nombre } = req.body;
  if (!html) return res.status(400).json({ error: 'HTML requerido' });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    // Viewport generoso para que la tabla no se comprima
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

    // Envolver el HTML en un contenedor de ancho fijo para que
    // Puppeteer no redimensione los elementos de la tabla
    const htmlWrapped = html.replace(
      /<body[^>]*>/i,
      '<body><div id="recibo-root" style="width:1160px;margin:0 auto;padding:10px;">'
    ).replace(/<\/body>/i, '</div></body>');

    await page.setContent(htmlWrapped, { waitUntil: 'networkidle0' });

    // Capturar SOLO las dimensiones reales del contenido — sin espacio en blanco
    const clip = await page.evaluate(() => {
      const el = document.getElementById('recibo-root');
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return {
        x: Math.floor(rect.left),
        y: Math.floor(rect.top),
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height),
      };
    });

    const imageBuffer = await page.screenshot({
      type: 'png',
      ...(clip ? { clip } : { fullPage: true }),
    });

    await browser.close();

    const filename = (nombre || 'captura.png').replace(/[^a-zA-Z0-9.\-_]/g, '_');

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', imageBuffer.length);
    res.end(imageBuffer);

  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    console.error('Error generando captura:', err);
    res.status(500).json({ error: 'Error al generar la captura' });
  }
};

module.exports = { generarPDF, generarCaptura };