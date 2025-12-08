<template>
  <div class="login-container">
    <div class="login-card">
      <h1 class="login-title">影像云AI监管平台 (MAGIC)</h1>
      
      <el-form 
        ref="loginForm" 
        :model="loginForm" 
        :rules="rules" 
        class="login-form"
        label-position="left"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
            @keyup.enter.native="handleLogin"
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="login-button-full"
            @click="handleLogin"
            :loading="loading"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="footer">
        <p class="copyright">© INS Lab, Xidian University @ 2025</p>
        <div class="footer-icons">
          <span>&lt;/&gt;</span>
          <span class="heart">❤</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginView',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true
          
          // 构建请求数据
          const requestData = {
            username: this.loginForm.username,
            password: this.loginForm.password
          }
          
          // 调用登录接口
          fetch('/api/v1/token/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
          })
            .then(async response => {
              // 先读取响应文本，以便检查内容类型
              const text = await response.text()
              let data = null
              
              // 尝试解析 JSON
              try {
                data = text ? JSON.parse(text) : null
              } catch (e) {
                // 如果不是 JSON，可能是 HTML 错误页面
                console.error('响应不是有效的 JSON:', text.substring(0, 500))
                console.error('完整响应文本:', text)
                console.error('请求URL:', '/api/v1/token/')
                console.error('代理目标:', 'http://10.198.236.252:8000')
                if (!response.ok) {
                  // 404 错误时，显示更详细的信息
                  if (response.status === 404) {
                    const errorMsg = `API 路径不存在 (404)。\n` +
                      `请检查：\n` +
                      `1. 后端服务是否启动在 http://10.198.236.252:8000\n` +
                      `2. 登录接口路径是否为 /api/v1/token/\n` +
                      `3. 网络是否连通\n` +
                      `4. 如果端口不是8000，请修改 vue.config.js 中的端口号\n` +
                      `响应内容: ${text.substring(0, 200)}`
                    throw new Error(errorMsg)
                  }
                  throw new Error(`服务器返回了非 JSON 格式的错误响应 (${response.status})`)
                }
              }
              
              // 打印响应状态和内容用于调试
              console.log('响应状态:', response.status, response.statusText)
              console.log('响应数据:', data)
              
              if (!response.ok) {
                // 错误响应
                let errorMessage = `登录失败: ${response.status}`
                
                // 401 错误表示认证失败
                if (response.status === 401) {
                  errorMessage = '用户名或密码错误'
                } else if (data) {
                  // 处理不同的错误格式
                  if (typeof data === 'string') {
                    errorMessage = data
                  } else if (data.message) {
                    errorMessage = data.message
                  } else if (data.detail) {
                    errorMessage = data.detail
                  } else if (data.error) {
                    errorMessage = data.error
                  } else if (data.non_field_errors) {
                    // Django REST framework 的格式
                    errorMessage = Array.isArray(data.non_field_errors) 
                      ? data.non_field_errors.join(', ') 
                      : data.non_field_errors
                  } else {
                    // 尝试提取字段错误
                    const fieldErrors = Object.keys(data)
                      .map(key => {
                        const value = data[key]
                        if (Array.isArray(value)) {
                          return `${key}: ${value.join(', ')}`
                        }
                        return `${key}: ${value}`
                      })
                      .join('; ')
                    
                    if (fieldErrors) {
                      errorMessage = fieldErrors
                    }
                  }
                }
                
                console.error('登录失败，错误详情:', data)
                throw new Error(errorMessage)
              }
              
              // 检查响应格式：新格式为 { code, message, data }
              if (data && data.code !== undefined) {
                // 新格式：{ code: 0, message: "success", data: { access, refresh, user } }
                if (data.code === 0 && data.data) {
                  if (data.data.access && data.data.refresh) {
                    // 保存 token
                    this.$store.commit('setTokens', {
                      access: data.data.access,
                      refresh: data.data.refresh
                    })
                    
                    // 从登录响应中提取用户信息和角色
                    const userData = data.data.user || {}
                    // 从 groups 数组中提取角色（通常第一个是主要角色）
                    let userRole = ''
                    if (userData.groups && Array.isArray(userData.groups) && userData.groups.length > 0) {
                      // 使用第一个角色，或者查找匹配的角色
                      userRole = userData.groups[0]
                    } else {
                      // groups 为空，视为超级管理员 superuser，拥有所有权限
                      userRole = 'Superuser'
                    }
                    
                    // 保存用户信息（包括角色）
                    this.$store.commit('setUser', {
                      username: userData.username || this.loginForm.username,
                      institutionType: userData.institution_type || userData.institutionType || '',
                      role: userRole,
                      hospital: userData.hospital || '' // 保存医院编码
                    })
                    
                    console.log('登录成功，Token 已保存')
                    console.log('用户信息:', {
                      username: userData.username || this.loginForm.username,
                      role: userRole,
                      groups: userData.groups
                    })
                    return data
                  } else {
                    throw new Error(data.message || '登录响应中缺少 token 信息')
                  }
                } else {
                  // code 不为 0 表示失败
                  throw new Error('用户名或密码错误')
                }
              } else if (data && data.access && data.refresh) {
                // 兼容旧格式：直接返回 { access, refresh }
                this.$store.commit('setTokens', {
                  access: data.access,
                  refresh: data.refresh
                })
                
                this.$store.commit('setUser', {
                  username: this.loginForm.username,
                  institutionType: 'ADMIN'
                })
                
                console.log('登录成功，Token 已保存')
                return data
              } else {
                throw new Error('登录响应格式不正确')
              }
            })
            .then(() => {
              // 用户信息和角色已经在登录响应中提取并保存，不需要再次获取
              this.loading = false
              this.$message.success('登录成功')
              
              // 根据用户角色决定默认重定向页面
              const userRole = this.$store.getters.role
              let defaultRedirect = '/main/workspace'
              
              // 医院管理员和医院用户默认重定向到预警列表
              if (userRole === 'Hospital Administrator' || userRole === 'Hospital User') {
                defaultRedirect = '/main/warning-base'
              }
              
              // 跳转到主页或之前尝试访问的页面
              const redirect = this.$route.query.redirect || defaultRedirect
              
              // 如果重定向目标是工作台，但用户是医院管理员或医院用户，则重定向到预警列表
              if (redirect === '/main/workspace' && (userRole === 'Hospital Administrator' || userRole === 'Hospital User')) {
                this.$router.push('/main/warning-base')
              } else {
                this.$router.push(redirect)
              }
            })
            .catch(error => {
              this.loading = false
              console.error('登录错误:', error)
              
              // 显示错误信息
              const errorMessage = error.message || '登录失败，请稍后重试'
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
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.login-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin: 0 0 30px 0;
}

.login-form {
  margin-top: 20px;
}

.login-form >>> .el-form-item__label {
  color: #333;
  font-weight: 500;
  padding-right: 12px;
  text-align: justify;
  text-align-last: justify;
  width: 100px !important;
  position: relative;
}

.login-form >>> .el-form-item__content {
  margin-left: 100px !important;
}

.login-form >>> .el-form-item__label::before {
  color: #f56c6c;
  margin-right: 4px;
  position: absolute;
  left: 0;
}

/* 对于有required的字段（有星号），文字部分需要向右偏移，避开星号 */
.login-form >>> .el-form-item.is-required .el-form-item__label {
  padding-left: 12px;
}


.login-form >>> .el-input__inner {
  background-color: #fffef0;
}

.footer {
  margin-top: 40px;
  text-align: center;
}

.copyright {
  color: #909399;
  font-size: 12px;
  margin: 0 0 10px 0;
}

.footer-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.heart {
  color: #f56c6c;
}

.login-button-full {
  width: 100% !important;
  margin-left: 0 !important;
}

.login-form >>> .el-form-item:last-child .el-form-item__content {
  margin-left: 0 !important;
}
</style>


