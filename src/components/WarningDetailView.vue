<template>
  <div class="warning-detail">
    <!-- 标题区域 -->
    <div class="title-section">
      <div class="title-bar"></div>
      <h2 class="title">预警列表</h2>
      <el-button type="text" icon="el-icon-arrow-left" @click="goBack" class="back-btn">返回</el-button>
    </div>

    <!-- 搜索表单 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="医疗机构">
        <el-input v-model="searchForm.hospitalName" placeholder="请输入医疗机构名称"></el-input>
      </el-form-item>
      <el-form-item label="患者姓名">
        <el-input v-model="searchForm.patientName" placeholder="请输入患者姓名"></el-input>
      </el-form-item>
      <el-form-item label="审核状态">
        <el-select v-model="searchForm.status" placeholder="请选择审核状态">
          <el-option label="全部" value=""></el-option>
          <el-option label="待初审" value="待初审"></el-option>
          <el-option label="待医院复核" value="待医院复核"></el-option>
          <el-option label="待终审" value="待终审"></el-option>
          <el-option label="已终审" value="已终审"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search">查询</el-button>
        <el-button icon="el-icon-refresh-left">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 数据表格 -->
    <div class="table-wrapper">
      <el-table :data="tableData" border style="width: 100%; min-width: 1400px;" size="small">
        <el-table-column prop="hospitalName" label="医疗机构名称" min-width="150"></el-table-column>
        <el-table-column prop="patientName" label="患者姓名" width="100"></el-table-column>
        <el-table-column prop="idCard" label="患者身份证号码" min-width="180"></el-table-column>
        <el-table-column prop="visitType" label="就诊类别" width="100"></el-table-column>
        <el-table-column prop="department" label="就诊科室" min-width="120"></el-table-column>
        <el-table-column prop="warningReason" label="预警原因" min-width="180"></el-table-column>
        <el-table-column prop="status" label="审核状态" width="120">
          <template slot-scope="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)" 
              size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="finalResult" label="终审结果" width="120" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.finalResult">
              <el-tag 
                :type="scope.row.finalResult === '明确违规' ? 'danger' : 'success'" 
                size="small">
                {{ scope.row.finalResult }}
              </el-tag>
            </span>
            <span v-else style="color: #909399;">/</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="viewRecord(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="currentPage"
      :page-sizes="[10, 20, 50, 100]"
      :page-size="pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="total"
      class="pagination">
    </el-pagination>

  </div>
</template>

<script>
export default {
  name: 'WarningDetailView',
  data() {
    return {
      taskInfo: {
        taskId: '',
        taskName: ''
      },
      searchForm: {
        hospitalName: '',
        patientName: '',
        status: ''
      },
      tableData: [
        {
          id: 1,
          hospitalName: '第一人民医院',
          patientName: '张**',
          idCard: '32038219890711****',
          visitType: '门诊',
          department: '神经科',
          warningReason: '影像检查串换项目次数',
          status: '待初审',
          finalResult: '',
          visitTime: '2024-01-15 09:30:00',
          detail: '患者就诊时进行的CT检查项目编码与实际检查项目不符，疑似存在串换项目情况。'
        },
        {
          id: 2,
          hospitalName: '第一人民医院',
          patientName: '李**',
          idCard: '32028219897655****',
          visitType: '门诊',
          department: '呼吸内科',
          warningReason: '影像DICOM文件重复次数',
          status: '待医院复核',
          finalResult: '',
          visitTime: '2024-01-14 14:20:00',
          detail: '同一患者在短时间内存在多次相同检查的DICOM文件，疑似重复检查。'
        },
        {
          id: 3,
          hospitalName: '第一人民医院',
          patientName: '王**',
          idCard: '32038219897115****',
          visitType: '门诊',
          department: '呼吸内科',
          warningReason: '影像DICOM文件重复次数',
          status: '待终审',
          finalResult: '',
          visitTime: '2024-01-13 11:15:00',
          detail: '检查记录显示该患者在24小时内进行了两次相同部位的X光检查。'
        },
        {
          id: 4,
          hospitalName: '第一人民医院',
          patientName: '赵**',
          idCard: '32038219901201****',
          visitType: '住院',
          department: '骨科',
          warningReason: '患者就诊缺失检查次数',
          status: '已终审',
          finalResult: '明确违规',
          visitTime: '2024-01-12 16:45:00',
          detail: '患者住院期间缺少必要的术前影像检查记录，但存在手术费用记录。'
        },
        {
          id: 5,
          hospitalName: '第二人民医院',
          patientName: '孙**',
          idCard: '32038219951215****',
          visitType: '门诊',
          department: '心内科',
          warningReason: '影像检查设备未使用次数',
          status: '已终审',
          finalResult: '无违规',
          visitTime: '2024-01-11 10:30:00',
          detail: '经复核，该检查使用的是便携式设备，未在固定设备上记录。'
        },
        {
          id: 6,
          hospitalName: '第二人民医院',
          patientName: '周**',
          idCard: '32038219880920****',
          visitType: '门诊',
          department: '消化内科',
          warningReason: '影像检查串换项目次数',
          status: '待初审',
          finalResult: '',
          visitTime: '2024-01-16 08:45:00',
          detail: '检查项目编码与医嘱不符，需要进一步核实。'
        },
        {
          id: 7,
          hospitalName: '第三人民医院',
          patientName: '吴**',
          idCard: '32038219920505****',
          visitType: '住院',
          department: '泌尿外科',
          warningReason: '患者重复检查次数',
          status: '待医院复核',
          finalResult: '',
          visitTime: '2024-01-15 13:20:00',
          detail: '患者在住院期间进行了多次相同项目的检查，需确认是否有医疗必要性。'
        },
        {
          id: 8,
          hospitalName: '第三人民医院',
          patientName: '郑**',
          idCard: '32038219931128****',
          visitType: '门诊',
          department: '普外科',
          warningReason: '影像检查设备未使用次数',
          status: '待初审',
          finalResult: '',
          visitTime: '2024-01-14 15:10:00',
          detail: '检查记录显示使用了某设备，但该设备在该时段的使用日志中无对应记录。'
        }
      ],
      currentPage: 1,
      pageSize: 10,
      total: 8
    }
  },
  mounted() {
    // 从路由参数中获取任务信息
    this.taskInfo.taskId = this.$route.query.taskId || ''
    this.taskInfo.taskName = this.$route.query.taskName || ''
  },
  methods: {
    handleSizeChange(val) {
      this.pageSize = val
    },
    handleCurrentChange(val) {
      this.currentPage = val
    },
    getStatusType(status) {
      const typeMap = {
        '待初审': 'warning',
        '待医院复核': 'primary',
        '待终审': 'info',
        '已终审': 'success'
      }
      return typeMap[status] || 'info'
    },
    viewRecord(row) {
      // 跳转到预警记录详情页面
      this.$router.push({
        path: '/warning-record',
        query: {
          recordId: row.id
        }
      })
    },
    goBack() {
      this.$router.back()
    }
  }
}
</script>

<style scoped>
.warning-detail {
  padding: 20px;
}

.title-section {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
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

.back-btn {
  position: absolute;
  right: 0;
  font-size: 14px;
}

.search-form {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.table-wrapper {
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
  overflow-x: auto;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

/* 表格样式优化 */
.el-table th {
  background-color: #f5f7fa;
  color: #303133;
  font-weight: 600;
}

.el-table td, .el-table th {
  padding: 12px 0;
}
</style>

