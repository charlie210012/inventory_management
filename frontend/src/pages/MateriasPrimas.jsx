import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { materiasPrimasService } from '../services/api'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Plus, Edit, Trash2, Search, ArrowUpDown } from 'lucide-react'
import { formatCurrency, formatNumber } from '../utils/formatters'

const MateriasPrimas = () => {
  const { user } = useAuthStore()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMateria, setSelectedMateria] = useState(null)
  const [showMovimientoModal, setShowMovimientoModal] = useState(false)

  const canModify = hasPermission(user?.role, PERMISOS.MODIFICAR_INVENTARIO)

  useEffect(() => {
    loadMaterias()
  }, [])

  const loadMaterias = async () => {
    try {
      const response = await materiasPrimasService.getAll()
      setMaterias(response.data)
    } catch (error) {
      console.error('Error cargando materias primas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar esta materia prima?')) return
    
    try {
      await materiasPrimasService.delete(id)
      loadMaterias()
    } catch (error) {
      alert('Error al eliminar: ' + error.response?.data?.detail)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (selectedMateria) {
        await materiasPrimasService.update(selectedMateria.id, formData)
      } else {
        await materiasPrimasService.create(formData)
      }
      setShowModal(false)
      setSelectedMateria(null)
      loadMaterias()
    } catch (error) {
      alert('Error al guardar: ' + error.response?.data?.detail)
    }
  }

  const handleMovimiento = async (formData) => {
    try {
      await materiasPrimasService.createMovimiento(formData)
      setShowMovimientoModal(false)
      setSelectedMateria(null)
      loadMaterias()
    } catch (error) {
      alert('Error al registrar movimiento: ' + error.response?.data?.detail)
    }
  }

  const filteredMaterias = materias.filter(m =>
    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
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
            onClick={() => {
              setSelectedMateria(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Agregar Materia Prima
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar materia prima..."
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
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Cantidad</th>
              <th>Unidad</th>
              <th>Precio Unit.</th>
              <th>Proveedor</th>
              <th>Estado</th>
              {canModify && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredMaterias.map((materia) => (
              <tr key={materia.id} className="hover:bg-gray-50">
                <td className="font-semibold">{materia.nombre}</td>
                <td className="text-gray-600">{materia.descripcion || '-'}</td>
                <td>
                  <span className={materia.cantidad_actual <= materia.cantidad_minima ? 'text-red-600 font-bold' : ''}>
                    {formatNumber(materia.cantidad_actual, 2)}
                  </span>
                </td>
                <td>{materia.unidad_medida}</td>
                <td>{formatCurrency(materia.precio_unitario)}</td>
                <td>{materia.proveedor || '-'}</td>
                <td>
                  {materia.cantidad_actual <= materia.cantidad_minima ? (
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
                          setSelectedMateria(materia)
                          setShowMovimientoModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Movimiento"
                      >
                        <ArrowUpDown size={18} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMateria(materia)
                          setShowModal(true)
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(materia.id)}
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
        <MateriaPrimaModal
          materia={selectedMateria}
          onClose={() => {
            setShowModal(false)
            setSelectedMateria(null)
          }}
          onSave={handleSave}
        />
      )}

      {/* Modal Movimiento */}
      {showMovimientoModal && (
        <MovimientoModal
          materia={selectedMateria}
          onClose={() => {
            setShowMovimientoModal(false)
            setSelectedMateria(null)
          }}
          onSave={handleMovimiento}
        />
      )}
    </div>
  )
}

// Modal Component
const MateriaPrimaModal = ({ materia, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: materia?.nombre || '',
    descripcion: materia?.descripcion || '',
    unidad_medida: materia?.unidad_medida || '',
    cantidad_actual: materia?.cantidad_actual || 0,
    cantidad_minima: materia?.cantidad_minima || 0,
    precio_unitario: materia?.precio_unitario || 0,
    proveedor: materia?.proveedor || '',
    ubicacion: materia?.ubicacion || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {materia ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Unidad de Medida *</label>
              <input
                type="text"
                required
                value={formData.unidad_medida}
                onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })}
                className="input"
                placeholder="kg, litros, unidades..."
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad Actual *</label>
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
              <label className="block text-sm font-medium mb-1">Cantidad Mínima *</label>
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
              <label className="block text-sm font-medium mb-1">Precio Unitario *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.precio_unitario}
                onChange={(e) => setFormData({ ...formData, precio_unitario: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Proveedor</label>
              <input
                type="text"
                value={formData.proveedor}
                onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
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

const MovimientoModal = ({ materia, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    materia_prima_id: materia.id,
    tipo: 'entrada',
    cantidad: 0,
    motivo: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Registrar Movimiento</h2>
        <p className="text-gray-600 mb-4">Materia Prima: <strong>{materia.nombre}</strong></p>
        <p className="text-gray-600 mb-4">Stock Actual: <strong>{formatNumber(materia.cantidad_actual, 2)} {materia.unidad_medida}</strong></p>
        
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

export default MateriasPrimas
