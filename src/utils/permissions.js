/**
 * 权限管理工具
 * 根据后端权限矩阵配置前端权限控制
 */

// 权限矩阵（与后端保持一致）
const PERMISSION_MATRIX = {
  // superuser：后端 groups 为空时的超级管理员，拥有所有权限
  'Superuser': {
    '__all__': true,
  },
  'System Administrator': {
    '__all__': true, // 拥有所有权限
  },
  'Medical Insurance Administrator': {
    // ViewSet-based permissions
    'businessrule': ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy', 'set_status'],
    'rulemodel': ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy', 'set_status'],
    'batchtask': ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy', 'stop', 'start'],
    'knowledgebase': ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy', 'download'],
    'datarecord': ['list', 'retrieve', 'create', 'update', 'partial_update', 'destroy'],
    'hospital': ['list', 'retrieve'],
    'logentry': ['list', 'retrieve'],
    'user': ['list', 'retrieve'],
    
    // APIView-based permissions
    'earlywarningsummarylist': ['get'],
    'earlywarningdetaillist': ['get'],
    'earlywarningdetailretrieve': ['get'],
    'initialreviewupdate': ['update', 'partial_update'],
    'finalreviewupdate': ['update', 'partial_update'],
    'datastatisticslist': ['get'],
  },
  'Medical Insurance User': {
    // Read-only access to core business entities
    'businessrule': ['list', 'retrieve'],
    'rulemodel': ['list', 'retrieve'],
    'batchtask': ['list', 'retrieve'],
    'knowledgebase': ['list', 'retrieve'],
    'datarecord': ['list', 'retrieve'],
    'hospital': ['list', 'retrieve'],
    // 注意：logentry 和 user 权限不在此处，因为 Medical Insurance User 不能访问日志管理和权限管理页面
    
    // Existing read-only access to statistics and warnings
    'earlywarningsummarylist': ['get'],
    'earlywarningdetaillist': ['get'],
    'earlywarningdetailretrieve': ['get'],
    'datastatisticslist': ['get'],
  },
  'Hospital Administrator': {
    'user': ['list', 'retrieve', 'create', 'update', 'partial_update'],
    'earlywarningsummarylist': ['get'], // 预警列表页面
    'earlywarningdetaillist': ['get'], // 预警详情列表页面
    'earlywarningdetailretrieve': ['get'], // 预警记录详情页面
    'hospitalreviewupdate': ['review_hospital'],
    'hospitalalertlist': ['get'],
  },
  'Hospital User': {
    'earlywarningsummarylist': ['get'], // 预警列表页面
    'earlywarningdetaillist': ['get'], // 预警详情列表页面
    'earlywarningdetailretrieve': ['get'], // 预警记录详情页面
    'hospitalreviewupdate': ['review_hospital'],
    'hospitalalertlist': ['get'],
  },
}

// 路由名称到权限 key 的映射
const ROUTE_TO_PERMISSION_MAP = {
  'workspace': null, // 工作台，所有角色都可以访问
  'knowledge-base': 'knowledgebase',
  'rule-base': 'businessrule',
  'database': 'datarecord',
  'model-base': 'rulemodel',
  'task-base': 'batchtask',
  'warning-base': 'earlywarningsummarylist',
  'warning-detail': 'earlywarningdetaillist',
  'warning-record': 'earlywarningdetailretrieve',
  'data-base': 'datastatisticslist',
  'log-base': 'logentry',
  'permission-base': 'user', // 权限管理对应 user 管理
  'create-user': null, // 创建用户，需要特殊权限检查
  'personal-info': null, // 个人信息，所有角色都可以访问
}

/**
 * 检查用户是否有权限访问某个路由
 * @param {string} role - 用户角色
 * @param {string} routeName - 路由名称
 * @returns {boolean} - 是否有权限
 */
export function hasRoutePermission(role, routeName) {
  // Superuser / System Administrator 拥有所有权限，可以访问所有页面
  if (role === 'Superuser' || role === 'System Administrator') {
    return true
  }

  // Medical Insurance Administrator 可以访问所有页面
  if (role === 'Medical Insurance Administrator') {
    return true
  }

  // personal-info 对所有角色开放
  if (routeName === 'personal-info') {
    return true
  }
  
  // 工作台：医院管理员和医院用户不能访问
  if (routeName === 'workspace') {
    if (role === 'Hospital Administrator' || role === 'Hospital User') {
      return false
    }
    return true
  }

  // Medical Insurance User 不能访问日志管理、权限管理和创建用户页面
  if (role === 'Medical Insurance User') {
    if (routeName === 'log-base' || routeName === 'permission-base' || routeName === 'create-user') {
      return false
    }
    // 其他页面可以访问（通过权限矩阵检查）
  }

  // 创建用户页面需要特殊权限检查
  if (routeName === 'create-user') {
    // 只有系统管理员、医保局管理员、医院管理员可以创建用户
    return role === 'System Administrator' || 
           role === 'Medical Insurance Administrator' || 
           role === 'Hospital Administrator'
  }

  // 如果没有角色，返回 false（但 workspace 和 personal-info 已经在上面处理了）
  if (!role) {
    return false
  }

  // 获取路由对应的权限 key
  const permissionKey = ROUTE_TO_PERMISSION_MAP[routeName]

  // 如果路由不需要权限检查（如 workspace, personal-info），返回 true
  if (permissionKey === null) {
    return true
  }

  // 获取角色的权限配置
  const rolePermissions = PERMISSION_MATRIX[role]
  if (!rolePermissions) {
    return false
  }

  // 检查是否有该权限 key 的配置
  // 只要有配置（即使是空数组），就认为有权限访问该页面
  return permissionKey in rolePermissions
}

/**
 * 检查用户是否有编辑权限（创建、更新、删除等）
 * @param {string} role - 用户角色
 * @param {string} routeName - 路由名称
 * @param {string} action - 操作类型：'create', 'update', 'delete', 'edit' (edit 包括 create 和 update)
 * @returns {boolean} - 是否有编辑权限
 */
export function hasEditPermission(role, routeName, action = 'edit') {
  // Superuser、System Administrator 和 Medical Insurance Administrator 拥有所有编辑权限
  if (role === 'Superuser' || role === 'System Administrator' || role === 'Medical Insurance Administrator') {
    return true
  }

  // Medical Insurance User 只有查看权限，没有编辑权限
  if (role === 'Medical Insurance User') {
    return false
  }

  // 如果没有角色，返回 false
  if (!role) {
    return false
  }

  // 获取路由对应的权限 key
  const permissionKey = ROUTE_TO_PERMISSION_MAP[routeName]
  if (!permissionKey) {
    return false
  }

  // 获取角色的权限配置
  const rolePermissions = PERMISSION_MATRIX[role]
  if (!rolePermissions || !rolePermissions[permissionKey]) {
    return false
  }

  const permissions = rolePermissions[permissionKey]

  // 检查具体的操作权限
  if (action === 'edit') {
    // edit 包括 create 和 update
    return permissions.includes('create') || permissions.includes('update') || permissions.includes('partial_update')
  } else if (action === 'create') {
    return permissions.includes('create')
  } else if (action === 'update') {
    return permissions.includes('update') || permissions.includes('partial_update')
  } else if (action === 'delete') {
    return permissions.includes('destroy') || permissions.includes('delete')
  }

  return false
}

/**
 * 获取用户可访问的路由列表
 * @param {string} role - 用户角色
 * @returns {Array<string>} - 可访问的路由名称列表
 */
export function getAccessibleRoutes(role) {
  if (!role) {
    return []
  }

  // Superuser、System Administrator、Medical Insurance Administrator 可以访问所有路由
  if (role === 'Superuser' || role === 'System Administrator' || role === 'Medical Insurance Administrator') {
    return Object.keys(ROUTE_TO_PERMISSION_MAP)
  }

  // Medical Insurance User 不能访问日志管理和权限管理
  if (role === 'Medical Insurance User') {
    return Object.keys(ROUTE_TO_PERMISSION_MAP).filter(routeName => 
      routeName !== 'log-base' && routeName !== 'permission-base'
    )
  }

  // 获取角色的权限配置
  const rolePermissions = PERMISSION_MATRIX[role]
  if (!rolePermissions) {
    return ['workspace', 'personal-info'] // 至少可以访问工作台和个人信息
  }

  // 遍历所有路由，找出有权限的路由
  const accessibleRoutes = []
  for (const [routeName, permissionKey] of Object.entries(ROUTE_TO_PERMISSION_MAP)) {
    if (permissionKey === null || permissionKey in rolePermissions) {
      accessibleRoutes.push(routeName)
    }
  }

  return accessibleRoutes
}

/**
 * 导出权限矩阵（用于调试）
 */
export { PERMISSION_MATRIX, ROUTE_TO_PERMISSION_MAP }

