import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue')
        },
        {
          path: 'clientes',
          name: 'clientes',
          component: () => import('@/views/ClientesView.vue')
        },
        {
          path: 'clientes/:id',
          name: 'cliente-detalhes',
          component: () => import('@/views/ClienteDetalhesView.vue')
        },
        {
          path: 'materiais',
          name: 'materiais',
          component: () => import('@/views/MateriaisView.vue')
        },
        {
          path: 'coletas',
          name: 'coletas',
          component: () => import('@/views/ColetasView.vue')
        },
        {
          path: 'coletas/nova',
          name: 'nova-coleta',
          component: () => import('@/views/NovaColetaView.vue')
        },
        {
          path: 'solicitacoes',
          name: 'solicitacoes',
          component: () => import('@/views/SolicitacoesView.vue')
        },
        {
          path: 'relatorios',
          name: 'relatorios',
          component: () => import('@/views/RelatoriosView.vue')
        },
        {
          path: 'configuracoes',
          name: 'configuracoes',
          component: () => import('@/views/ConfiguracoesView.vue')
        }
      ]
    }
  ]
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.user) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.user) {
    next('/')
  } else if (to.meta.requiresAdmin && authStore.user?.tipo !== 'admin') {
    next('/')
  } else {
    next()
  }
})

export default router
