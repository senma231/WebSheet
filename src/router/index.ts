import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'documents',
        component: () => import('@/views/DocumentsView.vue')
      },
      {
        path: 'document/:id',
        name: 'document-edit',
        component: () => import('@/views/DocumentEditView.vue')
      },
      {
        path: 'document/:id/permissions',
        name: 'document-permissions',
        component: () => import('@/views/DocumentPermissionsView.vue'),
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/views/SettingsView.vue')
      },
      {
        path: 'templates',
        name: 'template-management',
        component: () => import('@/views/TemplateManagementView.vue'),
        meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/share/:code',
    name: 'shared-document',
    component: () => import('@/views/SharedDocumentView.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 全局前置守卫
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const isAuthenticated = localStorage.getItem('token')

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router
