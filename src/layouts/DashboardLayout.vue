<template>
  <div class="flex h-screen bg-gray-100">
    <!-- Sidebar -->
    <aside class="w-64 bg-ferrotall-primary text-white flex flex-col">
      <div class="p-6 border-b border-blue-700">
        <h1 class="text-2xl font-bold">Ferrotall</h1>
        <p class="text-sm text-blue-200">Sucatas</p>
      </div>
      
      <nav class="flex-1 p-4 overflow-y-auto">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="flex items-center px-4 py-3 mb-2 rounded-lg transition-colors hover:bg-blue-700"
          :class="{ 'bg-blue-700': $route.path === item.path }"
        >
          <span class="mr-3">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      
      <div class="p-4 border-t border-blue-700">
        <div class="flex items-center px-4 py-2 mb-2">
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
            {{ userInitials }}
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium">{{ authStore.userProfile?.nome }}</p>
            <p class="text-xs text-blue-200">Administrador</p>
          </div>
        </div>
        <button 
          @click="handleLogout"
          class="w-full px-4 py-2 text-left text-sm hover:bg-blue-700 rounded-lg transition-colors"
        >
          🚪 Sair
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="px-6 py-4 flex items-center justify-between">
          <h2 class="text-2xl font-semibold text-gray-800">{{ pageTitle }}</h2>
          
          <div class="flex items-center space-x-4">
            <!-- Notificações -->
            <button 
              class="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
              @click="toggleNotifications"
            >
              <span class="text-2xl">🔔</span>
              <span 
                v-if="notificationsCount > 0" 
                class="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {{ notificationsCount }}
              </span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-6">
        <router-view />
      </main>
    </div>

    <!-- Notifications Panel -->
    <div 
      v-if="showNotifications"
      class="fixed inset-0 bg-black bg-opacity-50 z-50"
      @click="showNotifications = false"
    >
      <div 
        class="absolute right-0 top-0 h-full w-96 bg-white shadow-xl p-6"
        @click.stop
      >
        <h3 class="text-xl font-semibold mb-4">Notificações</h3>
        <div v-if="solicitacoesStore.solicitacoes.length === 0" class="text-gray-500 text-center py-8">
          Nenhuma notificação pendente
        </div>
        <div v-else class="space-y-3">
          <div 
            v-for="sol in solicitacoesStore.solicitacoes" 
            :key="sol.id"
            class="p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <p class="font-medium">Nova solicitação de coleta</p>
            <p class="text-sm text-gray-600 mt-1">Cliente: {{ sol.clienteNome }}</p>
            <p class="text-sm text-gray-600">{{ sol.recipiente?.tipo }} - {{ sol.percentual }}%</p>
            <button 
              @click="goToSolicitacoes"
              class="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Ver detalhes →
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSolicitacoesStore } from '@/stores/solicitacoes'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const solicitacoesStore = useSolicitacoesStore()

const showNotifications = ref(false)

const menuItems = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/clientes', icon: '👥', label: 'Clientes' },
  { path: '/materiais', icon: '🔧', label: 'Materiais' },
  { path: '/coletas', icon: '🚛', label: 'Coletas' },
  { path: '/solicitacoes', icon: '📋', label: 'Solicitações' },
  { path: '/relatorios', icon: '📈', label: 'Relatórios' },
  { path: '/configuracoes', icon: '⚙️', label: 'Configurações' }
]

const pageTitle = computed(() => {
  const item = menuItems.find(i => i.path === route.path)
  return item ? item.label : 'Ferrotall Sucatas'
})

const userInitials = computed(() => {
  const nome = authStore.userProfile?.nome || 'Admin'
  return nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
})

const notificationsCount = computed(() => {
  return solicitacoesStore.solicitacoes.filter(s => s.status === 'pendente').length
})

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

const goToSolicitacoes = () => {
  showNotifications.value = false
  router.push('/solicitacoes')
}

const handleLogout = async () => {
  if (confirm('Deseja realmente sair?')) {
    await authStore.logout()
  }
}

onMounted(() => {
  // Escutar solicitações em tempo real
  solicitacoesStore.listenToSolicitacoes()
})

onUnmounted(() => {
  solicitacoesStore.stopListening()
})
</script>
