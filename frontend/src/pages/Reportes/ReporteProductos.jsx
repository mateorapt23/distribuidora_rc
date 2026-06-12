import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../../api/config';
import { useIsMobile } from '../../hooks/useIsMobile';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};
const COLORES = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#06b6d4'];

// ── Iconos ─────────────────────────────────────────────────
const IcoXlsx = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l2.5 3L13 12m0 0l2.5-3M13 12l-2.5-3"/></svg>;
const IcoPdf  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/></svg>;
const IcoSort = ({ dir }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginLeft: 4, opacity: dir ? 1 : 0.35 }}>
    {(!dir || dir === 'asc')  && <polyline points="18 15 12 9 6 15" style={{ opacity: dir === 'asc'  ? 1 : 0.4 }} />}
    {(!dir || dir === 'desc') && <polyline points="6 9 12 15 18 9"  style={{ opacity: dir === 'desc' ? 1 : 0.4 }} />}
  </svg>
);

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

const Th = ({ label, col, sortCol, sortDir, onSort, align }) => {
  const active = sortCol === col;
  return (
    <th onClick={col ? () => onSort(col) : undefined} style={{
      padding: '12px 16px', color: active ? C.azul : C.textDim, fontWeight: 600,
      fontSize: 11, letterSpacing: 1.1, textAlign: align || 'left',
      borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase',
      cursor: col ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
        {label}
        {col && <IcoSort dir={active ? sortDir : null} />}
      </span>
    </th>
  );
};

const useSorting = (data, defaultCol, defaultDir) => {
  const [sortCol, setSortCol] = useState(defaultCol || null);
  const [sortDir, setSortDir] = useState(defaultDir || 'asc');
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

// ════════════════════════════════════════════════════════════
export default function ReporteProductos({ desde, hasta }) {
  const isMobile = useIsMobile();
  const pad = isMobile ? '14px 12px' : '24px 28px';
  const [limit, setLimit]       = useState(20);
  const [data, setData]         = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!desde || !hasta) return;
    const cargar = async () => {
      setCargando(true);
      try {
        const { data } = await api.get(
          `/reportes/productos-mas-vendidos?fecha_desde=${desde}&fecha_hasta=${hasta}&limit=${limit}`
        );
        setData(data);
      } catch { console.error('Error'); }
      finally { setCargando(false); }
    };
    cargar();
  }, [desde, hasta, limit]);

  const { sorted, sortCol, sortDir, onSort } = useSorting(data, 'cantidad_vendida', 'desc');

  const datosGrafico = data.slice(0, 10).map(p => ({
    nombre: p.descripcion.length > 20 ? p.descripcion.slice(0, 18) + '..' : p.descripcion,
    cantidad: parseFloat(p.cantidad_vendida),
    total: parseFloat(p.total_vendido),
  }));

  const exportarExcel = () => {
    if (!data.length) return;
    const headers = ['#', 'Código', 'Descripción', 'Cant. Vendida', 'Total Vendido', 'Nº Documentos'];
    const rows = data.map((p, i) => [i + 1, p.codigo, p.descripcion,
      parseFloat(p.cantidad_vendida), parseFloat(p.total_vendido).toFixed(2), p.num_documentos]);
    exportXLSX(rows, headers, `productos_vendidos_${desde}_${hasta}.xlsx`);
  };

  const exportarPDF = () => {
    if (!data.length) return;
    const headers = ['#', 'Código', 'Descripción', 'Cant. Vendida', 'Total Vendido', 'Nº Docs'];
    const rows = data.map((p, i) => [i + 1, p.codigo, p.descripcion,
      parseFloat(p.cantidad_vendida), `$${parseFloat(p.total_vendido).toFixed(2)}`, p.num_documentos]);
    exportPDF(rows, headers, `Productos más vendidos — ${desde} al ${hasta}`, `productos_vendidos_${desde}_${hasta}.pdf`);
  };

  if (cargando) return (
    <div style={{ padding: 60, textAlign: 'center', color: C.textDim }}>Cargando...</div>
  );

  return (
    <div style={{ padding: pad }}>

      {/* Controles superiores */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: C.textDim, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase' }}>Mostrar</span>
          <select value={limit} onChange={e => setLimit(e.target.value)}
            style={{ border: `1px solid ${C.border}`, background: '#fff', borderRadius: 8,
              padding: '7px 12px', fontSize: 13, color: C.textPrimary,
              outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>

        {data.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <BtnExport onClick={exportarExcel} color="#16a34a" label="Excel" icon={<IcoXlsx />} />
            <BtnExport onClick={exportarPDF}   color={C.rojo}  label="PDF"   icon={<IcoPdf />} />
          </div>
        )}
      </div>

      {data.length > 0 && (
        <>
          {/* Gráfico */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 20, marginBottom: 24,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ color: C.textDim, fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
              textTransform: 'uppercase', marginBottom: 16 }}>
              Top {Math.min(10, data.length)} productos por cantidad vendida
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosGrafico} layout="vertical"
                margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                <XAxis type="number" stroke={C.textDim} tick={{ fill: C.textDim, fontSize: 11 }}
                  axisLine={{ stroke: C.border }} tickLine={false} />
                <YAxis type="category" dataKey="nombre" width={isMobile ? 100 : 140}
                  tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
                <CartesianGrid horizontal={false} stroke={C.grid} strokeDasharray="3 3" />
                <Tooltip
                  contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}
                  formatter={(val, name) => [
                    name === 'cantidad' ? val : `$${parseFloat(val).toFixed(2)}`,
                    name === 'cantidad' ? 'Unidades' : 'Total vendido'
                  ]} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={18}>
                  {datosGrafico.map((_, i) => <Cell key={i} fill={COLORES[i % COLORES.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabla ordenable */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', fontSize: 13, tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '6%' }}  /> {/* # */}
                <col style={{ width: '14%' }} /> {/* Código */}
                <col style={{ width: '36%' }} /> {/* Descripción */}
                <col style={{ width: '15%' }} /> {/* Cant. vendida */}
                <col style={{ width: '15%' }} /> {/* Total vendido */}
                <col style={{ width: '14%' }} /> {/* Nº documentos */}
              </colgroup>
              <thead>
                <tr style={{ background: C.deep }}>
                  <Th label="#"             col={null}             sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Código"        col="codigo"           sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Descripción"   col="descripcion"      sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Cant. vendida" col="cantidad_vendida" sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Total vendido" col="total_vendido"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                  <Th label="Nº documentos" col="num_documentos"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} align="center" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.grid}`,
                    background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span style={{ color: i < 3 ? COLORES[i] : C.textDim, fontWeight: 700 }}>{i + 1}</span>
                    </td>
                    <td style={{ padding: '8px 12px', color: C.textDim, fontFamily: 'monospace', fontSize: 12, textAlign: 'center' }}>
                      {p.codigo}
                    </td>
                    <td style={{ padding: '8px 12px', color: C.textSec, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</td>
                    <td style={{ padding: '8px 12px', color: C.amarillo, fontWeight: 700, textAlign: 'center' }}>
                      {parseFloat(p.cantidad_vendida)}
                    </td>
                    <td style={{ padding: '8px 12px', color: C.verde, fontWeight: 700, textAlign: 'center' }}>
                      ${parseFloat(p.total_vendido).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 12px', color: C.textDim, textAlign: 'center' }}>
                      {p.num_documentos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
      )}

      {!cargando && data.length === 0 && (
        <div style={{ padding: 60, textAlign: 'center', color: C.textDim }}>
          Sin datos en el período seleccionado
        </div>
      )}
    </div>
  );
}