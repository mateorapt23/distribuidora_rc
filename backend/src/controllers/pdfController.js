const puppeteer = require('puppeteer');

// Flags recomendados para entornos con poca RAM compartida (Render free/standard)
const LAUNCH_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage', // evita que Chromium use /dev/shm (muy chico en Render) y crashee al iniciar
  '--disable-gpu',
  '--single-process',        // reduce el consumo de memoria al no usar procesos separados
];

// Detecta la ruta de Chrome del sistema, como último fallback si nada más funciona
const getChromePath = () => {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const { platform } = process;
  if (platform === 'win32')
    return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  if (platform === 'darwin')
    return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  return '/usr/bin/google-chrome';
};

// 1) Intenta con el Chromium que puppeteer descargó (npx puppeteer browsers install chrome)
// 2) Si falla, intenta indicando explícitamente la ruta que reporta puppeteer.executablePath()
// 3) Si falla, intenta con un Chrome del sistema (CHROME_PATH o ruta por defecto del SO)
const launchBrowser = async () => {
  const intentos = [
    { label: 'chromium bundled (puppeteer.launch sin executablePath)', opciones: {} },
    { label: 'chromium bundled (executablePath explícito)', opciones: { executablePath: puppeteer.executablePath() } },
    { label: 'chrome del sistema', opciones: { executablePath: getChromePath() } },
  ];

  let ultimoError;
  for (const intento of intentos) {
    try {
      const browser = await puppeteer.launch({
        headless: 'new',
        args: LAUNCH_ARGS,
        ...intento.opciones,
      });
      return browser;
    } catch (err) {
      ultimoError = err;
      console.error(`⚠️  No se pudo lanzar el navegador con "${intento.label}":`, err.message);
    }
  }

  throw ultimoError;
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