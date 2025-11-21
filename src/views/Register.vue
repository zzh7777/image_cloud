<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="register-title">影像云AI监管平台 (MAGIC)</h1>
      
      <el-form 
        ref="registerForm" 
        :model="registerForm" 
        :rules="rules" 
        class="register-form"
        label-position="left"
        label-width="100px"
      >
        <el-form-item label="角色" prop="role">
          <el-select 
            v-model="registerForm.role" 
            placeholder="请选择角色"
            style="width: 100%"
          >
            <el-option label="ADMIN" value="ADMIN"></el-option>
            <el-option label="HOSPITAL" value="HOSPITAL"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>

        <el-form-item 
          label="医院代码" 
          prop="hospitalCode"
          v-if="registerForm.role === 'HOSPITAL'"
        >
          <el-input 
            v-model="registerForm.hospitalCode" 
            placeholder="请输入医院代码"
            prefix-icon="el-icon-office-building"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="registerForm.password" 
            type="password" 
            placeholder="请输入密码（至少6位）"
            prefix-icon="el-icon-lock"
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            class="register-button-full"
            @click="handleRegister"
            :loading="loading"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="divider">
        <span class="divider-text">或</span>
      </div>

      <div class="footer-links">
        <span>已有账号？</span>
        <el-button type="text" @click="goToLogin" style="padding: 0; color: #409EFF;">
          立即登录
        </el-button>
      </div>

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
  name: 'RegisterView',
  data() {
    const validateHospitalCode = (rule, value, callback) => {
      // 只有当角色为 HOSPITAL 时才验证
      if (this.registerForm.role === 'HOSPITAL') {
        if (!value || value.trim() === '') {
          callback(new Error('请输入医院代码'))
        } else {
          callback()
        }
      } else {
        callback()
      }
    }
    
    return {
      registerForm: {
        role: '',
        username: '',
        hospitalCode: '',
        password: ''
      },
      rules: {
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
        ],
        hospitalCode: [
          { required: true, message: '请输入医院代码', trigger: 'blur' },
          { validator: validateHospitalCode, trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  watch: {
    // 监听角色变化，清空医院代码并清除验证状态
    'registerForm.role'() {
      if (this.registerForm.role !== 'HOSPITAL') {
        this.registerForm.hospitalCode = ''
      }
      this.$nextTick(() => {
        if (this.$refs.registerForm) {
          this.$refs.registerForm.clearValidate('hospitalCode')
        }
      })
    }
  },
  methods: {
    handleRegister() {
      this.$refs.registerForm.validate((valid) => {
        if (valid) {
          // 构建请求数据
          const requestData = {
            username: this.registerForm.username,
            password: this.registerForm.password,
            role: this.registerForm.role
          }
          
          // 当 role 为 HOSPITAL 时，添加 hospital_code
          if (this.registerForm.role === 'HOSPITAL') {
            if (!this.registerForm.hospitalCode || this.registerForm.hospitalCode.trim() === '') {
              this.$message.error('请填写医院代码')
              return false
            }
            requestData.hospital_code = this.registerForm.hospitalCode
          }
          
          this.loading = true
          
          // 调试：打印请求数据
          console.log('注册请求数据:', requestData)
          
          // 调用注册接口
          fetch('/api/v1/register/', {
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
                console.error('响应不是有效的 JSON:', text.substring(0, 200))
                if (!response.ok) {
                  throw new Error(`服务器返回了非 JSON 格式的错误响应 (${response.status})`)
                }
              }
              
              // 打印响应状态和内容用于调试
              console.log('响应状态:', response.status, response.statusText)
              console.log('响应数据:', data)
              
              if (!response.ok) {
                // 错误响应
                let errorMessage = `注册失败: ${response.status}`
                
                if (data) {
                  // 处理不同的错误格式
                  if (typeof data === 'string') {
                    errorMessage = data
                  } else if (data.detail) {
                    errorMessage = data.detail
                  } else if (data.message) {
                    errorMessage = data.message
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
                
                console.error('注册失败，错误详情:', data)
                throw new Error(errorMessage)
              }
              
              // 成功响应
              console.log('注册成功，返回数据:', data)
              return data
            })
            .then(() => {
              this.loading = false
              this.$message.success('注册成功，请登录')
              // 跳转到登录页面
              this.$router.push('/login')
            })
            .catch(error => {
              this.loading = false
              console.error('注册错误:', error)
              
              // 显示错误信息
              const errorMessage = error.message || '注册失败，请稍后重试'
              this.$message.error(errorMessage)
            })
        } else {
          return false
        }
      })
    },
    goToLogin() {
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.register-card {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.register-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin: 0 0 30px 0;
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
  width: 100px !important;
  position: relative;
}

.register-form >>> .el-form-item__content {
  margin-left: 100px !important;
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

/* 对于有required的字段（有星号），文字部分需要向右偏移，避开星号 */
.register-form >>> .el-form-item.is-required .el-form-item__label {
  padding-left: 12px;
  text-indent: 0;
}

/* 确保必填字段的文字对齐区域从 padding-left 之后开始 */
.register-form >>> .el-form-item.is-required .el-form-item__label {
  display: block;
}

/* 对于没有星号的标签（如"角色"），文字两端对齐 */
.register-form >>> .el-form-item[prop="role"] .el-form-item__label {
  padding-left: 0;
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

.divider {
  position: relative;
  text-align: center;
  margin: 30px 0;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background-color: #e4e7ed;
}

.divider-text {
  position: relative;
  background-color: #ffffff;
  padding: 0 15px;
  color: #909399;
}

.footer-links {
  text-align: center;
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
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

.register-button-full {
  width: 100% !important;
  margin-left: 0 !important;
}

.register-form >>> .el-form-item:last-child .el-form-item__content {
  margin-left: 0 !important;
}
</style>

