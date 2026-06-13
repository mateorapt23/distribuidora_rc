const fs = require('fs');
const path = require('path');

// Carga y cachea en memoria los .woff2 como base64 (solo se hace una vez al iniciar el server)
const toBase64 = (file) =>
  fs.readFileSync(path.join(__dirname, '..', 'fonts', file)).toString('base64');

const regular = toBase64('Roboto-Regular.woff2'); // peso 400
const bold    = toBase64('Roboto-Bold.woff2');    // peso 700
const black   = toBase64('Roboto-Black.woff2');   // peso 900

// Definimos @font-face REGISTRANDO el nombre "Arial" (y "Helvetica") con Roboto.
// Así, sin tocar ninguna plantilla (Guardados.jsx, Tabla.jsx, etc.), cualquier
// font-family: Arial/Helvetica con font-weight 400/700/900 usará estos archivos
// embebidos en Chromium, en lugar de depender de fuentes del sistema operativo
// (que en Render/@sparticuz/chromium no incluyen las negrillas).
const fontCSS = `
  @font-face {
    font-family: 'Arial';
    font-style: normal;
    font-weight: 400;
    src: url(data:font/woff2;base64,${regular}) format('woff2');
  }
  @font-face {
    font-family: 'Arial';
    font-style: normal;
    font-weight: 700;
    src: url(data:font/woff2;base64,${bold}) format('woff2');
  }
  @font-face {
    font-family: 'Arial';
    font-style: normal;
    font-weight: 900;
    src: url(data:font/woff2;base64,${black}) format('woff2');
  }
  @font-face {
    font-family: 'Helvetica';
    font-style: normal;
    font-weight: 400;
    src: url(data:font/woff2;base64,${regular}) format('woff2');
  }
  @font-face {
    font-family: 'Helvetica';
    font-style: normal;
    font-weight: 700;
    src: url(data:font/woff2;base64,${bold}) format('woff2');
  }
  @font-face {
    font-family: 'Helvetica';
    font-style: normal;
    font-weight: 900;
    src: url(data:font/woff2;base64,${black}) format('woff2');
  }
`;

// Inserta el bloque <style> con las fuentes embebidas dentro del <head> del HTML recibido.
// Si no hay <head>, lo agrega al inicio del documento.
const inyectarFuentes = (html) => {
  const styleTag = `<style>${fontCSS}</style>`;
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${styleTag}`);
  }
  return styleTag + html;
};

module.exports = { inyectarFuentes };