import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../../api/config';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444', morado: '#8b5cf6',
};

// ── Iconos ────────────────────────────────────────────────────
const IcoExport  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const IcoXlsx    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l2.5 3L13 12m0 0l2.5-3M13 12l-2.5-3"/></svg>;
const IcoPdf     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>;
const IcoSort    = ({ dir }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 4, opacity: dir ? 1 : 0.35 }}>
    {(!dir || dir === 'asc')  && <polyline points="18 15 12 9 6 15" style={{ opacity: dir === 'asc'  ? 1 : 0.4 }} />}
    {(!dir || dir === 'desc') && <polyline points="6 9 12 15 18 9"  style={{ opacity: dir === 'desc' ? 1 : 0.4 }} />}
  </svg>
);

// ── Utilidades de exportación ─────────────────────────────────
const loadScript = (src) => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) return res();
  const s = document.createElement('script'); s.src = src;
  s.onload = res; s.onerror = rej; document.head.appendChild(s);
});

const exportXLSX = async (rows, headers, filename) => {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  const ws = window.XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
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
  doc.autoTable({ head: [headers], body: rows, startY: 28, styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [249, 250, 251] } });
  doc.save(filename);
};

// ── Componente ThHeader con sorting ───────────────────────────
const Th = ({ label, col, sortCol, sortDir, onSort, align, width }) => {
  const active = sortCol === col;
  return (
    <th onClick={() => onSort(col)} style={{
      padding: '12px 16px', color: active ? C.azul : C.textDim, fontWeight: 600,
      fontSize: 11, letterSpacing: 1.1, textAlign: align || 'left',
      borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase',
      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
      width: width || 'auto',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
        {label}
        <IcoSort dir={active ? sortDir : null} />
      </span>
    </th>
  );
};

const useSorting = (data, defaultCol) => {
  const [sortCol, setSortCol] = useState(defaultCol || null);
  const [sortDir, setSortDir] = useState('asc');
  const onSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };
  const sorted = [...data].sort((a, b) => {
    if (!sortCol) return 0;
    const va = a[sortCol]; const vb = b[sortCol];
    // Comparación de fechas (ISO strings)
    const da = Date.parse(va); const db = Date.parse(vb);
    if (!isNaN(da) && !isNaN(db)) return sortDir === 'asc' ? da - db : db - da;
    const na = parseFloat(va); const nb = parseFloat(vb);
    const cmp = (!isNaN(na) && !isNaN(nb)) ? na - nb : String(va || '').localeCompare(String(vb || ''));
    return sortDir === 'asc' ? cmp : -cmp;
  });
  return { sorted, sortCol, sortDir, onSort };
};

// ════════════════════════════════════════════════════════════
export default function ReporteVentas({ desde, hasta }) {
  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!desde || !hasta) return;
    const cargar = async () => {
      setCargando(true);
      try {
        const { data } = await api.get(`/reportes/ventas?fecha_desde=${desde}&fecha_hasta=${hasta}`);
        setData(data);
      } catch { console.error('Error al cargar reporte'); }
      finally { setCargando(false); }
    };
    cargar();
  }, [desde, hasta]);

  const filas = data?.data || [];
  const { sorted, sortCol, sortDir, onSort } = useSorting(filas, 'fecha');

  const datosDia = {};
  filas.forEach(d => {
    const fecha = d.fecha?.slice(0, 10);
    if (!datosDia[fecha]) datosDia[fecha] = { fecha: fecha?.slice(5), total: 0, cantidad: 0 };
    datosDia[fecha].total    += parseFloat(d.total);
    datosDia[fecha].cantidad += 1;
  });
  const datosGrafico = Object.values(datosDia).sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Métricas adicionales
  const ventaMasAlta = filas.length > 0
    ? Math.max(...filas.map(d => parseFloat(d.total) || 0))
    : 0;
  const diasConVentas = Object.keys(datosDia).length;

  const exportarCSV = () => {
    if (!filas.length) return;
    const headers = ['Número', 'Cliente', 'Fecha', 'Total', 'Usuario'];
    const rows = filas.map(d => [d.numero, d.cliente, d.fecha?.slice(0, 10),
      parseFloat(d.total).toFixed(2), d.usuario || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ventas_${desde}_${hasta}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportarExcel = () => {
    if (!filas.length) return;
    const headers = ['Número', 'Cliente', 'Fecha', 'Total', 'Usuario'];
    const rows = filas.map(d => [d.numero, d.cliente, d.fecha?.slice(0, 10),
      parseFloat(d.total).toFixed(2), d.usuario || '']);
    exportXLSX(rows, headers, `ventas_${desde}_${hasta}.xlsx`);
  };

  const exportarPDF = () => {
    if (!filas.length) return;
    const headers = ['Número', 'Cliente', 'Fecha', 'Total', 'Usuario'];
    const rows = filas.map(d => [d.numero, d.cliente, d.fecha?.slice(0, 10),
      `$${parseFloat(d.total).toFixed(2)}`, d.usuario || '']);
    exportPDF(rows, headers, `Reporte de Ventas — ${desde} al ${hasta}`, `ventas_${desde}_${hasta}.pdf`);
  };

  if (cargando) return (
    <div style={{ padding: 60, textAlign: 'center', color: C.textDim }}>Cargando...</div>
  );

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Botones de exportación */}
      {filas.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
          <BtnExport onClick={exportarCSV}  color={C.verde}   label="CSV"   icon={<IcoExport />} />
          <BtnExport onClick={exportarExcel} color="#16a34a"  label="Excel" icon={<IcoXlsx />} />
          <BtnExport onClick={exportarPDF}   color={C.rojo}   label="PDF"   icon={<IcoPdf />} />
        </div>
      )}

      {data && (
        <>
          {/* Cards resumen */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <CardMetrica titulo="Total recibos"    valor={data.resumen.cantidad}                                  color={C.azul} />
            <CardMetrica titulo="Total recaudado"  valor={`$${parseFloat(data.resumen.total).toFixed(2)}`}       color={C.verde} grande />
            <CardMetrica titulo="Venta más alta"   valor={`$${ventaMasAlta.toFixed(2)}`}                         color={C.amarillo} />
            <CardMetrica titulo="Días con ventas"  valor={diasConVentas}                                         color={C.morado} />
          </div>

          {/* Gráfico */}
          {datosGrafico.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: 20, marginBottom: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ color: C.textDim, fontSize: 11, fontWeight: 700,
                letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>
                Ventas por día
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={datosGrafico} margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="fecha" stroke={C.textDim} tick={{ fill: C.textDim, fontSize: 11 }}
                    axisLine={{ stroke: C.border }} tickLine={false} />
                  <YAxis stroke={C.textDim} tick={{ fill: C.textDim, fontSize: 11 }}
                    axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                    labelStyle={{ color: C.textDim, fontSize: 12 }}
                    formatter={(val) => [`$${parseFloat(val).toFixed(2)}`, 'Total']} />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={20}>
                    {datosGrafico.map((_, i) => <Cell key={i} fill={C.verde} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabla ordenable */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '16%' }} />  {/* Número */}
                <col style={{ width: '28%' }} />  {/* Cliente */}
                <col style={{ width: '22%' }} />  {/* Fecha */}
                <col style={{ width: '18%' }} />  {/* Total */}
                <col style={{ width: '16%' }} />  {/* Usuario */}
              </colgroup>
              <thead>
                <tr style={{ background: C.deep }}>
                  <Th label="Número"  col="numero"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Cliente" col="cliente" sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Fecha"   col="fecha"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Total"   col="total"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Usuario" col="usuario" sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>
                    Sin ventas en el período seleccionado
                  </td></tr>
                ) : sorted.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.grid}`,
                    background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                    <td style={{ padding: '8px 14px', color: C.azul, fontFamily: 'monospace', fontWeight: 700, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.numero}</td>
                    <td style={{ padding: '8px 14px', color: C.textSec, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.cliente}</td>
                    <td style={{ padding: '8px 14px', color: C.textDim, fontSize: 12, textAlign: 'center', whiteSpace: 'nowrap' }}>{d.fecha?.slice(0, 10)}</td>
                    <td style={{ padding: '8px 14px', color: C.verde, fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>${parseFloat(d.total).toFixed(2)}</td>
                    <td style={{ padding: '8px 14px', color: C.textDim, fontSize: 12, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.usuario || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!cargando && !data && (
        <div style={{ padding: 60, textAlign: 'center', color: C.textDim }}>
          Sin datos en el período seleccionado
        </div>
      )}
    </div>
  );
}

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

const CardMetrica = ({ titulo, valor, color, grande }) => (
  <div style={{ background: '#fff', border: `1px solid #e5e7eb`, borderLeft: `4px solid ${color}`,
    borderRadius: 12, padding: '18px 22px', flex: 1, minWidth: 160,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
    <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
      textTransform: 'uppercase', marginBottom: 8 }}>{titulo}</div>
    <div style={{ fontSize: grande ? 30 : 24, fontWeight: 800, color }}>{valor}</div>
  </div>
);