<template>
  <div class="register-container">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">创建用户</h2>
    </div>
    
    <div class="register-card">
      
      <el-form 
        ref="registerForm" 
        :model="registerForm" 
        :rules="rules" 
        class="register-form"
        label-position="left"
        label-width="120px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请输入密码（至少8位）"
            prefix-icon="el-icon-lock"
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item label="角色组" prop="groupNames">
          <el-select 
            v-model="registerForm.groupNames" 
            placeholder="请选择角色组"
            style="width: 100%"
            multiple
            @change="handleGroupNamesChange"
          >
            <el-option 
              v-for="option in availableGroupOptions" 
              :key="option.value" 
              :label="option.label" 
              :value="option.value"
            ></el-option>
          </el-select>
          <div style="font-size: 12px; color: #909399; margin-top: 5px;">
            <span v-if="currentUserRole === 'System Administrator'">可以创建任何角色的用户</span>
            <span v-else-if="currentUserRole === 'Medical Insurance Administrator'">只能创建医保局管理员或医保局用户</span>
            <span v-else-if="currentUserRole === 'Hospital Administrator'">只能为自己所在的医院创建医院管理员或医院用户</span>
          </div>
        </el-form-item>

        <el-form-item 
          label="医院编码" 
          prop="hospitalCode"
          v-if="needsHospitalCode"
        >
          <el-select 
            v-model="registerForm.hospitalCode" 
            placeholder="请选择医院编码"
            style="width: 100%"
            filterable
            :loading="hospitalLoading"
          >
            <el-option 
              v-for="hospital in availableHospitals" 
              :key="hospital.hospitalCode" 
              :label="`${hospital.hospitalCode} - ${hospital.hospitalName}`" 
              :value="hospital.hospitalCode"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="register-button-full"
            @click="handleRegister"
            :loading="loading"
          >
            创建用户
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { handle401Error } from '@/utils/api'

export default {
  name: 'RegisterView',
  data() {
    const validateHospitalCode = (rule, value, callback) => {
      if (this.needsHospitalCode) {
        if (!value || value.trim() === '') {
          callback(new Error('请选择医院编码'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    }
    
    return {
      registerForm: {
        username: '',
        password: '',
        groupNames: [],
        hospitalCode: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 8, message: '密码长度不能少于8位', trigger: 'blur' }
        ],
        groupNames: [
          { required: true, message: '请选择角色组', trigger: 'change' },
          { type: 'array', min: 1, message: '至少选择一个角色组', trigger: 'change' }
        ],
        hospitalCode: [
          { validator: validateHospitalCode, trigger: 'change' }
        ]
      },
      loading: false,
      hospitalLoading: false,
      availableHospitals: [],
      currentUserRole: '',
      currentUserHospital: null
    }
  },
  computed: {
    // 根据当前用户角色，计算可用的角色组选项
    availableGroupOptions() {
      const role = this.currentUserRole
      
      if (role === 'Superuser') {
        // superuser：后端 groups 为空的超级管理员，只用于创建核心管理员账号
        return [
          { label: '医保局管理员', value: 'Medical Insurance Administrator' },
          { label: '医院管理员', value: 'Hospital Administrator' }
        ]
      } else if (role === 'System Administrator') {
        // 系统管理员可以创建任何角色
        return [
          { label: '系统管理员', value: 'System Administrator' },
          { label: '医保局管理员', value: 'Medical Insurance Administrator' },
          { label: '医保局用户', value: 'Medical Insurance User' },
          { label: '医院管理员', value: 'Hospital Administrator' },
          { label: '医院用户', value: 'Hospital User' }
        ]
      } else if (role === 'Medical Insurance Administrator') {
        // 医保局管理员只能创建医保局管理员或医保局用户
        return [
          { label: '医保局管理员', value: 'Medical Insurance Administrator' },
          { label: '医保局用户', value: 'Medical Insurance User' }
        ]
      } else if (role === 'Hospital Administrator') {
        // 医院管理员只能创建医院管理员或医院用户
        return [
          { label: '医院管理员', value: 'Hospital Administrator' },
          { label: '医院用户', value: 'Hospital User' }
        ]
      }
      
      return []
    },
    // 判断是否需要医院编码
    needsHospitalCode() {
      if (!this.registerForm.groupNames || this.registerForm.groupNames.length === 0) {
        return false
      }
      // 如果选择的角色组中包含医院相关角色，则需要医院编码
      return this.registerForm.groupNames.some(group => 
        group === 'Hospital Administrator' || group === 'Hospital User'
      )
    }
  },
  mounted() {
    // 检查登录状态
    if (!this.$store.getters.isLoggedIn) {
      this.$router.push('/login')
      return
    }
    
    // 获取当前用户角色
    this.currentUserRole = this.$store.getters.role
    
    // 检查权限
    if (this.currentUserRole !== 'Superuser' &&
        this.currentUserRole !== 'System Administrator' && 
        this.currentUserRole !== 'Medical Insurance Administrator' && 
        this.currentUserRole !== 'Hospital Administrator') {
      this.$message.warning('您没有创建用户的权限')
      this.$router.push('/main/workspace')
      return
    }
    
    // 如果是医院管理员，获取当前用户的医院信息
    if (this.currentUserRole === 'Hospital Administrator') {
      this.fetchCurrentUserInfo()
    }
    
    // 如果需要医院编码选项，获取医院列表
    if (this.needsHospitalCode || this.currentUserRole === 'Hospital Administrator') {
      this.fetchHospitals()
    }
  },
  watch: {
    // 监听角色组变化
    'registerForm.groupNames'() {
      // 如果不再需要医院编码，清空医院编码
      if (!this.needsHospitalCode) {
        this.registerForm.hospitalCode = ''
        this.$nextTick(() => {
          if (this.$refs.registerForm) {
            this.$refs.registerForm.clearValidate('hospitalCode')
          }
        })
      } else {
        // 如果是医院管理员，自动设置为当前用户的医院
        if (this.currentUserRole === 'Hospital Administrator' && this.currentUserHospital) {
          this.registerForm.hospitalCode = this.currentUserHospital
        }
      }
    }
  },
  methods: {
    // 格式化错误消息为中文
    formatErrorMessage(errorMessage) {
      if (!errorMessage) return errorMessage
      
      // 用户名已存在的错误
      if (errorMessage.includes('A user with that username already exists') || 
          errorMessage.includes('username') && errorMessage.includes('already exists')) {
        return '该用户名已存在，请使用其他用户名'
      }
      
      // 处理字段错误格式：username: A user with that username already exists.
      if (errorMessage.includes('username:')) {
        const usernameError = errorMessage.match(/username:\s*(.+)/i)
        if (usernameError && usernameError[1]) {
          const errorText = usernameError[1].trim()
          if (errorText.includes('already exists') || errorText.includes('A user with that username')) {
            return '该用户名已存在，请使用其他用户名'
          }
        }
      }
      
      return errorMessage
    },
    // 获取当前用户信息（用于医院管理员获取自己的医院编码）
    async fetchCurrentUserInfo() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        return
      }
      
      try {
        const response = await fetch('/api/v1/users/me/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.status === 401) {
          const refreshSuccess = await handle401Error(this.$store, this.$router, false)
          if (!refreshSuccess) {
            return
          }
          const newToken = this.$store.getters.accessToken
          const retryResponse = await fetch('/api/v1/users/me/', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (retryResponse.ok) {
            const text = await retryResponse.text()
            const data = text ? JSON.parse(text) : null
            if (data && data.hospital) {
              this.currentUserHospital = data.hospital
            }
          }
        } else if (response.ok) {
          const text = await response.text()
          const data = text ? JSON.parse(text) : null
          if (data && data.hospital) {
            this.currentUserHospital = data.hospital
            // 如果已经选择了医院角色，自动设置医院编码
            if (this.needsHospitalCode && !this.registerForm.hospitalCode) {
              this.registerForm.hospitalCode = data.hospital
            }
          }
        }
      } catch (error) {
        console.error('获取当前用户信息失败:', error)
      }
    },
    // 获取医院列表
    async fetchHospitals() {
      const accessToken = this.$store.getters.accessToken
      if (!accessToken) {
        return
      }
      
      this.hospitalLoading = true
      
      try {
        // 如果是医院管理员，只显示自己所在的医院
        if (this.currentUserRole === 'Hospital Administrator') {
          await this.fetchCurrentUserInfo()
          if (this.currentUserHospital) {
            // 只获取当前用户的医院
            const response = await fetch(`/api/v1/hospitals/?hospital_code=${this.currentUserHospital}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.status === 401) {
              const refreshSuccess = await handle401Error(this.$store, this.$router, false)
              if (!refreshSuccess) {
                this.hospitalLoading = false
                return
              }
              const newToken = this.$store.getters.accessToken
              const retryResponse = await fetch(`/api/v1/hospitals/?hospital_code=${this.currentUserHospital}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (retryResponse.ok) {
                const text = await retryResponse.text()
                const data = text ? JSON.parse(text) : null
                if (data && data.code === 0 && data.data && data.data.results) {
                  this.availableHospitals = data.data.results.map(item => ({
                    hospitalCode: item.hospital_code || item.hospitalCode,
                    hospitalName: item.hospital_name || item.hospitalName
                  }))
                }
              }
            } else if (response.ok) {
              const text = await response.text()
              const data = text ? JSON.parse(text) : null
              if (data && data.code === 0 && data.data && data.data.results) {
                this.availableHospitals = data.data.results.map(item => ({
                  hospitalCode: item.hospital_code || item.hospitalCode,
                  hospitalName: item.hospital_name || item.hospitalName
                }))
              }
            }
          }
        } else {
          // 系统管理员和医保局管理员可以查看所有医院
          let allHospitals = []
          let page = 1
          let hasNext = true
          const pageSize = 100
          
          while (hasNext) {
            const params = new URLSearchParams({
              page: page,
              page_size: pageSize
            })
            
            let response = await fetch(`/api/v1/hospitals/?${params.toString()}`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            })
            
            if (response.status === 401) {
              const refreshSuccess = await handle401Error(this.$store, this.$router, false)
              if (!refreshSuccess) {
                break
              }
              const newToken = this.$store.getters.accessToken
              response = await fetch(`/api/v1/hospitals/?${params.toString()}`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${newToken}`,
                  'Content-Type': 'application/json'
                }
              })
            }
            
            if (!response.ok) {
              break
            }
            
            const text = await response.text()
            let data = null
            
            try {
              data = text ? JSON.parse(text) : null
            } catch (e) {
              break
            }
            
            if (data && data.code === 0 && data.data && data.data.results) {
              const pageHospitals = data.data.results.map(item => ({
                hospitalCode: item.hospital_code || item.hospitalCode,
                hospitalName: item.hospital_name || item.hospitalName
              }))
              allHospitals = allHospitals.concat(pageHospitals)
              hasNext = !!data.data.next
              page++
            } else {
              hasNext = false
            }
          }
          
          this.availableHospitals = allHospitals
        }
      } catch (error) {
        console.error('获取医院列表失败:', error)
      } finally {
        this.hospitalLoading = false
      }
    },
    // 角色组变化处理
    handleGroupNamesChange() {
      // 如果选择了医院角色，需要获取医院列表
      if (this.needsHospitalCode && this.availableHospitals.length === 0) {
        this.fetchHospitals()
      }
      
      // 如果是医院管理员，自动设置医院编码
      if (this.currentUserRole === 'Hospital Administrator' && this.currentUserHospital) {
        this.registerForm.hospitalCode = this.currentUserHospital
      }
    },
    handleRegister() {
      this.$refs.registerForm.validate((valid) => {
        if (valid) {
          // 构建请求数据
          const requestData = {
            username: this.registerForm.username,
            password: this.registerForm.password,
            group_names: this.registerForm.groupNames
          }
          
          // 如果选择了医院角色，添加医院编码
          if (this.needsHospitalCode) {
            if (!this.registerForm.hospitalCode || this.registerForm.hospitalCode.trim() === '') {
              this.$message.error('请选择医院编码')
              return false
            }
            requestData.hospital_code = this.registerForm.hospitalCode
          }
          
          // 获取认证token
          const accessToken = this.$store.getters.accessToken
          if (!accessToken) {
            this.$message.error('未登录，请先登录')
            this.$router.push('/login')
            return
          }
          
          this.loading = true
          
          console.log('创建用户请求数据:', requestData)
          
          // 调用创建用户接口
          fetch('/api/v1/register/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify(requestData)
          })
            .then(async response => {
              const text = await response.text()
              let data = null
              
              try {
                data = text ? JSON.parse(text) : null
              } catch (e) {
                console.error('响应不是有效的 JSON:', text.substring(0, 200))
                if (!response.ok) {
                  throw new Error(`服务器返回了非 JSON 格式的错误响应 (${response.status})`)
                }
              }
              
              console.log('响应状态:', response.status, response.statusText)
              console.log('响应数据:', data)
              
              if (!response.ok) {
                let errorMessage = `创建用户失败: ${response.status}`
                
                if (data) {
                  if (data.code !== undefined && data.code !== 0) {
                    errorMessage = data.message || errorMessage
                  } else if (data.detail) {
                    errorMessage = data.detail
                  } else if (data.message) {
                    errorMessage = data.message
                  } else if (data.error) {
                    errorMessage = data.error
                  } else if (data.non_field_errors) {
                    errorMessage = Array.isArray(data.non_field_errors) 
                      ? data.non_field_errors.join(', ') 
                      : data.non_field_errors
                  } else {
                    const fieldErrors = Object.keys(data)
                      .map(key => {
                        const value = data[key]
                        if (Array.isArray(value)) {
                          // 处理数组形式的错误，如 username: ["A user with that username already exists."]
                          const translatedErrors = value.map(err => {
                            if (err.includes('A user with that username already exists') || 
                                err.includes('already exists')) {
                              return '该用户名已存在，请使用其他用户名'
                            }
                            return err
                          })
                          return `${key}: ${translatedErrors.join(', ')}`
                        }
                        // 处理字符串形式的错误
                        if (typeof value === 'string' && 
                            (value.includes('A user with that username already exists') || 
                             value.includes('already exists'))) {
                          return `${key}: 该用户名已存在，请使用其他用户名`
                        }
                        return `${key}: ${value}`
                      })
                      .join('; ')
                    
                    if (fieldErrors) {
                      errorMessage = fieldErrors
                    }
                  }
                }
                
                // 格式化错误消息为中文
                errorMessage = this.formatErrorMessage(errorMessage)
                
                console.error('创建用户失败，错误详情:', data)
                throw new Error(errorMessage)
              }
              
              // 处理统一响应格式
              if (data && data.code === 0) {
                console.log('创建用户成功，返回数据:', data.data)
                this.loading = false
                this.$message.success('创建用户成功')
                // 清空表单
                this.registerForm = {
                  username: '',
                  password: '',
                  groupNames: [],
                  hospitalCode: ''
                }
                this.$refs.registerForm.resetFields()
              } else {
                throw new Error(data?.message || '创建用户失败')
              }
            })
            .catch(error => {
              this.loading = false
              console.error('创建用户错误:', error)
              
              let errorMessage = error.message || '创建用户失败，请稍后重试'
              // 格式化错误消息为中文
              errorMessage = this.formatErrorMessage(errorMessage)
              this.$message.error(errorMessage)
            })
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style scoped>
.register-container {
  padding: 20px;
  background-color: #fff;
  min-height: 100%;
}

.register-card {
  background-color: #ffffff;
  border-radius: 4px;
  padding: 40px;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 标题区域 */
.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.title-bar {
  width: 4px;
  height: 24px;
  background-color: #409EFF;
  margin-right: 12px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.register-form {
  margin-top: 20px;
}

.register-form >>> .el-form-item__label {
  color: #333;
  font-weight: 500;
  padding-right: 12px;
  text-align: justify;
  text-align-last: justify;
  width: 120px !important;
  position: relative;
}

.register-form >>> .el-form-item__content {
  margin-left: 120px !important;
}

.register-form >>> .el-form-item__label::before {
  color: #f56c6c;
  position: absolute;
  left: 0;
  top: 0;
  line-height: inherit;
  width: 12px;
  text-align: left;
}

.register-form >>> .el-form-item.is-required .el-form-item__label {
  padding-left: 12px;
  text-indent: 0;
}

.register-form >>> .el-input__inner {
  background-color: #fffef0;
}

.register-form >>> .el-select .el-input__inner {
  background-color: #f5f7fa;
  color: #909399;
}

.register-form >>> .el-select .el-input.is-focus .el-input__inner {
  background-color: #fffef0;
  color: #333;
}

.register-button-full {
  width: 100% !important;
  margin-left: 0 !important;
}

.register-form >>> .el-form-item:last-child .el-form-item__content {
  margin-left: 0 !important;
}
</style>
