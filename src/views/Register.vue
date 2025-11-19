<template>
  <div class="register-container">
    <div class="register-card">
      <h1 class="register-title">影像云AI监管平台 (MAGIC)</h1>
      <p class="register-subtitle">注册新账号</p>
      
      <el-form 
        ref="registerForm" 
        :model="registerForm" 
        :rules="rules" 
        class="register-form"
        label-position="left"
        label-width="100px"
      >
        <el-form-item label="机构类型" prop="institutionType">
          <el-select 
            v-model="registerForm.institutionType" 
            placeholder="请选择机构类型"
            style="width: 100%"
          >
            <el-option label="系统管理员" value="system_admin"></el-option>
            <el-option label="普通用户" value="normal_user"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="registerForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>

        <el-form-item label="邮箱" prop="email">
          <el-input 
            v-model="registerForm.email" 
            placeholder="请输入邮箱"
            prefix-icon="el-icon-message"
          ></el-input>
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input 
            v-model="registerForm.phone" 
            placeholder="请输入手机号"
            prefix-icon="el-icon-phone"
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

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            v-model="registerForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入密码"
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
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    return {
      registerForm: {
        institutionType: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
      },
      rules: {
        institutionType: [
          { required: true, message: '请选择机构类型', trigger: 'change' }
        ],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
        ],
        email: [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请再次输入密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  methods: {
    handleRegister() {
      this.$refs.registerForm.validate((valid) => {
        if (valid) {
          this.loading = true
          // 模拟注册请求
          setTimeout(() => {
            this.loading = false
            this.$message.success('注册成功，请登录')
            // 跳转到登录页面
            this.$router.push('/login')
          }, 1000)
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
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.register-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  text-align: center;
  margin: 0 0 10px 0;
}

.register-subtitle {
  font-size: 16px;
  color: #909399;
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
  margin-right: 4px;
  position: absolute;
  left: 0;
}

/* 对于有required的字段（有星号），文字部分需要向右偏移，避开星号 */
.register-form >>> .el-form-item.is-required .el-form-item__label {
  padding-left: 12px;
}

/* 对于没有星号的标签（如"机构类型"），文字两端对齐 */
.register-form >>> .el-form-item[prop="institutionType"] .el-form-item__label {
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

