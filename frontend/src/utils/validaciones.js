// ─────────────────────────────────────────────────────────────
// Validaciones reutilizables (Ecuador): cédula, RUC, email, teléfono, fechas
// ─────────────────────────────────────────────────────────────

/** Valida una cédula ecuatoriana de 10 dígitos (algoritmo módulo 10). */
export function validarCedula(cedula) {
  if (!/^\d{10}$/.test(cedula || '')) return false;

  const digitos = cedula.split('').map(Number);
  const provincia = parseInt(cedula.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = digitos[2];
  if (tercerDigito > 5) return false; // 0-5 = persona natural

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

/** Valida un RUC ecuatoriano de 13 dígitos (persona natural, jurídica privada o pública). */
export function validarRuc(ruc) {
  if (!/^\d{13}$/.test(ruc || '')) return false;

  const digitos = ruc.split('').map(Number);
  const provincia = parseInt(ruc.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) return false;

  const tercerDigito = digitos[2];

  // Persona natural: mismo algoritmo de cédula + establecimiento "001"-"999"
  if (tercerDigito >= 0 && tercerDigito <= 5) {
    if (!validarCedula(ruc.substring(0, 10))) return false;
    const establecimiento = parseInt(ruc.substring(10, 13), 10);
    return establecimiento >= 1;
  }

  // Sociedad privada (tercer dígito 9): módulo 11, coeficientes [4,3,2,7,6,5,4,3,2]
  if (tercerDigito === 9) {
    const coef = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) suma += digitos[i] * coef[i];
    let verificador = 11 - (suma % 11);
    if (verificador === 11) verificador = 0;
    if (verificador === 10) return false;
    if (verificador !== digitos[9]) return false;
    const establecimiento = parseInt(ruc.substring(10, 13), 10);
    return establecimiento >= 1;
  }

  // Sociedad pública (tercer dígito 6): módulo 11, coeficientes [3,2,7,6,5,4,3,2] sobre 8 dígitos
  if (tercerDigito === 6) {
    const coef = [3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 8; i++) suma += digitos[i] * coef[i];
    let verificador = 11 - (suma % 11);
    if (verificador === 11) verificador = 0;
    if (verificador === 10) return false;
    if (verificador !== digitos[8]) return false;
    return ruc.substring(9, 13) === '0001';
  }

  return false;
}

/** Valida formato de email estándar. */
export function validarEmail(email) {
  if (!email) return true; // campo opcional en la mayoría de formularios
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Valida teléfono ecuatoriano: 7 a 10 dígitos. */
export function validarTelefono(telefono) {
  if (!telefono) return true; // campo opcional
  return /^\d{7,10}$/.test(telefono.trim());
}

/**
 * Valida la identificación de un cliente según su tipo.
 * Devuelve un mensaje de error (string) o null si es válida.
 */
export function validarIdentificacion(identificacion, tipo) {
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

/**
 * Valida un rango de fechas (strings 'YYYY-MM-DD' o vacío).
 * Devuelve un mensaje de error o null si el rango es válido.
 */
export function validarRangoFechas(desde, hasta) {
  if (!desde || !hasta) return null;
  const dDesde = new Date(desde);
  const dHasta = new Date(hasta);
  if (isNaN(dDesde.getTime()) || isNaN(dHasta.getTime())) return 'Fecha inválida';
  if (dDesde > dHasta) return 'La fecha "desde" no puede ser posterior a la fecha "hasta"';
  return null;
}

/** true si el string representa un número válido (permite decimales y negativos opcionalmente). */
export function esNumeroValido(valor, { permitirNegativo = false } = {}) {
  if (valor === '' || valor === null || valor === undefined) return false;
  const n = Number(valor);
  if (Number.isNaN(n)) return false;
  if (!permitirNegativo && n < 0) return false;
  return true;
}

/** Valida las filas de un detalle de documento/compra: descripción, cantidad > 0, precio/costo >= 0. */
export function validarFilasDetalle(filas, campoPrecio = 'precio') {
  const validas = filas.filter(f => f.descripcion && esNumeroValido(f.cantidad) && Number(f.cantidad) > 0);
  if (validas.length === 0) return 'Agrega al menos un producto';
  const conPrecioInvalido = validas.some(f => !esNumeroValido(f[campoPrecio]));
  if (conPrecioInvalido) return `Hay líneas con ${campoPrecio === 'costo' ? 'costo' : 'precio'} inválido o negativo`;
  return null;
}