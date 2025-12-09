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
              <div class="col-actions">动作</div>
            </div>
            <div 
              :class="['role-row', {active: g.id === activeGroupId}]" 
              v-for="g in groupsSorted" 
              :key="g.id"
            >
              <button 
                :class="['role-name', {active: g.id === activeGroupId}]" 
                @click="selectGroup(g.id)" 
                :title="'选择 '+(g.name||'角色')"
              >
                {{ g.name }}
              </button>
              <div class="role-type">
                {{ g.role_type === 'medical_insurance' ? '医保' : g.role_type === 'hospital' ? '医院' : '-' }}
              </div>
              <div class="row-actions">
                <button class="icon-btn" @click.stop="editGroup(g)" title="编辑" aria-label="编辑">
                  <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                  </svg>
                </button>
                <button class="icon-btn danger" @click.stop="deleteGroup(g)" title="删除" aria-label="删除">
                  <svg class="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/>
                    <path d="M14 11v6"/>
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="role-row add">
              <button class="add-btn" @click="addGroup" title="添加角色">添加角色</button>
            </div>
          </div>

          <div class="perm-box" v-if="activeGroupId">
            <div class="perm-head">
              <div class="perm-title">权限清单</div>
            </div>
            <div class="two-pane">
              <aside class="apps-pane">
                <ul class="app-list">
                  <li v-for="app in appKeysSorted" :key="app">
                    <button 
                      :class="['app-item', {active: app===activeApp}]" 
                      @click="activeApp = app"
                    >
                      <span class="app-name">{{ appDisplayName(app) }}</span>
                      <span class="badge">{{ (groupedPermissions[app]||[]).length }}</span>
                    </button>
                  </li>
                </ul>
              </aside>
              <section class="perms-pane">
                <div class="pane-headline">{{ activeApp ? appDisplayName(activeApp) : '请选择左侧分类' }}</div>
                <div class="perm-items">
                  <label 
                    class="perm-item" 
                    v-for="p in (groupedPermissions[activeApp]||[])" 
                    :key="p.id"
                  >
                    <input 
                      type="checkbox" 
                      :checked="isChecked(p.id)" 
                      @change="togglePerm(p.id, $event)" 
                    />
                    <span class="perm-name">{{ p.display_name || p.name || p.codename }}</span>
                  </label>
                </div>
              </section>
            </div>
          </div>

          <div class="actions" v-if="activeGroupId || status || !activeGroupId">
            <button 
              v-if="activeGroupId" 
              class="primary" 
              @click="confirmAndSave" 
              :disabled="saving"
            >
              {{ saving ? '更新中…' : '更新' }}
            </button>
            <div class="error-text" v-if="status" role="alert">{{ status }}</div>
            <div class="hint" v-if="!activeGroupId">请选择角色以配置权限</div>
            <div class="permission-hint" v-if="activeGroupId && groupPerms.length === 0">
              不选择权限默认只有查看权限
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
            <label class="form-label">角色名称</label>
            <input 
              type="text" 
              class="form-input" 
              v-model="dialogName" 
              placeholder="请输入角色名称"
              @keyup.enter="confirmRoleDialog"
            />
          </div>
          <div class="form-item">
            <label class="form-label">角色类型</label>
            <select class="form-select" v-model="dialogRoleType">
              <option value="medical_insurance">医保</option>
              <option value="hospital">医院</option>
            </select>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="closeRoleDialog">取消</button>
          <button class="btn-confirm" @click="confirmRoleDialog">确认</button>
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
        knowledge_base: '知识库管理',
        rule_base: '规则库管理',
        database: '数据库管理',
        model: '模型管理',
        task: '任务管理',
        warning: '预警管理'
      }
      return appDisplayMap[app] || app
    },
    // 加载所有数据
    loadAll() {
      this.loading = true
      this.status = ''
      
      // 模拟数据（纯静态页面）
      this.loadMockData()
      
      this.loading = false
    },
    // 加载模拟数据
    loadMockData() {
      // 系统管理员可以看到所有权限
      const medicalPerms = this.getMedicalInsurancePermissions().map(p => ({
        ...p,
        permission_type: 'medical_insurance'
      }))
      const hospitalPerms = this.getHospitalPermissions().map(p => ({
        ...p,
        permission_type: 'hospital'
      }))
      // 为医院权限重新分配ID，避免与医保权限ID冲突
      const hospitalPermsWithNewId = hospitalPerms.map((p, index) => ({
        ...p,
        id: medicalPerms.length + index + 1
      }))
      this.permissions = [...medicalPerms, ...hospitalPermsWithNewId]
      
      // 模拟角色数据
      this.groups = [
        { id: 1, name: '能增加知识库的医保人员', role_type: 'medical_insurance', permission_ids: [] },
        { id: 2, name: '能管理规则的医保人员', role_type: 'medical_insurance', permission_ids: [] },
        { id: 3, name: '医院复核人员', role_type: 'hospital', permission_ids: [] }
      ]
    },
    // 获取医保管理员可管理的权限
    getMedicalInsurancePermissions() {
      return [
        // 知识库管理
        { id: 1, app_label: 'knowledge_base', codename: 'knowledge_base.add', name: '增加', display_name: '知识库-增加' },
        { id: 2, app_label: 'knowledge_base', codename: 'knowledge_base.delete', name: '删除', display_name: '知识库-删除' },
        
        // 规则库管理
        { id: 3, app_label: 'rule_base', codename: 'rule_base.add', name: '增加', display_name: '规则库-增加' },
        { id: 4, app_label: 'rule_base', codename: 'rule_base.delete', name: '删除', display_name: '规则库-删除' },
        { id: 5, app_label: 'rule_base', codename: 'rule_base.edit', name: '编辑', display_name: '规则库-编辑' },
        { id: 6, app_label: 'rule_base', codename: 'rule_base.toggle', name: '启用/停用', display_name: '规则库-启用/停用' },
        
        // 数据库管理
        { id: 7, app_label: 'database', codename: 'database.add', name: '增加', display_name: '数据库-增加' },
        { id: 8, app_label: 'database', codename: 'database.delete', name: '删除', display_name: '数据库-删除' },
        { id: 9, app_label: 'database', codename: 'database.edit', name: '编辑', display_name: '数据库-编辑' },
        
        // 模型管理
        { id: 10, app_label: 'model', codename: 'model.add', name: '增加', display_name: '模型-增加' },
        { id: 11, app_label: 'model', codename: 'model.delete', name: '删除', display_name: '模型-删除' },
        { id: 12, app_label: 'model', codename: 'model.edit', name: '编辑', display_name: '模型-编辑' },
        { id: 13, app_label: 'model', codename: 'model.toggle', name: '启用/禁用', display_name: '模型-启用/禁用' },
        
        // 任务管理
        { id: 14, app_label: 'task', codename: 'task.start_stop', name: '启动/停止任务', display_name: '任务-启动/停止任务' },
        { id: 15, app_label: 'task', codename: 'task.add', name: '增加', display_name: '任务-增加' },
        { id: 16, app_label: 'task', codename: 'task.delete', name: '删除', display_name: '任务-删除' },
        
        // 预警管理
        { id: 17, app_label: 'warning', codename: 'warning.initial_review', name: '初审', display_name: '预警-初审' },
        { id: 18, app_label: 'warning', codename: 'warning.final_review', name: '终审', display_name: '预警-终审' }
      ]
    },
    // 获取医院管理员可管理的权限
    getHospitalPermissions() {
      return [
        // 预警管理
        { id: 1, app_label: 'warning', codename: 'warning.hospital_review', name: '复核', display_name: '预警-复核' }
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
      this.editingGroup = null
      this.showRoleDialog = true
    },
    // 编辑角色
    editGroup(g) {
      this.dialogMode = 'edit'
      this.dialogName = g.name || ''
      this.dialogRoleType = g.role_type || 'medical_insurance'
      this.editingGroup = g
      this.showRoleDialog = true
    },
    // 关闭角色弹窗
    closeRoleDialog() {
      this.showRoleDialog = false
      this.dialogName = ''
      this.dialogRoleType = 'medical_insurance'
      this.editingGroup = null
    },
    // 确认角色弹窗
    confirmRoleDialog() {
      if (!this.dialogName || !this.dialogName.trim()) {
        alert('请输入角色名称')
        return
      }
      
      this.status = ''
      
      if (this.dialogMode === 'add') {
        // 添加新角色
        const newId = this.groups.length > 0 ? Math.max(...this.groups.map(g => g.id)) + 1 : 1
        this.groups.push({
          id: newId,
          name: this.dialogName.trim(),
          role_type: this.dialogRoleType,
          permission_ids: []
        })
        this.activeGroupId = newId
        this.onRoleChanged()
      } else if (this.dialogMode === 'edit' && this.editingGroup) {
        // 编辑现有角色
        const oldRoleType = this.editingGroup.role_type
        this.editingGroup.name = this.dialogName.trim()
        this.editingGroup.role_type = this.dialogRoleType
        
        // 如果角色类型改变，清空权限
        if (oldRoleType !== this.dialogRoleType) {
          this.editingGroup.permission_ids = []
          if (this.activeGroupId === this.editingGroup.id) {
            this.groupPerms = []
            this.originalPerms = []
            this.onRoleChanged()
          }
        }
      }
      
      this.closeRoleDialog()
    },
    // 删除角色
    deleteGroup(g) {
      const ok = window.confirm('确认删除该角色？')
      if (!ok) return
      this.status = ''
      
      // 模拟删除
      this.groups = this.groups.filter(x => x.id !== g.id)
      if (this.activeGroupId === g.id) {
        this.activeGroupId = null
        this.groupPerms = []
        this.originalPerms = []
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
    // 确认并保存
    confirmAndSave() {
      if (this.saving) return
      
      // 如果没有更改，也允许保存（可能是清空所有权限）
      const hasChanges = this.isDirty
      const noPermissions = this.groupPerms.length === 0
      
      let confirmMessage = '确认要更新该角色的权限配置吗？'
      if (noPermissions && hasChanges) {
        confirmMessage = '确认要清空该角色的所有权限吗？不选择权限默认只有查看权限。'
      } else if (noPermissions && !hasChanges) {
        confirmMessage = '当前未选择任何权限，确认保存吗？不选择权限默认只有查看权限。'
      }
      
      const ok = window.confirm(confirmMessage)
      if (!ok) return
      this.status = ''
      
      // 模拟保存
      this.saving = true
      setTimeout(() => {
        const g = this.groups.find(x => x.id === this.activeGroupId)
        if (g) {
          g.permission_ids = [...this.groupPerms]
        }
        this.originalPerms = [...this.groupPerms]
        this.saving = false
        if (this.$message) {
          this.$message.success('权限更新成功')
        } else {
          alert('权限更新成功')
        }
      }, 500)
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
  grid-template-columns: 1fr auto auto; 
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
  max-width: 500px;
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

@media (max-width: 720px) {
  .two-pane { 
    grid-template-columns: 1fr; 
  }
  .perm-items { 
    grid-template-columns: 1fr; 
  }
}
</style>
