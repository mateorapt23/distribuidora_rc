// utils/fecha.js
// Devuelve la fecha de HOY en la zona horaria de Ecuador (America/Guayaquil),
// en formato YYYY-MM-DD.
//
// Por qué existe esto: `new Date().toISOString().split('T')[0]` da la fecha
// en UTC, no en la hora local. Ecuador está en UTC-5, así que entre
// las ~19:00 y las 23:59 hora local, `toISOString()` ya cayó en el día
// siguiente (UTC). Eso hacía que proformas/recibos/compras creados en la
// noche se guardaran con la fecha de mañana, y por eso el dashboard
// ("ventas hoy") no las contaba.
export const fechaLocalEcuador = () => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date()); // en-CA -> "YYYY-MM-DD"
};