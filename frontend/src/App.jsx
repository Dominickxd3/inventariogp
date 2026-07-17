import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Equipos from './pages/Equipos'
import EquipoDetalle from './pages/EquipoDetalle'
import Trabajadores from './pages/Trabajadores'
import TrabajadorDetalle from './pages/TrabajadorDetalle'
import Asignaciones from './pages/Asignaciones'
import Incidencias from './pages/Incidencias'
import Componentes from './pages/Componentes'
import EquipoScan from './pages/EquipoScan'
import Scan from './pages/Scan'

function ProtectedRoute({ children }) {
  const { usuario, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>
  if (!usuario) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/equipos" element={<Equipos />} />
              <Route path="/equipos/:id" element={<EquipoDetalle />} />
              <Route path="/trabajadores" element={<Trabajadores />} />
              <Route path="/trabajadores/:id" element={<TrabajadorDetalle />} />
              <Route path="/asignaciones" element={<Asignaciones />} />
              <Route path="/incidencias" element={<Incidencias />} />
              <Route path="/componentes" element={<Componentes />} />
              <Route path="/equipos/scan/:codigo" element={<EquipoScan />} />
              <Route path="/scan" element={<Scan />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  )
}
