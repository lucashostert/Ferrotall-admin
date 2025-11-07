<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Coletas</h2>
      <router-link to="/coletas/nova" class="btn btn-primary">
        ➕ Nova Coleta
      </router-link>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="label">Data Início</label>
          <input v-model="filtros.dataInicio" type="date" class="input" />
        </div>
        <div>
          <label class="label">Data Fim</label>
          <input v-model="filtros.dataFim" type="date" class="input" />
        </div>
        <div>
          <label class="label">Cliente</label>
          <select v-model="filtros.clienteId" class="input">
            <option value="">Todos</option>
            <option v-for="cliente in clientesStore.clientes" :key="cliente.id" :value="cliente.id">
              {{ cliente.nome }}
            </option>
          </select>
        </div>
      </div>
      <button @click="aplicarFiltros" class="btn btn-primary mt-4">🔍 Filtrar</button>
    </div>

    <!-- Lista -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-500">Carregando...</div>
      <div v-else-if="coletasStore.coletas.length === 0" class="text-center py-8 text-gray-500">
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
              <th class="text-center py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="coleta in coletasStore.coletas" :key="coleta.id" class="border-b hover:bg-gray-50">
              <td class="py-3 px-4">{{ formatDate(coleta.dataColeta) }}</td>
              <td class="py-3 px-4">{{ coleta.clienteNome }}</td>
              <td class="py-3 px-4">{{ coleta.materiais.length }} itens</td>
              <td class="py-3 px-4 text-right font-medium">{{ formatCurrency(coleta.valorTotalColeta) }}</td>
              <td class="py-3 px-4 text-center">
                <span class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="coleta.statusPagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                  {{ coleta.statusPagamento }}
                </span>
              </td>
              <td class="py-3 px-4 text-center">
                <button v-if="coleta.statusPagamento === 'pendente'" @click="marcarPago(coleta.id)" class="text-green-600 hover:text-green-800 mr-2">
                  ✅ Marcar Pago
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useColetasStore } from '@/stores/coletas'
import { useClientesStore } from '@/stores/clientes'
import { format } from 'date-fns'

const coletasStore = useColetasStore()
const clientesStore = useClientesStore()
const loading = ref(false)

const filtros = ref({
  dataInicio: '',
  dataFim: '',
  clienteId: ''
})

const aplicarFiltros = async () => {
  loading.value = true
  await coletasStore.fetchColetas(filtros.value)
  loading.value = false
}

const marcarPago = async (id) => {
  if (confirm('Confirmar pagamento?')) {
    await coletasStore.updateStatusPagamento(id, 'pago')
  }
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'dd/MM/yyyy HH:mm')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

onMounted(async () => {
  loading.value = true
  await Promise.all([coletasStore.fetchColetas(), clientesStore.fetchClientes()])
  loading.value = false
})
</script>
