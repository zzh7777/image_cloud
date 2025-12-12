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

// 路由名称到权限 key 的映射（根据最新权限列表）
const ROUTE_TO_PERMISSION_MAP = {
  'workspace': null, // 工作台，所有角色都可以访问
  'knowledge-base': 'knowledgebase',
  'rule-base': 'businessrule',
  'database': 'datarecord',
  'model-base': 'rulemodel',
  'task-base': 'batchtask',
  'warning-base': 'warning', // 预警管理主页面（图1），需要 warning.list_alert_manage 权限
  'warning-detail': 'warning', // 预警列表页面（图2），需要 warning.list_alert_list 权限
  'warning-record': 'warning', // 预警记录详情（图3），需要 warning.list_alert_detail 权限
  'data-base': 'datastatistics',
  'log-base': 'logentry',
  'permission-base': 'user', // 权限管理对应 user 管理，仅系统管理员
  'create-user': null, // 创建用户，需要特殊权限检查
  'personal-info': null, // 个人信息，所有角色都可以访问
}

// 路由名称到具体权限 action 的映射（用于页面访问检查）
const ROUTE_TO_PERMISSION_ACTION_MAP = {
  'knowledge-base': 'list',
  'rule-base': 'list',
  'database': 'list',
  'model-base': 'list',
  'task-base': 'list',
  'warning-base': 'list_alert_manage', // 预警管理主页面（图1）
  'warning-detail': 'list_alert_list', // 预警列表页面（图2）
  'warning-record': 'list_alert_detail', // 预警记录详情（图3）
  'data-base': 'list',
  'log-base': 'list',
}

// 基于后端返回的权限字符串进行检查，权限格式：`resource.action`
function hasPermissionAction(permissions = [], permissionKey, actions = []) {
  if (!permissionKey) {
    return false
  }
  if (!Array.isArray(permissions) || permissions.length === 0) {
    return false
  }
  const normalizedKey = permissionKey.toLowerCase()
  const actionList = Array.isArray(actions) ? actions : [actions].filter(Boolean)
  if (actionList.length === 0) {
    return false
  }
  return actionList.some(action => {
    const actionName = (action || '').toLowerCase()
    if (!actionName) return false
    // 检查精确匹配：resource.action
    const exactPermission = `${permissionKey}.${actionName}`
    const normalizedPermission = `${normalizedKey}.${actionName}`
    return permissions.includes(exactPermission) ||
           permissions.includes(normalizedPermission) ||
           permissions.includes(`${permissionKey}.__all__`) ||
           permissions.includes(`${normalizedKey}.__all__`)
  })
}

/**
 * 检查用户是否有权限访问某个路由
 * @param {string} role - 用户角色
 * @param {string} routeName - 路由名称
 * @param {Array<string>} permissions - 后端返回的权限字符串列表
 * @param {string} roleLevel - 角色级别
 * @param {string} roleType - 角色类型
 * @returns {boolean} - 是否有权限
 */
export function hasRoutePermission(role, routeName, permissions = [], roleLevel = '', roleType = '') {
  // 权限管理页面只有系统超管可以访问
  if (routeName === 'permission-base') {
    return roleLevel === 'super' || role === 'Superuser' || role === 'System Administrator'
  }

  // 创建用户页面由超级管理员或 admin 级别的 system/insurance/hospital 管理员访问
  if (routeName === 'create-user') {
    if (roleLevel === 'super' || role === 'Superuser') return true
    if (roleLevel === 'admin' && ['system', 'insurance', 'hospital'].includes(roleType)) {
      return true
    }
    return false
  }

  // Superuser 拥有所有权限，可以访问所有页面
  if (role === 'Superuser') {
    return true
  }

  // System Administrator 可以访问除权限管理外的所有页面
  if (role === 'System Administrator') {
    return true
  }

  // Medical Insurance Administrator 可以访问除权限管理外的所有页面
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

  // 如果没有角色，返回 false（但 workspace 和 personal-info 已经在上面处理了）
  if (!role) {
    return false
  }

  // 如果有后端权限列表，优先使用后端权限校验
  if (Array.isArray(permissions) && permissions.length > 0) {
    const permissionKey = ROUTE_TO_PERMISSION_MAP[routeName]
    if (permissionKey === null) {
      return true
    }
    if (!permissionKey) {
      return false
    }
    // 获取该路由对应的具体权限 action
    const requiredAction = ROUTE_TO_PERMISSION_ACTION_MAP[routeName]
    if (requiredAction) {
      // 使用路由对应的具体权限 action 进行检查
      return hasPermissionAction(permissions, permissionKey, [requiredAction])
    }
    // 如果没有映射，默认检查 list 权限
    return hasPermissionAction(permissions, permissionKey, ['list'])
  }

  // 获取路由对应的权限 key（旧逻辑回退）
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
 * @param {Array<string>} permissions - 后端返回的权限字符串列表
 * @returns {boolean} - 是否有编辑权限
 */
export function hasEditPermission(role, routeName, action = 'edit', permissions = []) {
  // 如果有后端权限列表，优先使用后端权限校验
  if (Array.isArray(permissions) && permissions.length > 0) {
    const permissionKey = ROUTE_TO_PERMISSION_MAP[routeName]
    if (!permissionKey) {
      return false
    }
    let actionsToCheck = []
    if (action === 'edit') {
      actionsToCheck = ['create', 'update', 'partial_update']
    } else if (action === 'create') {
      actionsToCheck = ['create']
    } else if (action === 'update') {
      actionsToCheck = ['update', 'partial_update']
    } else if (action === 'delete') {
      actionsToCheck = ['destroy', 'delete']
    } else if (action === 'download') {
      actionsToCheck = ['download']
    } else if (action === 'preview') {
      actionsToCheck = ['preview', 'download'] // preview 和 download 都可以查看详情
    } else if (action === 'view') {
      // 查看详情权限：可以是 download 或 preview
      actionsToCheck = ['download', 'preview']
    } else if (action === 'control') {
      // 任务控制权限（启动/停止）
      actionsToCheck = ['control']
    } else if (action === 'set_status') {
      // 设置状态权限
      actionsToCheck = ['set_status']
    } else if (action === 'list') {
      // 列表权限
      actionsToCheck = ['list']
    }
    return hasPermissionAction(permissions, permissionKey, actionsToCheck)
  }

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

  const permissionsByRole = rolePermissions[permissionKey]

  // 检查具体的操作权限
  if (action === 'edit') {
    // edit 包括 create 和 update
    return permissionsByRole.includes('create') || permissionsByRole.includes('update') || permissionsByRole.includes('partial_update')
  } else if (action === 'create') {
    return permissionsByRole.includes('create')
  } else if (action === 'update') {
    return permissionsByRole.includes('update') || permissionsByRole.includes('partial_update')
  } else if (action === 'delete') {
    return permissionsByRole.includes('destroy') || permissionsByRole.includes('delete')
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

  // Superuser 可以访问所有路由（包括权限管理）
  if (role === 'Superuser') {
    return Object.keys(ROUTE_TO_PERMISSION_MAP)
  }

  // System Administrator 和 Medical Insurance Administrator 可以访问除权限管理外的所有路由
  if (role === 'System Administrator' || role === 'Medical Insurance Administrator') {
    return Object.keys(ROUTE_TO_PERMISSION_MAP).filter(routeName => routeName !== 'permission-base')
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
 * 检查用户是否有查看详情权限（download 或 preview）
 * @param {string} role - 用户角色
 * @param {string} routeName - 路由名称
 * @param {Array<string>} permissions - 后端返回的权限字符串列表
 * @returns {boolean} - 是否有查看详情权限
 */
export function hasViewPermission(role, routeName, permissions = []) {
  return hasEditPermission(role, routeName, 'view', permissions)
}

/**
 * 导出权限矩阵（用于调试）
 */
export { PERMISSION_MATRIX, ROUTE_TO_PERMISSION_MAP, ROUTE_TO_PERMISSION_ACTION_MAP }



