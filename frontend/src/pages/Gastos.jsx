import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { gastosService } from '../services/api'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Plus, Edit, Trash2, Search } from 'lucide-react'
import { formatCurrency, formatDateTime } from '../utils/formatters'

const Gastos = () => {
  const { user } = useAuthStore()
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedGasto, setSelectedGasto] = useState(null)

  const canModify = hasPermission(user?.role, PERMISOS.GESTIONAR_GASTOS)

  useEffect(() => {
    loadGastos()
  }, [])

  const loadGastos = async () => {
    try {
      const response = await gastosService.getAll()
      setGastos(response.data)
    } catch (error) {
      console.error('Error cargando gastos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este gasto?')) return
    
    try {
      await gastosService.delete(id)
      loadGastos()
    } catch (error) {
      alert('Error al eliminar: ' + error.response?.data?.detail)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (selectedGasto) {
        await gastosService.update(selectedGasto.id, formData)
      } else {
        await gastosService.create(formData)
      }
      setShowModal(false)
      setSelectedGasto(null)
      loadGastos()
    } catch (error) {
      alert('Error al guardar: ' + error.response?.data?.detail)
    }
  }

  const filteredGastos = gastos.filter(g =>
    g.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalGastos = filteredGastos.reduce((sum, g) => sum + g.monto, 0)

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gastos de Producción</h1>
        {canModify && (
          <button
            onClick={() => {
              setSelectedGasto(null)
              setShowModal(true)
            }}
            className="btn-primary flex items-center"
          >
            <Plus size={20} className="mr-2" />
            Registrar Gasto
          </button>
        )}
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar gasto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100">
          <p className="text-sm text-gray-600 mb-1">Total Gastos</p>
          <p className="text-3xl font-bold text-yellow-700">{formatCurrency(totalGastos)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead className="bg-gray-50">
            <tr>
              <th>Concepto</th>
              <th>Categoría</th>
              <th>Monto</th>
              <th>Fecha Gasto</th>
              <th>Orden Producción</th>
              <th>Comprobante</th>
              {canModify && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredGastos.map((gasto) => (
              <tr key={gasto.id} className="hover:bg-gray-50">
                <td className="font-semibold">{gasto.concepto}</td>
                <td>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {gasto.categoria}
                  </span>
                </td>
                <td className="font-bold text-yellow-600">{formatCurrency(gasto.monto)}</td>
                <td>{formatDateTime(gasto.fecha_gasto)}</td>
                <td>{gasto.orden_produccion || '-'}</td>
                <td>{gasto.comprobante || '-'}</td>
                {canModify && (
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedGasto(gasto)
                          setShowModal(true)
                        }}
                        className="text-green-600 hover:text-green-800"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(gasto.id)}
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
        <GastoModal
          gasto={selectedGasto}
          onClose={() => {
            setShowModal(false)
            setSelectedGasto(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// Modal Component
const GastoModal = ({ gasto, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    concepto: gasto?.concepto || '',
    descripcion: gasto?.descripcion || '',
    categoria: gasto?.categoria || 'mano_obra',
    monto: gasto?.monto || 0,
    fecha_gasto: gasto?.fecha_gasto ? new Date(gasto.fecha_gasto).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    orden_produccion: gasto?.orden_produccion || '',
    comprobante: gasto?.comprobante || ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const dataToSend = {
      ...formData,
      fecha_gasto: new Date(formData.fecha_gasto).toISOString()
    }
    onSave(dataToSend)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {gasto ? 'Editar Gasto' : 'Nuevo Gasto'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Concepto *</label>
              <input
                type="text"
                required
                value={formData.concepto}
                onChange={(e) => setFormData({ ...formData, concepto: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categoría *</label>
              <select
                required
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                className="input"
              >
                <option value="mano_obra">Mano de Obra</option>
                <option value="servicios">Servicios</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="otros">Otros</option>
              </select>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.monto}
                onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha del Gasto *</label>
              <input
                type="datetime-local"
                required
                value={formData.fecha_gasto}
                onChange={(e) => setFormData({ ...formData, fecha_gasto: e.target.value })}
                className="input"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Orden de Producción</label>
              <input
                type="text"
                value={formData.orden_produccion}
                onChange={(e) => setFormData({ ...formData, orden_produccion: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comprobante</label>
              <input
                type="text"
                value={formData.comprobante}
                onChange={(e) => setFormData({ ...formData, comprobante: e.target.value })}
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

export default Gastos
