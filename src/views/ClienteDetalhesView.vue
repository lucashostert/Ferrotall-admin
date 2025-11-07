<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">{{ cliente?.nome }}</h2>
      <router-link to="/clientes" class="text-blue-600 hover:text-blue-800">← Voltar</router-link>
    </div>

    <div v-if="loading" class="text-center py-8">Carregando...</div>
    <div v-else-if="!cliente" class="text-center py-8">Cliente não encontrado</div>
    <div v-else>
      <!-- Dados do Cliente -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Informações</h3>
        <div class="grid grid-cols-2 gap-4">
          <div><span class="text-gray-600">E-mail:</span> {{ cliente.email }}</div>
          <div><span class="text-gray-600">Telefone:</span> {{ cliente.telefone || '-' }}</div>
          <div><span class="text-gray-600">CPF/CNPJ:</span> {{ cliente.cpfCnpj || '-' }}</div>
          <div><span class="text-gray-600">Endereço:</span> {{ cliente.endereco || '-' }}</div>
        </div>
      </div>

      <!-- Histórico de Coletas -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Histórico de Coletas</h3>
        <div v-if="coletas.length === 0" class="text-center py-8 text-gray-500">
          Nenhuma coleta registrada
        </div>
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b">
                <th class="text-left py-3 px-4">Data</th>
                <th class="text-left py-3 px-4">Materiais</th>
                <th class="text-right py-3 px-4">Valor</th>
                <th class="text-center py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="coleta in coletas" :key="coleta.id" class="border-b">
                <td class="py-3 px-4">{{ formatDate(coleta.dataColeta) }}</td>
                <td class="py-3 px-4">{{ coleta.materiais.length }} itens</td>
                <td class="py-3 px-4 text-right">{{ formatCurrency(coleta.valorTotalColeta) }}</td>
                <td class="py-3 px-4 text-center">
                  <span class="px-3 py-1 rounded-full text-xs"
                    :class="coleta.statusPagamento === 'pago' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'">
                    {{ coleta.statusPagamento }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useClientesStore } from '@/stores/clientes'
import { useColetasStore } from '@/stores/coletas'
import { format } from 'date-fns'

const route = useRoute()
const clientesStore = useClientesStore()
const coletasStore = useColetasStore()

const loading = ref(false)
const cliente = ref(null)
const coletas = ref([])

const formatDate = (timestamp) => {
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'dd/MM/yyyy')
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

onMounted(async () => {
  loading.value = true
  const id = route.params.id
  cliente.value = await clientesStore.getCliente(id)
  await coletasStore.fetchColetas({ clienteId: id })
  coletas.value = coletasStore.coletas
  loading.value = false
})
</script>
