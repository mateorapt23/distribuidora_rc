import { useState, useEffect, useCallback } from 'react';
import api from '../../api/config';
import { useBreakpoint } from '../../hooks/useIsMobile';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981',
  rojo: '#ef4444', morado: '#8b5cf6',
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

const ES_SALIDA = (tipo) => tipo?.startsWith('salida');

const fmtFecha = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  d.setHours(d.getHours() - 5);
  const fecha = d.toLocaleDateString('es-EC', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const hora  = d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fecha} ${hora}`;
};

// ── Iconos ─────────────────────────────────────────────────
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
const IcoXlsx = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l2.5 3L13 12m0 0l2.5-3M13 12l-2.5-3"/></svg>;
const IcoPdf  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>;
const IcoSort = ({ dir }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 4, opacity: dir ? 1 : 0.35 }}>
    {(!dir || dir === 'asc')  && <polyline points="18 15 12 9 6 15" style={{ opacity: dir === 'asc'  ? 1 : 0.4 }} />}
    {(!dir || dir === 'desc') && <polyline points="6 9 12 15 18 9"  style={{ opacity: dir === 'desc' ? 1 : 0.4 }} />}
  </svg>
);

// ── Utilidades export ───────────────────────────────────────
const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script'); s.src = src;
  s.onload = res; s.onerror = rej; document.head.appendChild(s);
});

const exportXLSX = async (rows, headers, filename) => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  const ws = window.XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
  window.XLSX.writeFile(wb, filename);
};

const exportPDF = async (rows, headers, title, filename) => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(14); doc.setFont(undefined, 'bold');
  doc.text(title, 14, 16);
  doc.setFontSize(9); doc.setFont(undefined, 'normal');
  doc.text(`Generado: ${new Date().toLocaleString('es-EC')}`, 14, 23);
  doc.autoTable({ head: [headers], body: rows, startY: 28, styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [249, 250, 251] } });
  doc.save(filename);
};

// ── Helpers UI ─────────────────────────────────────────────
const inputSt = {
  background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};

const BtnSm = ({ color, onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: 'transparent', color, border: `1px solid ${color}`, borderRadius: 7,
    padding: '6px 14px', fontWeight: 600, fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
  }}>{children}</button>
);

const BtnExport = ({ onClick, color, label, icon }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'transparent', border: `1px solid ${color}`, color,
    borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'background .15s',
  }}
    onMouseEnter={e => e.currentTarget.style.background = color + '14'}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
    {icon} {label}
  </button>
);

const BadgeTipo = ({ tipo, small }) => {
  const color = COLORES_TIPO[tipo] || C.textDim;
  const label = TIPOS.find(t => t.value === tipo)?.label || tipo;
  return (
    <span style={{
      fontSize: small ? 10 : 11, fontWeight: 700,
      padding: small ? '2px 7px' : '3px 9px', borderRadius: 4,
      background: color + '18', color, whiteSpace: 'nowrap', display: 'inline-block',
    }}>
      {label}
    </span>
  );
};

// Th con sorting
const Th = ({ label, col, sortCol, sortDir, onSort, align, width }) => {
  const active = sortCol === col;
  return (
    <th onClick={col ? () => onSort(col) : undefined} style={{
      padding: '11px 14px', color: active ? C.azul : C.textDim, fontWeight: 600,
      fontSize: 11, letterSpacing: 1.1, textAlign: align || 'left',
      borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase',
      cursor: col ? 'pointer' : 'default', userSelect: 'none',
      whiteSpace: 'nowrap', width: width || 'auto',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
        {label}
        {col && <IcoSort dir={active ? sortDir : null} />}
      </span>
    </th>
  );
};

const useSorting = (data) => {
  const [sortCol, setSortCol] = useState('creado_en');
  const [sortDir, setSortDir] = useState('desc');
  const onSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const va = a[sortCol]; const vb = b[sortCol];
    const na = parseFloat(va); const nb = parseFloat(vb);
    const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(va || '').localeCompare(String(vb || ''));
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return { sorted, sortCol, sortDir, onSort };
};

// ══ COMPONENTES MÓVIL ════════════════════════════════════════

// Muestra el flujo de stock: 100 → 107
const StockFlow = ({ antes, despues }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 4,
    background: C.bg, borderRadius: 6, padding: '3px 8px',
  }}>
    <span style={{ fontSize: 12, color: C.textDim }}>{antes}</span>
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2.5" strokeLinecap="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
    <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(despues) < 0 ? C.rojo : C.textPrimary }}>
      {despues}
    </span>
  </div>
);

// Card de movimiento normal (entrada, salida, ajuste)
const MovCard = ({ m }) => {
  const esSalida = ES_SALIDA(m.tipo);
  const cantidad = Math.abs(parseFloat(m.cantidad));
  const color = COLORES_TIPO[m.tipo] || C.textDim;

  return (
    <div style={{
      background: '#fff',
      border: `1px solid ${C.border}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Fila 1: Fecha + Badge tipo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: C.textDim, lineHeight: 1 }}>
          {fmtFecha(m.creado_en)}
        </span>
        <BadgeTipo tipo={m.tipo} small />
      </div>

      {/* Fila 2: Nombre del producto + código */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, lineHeight: 1.35 }}>
          {m.descripcion}
        </div>
        <div style={{ fontSize: 11, color: C.textDim, fontFamily: 'monospace', marginTop: 2 }}>
          {m.codigo}
        </div>
      </div>

      {/* Fila 3: Cantidad, stock anterior→nuevo, usuario */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: `1px solid ${C.grid}`, gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 22, fontWeight: 800,
          color: esSalida ? C.rojo : C.verde,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>
          {esSalida ? '−' : '+'}{cantidad}
        </span>
        <StockFlow antes={parseFloat(m.stock_anterior)} despues={parseFloat(m.stock_nuevo)} />
        {m.usuario_nombre && (
          <span style={{
            fontSize: 11, color: C.textDim,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', maxWidth: 90,
          }}>
            {m.usuario_nombre}
          </span>
        )}
      </div>
    </div>
  );
};

// Card de movimiento Efacilito
const EfacilitoMovCard = ({ m, referencia_id }) => {
  const cantidad = Math.abs(parseFloat(m.cantidad));
  return (
    <div style={{
      background: '#fdfcff',
      border: `1px solid #e9d5ff`,
      borderLeft: `3px solid #8b5cf6`,
      borderRadius: 10,
      padding: '11px 13px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      {/* Fecha + # Factura */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 11, color: C.textDim }}>{fmtFecha(m.creado_en)}</span>
        <span style={{ color: '#8b5cf6', fontWeight: 700, fontFamily: 'monospace', fontSize: 12 }}>
          #{referencia_id}
        </span>
      </div>

      {/* Producto */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, lineHeight: 1.35 }}>
          {m.descripcion}
        </div>
        <div style={{ fontSize: 11, color: C.textDim, fontFamily: 'monospace', marginTop: 2 }}>
          {m.codigo}
        </div>
      </div>

      {/* Cantidad + stock */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 8, borderTop: `1px solid #f3e8ff`, gap: 8, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: C.rojo, lineHeight: 1 }}>
          −{cantidad}
        </span>
        <StockFlow antes={parseFloat(m.stock_anterior)} despues={parseFloat(m.stock_nuevo)} />
      </div>
    </div>
  );
};

// Barra de ordenamiento para móvil (reemplaza los headers de columna)
const MobileSortBar = ({ sortCol, sortDir, onSort }) => {
  const opts = [
    { col: 'creado_en',  label: 'Fecha' },
    { col: 'descripcion', label: 'Producto' },
    { col: 'tipo',       label: 'Tipo' },
    { col: 'cantidad',   label: 'Cantidad' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 10, color: C.textDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, flexShrink: 0 }}>
        Ordenar:
      </span>
      {opts.map(o => {
        const active = sortCol === o.col;
        return (
          <button key={o.col} onClick={() => onSort(o.col)} style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            border: `1px solid ${active ? C.azul : C.border}`,
            background: active ? '#eff6ff' : 'transparent',
            color: active ? C.azul : C.textDim,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {o.label}
            {active && <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
          </button>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════════════════════════
export default function ReporteMovimientos({ desde, hasta }) {
  const { isSmall } = useBreakpoint();
  const [tipo, setTipo]           = useState('');
  const [buscar, setBuscar]       = useState('');
  const [data, setData]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [cargando, setCargando]   = useState(false);
  const [expandido, setExpandido] = useState(null);
  const LIMIT = 50;

  const cargar = useCallback(async () => {
    if (!desde || !hasta) return;
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

  const movsFiltrados = buscar
    ? data.filter(m =>
        m.descripcion?.toLowerCase().includes(buscar.toLowerCase()) ||
        m.codigo?.toLowerCase().includes(buscar.toLowerCase()))
    : data;

  const movsEfacilito = movsFiltrados.filter(m => m.tipo === 'salida_factura_efacilito');
  const movsNormales  = movsFiltrados.filter(m => m.tipo !== 'salida_factura_efacilito');

  const { sorted: sortedNormales, sortCol, sortDir, onSort } = useSorting(movsNormales);

  const gruposEfacilito = Object.values(
    movsEfacilito.reduce((acc, m) => {
      const key = m.referencia_id || 'sin-ref';
      if (!acc[key]) acc[key] = { referencia_id: m.referencia_id, movimientos: [] };
      acc[key].movimientos.push(m);
      return acc;
    }, {})
  );

  const mostrarEfacilito = movsEfacilito.length > 0 && (tipo === '' || tipo === 'salida_factura_efacilito');
  const mostrarNormales  = movsNormales.length > 0;
  const totalPags        = Math.ceil(total / LIMIT);

  const exportarExcel = () => {
    if (!movsFiltrados.length) return;
    const headers = ['Fecha', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Stock Ant.', 'Stock Nuevo', 'Referencia', 'Usuario'];
    const rows = movsFiltrados.map(m => [
      fmtFecha(m.creado_en), m.descripcion, m.codigo,
      TIPOS.find(t => t.value === m.tipo)?.label || m.tipo,
      (ES_SALIDA(m.tipo) ? '-' : '+') + Math.abs(parseFloat(m.cantidad)),
      parseFloat(m.stock_anterior), parseFloat(m.stock_nuevo),
      m.referencia_tipo || '', m.usuario_nombre || '',
    ]);
    exportXLSX(rows, headers, `movimientos_${desde}_${hasta}.xlsx`);
  };

  const exportarPDF = () => {
    if (!movsFiltrados.length) return;
    const headers = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Ant.', 'Stock Nuevo', 'Usuario'];
    const rows = movsFiltrados.map(m => [
      fmtFecha(m.creado_en), m.descripcion,
      TIPOS.find(t => t.value === m.tipo)?.label || m.tipo,
      (ES_SALIDA(m.tipo) ? '-' : '+') + Math.abs(parseFloat(m.cantidad)),
      parseFloat(m.stock_anterior), parseFloat(m.stock_nuevo),
      m.usuario_nombre || '',
    ]);
    exportPDF(rows, headers, `Movimientos de Stock — ${desde} al ${hasta}`, `movimientos_${desde}_${hasta}.pdf`);
  };

  const pad = isSmall ? '14px 12px' : '24px 28px';

  return (
    <div style={{ padding: pad }}>

      {/* ── Barra de controles ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Filtro tipo */}
        <select value={tipo} onChange={e => setTipo(e.target.value)}
          style={{ ...inputSt, width: isSmall ? '100%' : 'auto', minWidth: isSmall ? 0 : 200 }}>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        {/* Buscador */}
        <div style={{
          width: isSmall ? '100%' : 'auto', flex: isSmall ? 'none' : 1,
          minWidth: isSmall ? 0 : 220, position: 'relative',
        }}>
          <svg style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, stroke: C.textDim, fill: 'none', strokeWidth: 2, strokeLinecap: 'round',
          }} viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" placeholder="Buscar por producto o código..."
            value={buscar} onChange={e => setBuscar(e.target.value)}
            style={{ ...inputSt, width: '100%', paddingLeft: 34 }} />
        </div>

        {/* Contador + botones exportar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: isSmall ? '100%' : 'auto' }}>
          <span style={{ fontSize: 12, color: C.textDim, whiteSpace: 'nowrap' }}>
            {total.toLocaleString()} movimiento{total !== 1 ? 's' : ''}
          </span>
          {movsFiltrados.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginLeft: isSmall ? 0 : 'auto' }}>
              <BtnExport onClick={exportarExcel} color="#16a34a" label="Excel" icon={<IcoXlsx />} />
              <BtnExport onClick={exportarPDF}   color={C.rojo}  label="PDF"   icon={<IcoPdf />} />
            </div>
          )}
        </div>
      </div>

      {cargando && (
        <div style={{ padding: 60, textAlign: 'center', color: C.textDim }}>Cargando...</div>
      )}

      {/* ══ SECCIÓN EFACILITO ══ */}
      {!cargando && mostrarEfacilito && (() => {
        const abiertoEf = expandido === 'efacilito-bloque';
        return (
          <div style={{ marginBottom: 20 }}>
            {mostrarNormales && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 3, height: 20, borderRadius: 2, background: '#8b5cf6' }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>
                  Salidas por Facturas Efacilito
                </span>
              </div>
            )}

            <div style={{
              border: `1px solid ${abiertoEf ? '#c4b5fd' : C.border}`,
              borderRadius: 12, overflow: 'hidden',
              boxShadow: abiertoEf ? '0 4px 16px rgba(139,92,246,0.08)' : 'none',
            }}>
              {/* Header colapsable */}
              <div onClick={() => setExpandido(abiertoEf ? null : 'efacilito-bloque')}
                style={{
                  padding: isSmall ? '12px 14px' : '14px 20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: isSmall ? 8 : 12,
                  background: abiertoEf ? '#f5f3ff' : '#fff',
                  borderBottom: abiertoEf ? `1px solid ${C.border}` : 'none',
                  transition: 'background .15s',
                }}>
                <div style={{ color: abiertoEf ? '#8b5cf6' : C.textDim, flexShrink: 0 }}>
                  <IcoChevron open={abiertoEf} />
                </div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8b5cf6', flexShrink: 0,
                }}>
                  <IcoFolder />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: C.textPrimary, fontSize: isSmall ? 13 : 14 }}>
                    Salidas por Facturas Efacilito
                  </div>
                  <div style={{ fontSize: 12, color: C.textDim, marginTop: 2, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>{gruposEfacilito.length} facturas</span>
                    <span style={{ color: C.rojo, fontWeight: 600 }}>{movsEfacilito.length} productos descontados</span>
                  </div>
                </div>
                {!isSmall && (
                  <span style={{
                    background: '#ede9fe', color: '#7c3aed', borderRadius: 20,
                    padding: '3px 12px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {gruposEfacilito.length} facturas · {movsEfacilito.length} movimientos
                  </span>
                )}
              </div>

              {abiertoEf && (
                isSmall ? (
                  /* ── MÓVIL: cards Efacilito ── */
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 8, background: '#faf7ff' }}>
                    {gruposEfacilito.flatMap(grupo =>
                      grupo.movimientos.map(m => (
                        <EfacilitoMovCard key={m.id} m={m} referencia_id={grupo.referencia_id} />
                      ))
                    )}
                  </div>
                ) : (
                  /* ── DESKTOP: tabla Efacilito ── */
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', minWidth: 580, borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '30%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '11%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: C.deep }}>
                          <Th label="Fecha"        col={null} sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                          <Th label="Nro. Factura" col={null} sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                          <Th label="Producto"     col={null} sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                          <Th label="Cantidad"     col={null} sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                          <Th label="Stock ant."   col={null} sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                          <Th label="Stock nuevo"  col={null} sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                        </tr>
                      </thead>
                      <tbody>
                        {gruposEfacilito.flatMap(grupo =>
                          grupo.movimientos.map((m, i) => (
                            <tr key={m.id} style={{ borderBottom: `1px solid ${C.grid}`,
                              background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                              <td style={{ padding: '8px 10px', color: C.textDim, fontSize: 12, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {fmtFecha(m.creado_en)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <span style={{ color: '#8b5cf6', fontWeight: 600, fontFamily: 'monospace', fontSize: 12 }}>
                                  #{grupo.referencia_id}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <div style={{ color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {m.descripcion}
                                </div>
                                <div style={{ color: C.textDim, fontSize: 11, fontFamily: 'monospace' }}>{m.codigo}</div>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700, color: C.rojo, whiteSpace: 'nowrap' }}>
                                −{Math.abs(parseFloat(m.cantidad))}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center', color: C.textDim }}>
                                {parseFloat(m.stock_anterior)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center',
                                color: parseFloat(m.stock_nuevo) < 0 ? C.rojo : C.textSec, fontWeight: 600 }}>
                                {parseFloat(m.stock_nuevo)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )
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
              <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>Otros movimientos</span>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 20,
                padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
                {movsNormales.length}
              </span>
            </div>
          )}

          {isSmall ? (
            /* ── MÓVIL: cards ── */
            <div>
              <MobileSortBar sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sortedNormales.map(m => (
                  <MovCard key={m.id} m={m} />
                ))}
              </div>
            </div>
          ) : (
            /* ── DESKTOP: tabla ── */
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
              overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '20%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '10%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '9%' }} />
                  </colgroup>
                  <thead>
                    <tr style={{ background: C.deep }}>
                      <Th label="Fecha"       col="creado_en"       sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                      <Th label="Producto"    col="descripcion"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                      <Th label="Tipo"        col="tipo"            sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                      <Th label="Cantidad"    col="cantidad"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                      <Th label="Stock ant."  col="stock_anterior"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                      <Th label="Stock nuevo" col="stock_nuevo"     sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                      <Th label="Referencia"  col="referencia_tipo" sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                      <Th label="Usuario"     col="usuario_nombre"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedNormales.map((m, i) => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${C.grid}`,
                        background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                        <td style={{ padding: '8px 10px', color: C.textDim, fontSize: 12, textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {fmtFecha(m.creado_en)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', overflow: 'hidden' }}>
                          <div style={{ color: C.textSec, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.descripcion}</div>
                          <div style={{ color: C.textDim, fontSize: 11, fontFamily: 'monospace' }}>{m.codigo}</div>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <BadgeTipo tipo={m.tipo} />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700,
                          color: ES_SALIDA(m.tipo) ? C.rojo : C.verde, whiteSpace: 'nowrap' }}>
                          {ES_SALIDA(m.tipo) ? '−' : '+'}{Math.abs(parseFloat(m.cantidad))}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: C.textDim }}>
                          {parseFloat(m.stock_anterior)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center',
                          color: parseFloat(m.stock_nuevo) < 0 ? C.rojo : C.textSec, fontWeight: 600 }}>
                          {parseFloat(m.stock_nuevo)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: C.textDim, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.referencia_tipo || '—'}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center', color: C.textDim, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.usuario_nombre || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paginación */}
      {totalPags > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <BtnSm color={C.azul} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Ant.</BtnSm>
          <span style={{ color: C.textDim, fontSize: 13 }}>Página {page} de {totalPags}</span>
          <BtnSm color={C.azul} onClick={() => setPage(p => Math.min(totalPags, p + 1))} disabled={page === totalPags}>Sig. →</BtnSm>
        </div>
      )}

      {!cargando && data.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: C.textDim }}>
          Sin movimientos en el período seleccionado
        </div>
      )}
    </div>
  );
}