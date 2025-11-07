<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Registrar Nova Coleta</h2>
      <router-link to="/coletas" class="text-blue-600 hover:text-blue-800">
        ← Voltar
      </router-link>
    </div>

    <form @submit.prevent="salvarColeta" class="space-y-6">
      <!-- Dados do Cliente -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Dados do Cliente</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Cliente *</label>
            <select 
              v-model="form.clienteId"
              required
              class="input"
              @change="carregarDadosCliente"
            >
              <option value="">Selecione um cliente</option>
              <option 
                v-for="cliente in clientesAtivos" 
                :key="cliente.id"
                :value="cliente.id"
              >
                {{ cliente.nome }}
              </option>
            </select>
          </div>

          <div>
            <label class="label">Data da Coleta *</label>
            <input 
              v-model="form.dataColeta"
              type="datetime-local"
              required
              class="input"
            />
          </div>
        </div>

        <div v-if="clienteSelecionado" class="mt-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-gray-600">
            <strong>Endereço:</strong> {{ clienteSelecionado.endereco || 'Não informado' }}
          </p>
          <p class="text-sm text-gray-600 mt-1">
            <strong>Telefone:</strong> {{ clienteSelecionado.telefone || 'Não informado' }}
          </p>
        </div>
      </div>

      <!-- Dados do Recipiente -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Dados do Recipiente</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="label">Tipo de Recipiente *</label>
            <select 
              v-model="form.recipiente.tipo"
              required
              class="input"
            >
              <option value="Tambor 200L">Tambor 200L</option>
              <option value="Caçamba">Caçamba</option>
            </select>
          </div>

          <div>
            <label class="label">Localização *</label>
            <input 
              v-model="form.recipiente.localizacao"
              type="text"
              required
              class="input"
              placeholder="Ex: Galpão A, Setor 2"
            />
          </div>
        </div>
      </div>

      <!-- Materiais Coletados -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Materiais Coletados</h3>
          <button 
            type="button"
            @click="adicionarMaterial"
            class="btn btn-primary"
          >
            ➕ Adicionar Material
          </button>
        </div>

        <div v-if="form.materiais.length === 0" class="text-center py-8 text-gray-500">
          Nenhum material adicionado
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="(material, index) in form.materiais" 
            :key="index"
            class="p-4 bg-gray-50 rounded-lg border-2 border-gray-200"
          >
            <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div class="md:col-span-2">
                <label class="label">Material</label>
                <select 
                  v-model="material.materialId"
                  required
                  class="input"
                  @change="atualizarPrecoMaterial(index)"
                >
                  <option value="">Selecione</option>
                  <option 
                    v-for="mat in materiaisStore.materiais" 
                    :key="mat.id"
                    :value="mat.id"
                  >
                    {{ mat.nome }}
                  </option>
                </select>
              </div>

              <div>
                <label class="label">Peso Bruto (kg)</label>
                <input 
                  v-model.number="material.pesoBruto"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="input"
                  @input="calcularTotais(index)"
                />
              </div>

              <div>
                <label class="label">Peso Recipiente (kg)</label>
                <input 
                  v-model.number="material.pesoRecipiente"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="input"
                  @input="calcularTotais(index)"
                />
              </div>

              <div>
                <label class="label">Preço/kg (R$)</label>
                <input 
                  v-model.number="material.precoUnitario"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  class="input"
                  @input="calcularTotais(index)"
                />
              </div>
            </div>

            <div class="mt-4 flex items-center justify-between p-3 bg-white rounded border">
              <div class="text-sm">
                <span class="text-gray-600">Peso Líquido:</span>
                <strong class="ml-2">{{ (material.pesoBruto - material.pesoRecipiente).toFixed(2) }} kg</strong>
                <span class="text-gray-600 ml-4">Valor Total:</span>
                <strong class="ml-2 text-green-600">
                  {{ formatCurrency((material.pesoBruto - material.pesoRecipiente) * material.precoUnitario) }}
                </strong>
              </div>
              <button 
                type="button"
                @click="removerMaterial(index)"
                class="text-red-600 hover:text-red-800"
              >
                ❌ Remover
              </button>
            </div>
          </div>
        </div>

        <div v-if="form.materiais.length > 0" class="mt-6 p-4 bg-blue-50 rounded-lg">
          <div class="flex items-center justify-between">
            <span class="text-lg font-semibold">Valor Total da Coleta:</span>
            <span class="text-2xl font-bold text-blue-600">{{ formatCurrency(valorTotalColeta) }}</span>
          </div>
        </div>
      </div>

      <!-- Observações -->
      <div class="card">
        <h3 class="text-lg font-semibold mb-4">Observações</h3>
        <textarea 
          v-model="form.observacoes"
          rows="3"
          class="input"
          placeholder="Observações adicionais (opcional)"
        ></textarea>
      </div>

      <!-- Ações -->
      <div class="card">
        <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <div class="flex space-x-4">
          <button 
            type="submit"
            :disabled="saving || form.materiais.length === 0"
            class="btn btn-success flex-1"
          >
            {{ saving ? 'Salvando...' : '✅ Salvar Coleta' }}
          </button>
          <router-link 
            to="/coletas"
            class="btn btn-secondary flex-1 text-center"
          >
            Cancelar
          </router-link>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClientesStore } from '@/stores/clientes'
import { useMateriaisStore } from '@/stores/materiais'
import { useColetasStore } from '@/stores/coletas'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'
import { Timestamp } from 'firebase/firestore'

const router = useRouter()
const route = useRoute()
const clientesStore = useClientesStore()
const materiaisStore = useMateriaisStore()
const coletasStore = useColetasStore()
const authStore = useAuthStore()

const saving = ref(false)
const error = ref('')
const clienteSelecionado = ref(null)

const form = ref({
  clienteId: '',
  dataColeta: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  recipiente: {
    tipo: 'Tambor 200L',
    localizacao: ''
  },
  materiais: [],
  observacoes: '',
  solicitacaoId: route.query.solicitacaoId || null
})

const clientesAtivos = computed(() => {
  return clientesStore.clientes.filter(c => c.active)
})

const valorTotalColeta = computed(() => {
  return form.value.materiais.reduce((sum, m) => {
    return sum + ((m.pesoBruto - m.pesoRecipiente) * m.precoUnitario)
  }, 0)
})

const carregarDadosCliente = () => {
  const cliente = clientesStore.clientes.find(c => c.id === form.value.clienteId)
  clienteSelecionado.value = cliente
}

const adicionarMaterial = () => {
  form.value.materiais.push({
    materialId: '',
    nomeMaterial: '',
    pesoBruto: 0,
    pesoRecipiente: 0,
    precoUnitario: 0
  })
}

const removerMaterial = (index) => {
  form.value.materiais.splice(index, 1)
}

const atualizarPrecoMaterial = (index) => {
  const material = form.value.materiais[index]
  const matData = materiaisStore.materiais.find(m => m.id === material.materialId)
  
  if (matData) {
    material.nomeMaterial = matData.nome
    
    // Verificar se há preço personalizado para este cliente
    const precoPersonalizado = matData.precosPersonalizados?.[form.value.clienteId]
    material.precoUnitario = precoPersonalizado || matData.precoPadrao
  }
}

const calcularTotais = (index) => {
  // Totais são calculados no computed valorTotalColeta
}

const salvarColeta = async () => {
  error.value = ''
  
  if (!form.value.clienteId) {
    error.value = 'Selecione um cliente'
    return
  }
  
  if (form.value.materiais.length === 0) {
    error.value = 'Adicione pelo menos um material'
    return
  }

  saving.value = true
  
  try {
    const coletaData = {
      clienteId: form.value.clienteId,
      coletorId: authStore.user.uid,
      dataColeta: Timestamp.fromDate(new Date(form.value.dataColeta)),
      recipiente: form.value.recipiente,
      materiais: form.value.materiais,
      observacoes: form.value.observacoes,
      solicitacaoId: form.value.solicitacaoId
    }

    await coletasStore.createColeta(coletaData)
    alert('Coleta registrada com sucesso!')
    router.push('/coletas')
  } catch (err) {
    error.value = err.message || 'Erro ao salvar coleta'
  } finally {
    saving.value = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

onMounted(async () => {
  await Promise.all([
    clientesStore.fetchClientes(),
    materiaisStore.fetchMateriais()
  ])

  // Se veio de uma solicitação, pré-preencher dados
  if (route.query.clienteId) {
    form.value.clienteId = route.query.clienteId
    carregarDadosCliente()
  }
})
</script>
