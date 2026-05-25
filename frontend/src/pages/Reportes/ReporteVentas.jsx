import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../../api/config';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

const IcoBuscar  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcoExport  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;

const hoy = new Date().toISOString().split('T')[0];
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function ReporteVentas() {
  const [desde, setDesde]       = useState(primerDiaMes);
  const [hasta, setHasta]       = useState(hoy);
  const [data, setData]         = useState(null);
  const [cargando, setCargando] = useState(false);

  const cargar = async () => {
    setCargando(true);
    try {
      const { data } = await api.get(`/reportes/ventas?fecha_desde=${desde}&fecha_hasta=${hasta}`);
      setData(data);
    } catch { console.error('Error al cargar reporte'); }
    finally { setCargando(false); }
  };

  useEffect(() => { cargar(); }, []);

  const datosDia = {};
  (data?.data || []).forEach(d => {
    const fecha = d.fecha?.slice(0, 10);
    if (!datosDia[fecha]) datosDia[fecha] = { fecha: fecha?.slice(5), total: 0, cantidad: 0 };
    datosDia[fecha].total    += parseFloat(d.total);
    datosDia[fecha].cantidad += 1;
  });
  const datosGrafico = Object.values(datosDia).sort((a, b) => a.fecha.localeCompare(b.fecha));

  const exportarCSV = () => {
    if (!data?.data?.length) return;
    const headers = ['Número', 'Cliente', 'Fecha', 'Subtotal', 'IVA', 'Total', 'Usuario'];
    const filas = data.data.map(d => [
      d.numero, d.cliente, d.fecha?.slice(0, 10),
      parseFloat(d.subtotal).toFixed(2),
      parseFloat(d.total_iva).toFixed(2),
      parseFloat(d.total).toFixed(2),
      d.usuario || '',
    ]);
    const csv = [headers, ...filas].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ventas_${desde}_${hasta}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: '24px 28px' }}>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div>
          <Label>Desde</Label>
          <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={inputSt} />
        </div>
        <div>
          <Label>Hasta</Label>
          <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={inputSt} />
        </div>
        <button onClick={cargar} disabled={cargando}
          style={{ display: 'flex', alignItems: 'center', gap: 7,
            background: C.azul, border: 'none', color: '#fff', borderRadius: 8,
            padding: '10px 22px', fontWeight: 700, fontSize: 13,
            cursor: cargando ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            opacity: cargando ? 0.6 : 1, boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
            transition: 'all .15s' }}>
          <IcoBuscar /> {cargando ? 'Cargando...' : 'Buscar'}
        </button>
        {data?.data?.length > 0 && (
          <button onClick={exportarCSV}
            style={{ display: 'flex', alignItems: 'center', gap: 7,
              background: 'transparent', border: `1px solid ${C.verde}`, color: C.verde,
              borderRadius: 8, padding: '10px 20px', fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0fdf4'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
            <IcoExport /> Exportar CSV
          </button>
        )}
      </div>

      {data && (
        <>
          {/* Cards resumen */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <CardMetrica titulo="Total recibos"  valor={data.resumen.cantidad}                                   color={C.azul} />
            <CardMetrica titulo="Subtotal"        valor={`$${parseFloat(data.resumen.total).toFixed(2)}`}         color={C.verde} />
            <CardMetrica titulo="IVA recaudado"   valor={`$${parseFloat(data.resumen.total_iva).toFixed(2)}`}     color={C.amarillo} />
            <CardMetrica titulo="Total con IVA"   valor={`$${parseFloat(data.resumen.total).toFixed(2)}`}         color={C.verde} grande />
          </div>

          {/* Gráfico */}
          {datosGrafico.length > 0 && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: 20, marginBottom: 24,
              boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ color: C.textDim, fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
                textTransform: 'uppercase', marginBottom: 16 }}>
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

          {/* Tabla */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.deep }}>
                  {['Número', 'Cliente', 'Fecha', 'Subtotal', 'IVA', 'Total', 'Usuario'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: C.textDim, fontWeight: 600,
                      fontSize: 11, letterSpacing: 1.2, textAlign: 'left',
                      borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.data.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>
                    Sin ventas en el período seleccionado
                  </td></tr>
                ) : data.data.map((d, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.grid}`,
                    background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                    <td style={{ padding: '10px 16px', color: C.azul, fontFamily: 'monospace', fontWeight: 700 }}>{d.numero}</td>
                    <td style={{ padding: '10px 16px', color: C.textSec }}>{d.cliente}</td>
                    <td style={{ padding: '10px 16px', color: C.textDim, fontSize: 12 }}>{d.fecha?.slice(0, 10)}</td>
                    <td style={{ padding: '10px 16px', color: C.textSec }}>${parseFloat(d.subtotal).toFixed(2)}</td>
                    <td style={{ padding: '10px 16px', color: C.textDim }}>${parseFloat(d.total_iva).toFixed(2)}</td>
                    <td style={{ padding: '10px 16px', color: C.verde, fontWeight: 700 }}>${parseFloat(d.total).toFixed(2)}</td>
                    <td style={{ padding: '10px 16px', color: C.textDim, fontSize: 12 }}>{d.usuario || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const CardMetrica = ({ titulo, valor, color, grande }) => (
  <div style={{ background: '#fff', border: `1px solid #e5e7eb`, borderLeft: `4px solid ${color}`,
    borderRadius: 12, padding: '18px 22px', flex: 1, minWidth: 160,
    boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
    <div style={{ color: '#9ca3af', fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
      textTransform: 'uppercase', marginBottom: 8 }}>
      {titulo}
    </div>
    <div style={{ fontSize: grande ? 30 : 24, fontWeight: 800, color }}>
      {valor}
    </div>
  </div>
);

const Label = ({ children }) => (
  <label style={{ color: '#6b7280', fontSize: 11, fontWeight: 600, letterSpacing: 1,
    display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
    {children}
  </label>
);

const inputSt = {
  width: '100%', background: '#fff', border: '1px solid #e5e7eb',
  borderRadius: 8, padding: '9px 12px', color: '#374151', fontSize: 13,
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};