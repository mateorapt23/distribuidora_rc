import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import RecuperarPassword from './pages/Auth/RecuperarPassword';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Productos from './pages/Productos/Productos';
import Clientes from './pages/Clientes/Clientes';
import Documentos from './pages/Documentos/Documentos';
import Compras from './pages/Compras/Compras';
import FacturasEfacilito from './pages/FacturasEfacilito/FacturasEfacilito';
import Reportes from './pages/Reportes/Reportes';
import Usuarios from './pages/Usuarios/Usuarios';
import Actividad from './pages/Actividad/Actividad';

const RutaProtegida = ({ children, soloAdmin = false }) => {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  const inicio = usuario.rol === 'admin' ? '/dashboard' : '/productos';
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to={inicio} replace />;
  return <Layout>{children}</Layout>;
};

// Redirige al inicio correcto según el rol
const RedireccionInicio = () => {
  const { usuario } = useAuth();
  return <Navigate to={usuario?.rol === 'admin' ? '/dashboard' : '/productos'} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/login"               element={<Login />} />
      <Route path="/recuperar-password"  element={<RecuperarPassword />} />
      <Route path="/dashboard" element={
        <RutaProtegida soloAdmin><Dashboard /></RutaProtegida>
      } />
      <Route path="/productos" element={
        <RutaProtegida><Productos /></RutaProtegida>
      } />
      <Route path="/clientes" element={
        <RutaProtegida soloAdmin><Clientes /></RutaProtegida>
      } />
      <Route path="/documentos" element={
        <RutaProtegida><Documentos /></RutaProtegida>
      } />
      <Route path="/compras" element={
        <RutaProtegida soloAdmin><Compras /></RutaProtegida>
      } />
      <Route path="/facturas-ef" element={
        <RutaProtegida soloAdmin><FacturasEfacilito /></RutaProtegida>
      } />
      <Route path="/reportes" element={
        <RutaProtegida soloAdmin><Reportes /></RutaProtegida>
      } />
      <Route path="/usuarios" element={
        <RutaProtegida soloAdmin><Usuarios /></RutaProtegida>
      } />
      <Route path="/actividad" element={
        <RutaProtegida soloAdmin><Actividad /></RutaProtegida>
      } />
      <Route path="*" element={<RedireccionInicio />} />
    </Routes>
  );
}

export default App;