import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../api/config';
import { useAuth } from '../../context/AuthContext';
import { useBreakpoint } from '../../hooks/useIsMobile';

const COLORES = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#f97316', '#06b6d4'];

const C = {
  amarillo: '#f59e0b',
  azul:     '#3b82f6',
  verde:    '#10b981',
  rojo:     '#ef4444',
  morado:   '#8b5cf6',
  textPrimary: '#111827',
  textSec:     '#6b7280',
  textDim:     '#9ca3af',
  border:      '#e5e7eb',
  bg:          '#f4f5fb',
  card:        '#ffffff',
};

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
      padding: '8px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      {label && <p style={{ color: C.textDim, fontSize: 12, marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || C.azul, fontSize: 13, fontWeight: 700 }}>
          {p.name ? `${p.name}: ` : ''}{p.value}
        </p>
      ))}
    </div>
  );
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: C.card, borderRadius: 14,
    border: `1px solid ${C.border}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    ...style
  }}>
    {children}
  </div>
);

const CardMetrica = ({ titulo, valor, subtexto, color, borderColor, minW = 0 }) => (
  <Card style={{ flex: 1, minWidth: minW, padding: '20px 22px', borderTop: `3px solid ${borderColor || color}` }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: C.textDim,
      letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 10 }}>
      {titulo}
    </div>
    <div style={{ fontSize: 38, fontWeight: 800, color, lineHeight: 1, marginBottom: 6 }}>
      {valor}
    </div>
    <div style={{ fontSize: 12, color: C.textDim }}>{subtexto}</div>
  </Card>
);

const CardGrafico = ({ titulo, children, flex = 1, style = {} }) => (
  <Card style={{ flex, minWidth: 0, padding: '18px 20px', ...style }}>
    <div style={{ fontSize: 11, fontWeight: 600, color: C.textDim,
      letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 16 }}>
      {titulo}
    </div>
    {children}
  </Card>
);

const SinDatos = ({ mensaje = 'Sin datos' }) => (
  <div style={{ height: 200, display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: C.textDim, fontSize: 13 }}>
    {mensaje}
  </div>
);

const LabelDona = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.06) return null;
  const rad = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * rad);
  const y = cy + r * Math.sin(-midAngle * rad);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      fontSize={9} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Dashboard() {
  const { usuario } = useAuth();
  const { isMobile, isTablet, isSmall } = useBreakpoint();
  const pad = isMobile ? 16 : isTablet ? 20 : 28;
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const [dash, masVendidos, movimientos] = await Promise.all([
          api.get('/dashboard'),
          api.get('/reportes/productos-mas-vendidos?limit=5'),
          api.get('/reportes/movimientos?limit=200'),
        ]);
        setData({
          resumen:     dash.data,
          masVendidos: masVendidos.data,
          movimientos: movimientos.data.data,
        });
      } catch {
        setError('Error al cargar el dashboard');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', color: C.textDim, fontSize: 14 }}>
      Cargando...
    </div>
  );

  if (error) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 24, padding: 'clamp(24px, 5vw, 52px) clamp(16px, 4vw, 44px)', maxWidth: 440, width: '100%',
        textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.10)', border: `1px solid ${C.border}` }}>
        {/* Icono SVG */}
        <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          boxShadow: '0 4px 16px rgba(245,158,11,0.20)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        {/* Título */}
        <div style={{ fontSize: 22, fontWeight: 800, color: C.textPrimary, marginBottom: 10, letterSpacing: -0.3 }}>
          Acceso restringido
        </div>
        {/* Subtítulo */}
        <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, marginBottom: 6 }}>
          No tienes permisos para ver el <strong>Dashboard</strong>.
        </div>
        <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.7, marginBottom: 28 }}>
          Esta sección está disponible únicamente para administradores del sistema.
        </div>
        {/* Tip inferior */}
        <div style={{ padding: '14px 18px', background: C.bg, borderRadius: 12,
          border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
          <div style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 8, background: '#eff6ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <span style={{ fontSize: 12.5, color: C.textSec, lineHeight: 1.6 }}>
            Usa el menú lateral para acceder a las secciones disponibles para tu rol.
          </span>
        </div>
      </div>
    </div>
  );

  const { resumen, masVendidos, movimientos } = data;

  // Gráfico línea — salidas últimos 30 días
  const hoy = new Date();
  const hace30 = new Date(); hace30.setDate(hoy.getDate() - 29);
  const diasMap = {};
  (movimientos || []).forEach(m => {
    if (m.tipo === 'salida_recibo') {
      const fecha = m.creado_en?.slice(0, 10);
      if (fecha && new Date(fecha) >= hace30) {
        diasMap[fecha] = (diasMap[fecha] || 0) + Math.abs(parseFloat(m.cantidad));
      }
    }
  });
  const datosLinea = Object.entries(diasMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([fecha, cantidad]) => ({ fecha: fecha.slice(5), cantidad: parseFloat(cantidad.toFixed(1)) }));

  // Gráfico barras — top 5
  const datosBarras = (masVendidos || []).slice(0, 5).map(p => ({
    nombre: p.descripcion.length > 22 ? p.descripcion.slice(0, 20) + '..' : p.descripcion,
    cantidad: parseFloat(p.cantidad_vendida),
  }));

  // Dona — compras vs ventas
  const datosDona = [
    { name: 'Ventas',  value: parseFloat(parseFloat(resumen.ventas_mes.total).toFixed(2)) },
    { name: 'Compras', value: parseFloat(parseFloat(resumen.compras_mes?.total || 0).toFixed(2)) },
  ].filter(d => d.value > 0);

  const nombre = usuario?.nombre?.split(' ')[0] || 'bienvenido';

  return (
    <div style={{ background: C.bg, minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}`,
        padding: `0 ${pad}px`, height: 80, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 4, height: 44, borderRadius: 2, flexShrink: 0,
          background: 'linear-gradient(to bottom, #f59e0b, #3b82f6)' }} />
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.textPrimary }}>Dashboard</div>
          <div style={{ fontSize: 13, color: C.textDim, marginTop: 2 }}>
            Bienvenido, {nombre} — aquí está el resumen de hoy.
          </div>
        </div>
      </div>

      <div style={{ padding: `${pad}px` }}>

      {/* Cards métricas */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <CardMetrica
          titulo="Productos"
          valor={resumen.productos.toLocaleString()}
          subtexto="en catálogo activo"
          color={C.amarillo}
          borderColor={C.amarillo}
          minW={isSmall ? 'calc(50% - 8px)' : 0}
        />
        <CardMetrica
          titulo="Stock Bajo"
          valor={resumen.stock_bajo}
          subtexto="bajo mínimo"
          color={C.rojo}
          borderColor={C.rojo}
          minW={isSmall ? 'calc(50% - 8px)' : 0}
        />
        <CardMetrica
          titulo="Ventas Hoy"
          valor={`$${parseFloat(resumen.recibos_hoy.total).toFixed(0)}`}
          subtexto={`en recibos emitidos`}
          color={C.verde}
          borderColor={C.verde}
          minW={isSmall ? 'calc(50% - 8px)' : 0}
        />
        <CardMetrica
          titulo="Proformas"
          valor={resumen.proformas_hoy}
          subtexto="pendientes"
          color={C.morado}
          borderColor={C.morado}
          minW={isSmall ? 'calc(50% - 8px)' : 0}
        />
      </div>

      {/* Fila gráficos superiores */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>

        <CardGrafico titulo="Compras vs Ventas del mes" flex={1} style={{ minWidth: isSmall ? '100%' : 240 }}>
          {datosDona.length === 0 ? <SinDatos mensaje="Sin datos del mes aún" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={datosDona} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={85}
                  dataKey="value" labelLine={false} label={LabelDona}>
                  <Cell fill={C.verde}   stroke="#fff" strokeWidth={2} />
                  <Cell fill={C.amarillo} stroke="#fff" strokeWidth={2} />
                </Pie>
                <Legend formatter={(val, entry) => (
                  <span style={{ color: C.textSec, fontSize: 12 }}>
                    {val}: <span style={{ color: entry.color, fontWeight: 700 }}>
                      ${entry.payload.value.toFixed(2)}
                    </span>
                  </span>
                )} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardGrafico>

        <CardGrafico titulo="Top 5 más vendidos" flex={2} style={{ minWidth: isSmall ? '100%' : 300 }}>
          {datosBarras.length === 0 ? <SinDatos mensaje="Sin datos de ventas aún" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={datosBarras} layout="vertical"
                margin={{ left: 8, right: 30, top: 4, bottom: 4 }}>
                <XAxis type="number" stroke={C.textDim}
                  tick={{ fill: C.textDim, fontSize: 11 }} tickLine={false}
                  axisLine={{ stroke: C.border }} />
                <YAxis type="category" dataKey="nombre" width={110}
                  tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipCustom />}
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <CartesianGrid horizontal={false} stroke={C.border} strokeDasharray="3 3" />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={14}>
                  {datosBarras.map((_, i) => (
                    <Cell key={i} fill={COLORES[i % COLORES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardGrafico>
      </div>

      {/* Fila inferior */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

        <CardGrafico titulo="Salidas últimos 30 días" flex={3} style={{ minWidth: isSmall ? '100%' : 300 }}>
          {datosLinea.length === 0 ? <SinDatos mensaje="Sin movimientos en los últimos 30 días" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={datosLinea} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" stroke={C.textDim}
                  tick={{ fill: C.textDim, fontSize: 10 }} tickLine={false}
                  axisLine={{ stroke: C.border }} />
                <YAxis stroke={C.textDim} tick={{ fill: C.textDim, fontSize: 10 }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<TooltipCustom />} cursor={{ stroke: C.border }} />
                <Line type="monotone" dataKey="cantidad" stroke={C.azul}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#fff', stroke: C.azul, strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: C.amarillo, stroke: C.amarillo }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardGrafico>

        {/* Tabla alertas stock */}
        <Card style={{ flex: 2, minWidth: isSmall ? '100%' : 280, padding: '18px 20px', borderTop: `3px solid ${C.rojo}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.rojo }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: C.rojo,
              letterSpacing: 1.2, textTransform: 'uppercase' }}>
              Stock bajo mínimo
            </span>
          </div>

          {resumen.alertas_stock.length === 0 ? (
            <div style={{ color: C.textDim, fontSize: 13, padding: '20px 0' }}>
              Sin alertas por ahora ✓
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Código', 'Descripción', 'Stock', 'Mín.'].map(h => (
                    <th key={h} style={{
                      color: C.textDim, fontWeight: 600, fontSize: 10,
                      letterSpacing: 1.3, padding: '0 8px 10px',
                      textAlign: h === 'Stock' || h === 'Mín.' ? 'center' : 'left',
                      borderBottom: `1px solid ${C.border}`,
                      textTransform: 'uppercase',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {resumen.alertas_stock.map((p, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '9px 8px', color: C.textDim, fontSize: 12, fontFamily: 'monospace' }}>
                      {p.codigo}
                    </td>
                    <td style={{ padding: '9px 8px', color: C.textSec }}>
                      {p.descripcion.length > 26 ? p.descripcion.slice(0, 24) + '..' : p.descripcion}
                    </td>
                    <td style={{ padding: '9px 8px', textAlign: 'center', color: C.rojo, fontWeight: 700 }}>
                      {p.stock}
                    </td>
                    <td style={{ padding: '9px 8px', textAlign: 'center', color: C.textDim }}>
                      {p.stock_minimo}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </Card>
      </div>

      </div>
    </div>
  );
}