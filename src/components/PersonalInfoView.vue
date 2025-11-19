<template>
  <div class="personal-info-container">
    <h1 class="page-title">个人信息</h1>
    
    <div class="content-wrapper">
      <!-- 基本信息卡片 -->
      <el-card class="info-card" shadow="hover">
        <div slot="header" class="card-header">
          <span class="card-title">基本信息</span>
        </div>
        <el-form 
          ref="basicInfoForm" 
          :model="basicInfo" 
          :rules="basicInfoRules" 
          class="basic-info-form"
          label-width="100px"
          label-position="left"
        >
          <el-form-item label="姓名" prop="name">
            <el-input 
              v-model="basicInfo.name" 
              placeholder="请输入姓名"
              style="width: 100%;"
            ></el-input>
          </el-form-item>

          <el-form-item label="手机号" prop="phone">
            <el-input 
              v-model="basicInfo.phone" 
              placeholder="请输入手机号"
              style="width: 100%;"
            ></el-input>
          </el-form-item>

          <el-form-item label="邮箱" prop="email">
            <el-input 
              v-model="basicInfo.email" 
              placeholder="请输入邮箱"
              style="width: 100%; background-color: #fffef0;"
            ></el-input>
          </el-form-item>

          <el-form-item label="性别" prop="gender">
            <el-select 
              v-model="basicInfo.gender" 
              placeholder="请选择性别"
              style="width: 100%;"
            >
              <el-option label="未知" value="unknown"></el-option>
              <el-option label="男" value="male"></el-option>
              <el-option label="女" value="female"></el-option>
            </el-select>
          </el-form-item>

          <el-form-item label="生日" prop="birthday">
            <el-date-picker
              v-model="basicInfo.birthday"
              type="date"
              placeholder="选择日期"
              format="yyyy-MM-dd"
              value-format="yyyy-MM-dd"
              style="width: 100%;"
            ></el-date-picker>
          </el-form-item>

          <el-form-item label="工号" prop="employeeId">
            <el-input 
              v-model="basicInfo.employeeId" 
              placeholder="请输入工号"
              style="width: 100%;"
            ></el-input>
          </el-form-item>

          <el-form-item label="部门" prop="department">
            <el-input 
              v-model="basicInfo.department" 
              placeholder="请输入部门"
              style="width: 100%;"
            ></el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSaveBasicInfo" :loading="saving">
              保存
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 密码与安全卡片 -->
      <el-card class="info-card" shadow="hover">
        <div slot="header" class="card-header">
          <span class="card-title">密码与安全</span>
        </div>
        <el-form 
          ref="passwordForm" 
          :model="passwordInfo" 
          :rules="passwordRules" 
          class="basic-info-form"
          label-width="100px"
          label-position="left"
        >
          <el-form-item label="当前密码" prop="currentPassword">
            <el-input 
              v-model="passwordInfo.currentPassword" 
              type="password"
              placeholder="请输入当前密码"
              show-password
              style="width: 100%; background-color: #fffef0;"
            ></el-input>
          </el-form-item>

          <el-form-item label="新密码" prop="newPassword">
            <el-input 
              v-model="passwordInfo.newPassword" 
              type="password"
              placeholder="请输入新密码"
              show-password
              style="width: 100%;"
            ></el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
              修改密码
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PersonalInfoView',
  data() {
    return {
      basicInfo: {
        name: '',
        phone: '',
        email: 'admin',
        gender: 'unknown',
        birthday: '',
        employeeId: '',
        department: ''
      },
      passwordInfo: {
        currentPassword: '',
        newPassword: ''
      },
      basicInfoRules: {
        name: [
          // { required: true, message: '请输入姓名', trigger: 'blur' }
        ],
        phone: [
          // { required: true, message: '请输入手机号', trigger: 'blur' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
        ],
        email: [
          // { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ]
      },
      passwordRules: {
        currentPassword: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ]
      },
      saving: false,
      changingPassword: false
    }
  },
  mounted() {
    // 从 store 获取用户信息
    const username = this.$store.getters.username
    if (username) {
      this.basicInfo.email = username
    }
    // 这里可以添加从服务器获取用户详细信息的逻辑
    this.loadUserInfo()
  },
  methods: {
    loadUserInfo() {
      // 模拟加载用户信息
      // 实际应该从 API 获取
    },
    handleSaveBasicInfo() {
      this.$refs.basicInfoForm.validate((valid) => {
        if (valid) {
          this.saving = true
          // 模拟保存请求
          setTimeout(() => {
            this.saving = false
            this.$message.success('保存成功')
            // 这里可以添加实际的保存逻辑
          }, 1000)
        } else {
          return false
        }
      })
    },
    handleChangePassword() {
      this.$refs.passwordForm.validate((valid) => {
        if (valid) {
          this.changingPassword = true
          // 模拟修改密码请求
          setTimeout(() => {
            this.changingPassword = false
            this.$message.success('密码修改成功')
            // 清空表单
            this.passwordInfo.currentPassword = ''
            this.passwordInfo.newPassword = ''
            this.$refs.passwordForm.resetFields()
            // 这里可以添加实际的修改密码逻辑
          }, 1000)
        } else {
          return false
        }
      })
    }
  }
}
</script>

<style scoped>
.personal-info-container {
  padding: 20px;
  background-color: #fff;
  min-height: 100%;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 30px 0;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.info-card {
  flex: 1;
  min-width: 400px;
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.el-form-item {
  margin-bottom: 22px;
}

.basic-info-form >>> .el-form-item__label {
  color: #333;
  font-weight: 500;
  padding-right: 12px;
  text-align: justify;
  text-align-last: justify;
  width: 100px !important;
  position: relative;
}

.basic-info-form >>> .el-form-item__content {
  margin-left: 100px !important;
}

.basic-info-form >>> .el-form-item__label::before {
  color: #f56c6c;
  margin-right: 4px;
  position: absolute;
  left: 0;
}

/* 对于有required的字段（有星号），文字部分需要向右偏移，避开星号 */
.basic-info-form >>> .el-form-item.is-required .el-form-item__label {
  padding-left: 12px;
}

/* 对于没有星号的标签，文字两端对齐 */
.basic-info-form >>> .el-form-item:not(.is-required) .el-form-item__label {
  padding-left: 0;
}

@media (max-width: 768px) {
  .content-wrapper {
    flex-direction: column;
  }
  
  .info-card {
    min-width: 100%;
  }
}
</style>

