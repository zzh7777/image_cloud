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
        <el-form-item label="类型" prop="institutionType">
          <el-select 
            v-model="loginForm.institutionType" 
            placeholder="请选择类型"
            style="width: 100%"
          >
            <el-option label="系统管理员" value="system_admin"></el-option>
            <el-option label="普通用户" value="normal_user"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="账号" prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="请输入用户名"
            prefix-icon="el-icon-user"
          ></el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            prefix-icon="el-icon-lock"
            show-password
          ></el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="verifyCode" class="verify-code-form-item">
          <div class="verify-code-row">
            <div class="verify-code-input-wrapper">
              <el-input 
                v-model="loginForm.verifyCode" 
                placeholder="请输入验证码"
                prefix-icon="el-icon-picture"
                class="verify-code-input"
                maxlength="4"
                @keyup.enter.native="handleLogin"
                @blur="validateVerifyCodeField"
                @input="handleVerifyCodeInput"
              ></el-input>
            </div>
            <div class="verify-code-image-wrapper">
              <VerifyCode 
                ref="verifyCode"
                @update:code="handleCodeUpdate"
              />
            </div>
          </div>
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

      <div class="divider">
        <span class="divider-text">或</span>
      </div>

      <div class="footer-links">
        <span>还没有账号？</span>
        <el-button type="text" @click="goToRegister" style="padding: 0; color: #409EFF;">
          立即注册
        </el-button>
      </div>

      <el-button 
        type="info" 
        plain 
        style="width: 100%; margin-top: 20px"
        disabled
      >
        使用统一登录 (敬请期待, 尚在开发中)
      </el-button>

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
import VerifyCode from '../components/VerifyCode.vue'

export default {
  name: 'LoginView',
  components: {
    VerifyCode
  },
  data() {
    const validateVerifyCode = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入验证码'))
      } else if (value.length < 4) {
        // 输入少于4个字符时不验证，不显示错误
        callback()
      } else if (this.currentCode && value.toUpperCase() !== this.currentCode.toUpperCase()) {
        callback(new Error('验证码错误'))
      } else {
        callback()
      }
    }
    
    return {
      loginForm: {
        institutionType: 'system_admin',
        username: 'admin',
        password: '',
        verifyCode: ''
      },
      currentCode: '',
      rules: {
        institutionType: [
          { required: true, message: '请选择机构类型', trigger: 'change' }
        ],
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        verifyCode: [
          { required: true, message: '请输入验证码', trigger: 'blur' },
          { validator: validateVerifyCode, trigger: ['blur', 'change', 'input'] }
        ]
      },
      loading: false
    }
  },
  methods: {
    handleCodeUpdate(code) {
      this.currentCode = code
      // 清除验证码输入框的验证状态
      this.$nextTick(() => {
        this.$refs.loginForm.clearValidate('verifyCode')
      })
    },
    handleVerifyCodeInput(value) {
      // 当输入达到4个字符时，自动触发验证
      if (value && value.length === 4) {
        this.$nextTick(() => {
          this.$refs.loginForm.validateField('verifyCode', () => {
            // 如果验证码错误，刷新验证码并清空输入
            if (this.currentCode && value.toUpperCase() !== this.currentCode.toUpperCase()) {
              this.$nextTick(() => {
                this.$refs.verifyCode.refreshCode()
                this.loginForm.verifyCode = ''
              })
            }
          })
        })
      } else if (value && value.length < 4) {
        // 输入少于4个字符时，清除之前的验证错误
        this.$refs.loginForm.clearValidate('verifyCode')
      }
    },
    validateVerifyCodeField() {
      // 手动触发验证码字段的验证
      this.$refs.loginForm.validateField('verifyCode', () => {
        // 检查验证码是否错误
        if (this.loginForm.verifyCode && 
            this.currentCode && 
            this.loginForm.verifyCode.toUpperCase() !== this.currentCode.toUpperCase()) {
          // 验证码错误时刷新验证码并清空输入
          this.$nextTick(() => {
            this.$refs.verifyCode.refreshCode()
            this.loginForm.verifyCode = ''
          })
        }
      })
    },
    handleLogin() {
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          // 再次验证验证码（双重验证）
          if (!this.currentCode || this.loginForm.verifyCode.toUpperCase() !== this.currentCode.toUpperCase()) {
            // 设置验证错误，显示错误提示
            this.$refs.loginForm.validateField('verifyCode', () => {
              // 验证码错误时刷新验证码并清空输入
              this.$nextTick(() => {
                this.$refs.verifyCode.refreshCode()
                this.loginForm.verifyCode = ''
              })
            })
            return false
          }
          
          this.loading = true
          // 模拟登录请求
          setTimeout(() => {
            // 保存用户信息到store
            this.$store.commit('setUser', {
              username: this.loginForm.username,
              institutionType: this.loginForm.institutionType
            })
            this.loading = false
            // 跳转到主页
            this.$router.push('/')
            this.$message.success('登录成功')
          }, 1000)
        } else {
          // 如果验证码字段有错误，刷新验证码
          const verifyCodeField = this.$refs.loginForm.fields.find(field => field.prop === 'verifyCode')
          if (verifyCodeField && verifyCodeField.validateMessage) {
            this.$refs.verifyCode.refreshCode()
            this.loginForm.verifyCode = ''
          }
          return false
        }
      })
    },
    goToRegister() {
      this.$router.push('/register')
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

/* 对于没有星号的标签（如"类型"），文字两端对齐 */
.login-form >>> .el-form-item[prop="institutionType"] .el-form-item__label {
  padding-left: 0;
}

/* 对于验证码字段，文字保持原样，不两端对齐 */
.login-form >>> .el-form-item[prop="verifyCode"] .el-form-item__label {
  text-align: left;
  text-align-last: left;
}

.login-form >>> .el-input__inner {
  background-color: #fffef0;
}

.login-form >>> .el-select .el-input__inner {
  background-color: #f5f7fa;
  color: #909399;
}

.login-form >>> .el-select .el-input.is-focus .el-input__inner {
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

.footer-links {
  text-align: center;
  margin-top: 20px;
  color: #909399;
  font-size: 14px;
}

.login-button-full {
  width: 100% !important;
  margin-left: 0 !important;
}

.login-form >>> .el-form-item:last-child .el-form-item__content {
  margin-left: 0 !important;
}

.verify-code-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}

.verify-code-input {
  flex: 1;
}

.verify-code-image-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.verify-code-image-wrapper >>> .verify-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.verify-code-image-wrapper >>> .verify-code-actions {
  margin-top: 4px;
}

/* 调整验证码错误提示位置，使其显示在输入框下方 */
.verify-code-input-wrapper {
  flex: 1;
  position: relative;
}

.login-form >>> .verify-code-form-item .el-form-item__content {
  position: relative;
}

.login-form >>> .verify-code-form-item .verify-code-row {
  position: relative;
}

.login-form >>> .verify-code-form-item .el-form-item__error {
  padding-top: 2px;
  margin-top: 0;
  margin-bottom: 0;
  line-height: 1.2;
  position: absolute;
  left: 0;
  top: 42px;
  width: auto;
  z-index: 1;
  font-size: 12px;
}

.login-form >>> .verify-code-form-item .verify-code-input-wrapper .el-input {
  margin-bottom: 0;
}

.login-form >>> .verify-code-form-item .verify-code-input-wrapper {
  margin-bottom: 0;
}

.login-form >>> .verify-code-form-item {
  margin-bottom: 18px;
}
</style>


