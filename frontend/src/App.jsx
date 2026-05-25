import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard/Dashboard';
import Productos from './pages/Productos/Productos';
import Documentos from './pages/Documentos/Documentos';
import Compras from './pages/Compras/Compras';
import Reportes from './pages/Reportes/Reportes';
import Usuarios from './pages/Usuarios/Usuarios';

const RutaProtegida = ({ children }) => {
  const { usuario } = useAuth();
  return usuario ? (
    <Layout>{children}</Layout>
  ) : (
    <Navigate to="/login" replace />
  );
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={
        <RutaProtegida>
          <Dashboard />
        </RutaProtegida>
      } />
      <Route path="/productos" element={
        <RutaProtegida>
          <Productos />
        </RutaProtegida>
      } />
      <Route path="/documentos" element={
        <RutaProtegida>
          <Documentos />
        </RutaProtegida>
      } />
      <Route path="/compras" element={
        <RutaProtegida>
          <Compras />
        </RutaProtegida>
      } />
      <Route path="/reportes" element={
        <RutaProtegida>
          <Reportes />
        </RutaProtegida>
      } />
      <Route path="/usuarios" element={
        <RutaProtegida>
          <Usuarios />
        </RutaProtegida>
      } />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;