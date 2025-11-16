export const ROLES = {
  GERENTE: 'gerente',
  OPERARIO: 'operario',
  JEFE_PLANTA: 'jefe_planta',
  DIRECTOR_TECNICO: 'director_tecnico',
}

export const ROLE_LABELS = {
  [ROLES.GERENTE]: 'Gerente',
  [ROLES.OPERARIO]: 'Operario',
  [ROLES.JEFE_PLANTA]: 'Jefe de Planta',
  [ROLES.DIRECTOR_TECNICO]: 'Director Técnico',
}

export const PERMISOS = {
  VER_INVENTARIO: [ROLES.GERENTE, ROLES.OPERARIO, ROLES.JEFE_PLANTA, ROLES.DIRECTOR_TECNICO],
  MODIFICAR_INVENTARIO: [ROLES.GERENTE, ROLES.JEFE_PLANTA, ROLES.DIRECTOR_TECNICO],
  GESTIONAR_USUARIOS: [ROLES.GERENTE],
  GESTIONAR_GASTOS: [ROLES.GERENTE, ROLES.DIRECTOR_TECNICO],
}

export const hasPermission = (userRole, requiredRoles) => {
  return requiredRoles.includes(userRole)
}
