import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { ROLE_LABELS, PERMISOS, hasPermission } from '../utils/permissions'
import { 
  Home, 
  Package, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  LogOut,
  Menu,
  X 
} from 'lucide-react'
import { useState } from 'react'

const Layout = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const menuItems = [
    { path: '/', icon: Home, label: 'Dashboard', permission: PERMISOS.VER_INVENTARIO },
    { path: '/materias-primas', icon: Package, label: 'Materias Primas', permission: PERMISOS.VER_INVENTARIO },
    { path: '/gastos', icon: DollarSign, label: 'Gastos', permission: PERMISOS.VER_INVENTARIO },
    { path: '/productos-terminados', icon: ShoppingCart, label: 'Productos Terminados', permission: PERMISOS.VER_INVENTARIO },
    { path: '/usuarios', icon: Users, label: 'Usuarios', permission: PERMISOS.GESTIONAR_USUARIOS },
  ]

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-primary-800 text-white transition-all duration-300`}>
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && <h1 className="text-xl font-bold">Inventario</h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded hover:bg-primary-700">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        <nav className="mt-8">
          {menuItems.map((item) => {
            if (!hasPermission(user?.role, item.permission)) return null
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 hover:bg-primary-700 transition-colors ${
                    isActive ? 'bg-primary-700 border-l-4 border-white' : ''
                  }`
                }
              >
                <item.icon size={20} />
                {isSidebarOpen && <span className="ml-3">{item.label}</span>}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              Sistema de Inventario
            </h2>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.full_name || user?.username}</p>
                <p className="text-xs text-gray-500">{ROLE_LABELS[user?.role]}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={16} className="mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
