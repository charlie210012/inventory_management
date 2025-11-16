import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../store/authStore'
import { authService } from '../services/api'
import { Lock, User, AlertCircle } from 'lucide-react'

const Login = () => {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await authService.login(data)
      const { access_token } = response.data
      
      // Guardar token primero para que esté disponible en la siguiente petición
      login(null, access_token)
      
      // Obtener información del usuario (ahora con el token guardado)
      const userResponse = await authService.getCurrentUser()
      
      // Actualizar con la información completa del usuario
      login(userResponse.data, access_token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="bg-white/90 backdrop-blur-lg p-10 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl mb-4 shadow-lg shadow-primary-500/50">
            <Lock size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Sistema de Inventario</h1>
          <p className="text-gray-600 mt-2 font-medium">Inicia sesión para continuar</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 rounded-xl flex items-center text-red-700 shadow-md">
            <AlertCircle size={20} className="mr-3 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={20} className="text-gray-400" />
              </div>
              <input
                {...register('username', { required: 'El usuario es requerido' })}
                type="text"
                className="input pl-10"
                placeholder="Ingresa tu usuario"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={20} className="text-gray-400" />
              </div>
              <input
                {...register('password', { required: 'La contraseña es requerida' })}
                type="password"
                className="input pl-10"
                placeholder="Ingresa tu contraseña"
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3 font-medium">Usuarios de prueba:</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-primary-50 rounded-lg p-2 border border-primary-200">
              <p className="font-semibold text-primary-700">admin</p>
              <p className="text-gray-600">admin123</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 border border-green-200">
              <p className="font-semibold text-green-700">jefe_planta</p>
              <p className="text-gray-600">jefe123</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
              <p className="font-semibold text-blue-700">director_tecnico</p>
              <p className="text-gray-600">director123</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
              <p className="font-semibold text-gray-700">operario</p>
              <p className="text-gray-600">operario123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
