const puppeteer = require('puppeteer-core');

// Render define automáticamente la variable de entorno RENDER=true en producción.
// En local (tu PC) esa variable no existe, así que usamos el Chrome instalado
// localmente (vía el paquete "puppeteer" completo, instalado como devDependency).
const esRender = !!process.env.RENDER;

// Lanza Chromium según el entorno:
// - En Render: usa el binario empaquetado por @sparticuz/chromium (no depende de cachés externas).
// - En local: usa el Chromium que descarga el paquete "puppeteer" completo.
const launchBrowser = async () => {
  const argsComunes = ['--disable-dev-shm-usage']; // evita que Chromium use /dev/shm (muy pequeño en Render)

  if (esRender) {
    const chromium = require('@sparticuz/chromium');
    return puppeteer.launch({
      args: [...chromium.args, ...argsComunes],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
  }

  // Local: usamos el paquete "puppeteer" completo (devDependency) que trae su propio Chromium
  const puppeteerFull = require('puppeteer');
  return puppeteerFull.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', ...argsComunes],
  });
};

const generarPDF = async (req, res) => {
  const { html, nombre, margins, size } = req.body;
  if (!html) return res.status(400).json({ error: 'HTML requerido' });

  let browser;
  try {
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfOpciones = {
      printBackground: true,
      margin: {
        top:    margins?.top    ?? '10mm',
        right:  margins?.right  ?? '0mm',
        bottom: margins?.bottom ?? '0mm',
        left:   margins?.left   ?? '0mm',
      },
    };
    if (size?.width) {
      pdfOpciones.width  = size.width;
      pdfOpciones.height = size.height ?? undefined;
    } else {
      pdfOpciones.format = 'A4';
    }

    const pdfBuffer = await page.pdf(pdfOpciones);
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
    browser = await launchBrowser();

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

    const htmlWrapped = html.replace(
      /<body[^>]*>/i,
      '<body><div id="recibo-root" style="width:1160px;margin:0 auto;padding:10px;">'
    ).replace(/<\/body>/i, '</div></body>');

    await page.setContent(htmlWrapped, { waitUntil: 'networkidle0' });

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