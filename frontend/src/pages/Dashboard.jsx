import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { 
  materiasPrimasService, 
  productosService, 
  gastosService 
} from '../services/api'
import { 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  AlertTriangle 
} from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

const Dashboard = () => {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({
    materiasPrimas: 0,
    productos: 0,
    gastosTotal: 0,
    alertas: 0
  })
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [materiasRes, productosRes, gastosRes, alertasMateriasRes, alertasProductosRes] = await Promise.all([
        materiasPrimasService.getAll(),
        productosService.getAll(),
        gastosService.getAll(),
        materiasPrimasService.getStockBajo(),
        productosService.getStockBajo()
      ])

      const gastosTotal = gastosRes.data.reduce((sum, gasto) => sum + gasto.monto, 0)

      setStats({
        materiasPrimas: materiasRes.data.length,
        productos: productosRes.data.length,
        gastosTotal,
        alertas: alertasMateriasRes.data.length + alertasProductosRes.data.length
      })

      setAlertas([
        ...alertasMateriasRes.data.map(m => ({ tipo: 'Materia Prima', nombre: m.nombre, cantidad: m.cantidad_actual })),
        ...alertasProductosRes.data.map(p => ({ tipo: 'Producto', nombre: p.nombre, cantidad: p.cantidad_actual }))
      ])
    } catch (error) {
      console.error('Error cargando dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const statsCards = [
    {
      title: 'Materias Primas',
      value: stats.materiasPrimas,
      icon: Package,
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50',
      iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      shadowColor: 'shadow-blue-500/20'
    },
    {
      title: 'Productos Terminados',
      value: stats.productos,
      icon: ShoppingCart,
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50',
      iconBg: 'bg-gradient-to-br from-green-500 to-emerald-600',
      shadowColor: 'shadow-green-500/20'
    },
    {
      title: 'Gastos Totales',
      value: formatCurrency(stats.gastosTotal),
      icon: DollarSign,
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50',
      iconBg: 'bg-gradient-to-br from-purple-500 to-pink-600',
      shadowColor: 'shadow-purple-500/20'
    },
    {
      title: 'Alertas de Stock',
      value: stats.alertas,
      icon: AlertTriangle,
      gradient: 'from-red-500 to-orange-500',
      bgColor: 'bg-gradient-to-br from-red-50 to-orange-50',
      iconBg: 'bg-gradient-to-br from-red-500 to-orange-600',
      shadowColor: 'shadow-red-500/20'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 text-white shadow-xl shadow-primary-500/30">
        <h1 className="text-4xl font-bold mb-2">¡Bienvenido de nuevo!</h1>
        <p className="text-primary-100 text-lg">{user?.full_name || user?.username} • {user?.role}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <div 
            key={index} 
            className={`${stat.bgColor} rounded-2xl p-6 border border-white/50 shadow-lg ${stat.shadowColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600 mb-2">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`${stat.iconBg} p-3 rounded-xl shadow-lg`}>
                <stat.icon size={24} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas de Stock */}
      {alertas.length > 0 && (
        <div className="card bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl shadow-lg mr-4">
              <AlertTriangle className="text-white" size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Alertas de Stock Bajo</h2>
              <p className="text-sm text-gray-600">Productos que requieren atención inmediata</p>
            </div>
          </div>
          <div className="table-container">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Tipo</th>
                  <th className="table-header-cell">Nombre</th>
                  <th>Cantidad Actual</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alertas.map((alerta, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        alerta.tipo === 'Materia Prima' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {alerta.tipo}
                      </span>
                    </td>
                    <td>{alerta.nombre}</td>
                    <td className="text-red-600 font-semibold">{alerta.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado del Inventario</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Materias Primas Registradas</span>
              <span className="font-semibold">{stats.materiasPrimas}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Productos Terminados</span>
              <span className="font-semibold">{stats.productos}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Items con Stock Bajo</span>
              <span className="font-semibold text-red-600">{stats.alertas}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Usuario</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Usuario</span>
              <span className="font-semibold">{user?.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rol</span>
              <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-semibold">
                {user?.role}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Email</span>
              <span className="font-semibold">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
