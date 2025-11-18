import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Plus, Trash2, Search, X, Calendar } from 'lucide-react'
import { formatNumber, formatDate } from '../utils/formatters'

const ProductosTerminados = () => {
  const { user, token } = useAuthStore()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)

  const canModify = hasPermission(user?.role, PERMISOS.MODIFICAR_INVENTARIO)

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      const response = await fetch('/api/productos-terminados', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProductos(data)
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return

    try {
      const response = await fetch(`/api/productos-terminados/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        loadProductos()
        alert('Registro eliminado')
      } else {
        const error = await response.json()
        alert('Error: ' + error.detail)
      }
    } catch (error) {
      alert('Error al eliminar: ' + error.message)
    }
  }

  const handleOpenNew = () => {
    setSelectedProducto(null)
    setShowModal(true)
  }

  const filteredProductos = productos.filter(p =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.lote?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Registros de Producción</h1>
        {canModify && (
          <button
            onClick={handleOpenNew}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Nuevo Registro</span>
          </button>
        )}
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por código, nombre o lote..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Lote</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Tipo Inventario</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">F. Producción</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">F. Vencimiento</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
              {canModify && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProductos.map(producto => {
              const hoy = new Date()
              const vencimiento = producto.fecha_vencimiento ? new Date(producto.fecha_vencimiento) : null
              const estado = !vencimiento ? 'Normal' : vencimiento < hoy ? 'Vencido' : 'Normal'
              
              return (
                <tr key={producto.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{producto.codigo}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{producto.nombre}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{producto.lote || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatNumber(producto.cantidad_actual, 2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{producto.unidad_medida}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                      {producto.tipo_inventario || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {producto.fecha_produccion ? formatDate(producto.fecha_produccion) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {producto.fecha_vencimiento ? (
                      <span className={vencimiento < hoy ? 'text-red-600 font-semibold' : 'text-green-600'}>
                        {formatDate(producto.fecha_vencimiento)}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {estado === 'Vencido' ? (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                        Vencido
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Normal
                      </span>
                    )}
                  </td>
                  {canModify && (
                    <td className="px-6 py-4 text-sm space-x-2">
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <RegistroProduccionModal
          token={token}
          onClose={() => {
            setShowModal(false)
            setSelectedProducto(null)
          }}
          onSave={() => {
            setShowModal(false)
            loadProductos()
          }}
        />
      )}
    </div>
  )
}

const RegistroProduccionModal = ({ token, onClose, onSave }) => {
  const [tipoInventario, setTipoInventario] = useState('BPE - Magistrales')
  const [productos, setProductos] = useState([])
  const [productosFiltered, setProductosFiltered] = useState([])
  const [selectedProductoId, setSelectedProductoId] = useState('')
  const [selectedProductoData, setSelectedProductoData] = useState(null)
  const [unidad, setUnidad] = useState('mL')
  const [lote, setLote] = useState('')
  const [fechaFabricacion, setFechaFabricacion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Para unidades - presentaciones
  const [presentaciones, setPresentaciones] = useState({
    '3mL': '',
    '10mL': '',
    '30mL': '',
    '50mL': ''
  })
  
  // Para materiales
  const [materialesPrimas, setMaterialesPrimas] = useState([])
  const [materiales, setMateriales] = useState({
    envase: '',
    gotero: '',
    caja: ''
  })

  const presentacionesDisponibles = [
    { label: '3 mL', key: '3mL', volumen: 3 },
    { label: '10 mL', key: '10mL', volumen: 10 },
    { label: '30 mL', key: '30mL', volumen: 30 },
    { label: '50 mL', key: '50mL', volumen: 50 }
  ]

  useEffect(() => {
    loadProductos()
    loadMaterialesPrimas()
  }, [])

  const loadProductos = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setProductos(data)
        filterProductos(tipoInventario, data)
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
      setError('Error al cargar productos')
    }
  }

  const loadMaterialesPrimas = async () => {
    try {
      const response = await fetch('/api/materias-primas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMaterialesPrimas(data)
      }
    } catch (error) {
      console.error('Error cargando materias primas:', error)
    }
  }

  const filterProductos = (tipo, allProductos = productos) => {
    const filtered = allProductos.filter(p => p.unidad_negocio === tipo)
    setProductosFiltered(filtered)
    setSelectedProductoId('')
    setSelectedProductoData(null)
  }

  const handleTipoInventarioChange = (e) => {
    const newTipo = e.target.value
    setTipoInventario(newTipo)
    filterProductos(newTipo)
  }

  const handleProductoChange = (e) => {
    const prodId = parseInt(e.target.value)
    setSelectedProductoId(prodId)
    
    if (prodId) {
      const prod = productosFiltered.find(p => p.id === prodId)
      setSelectedProductoData(prod)
    } else {
      setSelectedProductoData(null)
    }
  }

  const calculateVencimiento = () => {
    if (!fechaFabricacion || !selectedProductoData) return null
    
    const meses = selectedProductoData.meses_vencimiento || 0
    if (meses === 0) return null
    
    const fecha = new Date(fechaFabricacion)
    fecha.setMonth(fecha.getMonth() + meses)
    return fecha.toISOString().split('T')[0]
  }

  // Calcular volumen total para unidades
  const calculateVolumenTotal = () => {
    let total = 0
    presentacionesDisponibles.forEach(p => {
      const cantidad = parseFloat(presentaciones[p.key]) || 0
      total += cantidad * p.volumen
    })
    return total
  }

  // Calcular cantidad total de unidades
  const calculateCantidadTotal = () => {
    let total = 0
    presentacionesDisponibles.forEach(p => {
      total += parseFloat(presentaciones[p.key]) || 0
    })
    return total
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!selectedProductoId || !lote || !fechaFabricacion) {
      setError('Todos los campos son requeridos')
      return
    }

    // Validar según el tipo de unidad
    let cantidadTotal = 0
    let volumenTotal = 0

    if (unidad === 'unidades') {
      cantidadTotal = calculateCantidadTotal()
      volumenTotal = calculateVolumenTotal()
      
      if (cantidadTotal === 0) {
        setError('Debe ingresar al menos una cantidad en las presentaciones')
        return
      }

      // Validar que los materiales estén seleccionados
      if (!materiales.envase || !materiales.gotero || !materiales.caja) {
        setError('Debe seleccionar los códigos de envase, gotero y caja')
        return
      }
    } else {
      // Para mL
      cantidadTotal = parseFloat(presentaciones['3mL']) || 0
      if (cantidadTotal === 0) {
        setError('Debe ingresar la cantidad en mL')
        return
      }
      volumenTotal = cantidadTotal
    }

    setLoading(true)
    try {
      const fechaVencimiento = calculateVencimiento()
      
      const payload = {
        codigo: selectedProductoData.codigo,
        nombre: selectedProductoData.nombre,
        descripcion: selectedProductoData.descripcion || '',
        unidad_medida: unidad,
        cantidad_actual: cantidadTotal,
        volumen_total: volumenTotal,
        cantidad_minima: 0,
        precio_produccion: 0,
        precio_venta: 0,
        lote: lote,
        fecha_produccion: new Date(fechaFabricacion).toISOString(),
        fecha_vencimiento: fechaVencimiento ? new Date(fechaVencimiento).toISOString() : null,
        ubicacion: '',
        tipo_inventario: tipoInventario,
        // Datos de presentaciones si es unidades
        presentaciones: unidad === 'unidades' ? presentaciones : null,
        // Códigos de materiales si es unidades
        materiales: unidad === 'unidades' ? materiales : null
      }

      const response = await fetch('/api/productos-terminados', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        alert('Registro de producción creado exitosamente')
        onSave()
      } else {
        const errorData = await response.json()
        setError('Error: ' + (errorData.detail || 'No se pudo guardar el registro'))
      }
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fechaVencimiento = calculateVencimiento()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Nuevo Registro de Producción</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tipo de Inventario */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Inventario *</label>
            <select
              value={tipoInventario}
              onChange={handleTipoInventarioChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="BPE - Magistrales">BPE - Magistrales</option>
              <option value="Droguería">Droguería</option>
              <option value="Fabricación de derivados">Fabricación de derivados</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Selecciona el tipo de inventario para filtrar productos</p>
          </div>

          {/* Producto */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Producto *</label>
            <select
              value={selectedProductoId}
              onChange={handleProductoChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un producto...</option>
              {productosFiltered.map(prod => (
                <option key={prod.id} value={prod.id}>
                  {prod.codigo} - {prod.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Información del Producto Seleccionado */}
          {selectedProductoData && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-700 mb-1">
                <strong>Nombre:</strong> {selectedProductoData.nombre}
              </p>
              <p className="text-sm text-gray-700 mb-1">
                <strong>Descripción:</strong> {selectedProductoData.descripcion || 'Sin descripción'}
              </p>
              {selectedProductoData.meses_vencimiento > 0 && (
                <p className="text-sm text-gray-700">
                  <strong>Vencimiento:</strong> {selectedProductoData.meses_vencimiento} {selectedProductoData.meses_vencimiento === 1 ? 'mes' : 'meses'} después de la fabricación
                </p>
              )}
            </div>
          )}

          {/* Unidad */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Unidad de Producción *</label>
            <select
              value={unidad}
              onChange={(e) => {
                setUnidad(e.target.value)
                setPresentaciones({ '3mL': '', '10mL': '', '30mL': '', '50mL': '' })
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="mL">mL (mililitros)</option>
              <option value="unidades">Unidades (con presentaciones)</option>
            </select>
          </div>

          {/* Presentaciones (si es unidades) */}
          {unidad === 'unidades' && (
            <>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Presentaciones y Cantidades Producidas</h3>
                <div className="grid grid-cols-2 gap-4">
                  {presentacionesDisponibles.map(presentacion => (
                    <div key={presentacion.key}>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        {presentacion.label}
                      </label>
                      <input
                        type="number"
                        value={presentaciones[presentacion.key]}
                        onChange={(e) => {
                          setPresentaciones({
                            ...presentaciones,
                            [presentacion.key]: e.target.value
                          })
                        }}
                        placeholder="Cantidad"
                        min="0"
                        step="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Unidades de {presentacion.volumen} mL</p>
                    </div>
                  ))}
                </div>
                
                {/* Resumen */}
                <div className="mt-4 p-3 bg-white rounded border border-purple-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Total de Unidades:</p>
                      <p className="text-lg font-bold text-purple-600">{calculateCantidadTotal()} unidades</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Volumen Total:</p>
                      <p className="text-lg font-bold text-blue-600">{calculateVolumenTotal()} mL</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materiales */}
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Materiales a Descontar</h3>
                <div className="space-y-4">
                  {/* Envase */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Código de Envase *
                    </label>
                    <select
                      value={materiales.envase}
                      onChange={(e) => setMateriales({ ...materiales, envase: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecciona un envase...</option>
                      {materialesPrimas.map(mp => (
                        <option key={mp.id} value={mp.codigo}>
                          {mp.codigo} - {mp.nombre}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Se descontará {calculateCantidadTotal()} unidades
                    </p>
                  </div>

                  {/* Gotero */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Código de Gotero *
                    </label>
                    <select
                      value={materiales.gotero}
                      onChange={(e) => setMateriales({ ...materiales, gotero: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecciona un gotero...</option>
                      {materialesPrimas.map(mp => (
                        <option key={mp.id} value={mp.codigo}>
                          {mp.codigo} - {mp.nombre}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Se descontará {calculateCantidadTotal()} unidades
                    </p>
                  </div>

                  {/* Caja */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Código de Caja *
                    </label>
                    <select
                      value={materiales.caja}
                      onChange={(e) => setMateriales({ ...materiales, caja: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Selecciona una caja...</option>
                      {materialesPrimas.map(mp => (
                        <option key={mp.id} value={mp.codigo}>
                          {mp.codigo} - {mp.nombre}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Se descontará {calculateCantidadTotal()} unidades
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Cantidad (si es mL) */}
          {unidad === 'mL' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad en mL *</label>
              <input
                type="number"
                value={presentaciones['3mL']}
                onChange={(e) => setPresentaciones({ ...presentaciones, '3mL': e.target.value })}
                placeholder="Ingresa la cantidad en mL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                step="0.01"
                min="0"
              />
            </div>
          )}

          {/* Lote */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Lote *</label>
            <input
              type="text"
              value={lote}
              onChange={(e) => setLote(e.target.value)}
              placeholder="Ej: LOTE-2025-001"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fecha de Fabricación */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Fabricación *</label>
            <input
              type="date"
              value={fechaFabricacion}
              onChange={(e) => setFechaFabricacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Fecha de Vencimiento (calculada) */}
          {fechaVencimiento && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Vencimiento (Calculada)</label>
              <div className="p-3 bg-green-50 border border-green-300 rounded-lg flex items-center">
                <Calendar size={18} className="text-green-600 mr-2" />
                <span className="text-gray-900 font-medium">{formatDate(fechaVencimiento)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Se calcula automáticamente sumando los meses definidos en el producto</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Registrar Producción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductosTerminados
