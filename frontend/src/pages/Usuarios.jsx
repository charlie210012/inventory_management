import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { usersService, authService } from '../services/api'
import { PERMISOS, hasPermission, ROLES, ROLE_LABELS } from '../utils/permissions'
import { Plus, Edit, Trash2, Search, UserCheck, UserX } from 'lucide-react'
import { formatDateTime } from '../utils/formatters'

const Usuarios = () => {
  const { user } = useAuthStore()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [isCreating, setIsCreating] = useState(false)

  const canManage = hasPermission(user?.role, PERMISOS.GESTIONAR_USUARIOS)

  useEffect(() => {
    if (canManage) {
      loadUsuarios()
    }
  }, [canManage])

  const loadUsuarios = async () => {
    try {
      const response = await usersService.getAll()
      setUsuarios(response.data)
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return
    
    try {
      await usersService.delete(id)
      loadUsuarios()
    } catch (error) {
      alert('Error al eliminar: ' + error.response?.data?.detail)
    }
  }

  const handleSave = async (formData) => {
    try {
      if (isCreating) {
        await authService.register(formData)
      } else {
        const { password, ...updateData } = formData
        await usersService.update(selectedUser.id, updateData)
      }
      setShowModal(false)
      setSelectedUser(null)
      setIsCreating(false)
      loadUsuarios()
    } catch (error) {
      alert('Error al guardar: ' + error.response?.data?.detail)
    }
  }

  const filteredUsuarios = usuarios.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (!canManage) {
    return (
      <div className="card text-center py-12">
        <UserX size={48} className="mx-auto text-red-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
        <p className="text-gray-600">No tienes permisos para gestionar usuarios.</p>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <button
          onClick={() => {
            setSelectedUser(null)
            setIsCreating(true)
            setShowModal(true)
          }}
          className="btn-primary flex items-center"
        >
          <Plus size={20} className="mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar usuario..."
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
              <th>Usuario</th>
              <th>Nombre Completo</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="font-semibold">{usuario.username}</td>
                <td>{usuario.full_name || '-'}</td>
                <td>{usuario.email}</td>
                <td>
                  <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-xs font-semibold">
                    {ROLE_LABELS[usuario.role] || usuario.role}
                  </span>
                </td>
                <td>
                  {usuario.is_active ? (
                    <span className="flex items-center text-green-600">
                      <UserCheck size={16} className="mr-1" />
                      Activo
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <UserX size={16} className="mr-1" />
                      Inactivo
                    </span>
                  )}
                </td>
                <td className="text-sm text-gray-600">{formatDateTime(usuario.created_at)}</td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedUser(usuario)
                        setIsCreating(false)
                        setShowModal(true)
                      }}
                      className="text-green-600 hover:text-green-800"
                      title="Editar"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(usuario.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Eliminar"
                      disabled={usuario.id === user.id}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Form */}
      {showModal && (
        <UserModal
          usuario={selectedUser}
          isCreating={isCreating}
          onClose={() => {
            setShowModal(false)
            setSelectedUser(null)
            setIsCreating(false)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

// Modal Component
const UserModal = ({ usuario, isCreating, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    username: usuario?.username || '',
    email: usuario?.email || '',
    full_name: usuario?.full_name || '',
    role: usuario?.role || ROLES.OPERARIO,
    is_active: usuario?.is_active ?? true,
    password: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {isCreating ? 'Nuevo Usuario' : 'Editar Usuario'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Usuario *</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input"
              disabled={!isCreating}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nombre Completo</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Rol *</label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              {Object.entries(ROLES).map(([key, value]) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>
          </div>
          {isCreating && (
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña *</label>
              <input
                type="password"
                required={isCreating}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                minLength={6}
              />
            </div>
          )}
          {!isCreating && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium">Usuario Activo</label>
            </div>
          )}
          <div className="flex justify-end space-x-3 mt-6">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {isCreating ? 'Crear' : 'Actualizar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Usuarios
