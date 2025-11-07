<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Materiais e Preços</h2>
      <button 
        @click="showModal = true"
        class="btn btn-primary"
      >
        ➕ Novo Material
      </button>
    </div>

    <!-- Lista de Materiais -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        Carregando materiais...
      </div>
      
      <div v-else-if="materiaisStore.materiais.length === 0" class="text-center py-8 text-gray-500">
        Nenhum material cadastrado
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4">Material</th>
              <th class="text-right py-3 px-4">Preço Padrão (R$/kg)</th>
              <th class="text-center py-3 px-4">Preços Personalizados</th>
              <th class="text-center py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="material in materiaisStore.materiais" 
              :key="material.id"
              class="border-b hover:bg-gray-50"
            >
              <td class="py-3 px-4 font-medium">{{ material.nome }}</td>
              <td class="py-3 px-4 text-right">{{ formatCurrency(material.precoPadrao) }}</td>
              <td class="py-3 px-4 text-center">
                <span class="text-gray-600">
                  {{ Object.keys(material.precosPersonalizados || {}).length }} cliente(s)
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-center space-x-2">
                  <button 
                    @click="editMaterial(material)"
                    class="text-green-600 hover:text-green-800"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    @click="setPrecoPersonalizado(material)"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    💰 Preços
                  </button>
                  <button 
                    @click="deleteMaterial(material)"
                    class="text-red-600 hover:text-red-800"
                  >
                    ❌ Excluir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Novo/Editar Material -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div 
        class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        @click.stop
      >
        <h3 class="text-xl font-semibold mb-4">
          {{ editingMaterial ? 'Editar Material' : 'Novo Material' }}
        </h3>
        
        <form @submit.prevent="saveMaterial" class="space-y-4">
          <div>
            <label class="label">Nome do Material *</label>
            <input 
              v-model="form.nome"
              type="text"
              required
              class="input"
            />
          </div>

          <div>
            <label class="label">Preço Padrão (R$/kg) *</label>
            <input 
              v-model.number="form.precoPadrao"
              type="number"
              step="0.01"
              min="0"
              required
              class="input"
            />
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <div class="flex space-x-3">
            <button 
              type="submit"
              :disabled="saving"
              class="btn btn-primary flex-1"
            >
              {{ saving ? 'Salvando...' : 'Salvar' }}
            </button>
            <button 
              type="button"
              @click="closeModal"
              class="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Preços Personalizados -->
    <div 
      v-if="showPrecosModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showPrecosModal = false"
    >
      <div 
        class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <h3 class="text-xl font-semibold mb-4">
          Preços Personalizados - {{ selectedMaterial?.nome }}
        </h3>
        
        <p class="text-gray-600 mb-4">
          Preço padrão: <strong>{{ formatCurrency(selectedMaterial?.precoPadrao) }}/kg</strong>
        </p>

        <div class="space-y-3">
          <div 
            v-for="cliente in clientesStore.clientes.filter(c => c.active)" 
            :key="cliente.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <span class="font-medium">{{ cliente.nome }}</span>
            <div class="flex items-center space-x-2">
              <input 
                v-model.number="precosPersonalizados[cliente.id]"
                type="number"
                step="0.01"
                min="0"
                :placeholder="`Padrão: ${selectedMaterial?.precoPadrao || 0}`"
                class="w-32 input"
              />
              <button 
                @click="savePrecoPersonalizado(cliente.id)"
                class="btn btn-primary btn-sm"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>

        <div class="mt-6">
          <button 
            @click="showPrecosModal = false"
            class="btn btn-secondary w-full"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useMateriaisStore } from '@/stores/materiais'
import { useClientesStore } from '@/stores/clientes'

const materiaisStore = useMateriaisStore()
const clientesStore = useClientesStore()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const showPrecosModal = ref(false)
const editingMaterial = ref(null)
const selectedMaterial = ref(null)
const precosPersonalizados = ref({})
const error = ref('')

const form = ref({
  nome: '',
  precoPadrao: 0
})

const editMaterial = (material) => {
  editingMaterial.value = material
  form.value = {
    nome: material.nome,
    precoPadrao: material.precoPadrao
  }
  showModal.value = true
}

const saveMaterial = async () => {
  error.value = ''
  saving.value = true
  
  try {
    if (editingMaterial.value) {
      await materiaisStore.updateMaterial(editingMaterial.value.id, form.value)
    } else {
      await materiaisStore.createMaterial(form.value)
    }
    closeModal()
  } catch (err) {
    error.value = err.message || 'Erro ao salvar material'
  } finally {
    saving.value = false
  }
}

const setPrecoPersonalizado = (material) => {
  selectedMaterial.value = material
  precosPersonalizados.value = { ...(material.precosPersonalizados || {}) }
  showPrecosModal.value = true
}

const savePrecoPersonalizado = async (clienteId) => {
  const preco = precosPersonalizados.value[clienteId]
  if (preco && preco > 0) {
    await materiaisStore.setPrecoPersonalizado(selectedMaterial.value.id, clienteId, preco)
    alert('Preço personalizado salvo com sucesso!')
  }
}

const deleteMaterial = async (material) => {
  if (confirm(`Deseja realmente excluir o material "${material.nome}"?`)) {
    await materiaisStore.deleteMaterial(material.id)
  }
}

const closeModal = () => {
  showModal.value = false
  editingMaterial.value = null
  error.value = ''
  form.value = {
    nome: '',
    precoPadrao: 0
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value || 0)
}

onMounted(async () => {
  loading.value = true
  await Promise.all([
    materiaisStore.fetchMateriais(),
    clientesStore.fetchClientes()
  ])
  loading.value = false
})
</script>
