const puppeteer = require('puppeteer');

const generarPDF = async (req, res) => {
  const { html, nombre } = req.body;
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
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
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

module.exports = { generarPDF };