import { useState, useEffect, useCallback } from 'react';
import api from '../../api/config';

const C = {
  bg: '#f4f5fb', card: '#ffffff', deep: '#f9fafb',
  border: '#e5e7eb', grid: '#f3f4f6',
  textPrimary: '#111827', textSec: '#374151', textDim: '#9ca3af',
  amarillo: '#f59e0b', azul: '#3b82f6', verde: '#10b981', rojo: '#ef4444',
};

const TIPOS = [
  { value: '',                         label: 'Todos' },
  { value: 'entrada_compra',           label: 'Entrada por compra' },
  { value: 'salida_recibo',            label: 'Salida por recibo' },
  { value: 'salida_factura_efacilito', label: 'Salida por factura' },
  { value: 'ajuste_manual',            label: 'Ajuste manual' },
];

const COLORES_TIPO = {
  entrada_compra:           '#10b981',
  salida_recibo:            '#3b82f6',
  salida_factura_efacilito: '#8b5cf6',
  ajuste_manual:            '#f59e0b',
};

const hoy = new Date().toISOString().split('T')[0];
const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

export default function ReporteMovimientos() {
  const [desde, setDesde]       = useState(primerDiaMes);
  const [hasta, setHasta]       = useState(hoy);
  const [tipo, setTipo]         = useState('');
  const [buscar, setBuscar]     = useState('');
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [cargando, setCargando] = useState(false);
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
    } catch { console.error('Error'); }
    finally { setCargando(false); }
  }, [page, tipo, desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(1); }, [tipo, desde, hasta]);

  const filtrado = buscar
    ? data.filter(m =>
        m.descripcion?.toLowerCase().includes(buscar.toLowerCase()) ||
        m.codigo?.toLowerCase().includes(buscar.toLowerCase()))
    : data;

  const totalPags = Math.ceil(total / LIMIT);

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
          <Label>Tipo</Label>
          <select value={tipo} onChange={e => setTipo(e.target.value)}
            style={{ ...inputSt, minWidth: 200 }}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <Label>Buscar producto</Label>
          <input placeholder="Código o descripción..." value={buscar}
            onChange={e => setBuscar(e.target.value)} style={inputSt} />
        </div>
        <span style={{ color: C.textDim, fontSize: 13, alignSelf: 'center', whiteSpace: 'nowrap' }}>
          {total} movimientos
        </span>
      </div>

      {/* Tabla */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.deep }}>
              {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock ant.', 'Stock nuevo', 'Referencia', 'Usuario'].map(h => (
                <th key={h} style={{ padding: '12px 14px', color: C.textDim, fontWeight: 600,
                  fontSize: 11, letterSpacing: 1.2, textAlign: 'left',
                  borderBottom: `1px solid ${C.border}`, textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Cargando...</td></tr>
            ) : filtrado.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: C.textDim }}>Sin movimientos</td></tr>
            ) : filtrado.map((m, i) => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${C.grid}`,
                background: i % 2 === 0 ? 'transparent' : '#fafafa' }}>
                <td style={{ padding: '10px 14px', color: C.textDim, fontSize: 12, whiteSpace: 'nowrap' }}>
                  {m.creado_en?.slice(0, 16).replace('T', ' ')}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ color: C.textSec, fontSize: 13 }}>{m.descripcion}</div>
                  <div style={{ color: C.textDim, fontSize: 11, fontFamily: 'monospace' }}>{m.codigo}</div>
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: (COLORES_TIPO[m.tipo] || C.textDim) + '18',
                    color: COLORES_TIPO[m.tipo] || C.textDim,
                  }}>
                    {TIPOS.find(t => t.value === m.tipo)?.label || m.tipo}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700,
                  color: parseFloat(m.cantidad) >= 0 ? C.verde : C.rojo }}>
                  {parseFloat(m.cantidad) >= 0 ? '+' : ''}{parseFloat(m.cantidad)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: C.textDim }}>
                  {parseFloat(m.stock_anterior)}
                </td>
                <td style={{ padding: '10px 14px', textAlign: 'right', color: C.textSec, fontWeight: 600 }}>
                  {parseFloat(m.stock_nuevo)}
                </td>
                <td style={{ padding: '10px 14px', color: C.textDim, fontSize: 11 }}>
                  {m.referencia_tipo || '—'}
                </td>
                <td style={{ padding: '10px 14px', color: C.textDim, fontSize: 12 }}>
                  {m.usuario_nombre || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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

const BtnSm = ({ color, onClick, disabled, children }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: color, color: '#fff', border: 'none', borderRadius: 7,
    padding: '6px 14px', fontWeight: 600, fontSize: 12,
    cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
    fontFamily: 'inherit',
  }}>{children}</button>
);