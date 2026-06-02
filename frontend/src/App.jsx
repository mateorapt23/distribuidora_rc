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
  if (soloAdmin && usuario.rol !== 'admin') return <Navigate to="/dashboard" replace />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Routes>
      <Route path="/login"               element={<Login />} />
      <Route path="/recuperar-password"  element={<RecuperarPassword />} />
      <Route path="/dashboard" element={
        <RutaProtegida><Dashboard /></RutaProtegida>
      } />
      <Route path="/productos" element={
        <RutaProtegida><Productos /></RutaProtegida>
      } />
      <Route path="/clientes" element={
        <RutaProtegida><Clientes /></RutaProtegida>
      } />
      <Route path="/documentos" element={
        <RutaProtegida><Documentos /></RutaProtegida>
      } />
      <Route path="/compras" element={
        <RutaProtegida><Compras /></RutaProtegida>
      } />
      <Route path="/facturas-ef" element={
        <RutaProtegida><FacturasEfacilito /></RutaProtegida>
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
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;