import { useState, useEffect, useCallback } from 'react';
import api from '../../api/config';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981',
  rojo: '#ef4444', morado: '#8b5cf6', indigo: '#6366f1',
};

const TIPOS = [
  { value: '',                         label: 'Todos' },
  { value: 'entrada_compra',           label: 'Entrada por compra' },
  { value: 'salida_recibo',            label: 'Salida por recibo' },
  { value: 'salida_factura_efacilito', label: 'Salida por factura Efacilito' },
  { value: 'ajuste_manual',            label: 'Ajuste manual' },
];

const COLORES_TIPO = {
  entrada_compra:           C.verde,
  salida_recibo:            C.azul,
  salida_factura_efacilito: '#8b5cf6',
  ajuste_manual:            C.amarillo,
};

// Si el tipo es "salida_*" la cantidad es negativa visualmente
const ES_SALIDA = (tipo) => tipo?.startsWith('salida');

// Convierte timestamp UTC a hora local de Ecuador (UTC-5)
const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  // Restar 5 horas para Ecuador
  d.setHours(d.getHours() - 5);
  const fecha = d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora  = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha} ${hora}`;
};

const hoy          = new Date().toISOString().split('T')[0];
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

// ── Iconos ────────────────────────────────────────────────────
const IcoChevron = ({ open }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round"
    style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IcoFolder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

// ── Helpers UI ────────────────────────────────────────────────
const Label = ({ children }) => (
  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: 1,
    display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
    {children}
  </label>
);

const inputSt = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const BtnSm = ({ color, onClick, disabled, children, outline }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: outline ? 'transparent' : color,
    color: outline ? color : '#fff',
    border: `1px solid ${color}`, borderRadius: 7,
    padding: '6px 14px', fontWeight: 600, fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 5,
    whiteSpace: 'nowrap',
  }}>{children}</button>
);

const BadgeTipo = ({ tipo }) => {
  const color = COLORES_TIPO[tipo] || C.textDim;
  const label = TIPOS.find(t => t.value === tipo)?.label || tipo;
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 4,
      background: color + '18', color,
      whiteSpace: 'nowrap', display: 'inline-block',
    }}>{label}</span>
  );
};

const CantidadCell = ({ cantidad, tipo }) => {
  const n    = parseFloat(cantidad);
  const salida = ES_SALIDA(tipo);
  const color = salida ? C.rojo : C.verde;
  const signo = salida ? '−' : '+';
  return (
    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700,
      color, whiteSpace: 'nowrap', width: 90 }}>
      {signo}{Math.abs(n)}
    </td>
  );
};

// ── Cabecera de tabla reutilizable ────────────────────────────
const THead = ({ cols }) => (
  <thead>
    <tr style={{ background: C.deep }}>
      {cols.map(({ label, align, width }) => (
        <th key={label} style={{
          padding: '11px 14px', color: C.textDim, fontWeight: 600,
          fontSize: 11, letterSpacing: 1.1, textAlign: align || 'left',
          borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase',
          whiteSpace: 'nowrap', width: width || 'auto',
        }}>{label}</th>
      ))}
    </tr>
  </thead>
);

const COLS_MOV = [
  { label: 'Fecha',       width: 140 },
  { label: 'Producto',    width: 260 },
  { label: 'Tipo',        width: 170 },
  { label: 'Cantidad',    width: 90,  align: 'right' },
  { label: 'Stock ant.',  width: 90,  align: 'right' },
  { label: 'Stock nuevo', width: 100, align: 'right' },
  { label: 'Referencia',  width: 160 },
  { label: 'Usuario',     width: 110 },
];

// ════════════════════════════════════════════════════════════
export default function ReporteMovimientos() {
  const [desde, setDesde]       = useState(primerDiaMes);
  const [hasta, setHasta]       = useState(hoy);
  const [tipo, setTipo]         = useState('');
  const [buscar, setBuscar]     = useState('');
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [cargando, setCargando] = useState(false);
  // Para el agrupado de importaciones Efacilito
  const [expandido, setExpandido] = useState(null);
  const LIMIT = 50;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (tipo)  params.append('tipo', tipo);
      if (desde) params.append('fecha_desde', desde);
      if (hasta) params.append('fecha_hasta', hasta);
      const { data: res } = await api.get(`/reportes/movimientos?${params}`);
      setData(res.data);
      setTotal(res.total);
    } catch { console.error('Error cargando movimientos'); }
    finally { setCargando(false); }
  }, [page, tipo, desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [tipo, desde, hasta]);

  // Separar movimientos normales de los de factura Efacilito
  const movsFiltrados = buscar
    ? data.filter(m =>
        m.descripcion?.toLowerCase().includes(buscar.toLowerCase()) ||
        m.codigo?.toLowerCase().includes(buscar.toLowerCase()))
    : data;

  const movsEfacilito = movsFiltrados.filter(m => m.tipo === 'salida_factura_efacilito');
  const movsNormales  = movsFiltrados.filter(m => m.tipo !== 'salida_factura_efacilito');

  // Agrupar los de Efacilito por referencia_id (= factura_id)
  const gruposEfacilito = (() => {
    const mapa = new Map();
    for (const m of movsEfacilito) {
      const key = m.referencia_id || 'sin-ref';
      if (!mapa.has(key)) {
        mapa.set(key, { referencia_id: key, fecha: m.creado_en, movimientos: [] });
      }
      mapa.get(key).movimientos.push(m);
    }
    return [...mapa.values()].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  })();

  const totalPags = Math.ceil(total / LIMIT);

  // KPIs de la página actual
  const totalEntradas = movsFiltrados.filter(m => !ES_SALIDA(m.tipo))
    .reduce((s, m) => s + parseFloat(m.cantidad), 0);
  const totalSalidas = movsFiltrados.filter(m => ES_SALIDA(m.tipo))
    .reduce((s, m) => s + parseFloat(m.cantidad), 0);

  const mostrarEfacilito = (tipo === '' || tipo === 'salida_factura_efacilito') && gruposEfacilito.length > 0;
  const mostrarNormales  = (tipo !== 'salida_factura_efacilito') && movsNormales.length > 0;

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* ── Filtros ── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
        padding: '16px 20px', marginBottom: 20,
        display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <Label>Desde</Label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
            style={{ ...inputSt, width: 155 }} />
        </div>
        <div>
          <Label>Hasta</Label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
            style={{ ...inputSt, width: 155 }} />
        </div>
        <div>
          <Label>Tipo</Label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            style={{ ...inputSt, width: 220 }}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <Label>Buscar producto</Label>
          <input placeholder="Código o descripción..." value={buscar}
            onChange={e => setBuscar(e.target.value)} style={{ ...inputSt, width: '100%' }} />
        </div>
        <span style={{ color: C.textDim, fontSize: 13, alignSelf: 'center', whiteSpace: 'nowrap' }}>
          {total} movimientos
        </span>
      </div>

      {/* ── KPIs ── */}
      {movsFiltrados.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total movimientos', value: movsFiltrados.length, color: C.azul },
            { label: 'Entradas',          value: `+${totalEntradas}`,  color: C.verde },
            { label: 'Salidas',           value: `−${totalSalidas}`,   color: C.rojo  },
          ].map(k => (
            <div key={k.label} style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim,
                textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
            </div>
          ))}
        </div>
      )}

      {cargando && (
        <div style={{ textAlign: 'center', padding: 40, color: C.textDim }}>Cargando...</div>
      )}

      {!cargando && movsFiltrados.length === 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: '48px 24px', textAlign: 'center', color: C.textDim }}>
          Sin movimientos para el período seleccionado
        </div>
      )}

      {/* ══ SECCIÓN: SALIDAS POR FACTURA EFACILITO — una sola tarjeta colapsable ══ */}
      {!cargando && mostrarEfacilito && (() => {
        const abiertoEf = expandido === 'efacilito-bloque';
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, overflow: 'hidden',
              boxShadow: abiertoEf ? '0 4px 16px rgba(139,92,246,0.08)' : 'none' }}>

              {/* Cabecera única colapsable */}
              <div onClick={() => setExpandido(abiertoEf ? null : 'efacilito-bloque')}
                style={{ padding: '14px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: abiertoEf ? '#f5f3ff' : '#fff',
                  borderBottom: abiertoEf ? `1px solid ${C.border}` : 'none',
                  transition: 'background .15s' }}>
                <div style={{ color: abiertoEf ? '#8b5cf6' : C.textDim }}>
                  <IcoChevron open={abiertoEf} />
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8b5cf6', flexShrink: 0 }}>
                  <IcoFolder />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: 14 }}>
                    Salidas por Facturas Efacilito
                  </div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 2, display: 'flex', gap: 14 }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>
                      {gruposEfacilito.length} facturas
                    </span>
                    <span style={{ color: C.rojo, fontWeight: 600 }}>
                      {movsEfacilito.length} productos descontados
                    </span>
                  </div>
                </div>
                <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 20,
                  padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                  {gruposEfacilito.length} facturas · {movsEfacilito.length} movimientos
                </span>
              </div>

              {/* Tabla completa con columna Nro. Factura */}
              {abiertoEf && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <THead cols={[
                      { label: 'Fecha',        width: 140 },
                      { label: 'Nro. Factura', width: 180 },
                      { label: 'Producto',     width: 240 },
                      { label: 'Cantidad',     width: 90,  align: 'right' },
                      { label: 'Stock ant.',   width: 90,  align: 'right' },
                      { label: 'Stock nuevo',  width: 100, align: 'right' },
                    ]} />
                    <tbody>
                      {gruposEfacilito.flatMap(grupo =>
                        grupo.movimientos.map((m, i) => (
                          <tr key={m.id} style={{ borderBottom: `1px solid ${C.grid}`,
                            background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                            <td style={{ padding: '9px 14px', color: C.textDim, fontSize: 12,
                              whiteSpace: 'nowrap', width: 140 }}>
                              {fmtFecha(m.creado_en)}
                            </td>
                            <td style={{ padding: '9px 14px', width: 180 }}>
                              <span style={{ color: '#8b5cf6', fontWeight: 600,
                                fontFamily: 'monospace', fontSize: 12 }}>
                                #{grupo.referencia_id}
                              </span>
                            </td>
                            <td style={{ padding: '9px 14px', width: 240 }}>
                              <div style={{ color: C.textSec, overflow: 'hidden',
                                textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 230 }}>
                                {m.descripcion}
                              </div>
                              <div style={{ color: C.textDim, fontSize: 11, fontFamily: 'monospace' }}>
                                {m.codigo}
                              </div>
                            </td>
                            <CantidadCell cantidad={m.cantidad} tipo={m.tipo} />
                            <td style={{ padding: '9px 14px', textAlign: 'right',
                              color: C.textDim, width: 90 }}>
                              {parseFloat(m.stock_anterior)}
                            </td>
                            <td style={{ padding: '9px 14px', textAlign: 'right',
                              color: parseFloat(m.stock_nuevo) < 0 ? C.rojo : C.textSec,
                              fontWeight: 600, width: 100 }}>
                              {parseFloat(m.stock_nuevo)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ══ SECCIÓN: DEMÁS MOVIMIENTOS ══ */}
      {!cargando && mostrarNormales && (
        <div>
          {mostrarEfacilito && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 3, height: 20, borderRadius: 2, background: C.azul }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                Otros movimientos
              </span>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 20,
                padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                {movsNormales.length}
              </span>
            </div>
          )}

          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                <THead cols={COLS_MOV} />
                <tbody>
                  {movsNormales.map((m, i) => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${C.grid}`,
                      background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px', color: C.textDim, fontSize: 12,
                        whiteSpace: 'nowrap', width: 140, overflow: 'hidden' }}>
                        {fmtFecha(m.creado_en)}
                      </td>
                      <td style={{ padding: '10px 14px', width: 260, overflow: 'hidden' }}>
                        <div style={{ color: C.textSec, overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</div>
                        <div style={{ color: C.textDim, fontSize: 11, fontFamily: 'monospace' }}>{m.codigo}</div>
                      </td>
                      <td style={{ padding: '10px 14px', width: 170 }}>
                        <BadgeTipo tipo={m.tipo} />
                      </td>
                      <CantidadCell cantidad={m.cantidad} tipo={m.tipo} />
                      <td style={{ padding: '10px 14px', textAlign: 'right',
                        color: C.textDim, width: 90 }}>
                        {parseFloat(m.stock_anterior)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right',
                        color: parseFloat(m.stock_nuevo) < 0 ? C.rojo : C.textSec,
                        fontWeight: 600, width: 100 }}>
                        {parseFloat(m.stock_nuevo)}
                      </td>
                      <td style={{ padding: '10px 14px', color: C.textDim, fontSize: 11,
                        width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.referencia_tipo || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: C.textDim, fontSize: 12,
                        width: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.usuario_nombre || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Paginación */}
      {totalPags > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center' }}>
          <BtnSm color={C.azul} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Ant.</BtnSm>
          <span style={{ color: C.textDim, fontSize: 13 }}>Página {page} de {totalPags}</span>
          <BtnSm color={C.azul} onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags}>Sig. →</BtnSm>
        </div>
      )}
    </div>
  );
}