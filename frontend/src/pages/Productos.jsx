import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'

const Productos = () => {
  const { user, token } = useAuthStore()
  const [productos, setProductos] = useState([])
  const [materiasPrimas, setMateriasPrimas] = useState([])
  const [inventarios, setInventarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProducto, setSelectedProducto] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    precio_produccion: 0,
    precio_venta: 0,
    unidad_negocio: 'BPE - Magistrales',
    meses_vencimiento: 6,
    materias_primas: [],
    inventarios: [],
  })
  const [materiaPrimaInput, setMateriaPrimaInput] = useState({
    materia_prima_id: '',
    concentracion: '',
  })

  const canModify = hasPermission(user?.role, PERMISOS.MODIFICAR_INVENTARIO)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        loadProductos(),
        loadMateriasPrimas(),
        loadInventarios(),
      ])
    } finally {
      setLoading(false)
    }
  }

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
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
    }
  }

  const loadMateriasPrimas = async () => {
    try {
      const response = await fetch('/api/materias-primas', {
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
      console.error('Error cargando materias primas:', error)
    }
  }

  const loadInventarios = async () => {
    try {
      const response = await fetch('/api/inventarios', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInventarios(data)
      }
    } catch (error) {
      console.error('Error cargando inventarios:', error)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('precio') ? parseFloat(value) || 0 : value
    }))
  }

  const handleAddMateriaPrima = () => {
    if (!materiaPrimaInput.materia_prima_id || !materiaPrimaInput.concentracion) {
      alert('Selecciona una materia prima y especifica la concentración')
      return
    }

    const mpExistente = formData.materias_primas.find(
      m => m.materia_prima_id === parseInt(materiaPrimaInput.materia_prima_id)
    )

    if (mpExistente) {
      alert('Esta materia prima ya ha sido agregada')
      return
    }

    setFormData(prev => ({
      ...prev,
      materias_primas: [
        ...prev.materias_primas,
        {
          materia_prima_id: parseInt(materiaPrimaInput.materia_prima_id),
          concentracion: parseFloat(materiaPrimaInput.concentracion),
        }
      ]
    }))
    setMateriaPrimaInput({ materia_prima_id: '', concentracion: '' })
  }

  const handleRemoveMateriaPrima = (mpId) => {
    setFormData(prev => ({
      ...prev,
      materias_primas: prev.materias_primas.filter(m => m.materia_prima_id !== mpId)
    }))
  }

  const handleInventarioToggle = (invId) => {
    setFormData(prev => ({
      ...prev,
      inventarios: prev.inventarios.includes(invId)
        ? prev.inventarios.filter(i => i !== invId)
        : [...prev.inventarios, invId]
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!formData.codigo || !formData.nombre) {
      alert('Código y nombre son requeridos')
      return
    }

    if (formData.materias_primas.length === 0) {
      alert('Debe agregar al menos una materia prima')
      return
    }

    if (formData.inventarios.length === 0) {
      alert('Debe seleccionar al menos un inventario')
      return
    }

    try {
      const method = selectedProducto ? 'PUT' : 'POST'
      const url = selectedProducto ? `/api/products/${selectedProducto.id}` : '/api/products'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowModal(false)
        setSelectedProducto(null)
        resetForm()
        loadProductos()
        alert(selectedProducto ? 'Producto actualizado' : 'Producto creado')
      } else {
        const error = await response.json()
        alert('Error: ' + error.detail)
      }
    } catch (error) {
      alert('Error al guardar: ' + error.message)
    }
  }

  const handleEdit = (producto) => {
    setSelectedProducto(producto)
    setFormData({
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio_produccion: producto.precio_produccion,
      precio_venta: producto.precio_venta || 0,
      unidad_negocio: producto.unidad_negocio || 'BPE - Magistrales',
      meses_vencimiento: producto.meses_vencimiento || 6,
      materias_primas: producto.materias_primas || [],
      inventarios: producto.inventarios?.map(inv => inv.id) || [],
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este producto?')) return

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        loadProductos()
        alert('Producto eliminado')
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
    resetForm()
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      precio_produccion: 0,
      precio_venta: 0,
      unidad_negocio: 'BPE - Magistrales',
      meses_vencimiento: 6,
      materias_primas: [],
      inventarios: [],
    })
    setMateriaPrimaInput({ materia_prima_id: '', concentracion: '' })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProducto(null)
    resetForm()
  }

  const filteredProductos = productos.filter(p =>
    p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Listado de Productos</h1>
        {canModify && (
          <button
            onClick={handleOpenNew}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>

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

      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad Negocio</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Descripción</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Materias Primas</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Inventarios</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Precio Venta</th>
              {canModify && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProductos.map(producto => (
              <tr key={producto.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">{producto.codigo}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{producto.nombre}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                    {producto.unidad_negocio}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{producto.descripcion || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {producto.materias_primas?.length || 0} items
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex gap-1 flex-wrap">
                    {producto.inventarios?.map(inv => (
                      <span key={inv.id} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {inv.nombre}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(producto.precio_venta || 0)}</td>
                {canModify && (
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(producto)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(producto.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedProducto ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Datos básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    type="text"
                    name="codigo"
                    value={formData.codigo}
                    onChange={handleInputChange}
                    disabled={selectedProducto !== null}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Producción</label>
                  <input
                    type="number"
                    name="precio_produccion"
                    value={formData.precio_produccion}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta</label>
                  <input
                    type="number"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Negocio *</label>
                <select
                  name="unidad_negocio"
                  value={formData.unidad_negocio}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="BPE - Magistrales">BPE - Magistrales</option>
                  <option value="Droguería">Droguería</option>
                  <option value="Fabricación de derivados">Fabricación de derivados</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.unidad_negocio === 'BPE - Magistrales'
                    ? 'Las materias primas se descontarán de: BPE - Magistrales'
                    : 'Las materias primas se descontarán de: Fabricación de derivados'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meses de Vencimiento *</label>
                <select
                  name="meses_vencimiento"
                  value={formData.meses_vencimiento}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                    <option key={month} value={month}>
                      {month === 0 ? 'Sin vencimiento' : `${month} ${month === 1 ? 'mes' : 'meses'}`}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Tiempo de vencimiento después de la fabricación</p>
              </div>

              {/* Materias Primas */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Materias Primas *</h3>
                
                <div className="space-y-4 mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="grid grid-cols-12 gap-3">
                    <select
                      value={materiaPrimaInput.materia_prima_id}
                      onChange={(e) => setMateriaPrimaInput(prev => ({ ...prev, materia_prima_id: e.target.value }))}
                      className="col-span-7 px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                    >
                      <option value="">Selecciona una materia prima</option>
                      {materiasPrimas.map(mp => (
                        <option key={mp.id} value={mp.id}>
                          {mp.nombre} ({mp.id})
                        </option>
                      ))}
                    </select>
                    <div className="col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          value={materiaPrimaInput.concentracion}
                          onChange={(e) => setMateriaPrimaInput(prev => ({ ...prev, concentracion: e.target.value }))}
                          min="0"
                          max="100"
                          step="0.01"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-center"
                        />
                        <span className="absolute right-3 top-3 text-gray-600 font-semibold text-sm">%P/V</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMateriaPrima}
                      className="col-span-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors font-medium text-sm"
                    >
                      + Agregar
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 italic">
                    %P/V = Porcentaje Peso/Volumen de concentración de la materia prima en el producto
                  </p>
                </div>

                <div className="space-y-3">
                  {formData.materias_primas.length > 0 ? (
                    formData.materias_primas.map(mp => {
                      const mpData = materiasPrimas.find(m => m.id === mp.materia_prima_id)
                      return (
                        <div key={mp.materia_prima_id} className="flex items-center justify-between bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">{mpData?.nombre}</p>
                            <p className="text-xs text-gray-600">ID: {mpData?.id} • Unidad: {mpData?.unidad_medida}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="bg-white px-4 py-2 rounded-lg border border-blue-300 flex items-center space-x-2">
                              <span className="text-lg font-bold text-blue-600">{mp.concentracion}</span>
                              <span className="text-sm font-semibold text-blue-600">%P/V</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMateriaPrima(mp.materia_prima_id)}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      <p className="text-sm text-gray-500">No hay materias primas agregadas</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  {selectedProducto ? 'Actualizar' : 'Crear'} Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Productos
