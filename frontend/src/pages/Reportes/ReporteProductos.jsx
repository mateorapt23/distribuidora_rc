import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import api from '../../api/config';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

const COLORES = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#06b6d4'];

const IcoBuscar = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;

const hoy = new Date().toISOString().split('T')[0];
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function ReporteProductos() {
  const [desde, setDesde]       = useState(primerDiaMes);
  const [hasta, setHasta]       = useState(hoy);
  const [limit, setLimit]       = useState(20);
  const [data, setData]         = useState([]);
  const [cargando, setCargando] = useState(false);

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

  useEffect(() => { cargar(); }, []);

  const datosGrafico = data.slice(0, 10).map(p => ({
    nombre: p.descripcion.length > 20 ? p.descripcion.slice(0, 18) + '..' : p.descripcion,
    cantidad: parseFloat(p.cantidad_vendida),
    total: parseFloat(p.total_vendido),
  }));

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
        <div>
          <Label>Top</Label>
          <select value={limit} onChange={e => setLimit(e.target.value)}
            style={{ ...inputSt, width: 110 }}>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
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
                <YAxis type="category" dataKey="nombre" width={140}
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

          {/* Tabla */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: C.deep }}>
                  {['#', 'Código', 'Descripción', 'Cant. vendida', 'Total vendido', 'Nº documentos'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', color: C.textDim, fontWeight: 600,
                      fontSize: 11, letterSpacing: 1.2, textAlign: 'left',
                      borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.grid}`,
                    background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                    <td style={{ padding: '10px 16px', width: 40 }}>
                      <span style={{ color: i < 3 ? COLORES[i] : C.textDim, fontWeight: 700 }}>{i + 1}</span>
                    </td>
                    <td style={{ padding: '10px 16px', color: C.textDim, fontFamily: 'monospace', fontSize: 12 }}>
                      {p.codigo}
                    </td>
                    <td style={{ padding: '10px 16px', color: C.textSec }}>{p.descripcion}</td>
                    <td style={{ padding: '10px 16px', color: C.amarillo, fontWeight: 700 }}>
                      {parseFloat(p.cantidad_vendida)}
                    </td>
                    <td style={{ padding: '10px 16px', color: C.verde, fontWeight: 700 }}>
                      ${parseFloat(p.total_vendido).toFixed(2)}
                    </td>
                    <td style={{ padding: '10px 16px', color: C.textDim }}>
                      {p.num_documentos}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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