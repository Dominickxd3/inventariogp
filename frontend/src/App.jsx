import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Equipos from './pages/Equipos'
import EquipoDetalle from './pages/EquipoDetalle'
import Trabajadores from './pages/Trabajadores'
import TrabajadorDetalle from './pages/TrabajadorDetalle'
import Asignaciones from './pages/Asignaciones'
import Incidencias from './pages/Incidencias'
import Componentes from './pages/Componentes'
import Scan from './pages/Scan'

export default function App() {
  return (
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
        <Route path="/scan" element={<Scan />} />
      </Routes>
    </Layout>
  )
}
