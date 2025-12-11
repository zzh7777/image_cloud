<template>
  <div class="permission-base">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">权限管理</h2>
    </div>
    
    <!-- 系统管理员权限管理 -->
    <div v-if="isSystemAdmin" class="content-section">
      <div class="main-layout">
        <!-- 左侧：角色清单 -->
        <div class="roles-section">
          <div class="roles-list">
            <div class="role-row head">
              <div class="col-name">角色清单</div>
              <div class="col-type">角色类型</div>
            </div>
            <div 
              class="role-row" 
              v-for="g in groupsSorted" 
              :key="g.id"
            >
              <div class="role-name">
                {{ g.name }}
              </div>
              <div class="role-type">
                {{ g.role_type === 'medical_insurance' ? '医保' : g.role_type === 'hospital' ? '医院' : (g.role_type === null || g.role_type === undefined ? '-' : g.role_type) }}
              </div>
            </div>
            <div class="role-row add">
              <button class="add-btn" @click="addGroup" title="添加角色">添加角色</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色编辑弹窗 -->
    <div v-if="showRoleDialog" class="dialog-overlay" @click.self="closeRoleDialog">
      <div class="dialog-container">
        <div class="dialog-header">
          <h3>{{ dialogMode === 'add' ? '添加角色' : '编辑角色' }}</h3>
          <button class="dialog-close" @click="closeRoleDialog" aria-label="关闭">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-item">
            <label class="form-label">角色名称 <span class="required">*</span></label>
            <input 
              type="text" 
              class="form-input" 
              v-model="dialogName" 
              placeholder="请输入角色名称"
            />
          </div>
          <div class="form-item">
            <label class="form-label">角色类型 <span class="required">*</span></label>
            <select class="form-select" v-model="dialogRoleType" @change="onDialogRoleTypeChange">
              <option value="medical_insurance">医保</option>
              <option value="hospital">医院</option>
            </select>
          </div>
          <div class="form-item">
            <label class="form-label">描述（可选）</label>
            <textarea 
              class="form-textarea" 
              v-model="dialogDescription" 
              placeholder="请输入角色描述"
              rows="3"
            ></textarea>
          </div>
          <div class="form-item">
            <label class="form-label">权限选择 <span class="required">*</span></label>
            <div class="dialog-permissions">
              <div class="dialog-two-pane">
                <aside class="dialog-apps-pane">
                  <ul class="dialog-app-list">
                    <li v-for="app in dialogAppKeysSorted" :key="app">
                      <button 
                        :class="['dialog-app-item', {active: app===dialogActiveApp}]" 
                        @click="dialogActiveApp = app"
                      >
                        <span class="dialog-app-name">{{ appDisplayName(app) }}</span>
                        <span class="dialog-badge">{{ (dialogGroupedPermissions[app]||[]).length }}</span>
                      </button>
                    </li>
                  </ul>
                </aside>
                <section class="dialog-perms-pane">
                  <div class="dialog-pane-headline">{{ dialogActiveApp ? appDisplayName(dialogActiveApp) : '请选择左侧分类' }}</div>
                  <div class="dialog-perm-items">
                    <label 
                      class="dialog-perm-item" 
                      v-for="p in (dialogGroupedPermissions[dialogActiveApp]||[])" 
                      :key="p.id"
                    >
                      <input 
                        type="checkbox" 
                        :checked="isDialogPermChecked(p.id)" 
                        @change="toggleDialogPerm(p.id, $event)" 
                      />
                      <span class="dialog-perm-name">{{ p.display_name || p.name || p.codename }}</span>
                    </label>
                  </div>
                </section>
              </div>
              <div class="dialog-perm-hint" v-if="dialogSelectedPerms.length === 0">
                请至少选择一个权限
              </div>
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeRoleDialog">取消</button>
          <button class="btn-confirm" @click="confirmRoleDialog" :disabled="dialogSelectedPerms.length === 0 || !dialogName.trim()">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PermissionBaseView',
  data() {
    return {
      groups: [],
      permissions: [],
      activeGroupId: null,
      groupPerms: [],
      originalPerms: [],
      activeApp: null,
      saving: false,
      status: '',
      loading: false,
      // 弹窗相关
      showRoleDialog: false,
      dialogMode: 'add', // 'add' 或 'edit'
      dialogName: '',
      dialogRoleType: 'medical_insurance',
      dialogDescription: '',
      dialogSelectedPerms: [], // 弹窗中选中的权限ID列表
      dialogActiveApp: null, // 弹窗中当前选中的应用分类
      editingGroup: null
    }
  },
  computed: {
    // 判断是否是系统管理员（仅 Superuser）
    isSystemAdmin() {
      const role = this.$store.getters.role
      return role === 'Superuser'
    },
    // 排序后的角色列表
    groupsSorted() {
      const arr = this.groups.slice()
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    },
    // 按应用分组的权限（根据当前选中角色的类型过滤）
    groupedPermissions() {
      const map = {}
      // 获取当前选中角色的类型
      const activeGroup = this.groups.find(g => g.id === this.activeGroupId)
      const roleType = activeGroup?.role_type
      
      // 根据角色类型过滤权限
      let filteredPermissions = this.permissions
      if (roleType === 'medical_insurance') {
        // 医保角色只能看到医保权限
        filteredPermissions = this.permissions.filter(p => p.permission_type === 'medical_insurance')
      } else if (roleType === 'hospital') {
        // 医院角色只能看到医院权限
        filteredPermissions = this.permissions.filter(p => p.permission_type === 'hospital')
      }
      
      for (const p of filteredPermissions) {
        const app = p.app_label || '其他'
        if (!map[app]) map[app] = []
        map[app].push(p)
      }
      for (const k in map) {
        map[k] = map[k].sort((a, b) => {
          const an = (a.name || a.codename || '').toLowerCase()
          const bn = (b.name || b.codename || '').toLowerCase()
          return an.localeCompare(bn)
        })
      }
      return Object.fromEntries(Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])))
    },
    // 排序后的应用键列表
    appKeysSorted() {
      return Object.keys(this.groupedPermissions).sort((a, b) => a.localeCompare(b))
    },
    // 弹窗中按应用分组的权限（根据弹窗中选择的角色类型过滤）
    dialogGroupedPermissions() {
      const map = {}
      // 根据弹窗中的角色类型过滤权限
      let filteredPermissions = this.permissions
      if (this.dialogRoleType === 'medical_insurance') {
        filteredPermissions = this.permissions.filter(p => p.permission_type === 'medical_insurance')
      } else if (this.dialogRoleType === 'hospital') {
        // 医院角色只显示预警管理权限，不显示医院管理权限
        filteredPermissions = this.permissions.filter(p => 
          p.permission_type === 'hospital' && p.app_label !== 'hospital'
        )
      }
      
      for (const p of filteredPermissions) {
        const app = p.app_label || '其他'
        if (!map[app]) map[app] = []
        map[app].push(p)
      }
      for (const k in map) {
        map[k] = map[k].sort((a, b) => {
          const an = (a.name || a.codename || '').toLowerCase()
          const bn = (b.name || b.codename || '').toLowerCase()
          return an.localeCompare(bn)
        })
      }
      return Object.fromEntries(Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])))
    },
    // 弹窗中排序后的应用键列表
    dialogAppKeysSorted() {
      return Object.keys(this.dialogGroupedPermissions).sort((a, b) => a.localeCompare(b))
    },
    // 是否有未保存的更改
    isDirty() {
      const a = [...new Set(this.groupPerms)].sort((x, y) => x - y)
      const b = [...new Set(this.originalPerms)].sort((x, y) => x - y)
      if (a.length !== b.length) return true
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return true
      }
      return false
    }
  },
  mounted() {
    this.loadAll()
  },
  methods: {
    // 应用分类显示名称映射
    appDisplayName(app) {
      const appDisplayMap = {
        // 新的 app_label 格式
        knowledgebase: '知识库管理',
        businessrule: '规则库管理',
        rulemodel: '模型管理',
        batchtask: '任务管理',
        datarecord: '数据源管理',
        warning: '预警管理',
        datastatistics: '数据统计',
        logentry: '日志管理',
        user: '用户管理',
        hospital: '医院管理',
        // 兼容旧的 app_label 格式
        knowledge_base: '知识库管理',
        rule_base: '规则库管理',
        database: '数据源管理',
        model: '模型管理',
        task: '任务管理',
        data_statistics: '数据统计',
        log: '日志管理',
        其他: '其他'
      }
      return appDisplayMap[app] || app
    },
    // 加载所有数据
    async loadAll() {
      this.loading = true
      this.status = ''
      
      try {
        // 先加载权限列表
        await this.loadPermissions()
        // 加载角色列表
        await this.loadRoles()
      } catch (error) {
        console.error('加载数据失败:', error)
        this.status = '加载数据失败，请稍后重试'
        // 如果加载失败，使用模拟数据
        this.loadMockData()
      }
      
      this.loading = false
    },
    // 加载权限列表
    async loadPermissions() {
      // 先使用模拟数据，如果有后端接口可以替换
      this.loadMockPermissions()
    },
    // 加载角色列表
    async loadRoles() {
      try {
        const accessToken = this.$store.getters.accessToken
        const response = await fetch('/api/v1/roles/list_all/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('角色列表 API 响应:', data)
        
        // 处理统一响应格式 { code, message, data: { count, results } }
        if (data.code === 0 && data.data) {
          const rolesArray = data.data.results || []
          
          // 转换后端数据格式为前端格式，过滤掉 system 类型的角色
          this.groups = rolesArray
            .filter(role => role.role_type !== 'system')
            .map(role => ({
              id: role.id,
              name: role.name,
              role_type: role.role_type === 'insurance' ? 'medical_insurance' : role.role_type === 'hospital' ? 'hospital' : (role.role_type || null),
              permission_ids: role.permissions || []
            }))
          console.log('加载的角色列表:', this.groups)
        } else if (data.results) {
          // 兼容旧格式：直接返回 { results: [...] }
          const rolesArray = data.results || []
          // 过滤掉 system 类型的角色
          this.groups = rolesArray
            .filter(role => role.role_type !== 'system')
            .map(role => ({
              id: role.id,
              name: role.name,
              role_type: role.role_type === 'insurance' ? 'medical_insurance' : role.role_type === 'hospital' ? 'hospital' : (role.role_type || null),
              permission_ids: role.permissions || []
            }))
          console.log('加载的角色列表（旧格式）:', this.groups)
        } else {
          throw new Error(data.message || '加载角色列表失败：响应格式不正确')
        }
      } catch (error) {
        console.error('加载角色列表失败:', error)
        // 如果加载失败，使用模拟数据
        this.loadMockRoles()
      }
    },
    // 加载模拟权限数据
    loadMockPermissions() {
      // 系统管理员可以看到所有权限
      const medicalPerms = this.getMedicalInsurancePermissions().map(p => ({
        ...p,
        permission_type: 'medical_insurance'
      }))
      const hospitalPerms = this.getHospitalPermissions().map(p => ({
        ...p,
        permission_type: 'hospital'
      }))
      // 直接合并，因为现在使用后端真实的权限ID
      this.permissions = [...medicalPerms, ...hospitalPerms]
    },
    // 加载模拟角色数据
    loadMockRoles() {
      this.groups = [
        { id: 1, name: '能增加知识库的医保人员', role_type: 'medical_insurance', permission_ids: [] },
        { id: 2, name: '能管理规则的医保人员', role_type: 'medical_insurance', permission_ids: [] },
        { id: 3, name: '医院复核人员', role_type: 'hospital', permission_ids: [] }
      ]
    },
    // 加载模拟数据（兼容旧代码）
    loadMockData() {
      this.loadMockPermissions()
      this.loadMockRoles()
    },
    // 获取医保管理员可管理的权限（使用后端权限ID）
    getMedicalInsurancePermissions() {
      return [
        // 知识库管理
        { id: 1, app_label: 'knowledgebase', codename: 'knowledgebase.list', name: '可以查看知识库列表、可以查看知识库详情、可以搜索知识库列表', display_name: '知识库-列表' },
        { id: 2, app_label: 'knowledgebase', codename: 'knowledgebase.create', name: '可以创建知识库', display_name: '知识库-创建' },
        { id: 3, app_label: 'knowledgebase', codename: 'knowledgebase.destroy', name: '可以删除知识库', display_name: '知识库-删除' },
        { id: 4, app_label: 'knowledgebase', codename: 'knowledgebase.download', name: '可以下载知识库', display_name: '知识库-下载' },

        // 规则库管理
        { id: 5, app_label: 'businessrule', codename: 'businessrule.list', name: '可以查看规则库列表、可以查看规则库详情、可以搜索规则库列表', display_name: '规则库-列表' },
        { id: 6, app_label: 'businessrule', codename: 'businessrule.create', name: '可以创建规则库', display_name: '规则库-创建' },
        { id: 7, app_label: 'businessrule', codename: 'businessrule.update', name: '可以更新规则库', display_name: '规则库-更新' },
        { id: 8, app_label: 'businessrule', codename: 'businessrule.destroy', name: '可以删除规则库', display_name: '规则库-删除' },
        { id: 9, app_label: 'businessrule', codename: 'businessrule.set_status', name: '可以设置规则库状态', display_name: '规则库-设置状态' },

        // 模型管理
        { id: 10, app_label: 'rulemodel', codename: 'rulemodel.list', name: '可以查看模型列表、可以查看模型详情、可以搜索模型列表', display_name: '模型-列表' },
        { id: 11, app_label: 'rulemodel', codename: 'rulemodel.create', name: '可以创建模型', display_name: '模型-创建' },
        { id: 12, app_label: 'rulemodel', codename: 'rulemodel.update', name: '可以更新模型', display_name: '模型-更新' },
        { id: 13, app_label: 'rulemodel', codename: 'rulemodel.destroy', name: '可以删除模型', display_name: '模型-删除' },
        { id: 14, app_label: 'rulemodel', codename: 'rulemodel.set_status', name: '可以设置模型状态', display_name: '模型-设置状态' },

        // 任务管理
        { id: 15, app_label: 'batchtask', codename: 'batchtask.list', name: '可以查看任务列表、可以查看任务详情、可以搜索任务列表', display_name: '任务-列表' },
        { id: 16, app_label: 'batchtask', codename: 'batchtask.create', name: '可以创建任务', display_name: '任务-创建' },
        { id: 17, app_label: 'batchtask', codename: 'batchtask.update', name: '可以更新任务', display_name: '任务-更新' },
        { id: 18, app_label: 'batchtask', codename: 'batchtask.destroy', name: '可以删除任务', display_name: '任务-删除' },
        { id: 19, app_label: 'batchtask', codename: 'batchtask.control', name: '可以启动和停止任务', display_name: '任务-启停' },

        // 数据库管理
        { id: 20, app_label: 'datarecord', codename: 'datarecord.list', name: '可以查看数据记录列表、可以查看数据记录详情、可以搜索数据记录列表', display_name: '数据记录-列表' },
        { id: 21, app_label: 'datarecord', codename: 'datarecord.create', name: '可以创建数据记录', display_name: '数据记录-创建' },
        { id: 22, app_label: 'datarecord', codename: 'datarecord.update', name: '可以更新数据记录', display_name: '数据记录-更新' },
        { id: 23, app_label: 'datarecord', codename: 'datarecord.destroy', name: '可以删除数据记录', display_name: '数据记录-删除' },

        // 预警管理
        { id: 24, app_label: 'warning', codename: 'warning.list_alert_manage', name: '可以查看预警管理列表、可以搜索预警管理列表', display_name: '预警-管理列表' },
        { id: 25, app_label: 'warning', codename: 'warning.review_initial', name: '可以初审预警', display_name: '预警-初审' },
        { id: 26, app_label: 'warning', codename: 'warning.review_final', name: '可以终审预警', display_name: '预警-终审' },
        { id: 27, app_label: 'warning', codename: 'warning.review_hospital', name: '可以医院复核预警', display_name: '预警-医院复核' },
        { id: 28, app_label: 'warning', codename: 'warning.preview_screenshot', name: '可以预览预警截图', display_name: '预警-截图预览' },
        { id: 29, app_label: 'warning', codename: 'warning.preview_materials', name: '可以预览预警材料', display_name: '预警-材料预览' },
        { id: 41, app_label: 'warning', codename: 'warning.list_alert_list', name: '可以查看预警列表页面的列表、可以搜索预警列表页面的列表', display_name: '预警-列表页面' },
        { id: 42, app_label: 'warning', codename: 'warning.list_alert_detail', name: '可以查看预警记录详情', display_name: '预警-记录详情' },

        // 数据统计
        { id: 30, app_label: 'datastatistics', codename: 'datastatistics.list', name: '可以查看数据统计列表、可以搜索数据统计列表', display_name: '数据统计-列表' },

        // 日志管理
        { id: 31, app_label: 'logentry', codename: 'logentry.list', name: '可以查看日志列表、可以搜索日志', display_name: '日志-列表' }
      ]
    },
    // 获取医院管理员可管理的权限（使用后端权限ID）
    getHospitalPermissions() {
      return [
        // 预警相关权限（医院角色）
        { id: 24, app_label: 'warning', codename: 'warning.list_alert_manage', name: '可以查看预警管理列表、可以搜索预警管理列表', display_name: '预警-管理列表' },
        { id: 25, app_label: 'warning', codename: 'warning.review_initial', name: '可以初审预警', display_name: '预警-初审' },
        { id: 26, app_label: 'warning', codename: 'warning.review_final', name: '可以终审预警', display_name: '预警-终审' },
        { id: 27, app_label: 'warning', codename: 'warning.review_hospital', name: '可以医院复核预警', display_name: '预警-医院复核' },
        { id: 28, app_label: 'warning', codename: 'warning.preview_screenshot', name: '可以预览预警截图', display_name: '预警-截图预览' },
        { id: 29, app_label: 'warning', codename: 'warning.preview_materials', name: '可以预览预警材料', display_name: '预警-材料预览' },
        { id: 41, app_label: 'warning', codename: 'warning.list_alert_list', name: '可以查看预警列表页面的列表、可以搜索预警列表页面的列表', display_name: '预警-列表页面' },
        { id: 42, app_label: 'warning', codename: 'warning.list_alert_detail', name: '可以查看预警记录详情', display_name: '预警-记录详情' }
      ]
    },
    // 选择角色
    selectGroup(id) {
      this.activeGroupId = id
      this.onRoleChanged()
    },
    // 角色改变时的处理
    onRoleChanged() {
      const g = this.groups.find(x => x.id === this.activeGroupId)
      if (!g) {
        this.groupPerms = []
        this.originalPerms = []
        this.activeApp = null
        return
      }
      
      // 获取当前角色类型对应的权限ID列表
      const roleType = g.role_type
      let validPermissionIds = []
      if (roleType === 'medical_insurance') {
        validPermissionIds = this.permissions
          .filter(p => p.permission_type === 'medical_insurance')
          .map(p => p.id)
      } else if (roleType === 'hospital') {
        validPermissionIds = this.permissions
          .filter(p => p.permission_type === 'hospital')
          .map(p => p.id)
      }
      
      // 过滤掉不属于当前角色类型的权限
      const filteredPermIds = (g.permission_ids || []).filter(id => validPermissionIds.includes(id))
      this.groupPerms = [...filteredPermIds]
      this.originalPerms = [...filteredPermIds]
      
      // 更新角色的权限列表（移除无效权限）
      if (filteredPermIds.length !== (g.permission_ids || []).length) {
        g.permission_ids = filteredPermIds
      }
      
      const keys = this.appKeysSorted
      this.activeApp = keys.length ? keys[0] : null
    },
    // 添加角色
    addGroup() {
      this.dialogMode = 'add'
      this.dialogName = ''
      this.dialogRoleType = 'medical_insurance'
      this.dialogDescription = ''
      this.dialogSelectedPerms = []
      this.editingGroup = null
      // 初始化弹窗中的应用分类
      const keys = this.dialogAppKeysSorted
      this.dialogActiveApp = keys.length > 0 ? keys[0] : null
      this.showRoleDialog = true
    },
    // 编辑角色（暂时禁用，因为现在是一次性创建）
    // eslint-disable-next-line no-unused-vars
    editGroup(g) {
      if (this.$message) {
        this.$message.info('编辑功能暂未开放，请删除后重新创建')
      } else {
        alert('编辑功能暂未开放，请删除后重新创建')
      }
    },
    // 关闭角色弹窗
    closeRoleDialog() {
      this.showRoleDialog = false
      this.dialogName = ''
      this.dialogRoleType = 'medical_insurance'
      this.dialogDescription = ''
      this.dialogSelectedPerms = []
      this.dialogActiveApp = null
      this.editingGroup = null
    },
    // 弹窗中角色类型改变时的处理
    onDialogRoleTypeChange() {
      // 清空已选权限，因为角色类型改变了
      this.dialogSelectedPerms = []
      // 重新初始化应用分类
      const keys = this.dialogAppKeysSorted
      this.dialogActiveApp = keys.length > 0 ? keys[0] : null
    },
    // 检查弹窗中权限是否被选中
    isDialogPermChecked(id) {
      return new Set(this.dialogSelectedPerms).has(id)
    },
    // 切换弹窗中的权限
    toggleDialogPerm(id, ev) {
      const checked = ev.target.checked
      const set = new Set(this.dialogSelectedPerms)
      if (checked) {
        set.add(id)
      } else {
        set.delete(id)
      }
      this.dialogSelectedPerms = Array.from(set)
    },
    // 确认角色弹窗
    async confirmRoleDialog() {
      if (!this.dialogName || !this.dialogName.trim()) {
        if (this.$message) {
          this.$message.warning('请输入角色名称')
        } else {
          alert('请输入角色名称')
        }
        return
      }
      
      if (this.dialogSelectedPerms.length === 0) {
        if (this.$message) {
          this.$message.warning('请至少选择一个权限')
        } else {
          alert('请至少选择一个权限')
        }
        return
      }
      
      this.status = ''
      this.saving = true
      
      try {
        // 转换角色类型：medical_insurance -> insurance, hospital -> hospital
        const roleType = this.dialogRoleType === 'medical_insurance' ? 'insurance' : 'hospital'
        
        // 构建请求数据
        const requestData = {
          name: this.dialogName.trim(),
          permissions: this.dialogSelectedPerms,
          role_type: roleType
        }
        
        // 如果有描述，添加到请求数据
        if (this.dialogDescription && this.dialogDescription.trim()) {
          requestData.description = this.dialogDescription.trim()
        }
        
        const accessToken = this.$store.getters.accessToken
        const response = await fetch('/api/v1/roles/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify(requestData)
        })
        
        const data = await response.json()
        
        if (!response.ok || (data.code !== undefined && data.code !== 0)) {
          const errorMsg = data.message || data.detail || `创建角色失败: ${response.status}`
          this.status = errorMsg
          if (this.$message) {
            this.$message.error(errorMsg)
          } else {
            alert(errorMsg)
          }
          this.saving = false
          return
        }
        
        // 创建成功，刷新角色列表
        const roleData = data.data || data
        if (this.$message) {
          this.$message.success('角色创建成功')
        } else {
          alert('角色创建成功')
        }
        
        // 关闭弹窗
        this.closeRoleDialog()
        
        // 重新加载数据
        await this.loadAll()
        
        // 选中新创建的角色
        if (roleData.id) {
          this.activeGroupId = roleData.id
          this.onRoleChanged()
        }
      } catch (error) {
        console.error('创建角色错误:', error)
        this.status = '创建角色失败，请稍后重试'
        if (this.$message) {
          this.$message.error('创建角色失败，请稍后重试')
        } else {
          alert('创建角色失败，请稍后重试')
        }
      } finally {
        this.saving = false
      }
    },
    // 删除角色
    async deleteGroup(g) {
      const ok = window.confirm('确认删除该角色？')
      if (!ok) return
      this.status = ''
      
      try {
        const accessToken = this.$store.getters.accessToken
        const response = await fetch(`/api/v1/roles/${g.id}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        })
        
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          const errorMsg = data.message || data.detail || `删除角色失败: ${response.status}`
          this.status = errorMsg
          if (this.$message) {
            this.$message.error(errorMsg)
          } else {
            alert(errorMsg)
          }
          return
        }
        
        // 删除成功
        this.groups = this.groups.filter(x => x.id !== g.id)
        if (this.activeGroupId === g.id) {
          this.activeGroupId = null
          this.groupPerms = []
          this.originalPerms = []
        }
        
        if (this.$message) {
          this.$message.success('角色删除成功')
        } else {
          alert('角色删除成功')
        }
      } catch (error) {
        console.error('删除角色错误:', error)
        this.status = '删除角色失败，请稍后重试'
        if (this.$message) {
          this.$message.error('删除角色失败，请稍后重试')
        } else {
          alert('删除角色失败，请稍后重试')
        }
      }
    },
    // 检查权限是否被选中
    isChecked(id) {
      return new Set(this.groupPerms).has(id)
    },
    // 切换权限
    togglePerm(id, ev) {
      const checked = ev.target.checked
      const set = new Set(this.groupPerms)
      if (checked) {
        set.add(id)
      } else {
        set.delete(id)
      }
      this.groupPerms = Array.from(set)
    },
    // 确认并保存（更新现有角色的权限）
    async confirmAndSave() {
      if (this.saving) return
      
      if (this.groupPerms.length === 0) {
        if (this.$message) {
          this.$message.warning('请至少选择一个权限')
        } else {
          alert('请至少选择一个权限')
        }
        return
      }
      
      const ok = window.confirm('确认要更新该角色的权限配置吗？')
      if (!ok) return
      this.status = ''
      
      this.saving = true
      
      try {
        const g = this.groups.find(x => x.id === this.activeGroupId)
        if (!g) {
          throw new Error('未找到要更新的角色')
        }
        
        // 转换角色类型
        const roleType = g.role_type === 'medical_insurance' ? 'insurance' : g.role_type === 'hospital' ? 'hospital' : g.role_type
        
        const accessToken = this.$store.getters.accessToken
        const response = await fetch(`/api/v1/roles/${g.id}/`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            name: g.name,
            permissions: this.groupPerms,
            role_type: roleType
          })
        })
        
        const data = await response.json()
        
        if (!response.ok || (data.code !== undefined && data.code !== 0)) {
          const errorMsg = data.message || data.detail || `更新角色失败: ${response.status}`
          this.status = errorMsg
          if (this.$message) {
            this.$message.error(errorMsg)
          } else {
            alert(errorMsg)
          }
          this.saving = false
          return
        }
        
        // 更新成功
        if (g) {
          g.permission_ids = [...this.groupPerms]
        }
        this.originalPerms = [...this.groupPerms]
        
        if (this.$message) {
          this.$message.success('权限更新成功')
        } else {
          alert('权限更新成功')
        }
      } catch (error) {
        console.error('更新角色权限错误:', error)
        this.status = '更新角色权限失败，请稍后重试'
        if (this.$message) {
          this.$message.error('更新角色权限失败，请稍后重试')
        } else {
          alert('更新角色权限失败，请稍后重试')
        }
      } finally {
        this.saving = false
      }
    },
  }
}
</script>

<style scoped>
.permission-base {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.title-bar {
  width: 4px;
  height: 20px;
  background-color: #409EFF;
  margin-right: 10px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #303133;
}

.content-section {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.main-layout {
  width: 100%;
}

.section-title {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card { 
  background: #fff; 
  border: none;
  border-radius: 0;
  padding: 0;
  box-shadow: none;
}

.card-head { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  margin-bottom: 20px; 
  padding-bottom: 15px;
  border-bottom: 1px solid #e4e7ed;
}

.roles-head { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  margin-bottom: 12px; 
}

.roles-title { 
  font-weight: 600; 
  color: #303133;
  font-size: 14px;
}

.roles-list { 
  border: 1px solid #e4e7ed; 
  border-radius: 4px; 
  background: #fff; 
  margin-bottom: 20px; 
  overflow: hidden; 
  width: 100%; 
}

.role-row { 
  display: grid; 
  grid-template-columns: 1fr auto; 
  align-items: center; 
  gap: 8px; 
  padding: 12px 14px; 
  border-bottom: 1px solid #e4e7ed; 
}

.role-row.head { 
  background: #f5f7fa; 
  font-weight: 600; 
  color: #303133; 
  font-size: 16px;
}

.role-row:last-child { 
  border-bottom: none; 
}

.role-row:hover { 
  background: #f5f7fa; 
}

.role-row.active { 
  background: #ecf5ff; 
}

.role-row.add { 
  grid-template-columns: 1fr; 
  justify-items: center; 
}

.col-type {
  font-weight: 600;
  color: #303133;
  text-align: center;
  min-width: 80px;
}

.role-type {
  text-align: center;
  color: #606266;
  font-size: 14px;
  min-width: 80px;
}

.role-name { 
  text-align: left; 
  width: 100%; 
  background: transparent; 
  border: none; 
  color: #111827; 
  cursor: pointer; 
  padding: 0; 
  font-weight: 500; 
}

.role-name.active { 
  color: #409EFF; 
  font-weight: 600; 
}

.row-actions { 
  display: flex; 
  gap: 8px; 
  align-items: center; 
}

.icon-btn { 
  background: transparent; 
  border: none; 
  padding: 6px; 
  border-radius: 6px; 
  cursor: pointer; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  transition: background 0.2s;
}

.icon-btn:hover { 
  background: #f3f4f6; 
}

.icon-btn.danger { 
  color: #b91c1c; 
}

.icon-btn.danger:hover { 
  background: #fee2e2; 
}

.add-btn { 
  background: transparent; 
  border: none; 
  color: #409EFF; 
  padding: 6px 8px; 
  border-radius: 6px; 
  cursor: pointer; 
  font-size: 14px;
  transition: background 0.2s;
}

.add-btn:hover { 
  background: #ecf5ff; 
}

.icon { 
  flex: 0 0 16px; 
}

.perm-box { 
  border: 1px solid #e4e7ed; 
  border-radius: 4px; 
  padding: 20px; 
  background: #fafafa; 
  margin-top: 20px;
}

.perm-head { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  margin-bottom: 12px; 
}

.perm-title { 
  font-weight: 600; 
  color: #303133;
  font-size: 16px;
}

.two-pane { 
  display: grid; 
  grid-template-columns: 240px 1fr; 
  gap: 16px; 
}

.apps-pane { 
  border: 1px solid #e4e7ed; 
  border-radius: 4px; 
  background: #f5f7fa; 
  padding: 8px; 
}

.app-list { 
  list-style: none; 
  margin: 0; 
  padding: 0; 
  display: flex; 
  flex-direction: column; 
  gap: 6px; 
}

.app-item { 
  width: 100%; 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 8px 10px; 
  border-radius: 4px; 
  border: 1px solid #e4e7ed; 
  background: #fff; 
  cursor: pointer; 
  transition: all 0.2s;
}

.app-item:hover {
  background: #f5f7fa;
}

.app-item.active { 
  background: #ecf5ff; 
  border-color: #409EFF; 
  color: #409EFF; 
}

.app-name { 
  font-weight: 600; 
  font-size: 14px;
}

.badge { 
  background: #ecf5ff; 
  color: #409EFF; 
  border-radius: 999px; 
  padding: 2px 8px; 
  font-size: 12px; 
}

.perms-pane { 
  border: 1px solid #e4e7ed; 
  border-radius: 4px; 
  background: #fff; 
  padding: 15px; 
}

.pane-headline { 
  font-weight: 500; 
  margin-bottom: 15px; 
  color: #303133;
  font-size: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.perm-items { 
  display: grid; 
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); 
  gap: 8px; 
  width: 100%; 
}

.perm-item { 
  display: grid; 
  grid-template-columns: 20px 1fr; 
  align-items: flex-start; 
  gap: 10px; 
  padding: 6px; 
  border-radius: 8px; 
  width: 100%; 
  cursor: pointer;
  transition: background 0.2s;
}

.perm-item:hover {
  background: #f9fafb;
}

.perm-item .perm-name { 
  white-space: normal; 
  word-break: normal; 
  overflow-wrap: break-word; 
  line-height: 1.5; 
  font-size: 14px;
  color: #606266;
}

.perm-item input { 
  accent-color: #409EFF; 
  cursor: pointer;
}

.actions { 
  margin-top: 12px; 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.primary { 
  background: #409EFF; 
  color: #fff; 
  border: none; 
  border-radius: 4px; 
  padding: 10px 20px; 
  cursor: pointer;
  font-size: 14px;
  transition: background 0.2s;
}

.primary:hover:not(:disabled) {
  background: #66b1ff;
}

.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-text { 
  color: #f56c6c; 
  font-size: 14px;
}

.hint { 
  color: #909399; 
  font-size: 14px;
}

.permission-hint {
  color: #909399;
  font-size: 12px;
  margin-top: 8px;
  font-style: italic;
}

.no-access-message {
  padding: 40px 20px;
  text-align: center;
  color: #909399;
}

.no-access-message p {
  margin: 10px 0;
  font-size: 14px;
}

/* 弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
}

.dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.dialog-close {
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: #909399;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #f5f7fa;
  color: #303133;
}

.dialog-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #409EFF;
}

.form-input::placeholder {
  color: #c0c4cc;
}

.form-select {
  background-color: #fff;
  cursor: pointer;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e4e7ed;
}

.btn-cancel,
.btn-confirm {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: #fff;
  color: #606266;
  border: 1px solid #dcdfe6;
}

.btn-cancel:hover {
  color: #409EFF;
  border-color: #c6e2ff;
  background-color: #ecf5ff;
}

.btn-confirm {
  background: #409EFF;
  color: #fff;
}

.btn-confirm:hover {
  background: #66b1ff;
}

.btn-confirm:active {
  background: #3a8ee6;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  color: #606266;
  transition: border-color 0.2s;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: #409EFF;
}

.required {
  color: #f56c6c;
}

.dialog-permissions {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  background: #fafafa;
  max-height: 400px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-two-pane {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 12px;
  flex: 1;
  min-height: 0;
}

.dialog-apps-pane {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #f5f7fa;
  padding: 6px;
  overflow-y: auto;
}

.dialog-app-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dialog-app-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.dialog-app-item:hover {
  background: #f5f7fa;
}

.dialog-app-item.active {
  background: #ecf5ff;
  border-color: #409EFF;
  color: #409EFF;
}

.dialog-app-name {
  font-weight: 600;
  font-size: 13px;
}

.dialog-badge {
  background: #ecf5ff;
  color: #409EFF;
  border-radius: 999px;
  padding: 1px 6px;
  font-size: 11px;
}

.dialog-perms-pane {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: #fff;
  padding: 12px;
  overflow-y: auto;
}

.dialog-pane-headline {
  font-weight: 500;
  margin-bottom: 12px;
  color: #303133;
  font-size: 13px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.dialog-perm-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 6px;
  width: 100%;
}

.dialog-perm-item {
  display: grid;
  grid-template-columns: 18px 1fr;
  align-items: flex-start;
  gap: 8px;
  padding: 4px;
  border-radius: 6px;
  width: 100%;
  cursor: pointer;
  transition: background 0.2s;
}

.dialog-perm-item:hover {
  background: #f9fafb;
}

.dialog-perm-item .dialog-perm-name {
  white-space: normal;
  word-break: normal;
  overflow-wrap: break-word;
  line-height: 1.4;
  font-size: 13px;
  color: #606266;
}

.dialog-perm-item input {
  accent-color: #409EFF;
  cursor: pointer;
}

.dialog-perm-hint {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 8px;
  text-align: center;
}

@media (max-width: 720px) {
  .two-pane { 
    grid-template-columns: 1fr; 
  }
  .perm-items { 
    grid-template-columns: 1fr; 
  }
}
</style>
