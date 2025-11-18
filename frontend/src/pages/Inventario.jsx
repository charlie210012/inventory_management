import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Package, ShoppingCart, ChevronLeft, Search, History } from 'lucide-react'
import { formatNumber, formatDate } from '../utils/formatters'

const Inventario = () => {
  const { user, token } = useAuthStore()
  const [tipoInventario, setTipoInventario] = useState(null) // 'materias_primas' o 'productos_terminados'
  const [filtroTipo, setFiltroTipo] = useState('BPE - Magistrales')
  const [materiasPrimas, setMateriasPrimas] = useState([])
  const [productoTerminado, setProductoTerminado] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)

  const canView = hasPermission(user?.role, PERMISOS.VER_INVENTARIO)

  useEffect(() => {
    if (tipoInventario === 'materias_primas') {
      loadMateriasPrimas()
    } else if (tipoInventario === 'productos_terminados') {
      loadProductosTerminados()
    }
  }, [tipoInventario, filtroTipo, token])

  const loadMateriasPrimas = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/materias-primas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrar por tipo de inventario
        const filtered = data.filter(mp => mp.tipo_inventario === filtroTipo)
        setMateriasPrimas(filtered)
      }
    } catch (error) {
      console.error('Error cargando materias primas:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProductosTerminados = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/productos-terminados', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMateriasPrimas(data)
      }
    } catch (error) {
      console.error('Error cargando productos terminados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!canView) {
    return <div className="text-center text-red-600">No tienes permisos para ver inventario</div>
  }

  if (!tipoInventario) {
    return <SelectorInventario setTipoInventario={setTipoInventario} />
  }

  if (productoTerminado) {
    return (
      <DetalleMateriaPrima
        materia={productoTerminado}
        token={token}
        onBack={() => setProductoTerminado(null)}
      />
    )
  }

  const filteredMaterias = materiasPrimas.filter(mp =>
    mp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mp.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setTipoInventario(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {tipoInventario === 'materias_primas' ? 'Inventario de Materias Primas' : 'Inventario de Productos Terminados'}
          </h1>
        </div>
      </div>

      {/* Filtro */}
      {tipoInventario === 'materias_primas' ? (
        <div className="flex space-x-3">
          <button
            onClick={() => setFiltroTipo('BPE - Magistrales')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtroTipo === 'BPE - Magistrales'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            BPE - Magistrales
          </button>
          <button
            onClick={() => setFiltroTipo('Fabricación de derivados')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filtroTipo === 'Fabricación de derivados'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Fabricación de derivados
          </button>
        </div>
      ) : (
        <div className="flex space-x-3">
          {['BPE - Magistrales', 'Droguería', 'Fabricación de derivados'].map(tipo => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filtroTipo === tipo
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      {loading ? (
        <div className="flex justify-center items-center h-64">Cargando...</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
                {tipoInventario === 'materias_primas' ? (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad Actual</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Proveedor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lote</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">F. Producción</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredMaterias.length > 0 ? (
                filteredMaterias.map(item => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.codigo}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.nombre}</td>
                    {tipoInventario === 'materias_primas' ? (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <span className={item.cantidad_actual <= item.cantidad_minima ? 'text-red-600 font-bold' : ''}>
                            {formatNumber(item.cantidad_actual, 2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.unidad_medida}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.proveedor || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => setProductoTerminado(item)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                          >
                            <History size={18} />
                            <span>Ver Historial</span>
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(item.cantidad_actual, 2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.unidad_medida}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.lote || '-'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.fecha_produccion ? formatDate(item.fecha_produccion) : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No hay registros disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const SelectorInventario = ({ setTipoInventario }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-gray-900">Inventario</h1>
      <p className="text-lg text-gray-600">Selecciona qué deseas consultar:</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Materias Primas */}
        <button
          onClick={() => setTipoInventario('materias_primas')}
          className="group relative overflow-hidden bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 text-left"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform" />
          <div className="relative z-10">
            <div className="inline-block p-4 bg-blue-100 rounded-lg mb-4">
              <Package size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Materias Primas</h2>
            <p className="text-gray-600">Ver y gestionar inventario de materias primas. Filtrar por tipo de inventario y revisar historial de descuentos.</p>
            <div className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium group-hover:bg-blue-700 transition-colors">
              Acceder →
            </div>
          </div>
        </button>

        {/* Productos Terminados */}
        <button
          onClick={() => setTipoInventario('productos_terminados')}
          className="group relative overflow-hidden bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 text-left"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 transform translate-x-8 -translate-y-8 group-hover:scale-150 transition-transform" />
          <div className="relative z-10">
            <div className="inline-block p-4 bg-green-100 rounded-lg mb-4">
              <ShoppingCart size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Productos Terminados</h2>
            <p className="text-gray-600">Ver inventario de productos terminados. Filtrar por tipo de inventario y consultar cantidades disponibles.</p>
            <div className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-lg font-medium group-hover:bg-green-700 transition-colors">
              Acceder →
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}

const DetalleMateriaPrima = ({ materia, token, onBack }) => {
  const [historial, setHistorial] = useState([])
  const [historialSalidas, setHistorialSalidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [vistaActiva, setVistaActiva] = useState('descuentos') // 'descuentos' o 'salidas'

  useEffect(() => {
    loadHistorial()
    loadHistorialSalidas()
  }, [materia.id, token])

  const loadHistorial = async () => {
    try {
      const response = await fetch(`/api/materias-primas/${materia.id}/historial-descuentos`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHistorial(data)
      } else if (response.status === 404) {
        setHistorial([])
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
      setHistorial([])
    } finally {
      setLoading(false)
    }
  }

  const loadHistorialSalidas = async () => {
    try {
      const response = await fetch(`/api/salidas/historial?tipo_item=materia_prima`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        // Filtrar salidas de esta materia prima específica
        const filtered = data.filter(s => s.codigo_item === materia.codigo)
        setHistorialSalidas(filtered)
      }
    } catch (error) {
      console.error('Error cargando historial de salidas:', error)
      setHistorialSalidas([])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{materia.nombre}</h1>
            <p className="text-gray-600 mt-1">Código: {materia.codigo}</p>
          </div>
        </div>
      </div>

      {/* Información General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Cantidad Actual</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(materia.cantidad_actual, 2)}</p>
          <p className="text-xs text-gray-500 mt-1">{materia.unidad_medida}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Cantidad Mínima</p>
          <p className="text-2xl font-bold text-gray-900">{formatNumber(materia.cantidad_minima, 2)}</p>
          <p className="text-xs text-gray-500 mt-1">{materia.unidad_medida}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Tipo Inventario</p>
          <p className="text-lg font-bold text-gray-900">{materia.tipo_inventario || 'N/A'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Proveedor</p>
          <p className="text-lg font-bold text-gray-900">{materia.proveedor || '-'}</p>
        </div>
      </div>

      {/* Historial de Movimientos */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex gap-2">
          <button
            onClick={() => setVistaActiva('descuentos')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              vistaActiva === 'descuentos'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Descuentos por Producción
          </button>
          <button
            onClick={() => setVistaActiva('salidas')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              vistaActiva === 'salidas'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Salidas Directas
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">Cargando historial...</div>
        ) : (
          <div className="overflow-x-auto">
            {vistaActiva === 'descuentos' && (
              <>
                {historial.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Producto</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad Descontada (g)</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Concentración %</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Volumen Producido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historial.map((registro, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{formatDate(registro.fecha)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{registro.producto_nombre}</td>
                          <td className="px-6 py-4 text-sm font-bold text-blue-600">{formatNumber(registro.cantidad_descontada, 2)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatNumber(registro.concentracion, 2)}%</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatNumber(registro.volumen_producido, 2)} {registro.unidad}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No hay registro de descuentos por producción</p>
                  </div>
                )}
              </>
            )}

            {vistaActiva === 'salidas' && (
              <>
                {historialSalidas.length > 0 ? (
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Fecha</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lote</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad Retirada</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Motivo</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Saldo Anterior</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Saldo Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialSalidas.map((salida) => (
                        <tr key={salida.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{formatDate(salida.created_at)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">{salida.lote}</td>
                          <td className="px-6 py-4 text-sm font-bold text-red-600">{formatNumber(salida.cantidad_salida, 2)} {salida.unidad_medida}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                              {salida.motivo_salida}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatNumber(salida.saldo_anterior, 2)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-primary-600">{formatNumber(salida.saldo_actual, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No hay registro de salidas directas</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Inventario
