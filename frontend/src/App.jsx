import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import MateriasPrimas from './pages/MateriasPrimas'
import Productos from './pages/Productos'
import Gastos from './pages/Gastos'
import ProductosTerminados from './pages/ProductosTerminados'
import Usuarios from './pages/Usuarios'
import Salidas from './pages/Salidas'

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="materias-primas" element={<MateriasPrimas />} />
          <Route path="productos" element={<Productos />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="productos-terminados" element={<ProductosTerminados />} />
          <Route path="salidas" element={<Salidas />} />
          <Route path="usuarios" element={<Usuarios />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
