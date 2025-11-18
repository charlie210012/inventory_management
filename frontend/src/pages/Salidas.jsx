import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { PERMISOS, hasPermission } from '../utils/permissions'
import { Plus, Search, History, ChevronLeft, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatNumber, formatDate } from '../utils/formatters'

const Salidas = () => {
  const { user, token } = useAuthStore()
  const [vista, setVista] = useState('formulario') // 'formulario' o 'historial'
  const [tipoItem, setTipoItem] = useState('materia_prima')
  const [codigoItem, setCodigoItem] = useState('')
  const [itemDetalle, setItemDetalle] = useState(null)
  const [lote, setLote] = useState('')
  const [lotes, setLotes] = useState([])
  const [cantidadSalida, setCantidadSalida] = useState('')
  const [motivoSalida, setMotivoSalida] = useState('Venta')
  const [observaciones, setObservaciones] = useState('')
  const [motivos, setMotivos] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroMotivo, setFiltroMotivo] = useState('')
  const [searchHistorial, setSearchHistorial] = useState('')

  const canView = hasPermission(user?.role, PERMISOS.VER_INVENTARIO)

  useEffect(() => {
    if (canView) {
      cargarMotivos()
      cargarHistorial()
    }
  }, [token])

  const cargarMotivos = async () => {
    try {
      const response = await fetch('/api/salidas/motivos', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setMotivos(data.motivos || [])
      }
    } catch (error) {
      console.error('Error cargando motivos:', error)
    }
  }

  const cargarHistorial = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroTipo) params.append('tipo_item', filtroTipo)
      if (filtroMotivo) params.append('motivo', filtroMotivo)

      const response = await fetch(`/api/salidas/historial?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHistorial(data)
      }
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoading(false)
    }
  }

  const buscarItemPorCodigo = async () => {
    if (!codigoItem.trim()) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un código' })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/salidas/codigo/${codigoItem}?tipo_item=${tipoItem}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setItemDetalle(data)
        setLote(data.lote || '')
        setLotes([])
        // Cargar lotes disponibles
        cargarLotes(data.codigo)
        setMensaje(null)
      } else if (response.status === 404) {
        setMensaje({ tipo: 'error', texto: 'Item no encontrado' })
        setItemDetalle(null)
        setLote('')
        setLotes([])
      }
    } catch (error) {
      console.error('Error buscando item:', error)
      setMensaje({ tipo: 'error', texto: 'Error al buscar item' })
    } finally {
      setLoading(false)
    }
  }

  const cargarLotes = async (codigo) => {
    try {
      const response = await fetch(
        `/api/salidas/lotes/${codigo}?tipo_item=${tipoItem}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLotes(data)
      }
    } catch (error) {
      console.error('Error cargando lotes:', error)
    }
  }

  const registrarSalida = async (e) => {
    e.preventDefault()

    if (!itemDetalle || !lote || !cantidadSalida || !motivoSalida) {
      setMensaje({ tipo: 'error', texto: 'Completa todos los campos requeridos' })
      return
    }

    const cantidadNum = parseFloat(cantidadSalida)
    if (cantidadNum <= 0 || cantidadNum > itemDetalle.cantidad_actual) {
      setMensaje({ tipo: 'error', texto: 'Cantidad inválida' })
      return
    }

    setLoading(true)
    try {
      const payload = {
        tipo_item: tipoItem,
        codigo_item: itemDetalle.codigo,
        lote: lote,
        cantidad_salida: cantidadNum,
        motivo_salida: motivoSalida,
        observaciones: observaciones || null,
        materia_prima_id: tipoItem === 'materia_prima' ? itemDetalle.id : null,
        producto_terminado_id: tipoItem === 'producto_terminado' ? itemDetalle.id : null,
      }

      const response = await fetch('/api/salidas/registrar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        setMensaje({
          tipo: 'exito',
          texto: `Salida registrada exitosamente. Saldo actual: ${formatNumber(result.saldo_actual)} ${result.unidad_medida}`,
        })

        // Limpiar formulario
        setCodigoItem('')
        setItemDetalle(null)
        setLote('')
        setCantidadSalida('')
        setMotivoSalida('Venta')
        setObservaciones('')
        setLotes([])

        // Recargar historial
        await new Promise((resolve) => setTimeout(resolve, 500))
        cargarHistorial()
      } else {
        const error = await response.json()
        setMensaje({ tipo: 'error', texto: error.detail || 'Error al registrar salida' })
      }
    } catch (error) {
      console.error('Error registrando salida:', error)
      setMensaje({ tipo: 'error', texto: 'Error al registrar salida' })
    } finally {
      setLoading(false)
    }
  }

  const handleTipoItemChange = (nuevo) => {
    setTipoItem(nuevo)
    setCodigoItem('')
    setItemDetalle(null)
    setLote('')
    setLotes([])
  }

  // Filtrar historial según búsqueda
  const historialFiltrado = historial.filter((item) => {
    const matchSearch = 
      item.codigo_item.toLowerCase().includes(searchHistorial.toLowerCase()) ||
      item.nombre_item.toLowerCase().includes(searchHistorial.toLowerCase()) ||
      item.lote.toLowerCase().includes(searchHistorial.toLowerCase())
    return matchSearch
  })

  if (!canView) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200">
        <p className="text-red-700">No tienes permisos para acceder a esta sección</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header con tabs */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Salidas</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setVista('formulario')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              vista === 'formulario'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Plus size={20} className="inline mr-2" />
            Nueva Salida
          </button>
          <button
            onClick={() => {
              setVista('historial')
              cargarHistorial()
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              vista === 'historial'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            <History size={20} className="inline mr-2" />
            Historial
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div
          className={`p-4 rounded-lg flex items-start gap-3 animate-fadeIn ${
            mensaje.tipo === 'exito'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {mensaje.tipo === 'exito' ? (
            <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          )}
          <p
            className={
              mensaje.tipo === 'exito' ? 'text-green-700' : 'text-red-700'
            }
          >
            {mensaje.texto}
          </p>
        </div>
      )}

      {/* Formulario de Nueva Salida */}
      {vista === 'formulario' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Registrar Salida de Inventario</h2>

          {/* Selector de Tipo */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tipo de Item
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTipoItemChange('materia_prima')}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  tipoItem === 'materia_prima'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                }`}
              >
                Materia Prima
              </button>
              <button
                onClick={() => handleTipoItemChange('producto_terminado')}
                className={`p-4 rounded-lg border-2 transition-all font-semibold ${
                  tipoItem === 'producto_terminado'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                }`}
              >
                Producto Terminado
              </button>
            </div>
          </div>

          {/* Búsqueda de Código */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código del Item *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigoItem}
                onChange={(e) => setCodigoItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && buscarItemPorCodigo()}
                placeholder="Ingresa código y presiona Enter"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <button
                onClick={buscarItemPorCodigo}
                disabled={loading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-all font-semibold"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Detalles del Item */}
          {itemDetalle && (
            <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Nombre</p>
                  <p className="text-lg font-semibold text-gray-900">{itemDetalle.nombre}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide">Cantidad Disponible</p>
                  <p className="text-lg font-semibold text-primary-700">
                    {formatNumber(itemDetalle.cantidad_actual)} {itemDetalle.unidad_medida}
                  </p>
                </div>
              </div>

              {/* Selector de Lote */}
              {lotes.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lote *
                  </label>
                  <select
                    value={lote}
                    onChange={(e) => setLote(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                  >
                    <option value="">Selecciona un lote</option>
                    {lotes.map((l) => (
                      <option key={l.id} value={l.lote}>
                        {l.lote} - {formatNumber(l.cantidad_disponible)} {l.unidad_medida}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={registrarSalida} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Cantidad de Salida */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cantidad de Salida *
                </label>
                <input
                  type="number"
                  value={cantidadSalida}
                  onChange={(e) => setCantidadSalida(e.target.value)}
                  placeholder="Ingresa cantidad"
                  min="0"
                  step="0.01"
                  max={itemDetalle?.cantidad_actual || undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
                {itemDetalle && (
                  <p className="text-xs text-gray-500 mt-1">
                    Máximo: {formatNumber(itemDetalle.cantidad_actual)}
                  </p>
                )}
              </div>

              {/* Motivo de Salida */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo de Salida *
                </label>
                <select
                  value={motivoSalida}
                  onChange={(e) => setMotivoSalida(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                >
                  {motivos.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Observaciones */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Agrega observaciones adicionales (opcional)"
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !itemDetalle}
                className="flex-1 bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 disabled:bg-gray-400 transition-all font-semibold"
              >
                {loading ? 'Registrando...' : 'Registrar Salida'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodigoItem('')
                  setItemDetalle(null)
                  setLote('')
                  setCantidadSalida('')
                  setObservaciones('')
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-semibold"
              >
                Limpiar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Historial de Salidas */}
      {vista === 'historial' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Historial de Salidas</h2>

          {/* Filtros */}
          <div className="mb-6 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Buscar por código, nombre o lote
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={searchHistorial}
                  onChange={(e) => setSearchHistorial(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Item
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => {
                  setFiltroTipo(e.target.value)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Todos</option>
                <option value="materia_prima">Materia Prima</option>
                <option value="producto_terminado">Producto Terminado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Motivo
              </label>
              <select
                value={filtroMotivo}
                onChange={(e) => {
                  setFiltroMotivo(e.target.value)
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              >
                <option value="">Todos</option>
                {motivos.map((motivo) => (
                  <option key={motivo} value={motivo}>
                    {motivo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabla de Historial */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando historial...</p>
            </div>
          ) : historialFiltrado.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay registros de salidas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tipo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Código</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nombre</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Lote</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Cantidad</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Motivo</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Saldo Anterior</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Saldo Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {historialFiltrado.map((registro) => (
                    <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatDate(registro.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            registro.tipo_item === 'materia_prima'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {registro.tipo_item === 'materia_prima' ? 'MP' : 'PT'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                        {registro.codigo_item}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {registro.nombre_item}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {registro.lote}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatNumber(registro.cantidad_salida)} {registro.unidad_medida}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold">
                          {registro.motivo_salida}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {formatNumber(registro.saldo_anterior)}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-primary-600 whitespace-nowrap">
                        {formatNumber(registro.saldo_actual)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Salidas
