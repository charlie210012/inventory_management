import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { productosService } from '../services/api'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Plus, Edit, Trash2, Search, ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'

const ProductosTerminados = () => {
  const { user } = useAuthStore()
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [showMovimientoModal, setShowMovimientoModal] = useState(false)

  const canModify = hasPermission(user?.role, PERMISOS.MODIFICAR_INVENTARIO)

  useEffect(() => {
    loadProductos()
  }, [])

  const loadProductos = async () => {
    try {
      const response = await productosService.getAll()
      setProductos(response.data)
    } catch (error) {
      console.error('Error cargando productos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return
    
    try {
      await productosService.delete(id)
      loadProductos()
    } catch (error) {
      alert('Error al eliminar: ' + error.response?.data?.detail)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (selectedProducto) {
        await productosService.update(selectedProducto.id, formData)
      } else {
        await productosService.create(formData)
      }
      setShowModal(false)
      setSelectedProducto(null)
      loadProductos()
    } catch (error) {
      alert('Error al guardar: ' + error.response?.data?.detail)
    }
  }

  const handleMovimiento = async (formData) => {
    try {
      await productosService.createMovimiento(formData)
      setShowMovimientoModal(false)
      setSelectedProducto(null)
      loadProductos()
    } catch (error) {
      alert('Error al registrar movimiento: ' + error.response?.data?.detail)
    }
  }

  const filteredProductos = productos.filter(p =>
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Productos Terminados</h1>
        {canModify && (
          <button
            onClick={() => {
              setSelectedProducto(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Agregar Producto
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="bg-gray-50">
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Lote</th>
              <th>Precio Prod.</th>
              <th>Precio Venta</th>
              <th>Estado</th>
              {canModify && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProductos.map((producto) => (
              <tr key={producto.id} className="hover:bg-gray-50">
                <td className="font-mono text-sm">{producto.codigo}</td>
                <td className="font-semibold">{producto.nombre}</td>
                <td>
                  <span className={producto.cantidad_actual <= producto.cantidad_minima ? 'text-red-600 font-bold' : ''}>
                    {formatNumber(producto.cantidad_actual, 2)}
                  </span>
                </td>
                <td>{producto.unidad_medida}</td>
                <td>{producto.lote || '-'}</td>
                <td>{formatCurrency(producto.precio_produccion)}</td>
                <td>{producto.precio_venta ? formatCurrency(producto.precio_venta) : '-'}</td>
                <td>
                  {producto.cantidad_actual <= producto.cantidad_minima ? (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Stock Bajo</span>
                  ) : (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Normal</span>
                  )}
                </td>
                {canModify && (
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProducto(producto)
                          setShowMovimientoModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Movimiento"
                      >
                        <ArrowUpDown size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProducto(producto)
                          setShowModal(true)
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(producto.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <ProductoModal
          producto={selectedProducto}
          onClose={() => {
            setShowModal(false)
            setSelectedProducto(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* Modal Movimiento */}
      {showMovimientoModal && (
        <MovimientoModal
          producto={selectedProducto}
          onClose={() => {
            setShowMovimientoModal(false)
            setSelectedProducto(null)
          }}
          onSave={handleMovimiento}
        />
      )}
    </div>
  )
}

// Modal Component
const ProductoModal = ({ producto, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    codigo: producto?.codigo || '',
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    unidad_medida: producto?.unidad_medida || '',
    cantidad_actual: producto?.cantidad_actual || 0,
    cantidad_minima: producto?.cantidad_minima || 0,
    precio_produccion: producto?.precio_produccion || 0,
    precio_venta: producto?.precio_venta || 0,
    lote: producto?.lote || '',
    fecha_produccion: producto?.fecha_produccion ? new Date(producto.fecha_produccion).toISOString().slice(0, 10) : '',
    fecha_vencimiento: producto?.fecha_vencimiento ? new Date(producto.fecha_vencimiento).toISOString().slice(0, 10) : '',
    ubicacion: producto?.ubicacion || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const dataToSend = { ...formData }
    if (dataToSend.fecha_produccion) {
      dataToSend.fecha_produccion = new Date(dataToSend.fecha_produccion).toISOString()
    }
    if (dataToSend.fecha_vencimiento) {
      dataToSend.fecha_vencimiento = new Date(dataToSend.fecha_vencimiento).toISOString()
    }
    onSave(dataToSend)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {producto ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input
                type="text"
                required
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="input"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="input"
              rows="2"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unidad *</label>
              <input
                type="text"
                required
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cantidad_actual}
                onChange={(e) => setFormData({ ...formData, cantidad_actual: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mínima *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cantidad_minima}
                onChange={(e) => setFormData({ ...formData, cantidad_minima: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Lote</label>
              <input
                type="text"
                value={formData.lote}
                onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio Producción *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio_produccion}
                onChange={(e) => setFormData({ ...formData, precio_produccion: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio Venta</label>
              <input
                type="number"
                step="0.01"
                value={formData.precio_venta}
                onChange={(e) => setFormData({ ...formData, precio_venta: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">F. Producción</label>
              <input
                type="date"
                value={formData.fecha_produccion}
                onChange={(e) => setFormData({ ...formData, fecha_produccion: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">F. Vencimiento</label>
              <input
                type="date"
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ubicación</label>
              <input
                type="text"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const MovimientoModal = ({ producto, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    producto_id: producto.id,
    tipo: 'entrada',
    cantidad: 0,
    motivo: '',
    destino: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Registrar Movimiento</h2>
        <p className="text-gray-600 mb-4">Producto: <strong>{producto.nombre}</strong></p>
        <p className="text-gray-600 mb-4">Stock Actual: <strong>{formatNumber(producto.cantidad_actual, 2)} {producto.unidad_medida}</strong></p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Movimiento *</label>
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="input"
              required
            >
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad *</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: parseFloat(e.target.value) })}
              className="input"
              min="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Destino</label>
            <input
              type="text"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
              className="input"
              placeholder="Cliente, almacén, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <textarea
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="input"
              rows="3"
              placeholder="Describe el motivo del movimiento..."
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Registrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductosTerminados
