<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <!-- Mobile Overlay -->
    <div 
      v-if="isSidebarOpen && isMobile"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
      @click="closeSidebar"
    ></div>

    <!-- Sidebar -->
    <aside 
      class="bg-ferrotall-primary text-white flex flex-col fixed lg:sticky top-0 h-screen z-50 transition-all duration-300 ease-in-out"
      :class="[
        isSidebarExpanded ? 'w-64' : 'w-20',
        isMobile && !isSidebarOpen ? '-translate-x-full lg:translate-x-0' : 'translate-x-0'
      ]"
    >
      <!-- Header -->
      <div class="p-4 border-b border-blue-700 flex items-center justify-between">
        <div v-if="isSidebarExpanded" class="flex-1">
          <h1 class="text-xl font-bold">Ferrotall</h1>
          <p class="text-xs text-blue-200">Sucatas</p>
        </div>
        <div v-else class="flex-1 text-center">
          <h1 class="text-2xl font-bold">F</h1>
        </div>
        
        <!-- Toggle Button (Desktop) -->
        <button 
          @click="toggleSidebarExpand"
          class="hidden lg:block p-2 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <span v-if="isSidebarExpanded">◀</span>
          <span v-else">▶</span>
        </button>
      </div>
      
      <!-- Navigation -->
      <nav class="flex-1 p-2 overflow-y-auto">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          @click="onMenuItemClick"
          class="flex items-center px-3 py-3 mb-1 rounded-lg transition-colors hover:bg-blue-700 group relative"
          :class="{ 'bg-blue-700': $route.path === item.path }"
        >
          <span class="text-xl" :class="isSidebarExpanded ? 'mr-3' : 'mx-auto'">{{ item.icon }}</span>
          <span v-if="isSidebarExpanded" class="text-sm">{{ item.label }}</span>
          
          <!-- Tooltip para menu colapsado -->
          <div 
            v-if="!isSidebarExpanded" 
            class="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50"
          >
            {{ item.label }}
          </div>
        </router-link>
      </nav>
      
      <!-- User Section -->
      <div class="p-3 border-t border-blue-700">
        <div 
          class="flex items-center mb-2 px-2 py-2 rounded-lg"
          :class="isSidebarExpanded ? '' : 'justify-center'"
        >
          <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0" :class="isSidebarExpanded ? 'mr-3' : ''">
            {{ userInitials }}
          </div>
          <div v-if="isSidebarExpanded" class="flex-1 overflow-hidden">
            <p class="text-xs font-medium truncate">{{ authStore.userProfile?.nome }}</p>
            <p class="text-xs text-blue-200">Admin</p>
          </div>
        </div>
        <button 
          @click="handleLogout"
          class="w-full px-3 py-2 text-sm hover:bg-blue-700 rounded-lg transition-colors flex items-center"
          :class="isSidebarExpanded ? '' : 'justify-center'"
        >
          <span class="text-lg">🚪</span>
          <span v-if="isSidebarExpanded" class="ml-2">Sair</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden w-full">
      <!-- Header -->
      <header class="bg-white shadow-sm">
        <div class="px-4 lg:px-6 py-3 lg:py-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <!-- Mobile Menu Button -->
            <button 
              @click="toggleSidebarOpen"
              class="lg:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h2 class="text-lg lg:text-2xl font-semibold text-gray-800">{{ pageTitle }}</h2>
          </div>
          
          <div class="flex items-center space-x-2 lg:space-x-4">
            <!-- Notificações -->
            <button 
              class="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
              @click="toggleNotifications"
            >
              <span class="text-xl lg:text-2xl">🔔</span>
              <span 
                v-if="notificationsCount > 0" 
                class="absolute top-0 right-0 w-4 h-4 lg:w-5 lg:h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
              >
                {{ notificationsCount }}
              </span>
            </button>
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
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
        class="absolute right-0 top-0 h-full w-full sm:w-96 bg-white shadow-xl p-4 lg:p-6 overflow-y-auto"
        @click.stop
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg lg:text-xl font-semibold">Notificações</h3>
          <button 
            @click="showNotifications = false"
            class="lg:hidden p-2 text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
        <div v-if="solicitacoesStore.solicitacoes.length === 0" class="text-gray-500 text-center py-8">
          Nenhuma notificação pendente
        </div>
        <div v-else class="space-y-3">
          <div 
            v-for="sol in solicitacoesStore.solicitacoes" 
            :key="sol.id"
            class="p-3 lg:p-4 bg-blue-50 rounded-lg border border-blue-200"
          >
            <p class="font-medium text-sm lg:text-base">Nova solicitação de coleta</p>
            <p class="text-xs lg:text-sm text-gray-600 mt-1">Cliente: {{ sol.clienteNome }}</p>
            <p class="text-xs lg:text-sm text-gray-600">{{ sol.recipiente?.tipo }} - {{ sol.percentual }}%</p>
            <button 
              @click="goToSolicitacoes"
              class="mt-2 text-xs lg:text-sm text-blue-600 hover:text-blue-800"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSolicitacoesStore } from '@/stores/solicitacoes'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const solicitacoesStore = useSolicitacoesStore()

const showNotifications = ref(false)
const isSidebarOpen = ref(false)
const isSidebarExpanded = ref(true)
const isMobile = ref(window.innerWidth < 1024)

// Detectar mudanças no tamanho da tela
const handleResize = () => {
  isMobile.value = window.innerWidth < 1024
  if (!isMobile.value) {
    isSidebarOpen.value = false
  }
}

// Watch para fechar sidebar ao mudar de rota no mobile
watch(route, () => {
  if (isMobile.value) {
    isSidebarOpen.value = false
  }
})

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

const toggleSidebarOpen = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleSidebarExpand = () => {
  isSidebarExpanded.value = !isSidebarExpanded.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}

const onMenuItemClick = () => {
  if (isMobile.value) {
    closeSidebar()
  }
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
  
  // Listener para resize
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  solicitacoesStore.stopListening()
  window.removeEventListener('resize', handleResize)
})
</script>
