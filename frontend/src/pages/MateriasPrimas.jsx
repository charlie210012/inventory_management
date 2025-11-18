import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
import { formatNumber } from '../utils/formatters'

const MateriasPrimas = () => {
  const { user, token } = useAuthStore()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMateria, setSelectedMateria] = useState(null)
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    unidad_medida: '',
    cantidad_actual: 0,
    cantidad_minima: 0,
    lote: '',
    proveedor: '',
    fecha_ingreso: '',
    tipo_inventario: 'BPE - Magistrales',
  })

  const canModify = hasPermission(user?.role, PERMISOS.MODIFICAR_INVENTARIO)

  const tiposInventario = [
    { value: 'BPE - Magistrales', label: 'BPE - Magistrales' },
    { value: 'Fabricación de derivados', label: 'Fabricación de derivados' },
  ]

  useEffect(() => {
    loadMaterias()
  }, [])

  const loadMaterias = async () => {
    try {
      const response = await fetch('/api/materias-primas', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMaterias(data)
      }
    } catch (error) {
      console.error('Error cargando materias primas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('cantidad') ? parseFloat(value) || 0 : value
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!formData.codigo || !formData.nombre || !formData.unidad_medida) {
      alert('Código, nombre y unidad de medida son requeridos')
      return
    }

    try {
      const method = selectedMateria ? 'PUT' : 'POST'
      const url = selectedMateria ? `/api/materias-primas/${selectedMateria.id}` : '/api/materias-primas'

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
        setSelectedMateria(null)
        resetForm()
        loadMaterias()
        alert(selectedMateria ? 'Materia prima actualizada' : 'Materia prima creada')
      } else {
        const error = await response.json()
        alert('Error: ' + error.detail)
      }
    } catch (error) {
      alert('Error al guardar: ' + error.message)
    }
  }

  const handleEdit = (materia) => {
    setSelectedMateria(materia)
    setFormData({
      codigo: materia.codigo,
      nombre: materia.nombre,
      descripcion: materia.descripcion || '',
      unidad_medida: materia.unidad_medida,
      cantidad_actual: materia.cantidad_actual,
      cantidad_minima: materia.cantidad_minima,
      lote: materia.lote || '',
      proveedor: materia.proveedor || '',
      fecha_ingreso: materia.fecha_ingreso ? materia.fecha_ingreso.split('T')[0] : '',
      tipo_inventario: materia.tipo_inventario,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta materia prima?')) return

    try {
      const response = await fetch(`/api/materias-primas/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        loadMaterias()
        alert('Materia prima eliminada')
      } else {
        const error = await response.json()
        alert('Error: ' + error.detail)
      }
    } catch (error) {
      alert('Error al eliminar: ' + error.message)
    }
  }

  const handleOpenNew = () => {
    setSelectedMateria(null)
    resetForm()
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nombre: '',
      descripcion: '',
      unidad_medida: '',
      cantidad_actual: 0,
      cantidad_minima: 0,
      lote: '',
      proveedor: '',
      fecha_ingreso: '',
      tipo_inventario: 'BPE - Magistrales',
    })
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedMateria(null)
    resetForm()
  }

  const filteredMaterias = materias.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Materias Primas</h1>
        {canModify && (
          <button
            onClick={handleOpenNew}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Agregar Materia Prima</span>
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

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Código</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cantidad</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unidad</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Inventario</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Proveedor</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Estado</th>
              {canModify && <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {filteredMaterias.map(materia => (
              <tr key={materia.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{materia.codigo}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{materia.nombre}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className={materia.cantidad_actual <= materia.cantidad_minima ? 'text-red-600 font-bold' : ''}>
                    {formatNumber(materia.cantidad_actual, 2)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{materia.unidad_medida}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {materia.tipo_inventario}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{materia.proveedor || '-'}</td>
                <td className="px-6 py-4 text-sm">
                  {materia.cantidad_actual <= materia.cantidad_minima ? (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Stock Bajo</span>
                  ) : (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Normal</span>
                  )}
                </td>
                {canModify && (
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => handleEdit(materia)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(materia.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedMateria ? 'Editar Materia Prima' : 'Agregar Materia Prima'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Código Interno */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Interno *</label>
                <input
                  type="text"
                  name="codigo"
                  value={formData.codigo}
                  onChange={handleInputChange}
                  disabled={selectedMateria !== null}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              {/* Nombre */}
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

              {/* Unidad de Medida */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida *</label>
                <input
                  type="text"
                  name="unidad_medida"
                  placeholder="kg, litros, unidades, etc."
                  value={formData.unidad_medida}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Descripción */}
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

              {/* Cantidad Actual y Mínima */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Actual *</label>
                  <input
                    type="number"
                    name="cantidad_actual"
                    value={formData.cantidad_actual}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Mínima *</label>
                  <input
                    type="number"
                    name="cantidad_minima"
                    value={formData.cantidad_minima}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Lote */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lote</label>
                <input
                  type="text"
                  name="lote"
                  value={formData.lote}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  name="proveedor"
                  value={formData.proveedor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Fecha de Ingreso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                <input
                  type="date"
                  name="fecha_ingreso"
                  value={formData.fecha_ingreso}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tipo de Inventario */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inventario Destino *</label>
                <div className="space-y-2">
                  {tiposInventario.map(tipo => (
                    <label key={tipo.value} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="tipo_inventario"
                        value={tipo.value}
                        checked={formData.tipo_inventario === tipo.value}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900 font-medium">{tipo.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end space-x-3 pt-6 border-t mt-8">
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
                  {selectedMateria ? 'Actualizar' : 'Crear'} Materia Prima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MateriasPrimas
