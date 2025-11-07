<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold">Solicitações de Coleta</h2>

    <!-- Filtros -->
    <div class="card">
      <div class="flex space-x-4">
        <button 
          v-for="status in statusOptions" 
          :key="status.value"
          @click="filterStatus = status.value"
          class="px-4 py-2 rounded-lg font-medium transition-colors"
          :class="filterStatus === status.value ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'"
        >
          {{ status.label }}
        </button>
      </div>
    </div>

    <!-- Lista de Solicitações -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        Carregando solicitações...
      </div>
      
      <div v-else-if="filteredSolicitacoes.length === 0" class="text-center py-8 text-gray-500">
        Nenhuma solicitação {{ filterStatus === null ? '' : `${statusOptions.find(s => s.value === filterStatus)?.label.toLowerCase()}` }}
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="sol in filteredSolicitacoes" 
          :key="sol.id"
          class="p-6 bg-gray-50 rounded-lg border-2 transition-all hover:border-blue-300"
          :class="{
            'border-yellow-300 bg-yellow-50': sol.status === 'pendente',
            'border-blue-300 bg-blue-50': sol.status === 'agendada',
            'border-green-300 bg-green-50': sol.status === 'concluida'
          }"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-3 mb-2">
                <h3 class="text-lg font-semibold">{{ sol.clienteNome }}</h3>
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-yellow-200 text-yellow-800': sol.status === 'pendente',
                    'bg-blue-200 text-blue-800': sol.status === 'agendada',
                    'bg-green-200 text-green-800': sol.status === 'concluida'
                  }"
                >
                  {{ sol.status }}
                </span>
              </div>
              
              <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p class="text-sm text-gray-600">Recipiente</p>
                  <p class="font-medium">{{ sol.recipiente?.tipo }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Preenchimento</p>
                  <p class="font-medium">{{ sol.percentual }}%</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Localização</p>
                  <p class="font-medium">{{ sol.localizacao }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600">Data Solicitação</p>
                  <p class="font-medium">{{ formatDate(sol.dataSolicitacao) }}</p>
                </div>
              </div>

              <div v-if="sol.dataAgendamento" class="mt-4 p-3 bg-white rounded border">
                <p class="text-sm text-gray-600">Agendada para</p>
                <p class="font-medium">{{ formatDate(sol.dataAgendamento) }}</p>
              </div>
            </div>

            <div class="flex flex-col space-y-2 ml-4">
              <button 
                v-if="sol.status === 'pendente'"
                @click="agendar(sol)"
                class="btn btn-primary"
              >
                📅 Agendar
              </button>
              <button 
                v-if="sol.status === 'agendada'"
                @click="iniciarColeta(sol)"
                class="btn btn-success"
              >
                🚛 Iniciar Coleta
              </button>
              <button 
                v-if="sol.status !== 'concluida'"
                @click="cancelar(sol)"
                class="btn btn-danger"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Agendar -->
    <div 
      v-if="showAgendarModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showAgendarModal = false"
    >
      <div 
        class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        @click.stop
      >
        <h3 class="text-xl font-semibold mb-4">Agendar Coleta</h3>
        
        <div class="space-y-4">
          <div>
            <label class="label">Data e Hora</label>
            <input 
              v-model="dataAgendamento"
              type="datetime-local"
              class="input"
            />
          </div>

          <div>
            <label class="label">Observações (opcional)</label>
            <textarea 
              v-model="observacoes"
              rows="3"
              class="input"
            ></textarea>
          </div>

          <div class="flex space-x-3">
            <button 
              @click="confirmarAgendamento"
              class="btn btn-primary flex-1"
            >
              Confirmar
            </button>
            <button 
              @click="showAgendarModal = false"
              class="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSolicitacoesStore } from '@/stores/solicitacoes'
import { format } from 'date-fns'

const router = useRouter()
const solicitacoesStore = useSolicitacoesStore()

const loading = ref(false)
const filterStatus = ref(null)
const showAgendarModal = ref(false)
const selectedSolicitacao = ref(null)
const dataAgendamento = ref('')
const observacoes = ref('')

const statusOptions = [
  { value: null, label: 'Todas' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'agendada', label: 'Agendadas' },
  { value: 'concluida', label: 'Concluídas' }
]

const filteredSolicitacoes = computed(() => {
  if (!filterStatus.value) return solicitacoesStore.solicitacoes
  return solicitacoesStore.solicitacoes.filter(s => s.status === filterStatus.value)
})

const agendar = (solicitacao) => {
  selectedSolicitacao.value = solicitacao
  // Set default to tomorrow at 9am
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)
  dataAgendamento.value = format(tomorrow, "yyyy-MM-dd'T'HH:mm")
  showAgendarModal.value = true
}

const confirmarAgendamento = async () => {
  if (!dataAgendamento.value) {
    alert('Selecione uma data e hora')
    return
  }

  await solicitacoesStore.updateStatus(selectedSolicitacao.value.id, 'agendada', {
    dataAgendamento: new Date(dataAgendamento.value),
    observacoes: observacoes.value
  })

  showAgendarModal.value = false
  selectedSolicitacao.value = null
  dataAgendamento.value = ''
  observacoes.value = ''
}

const iniciarColeta = (solicitacao) => {
  // Redirecionar para a tela de nova coleta com os dados da solicitação
  router.push({
    name: 'nova-coleta',
    query: {
      solicitacaoId: solicitacao.id,
      clienteId: solicitacao.clienteId
    }
  })
}

const cancelar = async (solicitacao) => {
  if (confirm('Deseja realmente cancelar esta solicitação?')) {
    await solicitacoesStore.updateStatus(solicitacao.id, 'cancelada')
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'dd/MM/yyyy HH:mm')
}

onMounted(async () => {
  loading.value = true
  await solicitacoesStore.fetchSolicitacoes()
  loading.value = false
})
</script>
