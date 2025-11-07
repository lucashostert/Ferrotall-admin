<template>
  <div class="space-y-6">
    <!-- Cards de Estatísticas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Total Clientes</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.totalClientes }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">👥</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Coletas do Mês</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.coletasMes }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">🚛</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Pendentes</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ stats.solicitacoesPendentes }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">📋</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-gray-500 text-sm">Faturamento Mês</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(stats.faturamentoMes) }}</p>
          </div>
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span class="text-2xl">💰</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Solicitações Recentes -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold">Solicitações Recentes</h3>
        <router-link to="/solicitacoes" class="text-blue-600 hover:text-blue-800 text-sm">
          Ver todas →
        </router-link>
      </div>
      
      <div v-if="loading" class="text-center py-8 text-gray-500">
        Carregando...
      </div>
      
      <div v-else-if="solicitacoesRecentes.length === 0" class="text-center py-8 text-gray-500">
        Nenhuma solicitação pendente
      </div>
      
      <div v-else class="space-y-3">
        <div 
          v-for="sol in solicitacoesRecentes" 
          :key="sol.id"
          class="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div class="flex-1">
            <p class="font-medium">{{ sol.clienteNome }}</p>
            <p class="text-sm text-gray-600">
              {{ sol.recipiente?.tipo }} - {{ sol.percentual }}% - {{ sol.localizacao }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ formatDate(sol.dataSolicitacao) }}
            </p>
          </div>
          <router-link 
            to="/solicitacoes"
            class="btn btn-primary btn-sm"
          >
            Atender
          </router-link>
        </div>
      </div>
    </div>

    <!-- Coletas Recentes -->
    <div class="card">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-semibold">Últimas Coletas</h3>
        <router-link to="/coletas" class="text-blue-600 hover:text-blue-800 text-sm">
          Ver todas →
        </router-link>
      </div>
      
      <div v-if="coletasRecentes.length === 0" class="text-center py-8 text-gray-500">
        Nenhuma coleta registrada
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4">Data</th>
              <th class="text-left py-3 px-4">Cliente</th>
              <th class="text-left py-3 px-4">Materiais</th>
              <th class="text-right py-3 px-4">Valor</th>
              <th class="text-center py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="coleta in coletasRecentes" 
              :key="coleta.id"
              class="border-b hover:bg-gray-50"
            >
              <td class="py-3 px-4">{{ formatDate(coleta.dataColeta) }}</td>
              <td class="py-3 px-4">{{ coleta.clienteNome }}</td>
              <td class="py-3 px-4">{{ coleta.materiais.length }} itens</td>
              <td class="py-3 px-4 text-right font-medium">{{ formatCurrency(coleta.valorTotalColeta) }}</td>
              <td class="py-3 px-4 text-center">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="coleta.statusPagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                >
                  {{ coleta.statusPagamento }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useClientesStore } from '@/stores/clientes'
import { useColetasStore } from '@/stores/coletas'
import { useSolicitacoesStore } from '@/stores/solicitacoes'
import { format } from 'date-fns'

const clientesStore = useClientesStore()
const coletasStore = useColetasStore()
const solicitacoesStore = useSolicitacoesStore()

const loading = ref(true)

const stats = computed(() => {
  const now = new Date()
  const primeiroDiaMes = new Date(now.getFullYear(), now.getMonth(), 1)
  
  const coletasDoMes = coletasStore.coletas.filter(c => {
    const dataColeta = c.dataColeta.toDate()
    return dataColeta >= primeiroDiaMes
  })

  return {
    totalClientes: clientesStore.clientes.filter(c => c.active).length,
    coletasMes: coletasDoMes.length,
    solicitacoesPendentes: solicitacoesStore.solicitacoes.filter(s => s.status === 'pendente').length,
    faturamentoMes: coletasDoMes.reduce((sum, c) => sum + (c.valorTotalColeta || 0), 0)
  }
})

const solicitacoesRecentes = computed(() => {
  return solicitacoesStore.solicitacoes
    .filter(s => s.status === 'pendente')
    .slice(0, 5)
})

const coletasRecentes = computed(() => {
  return coletasStore.coletas.slice(0, 10)
})

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'dd/MM/yyyy HH:mm')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      clientesStore.fetchClientes(),
      coletasStore.fetchColetas({ limit: 10 }),
      solicitacoesStore.fetchSolicitacoes('pendente')
    ])
  } catch (error) {
    console.error('Erro ao carregar dashboard:', error)
  } finally {
    loading.value = false
  }
})
</script>
