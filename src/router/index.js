import Vue from 'vue'
import VueRouter from 'vue-router'
import Navigation from '../views/Navigation.vue'
import WorkspaceView from '../components/WorkspaceView.vue'
import RuleBaseView from '../components/RuleBaseView.vue'
import KnowledgeBaseView from '../components/KnowledgeBaseView.vue'
import TaskBaseView from '../components/TaskBaseView.vue'
import WarningBaseView from '../components/WarningBaseView.vue'
import WarningDetailView from '../components/WarningDetailView.vue'
import WarningRecordView from '../components/WarningRecordView.vue'
import DataBaseView from '../components/DataBaseView.vue'
import LogBaseView from '../components/LogBaseView.vue'
import PermissionBaseView from '../components/PermissionBaseView.vue'
import ModelBaseView from '../components/ModelBaseView.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Navigation,
    redirect: '/workspace',
    children: [
      {
        path: 'workspace',
        name: 'workspace',
        component: WorkspaceView
      },
      {
        path: 'knowledge-base',
        name: 'knowledge-base',
        component: KnowledgeBaseView
      },
      {
        path: 'rule-base',
        name: 'rule-base',
        component: RuleBaseView
      },
      {
        path: 'model-base',
        name: 'model-base',
        component: ModelBaseView
      },
      {
        path: 'task-base',
        name: 'task-base',
        component: TaskBaseView
      },
      {
        path: 'warning-base',
        name: 'warning-base',
        component: WarningBaseView
      },
      {
        path: 'warning-detail',
        name: 'warning-detail',
        component: WarningDetailView
      },
      {
        path: 'warning-record',
        name: 'warning-record',
        component: WarningRecordView
      },
      {
        path: 'data-base',
        name: 'data-base',
        component: DataBaseView
      },
      {
        path: 'log-base',
        name: 'log-base',
        component: LogBaseView
      },
      {
        path: 'permission-base',
        name: 'permission-base',
        component: PermissionBaseView
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

export default router
