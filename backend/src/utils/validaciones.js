// ─────────────────────────────────────────────────────────────
// Validaciones de identificación ecuatoriana / email / teléfono (backend)
// Mismo algoritmo que frontend/src/utils/validaciones.js
// ─────────────────────────────────────────────────────────────

function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula || '')) return false;
  const digitos = cedula.split('').map(Number);
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;
  if (digitos[2] > 5) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = digitos[i] * coeficientes[i];
    if (valor > 9) valor -= 9;
    suma += valor;
  }
  const verificador = (10 - (suma % 10)) % 10;
  return verificador === digitos[9];
}

function validarRuc(ruc) {
  if (!/^\d{13}$/.test(ruc || '')) return false;
  const digitos = ruc.split('').map(Number);
  const provincia = parseInt(ruc.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = digitos[2];

  if (tercerDigito >= 0 && tercerDigito <= 5) {
    if (!validarCedula(ruc.substring(0, 10))) return false;
    return parseInt(ruc.substring(10, 13), 10) >= 1;
  }

  if (tercerDigito === 9) {
    const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) suma += digitos[i] * coef[i];
    let verificador = 11 - (suma % 11);
    if (verificador === 11) verificador = 0;
    if (verificador === 10 || verificador !== digitos[9]) return false;
    return parseInt(ruc.substring(10, 13), 10) >= 1;
  }

  if (tercerDigito === 6) {
    const coef = [3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 8; i++) suma += digitos[i] * coef[i];
    let verificador = 11 - (suma % 11);
    if (verificador === 11) verificador = 0;
    if (verificador === 10 || verificador !== digitos[8]) return false;
    return ruc.substring(9, 13) === '0001';
  }

  return false;
}

function validarEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function validarTelefono(telefono) {
  if (!telefono) return true;
  return /^\d{7,10}$/.test(String(telefono).trim());
}

function validarIdentificacion(identificacion, tipo) {
  const id = (identificacion || '').trim();
  if (!id) return 'La identificación es requerida';

  if (tipo === 'CEDULA') {
    if (!/^\d{10}$/.test(id)) return 'La cédula debe tener exactamente 10 dígitos numéricos';
    if (!validarCedula(id)) return 'La cédula ingresada no es válida';
  } else if (tipo === 'RUC') {
    if (!/^\d{13}$/.test(id)) return 'El RUC debe tener exactamente 13 dígitos numéricos';
    if (!validarRuc(id)) return 'El RUC ingresado no es válido';
  } else {
    if (id.length < 3) return 'La identificación ingresada es demasiado corta';
  }
  return null;
}

function validarFilasDetalle(detalle, campoPrecio = 'precio') {
  if (!detalle || detalle.length === 0) return 'Debe incluir al menos un producto';
  for (const item of detalle) {
    const cant = Number(item.cantidad);
    const prec = Number(item[campoPrecio]);
    if (!item.descripcion || Number.isNaN(cant) || cant <= 0) return 'Hay líneas con cantidad inválida';
    if (Number.isNaN(prec) || prec < 0) return `Hay líneas con ${campoPrecio === 'costo' ? 'costo' : 'precio'} inválido o negativo`;
  }
  return null;
}

module.exports = { validarCedula, validarRuc, validarEmail, validarTelefono, validarIdentificacion, validarFilasDetalle };