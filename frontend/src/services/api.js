import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('auth-storage')
    if (authStorage) {
      const { state } = JSON.parse(authStorage)
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/users/me'),
}

// Usuarios
export const usersService = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
}

// Materias Primas
export const materiasPrimasService = {
  getAll: (params) => api.get('/materias-primas', { params }),
  getById: (id) => api.get(`/materias-primas/${id}`),
  create: (data) => api.post('/materias-primas', data),
  update: (id, data) => api.put(`/materias-primas/${id}`, data),
  delete: (id) => api.delete(`/materias-primas/${id}`),
  createMovimiento: (data) => api.post('/materias-primas/movimientos', data),
  getMovimientos: (id, params) => api.get(`/materias-primas/movimientos/${id}`, { params }),
  getStockBajo: () => api.get('/materias-primas/alertas/stock-bajo'),
}

// Gastos
export const gastosService = {
  getAll: (params) => api.get('/gastos', { params }),
  getById: (id) => api.get(`/gastos/${id}`),
  create: (data) => api.post('/gastos', data),
  update: (id, data) => api.put(`/gastos/${id}`, data),
  delete: (id) => api.delete(`/gastos/${id}`),
  getReportePorCategoria: (params) => api.get('/gastos/reportes/por-categoria', { params }),
}

// Productos Terminados
export const productosService = {
  getAll: (params) => api.get('/productos-terminados', { params }),
  getById: (id) => api.get(`/productos-terminados/${id}`),
  create: (data) => api.post('/productos-terminados', data),
  update: (id, data) => api.put(`/productos-terminados/${id}`, data),
  delete: (id) => api.delete(`/productos-terminados/${id}`),
  createMovimiento: (data) => api.post('/productos-terminados/movimientos', data),
  getMovimientos: (id, params) => api.get(`/productos-terminados/movimientos/${id}`, { params }),
  getStockBajo: () => api.get('/productos-terminados/alertas/stock-bajo'),
}

export default api
