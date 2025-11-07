<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold">Clientes</h2>
      <button 
        @click="showModal = true"
        class="btn btn-primary"
      >
        ➕ Novo Cliente
      </button>
    </div>

    <!-- Pesquisa -->
    <div class="card">
      <input 
        v-model="searchTerm"
        type="text"
        placeholder="Pesquisar clientes..."
        class="input"
      />
    </div>

    <!-- Lista de Clientes -->
    <div class="card">
      <div v-if="loading" class="text-center py-8 text-gray-500">
        Carregando clientes...
      </div>
      
      <div v-else-if="filteredClientes.length === 0" class="text-center py-8 text-gray-500">
        Nenhum cliente encontrado
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4">Nome</th>
              <th class="text-left py-3 px-4">CPF/CNPJ</th>
              <th class="text-left py-3 px-4">Telefone</th>
              <th class="text-left py-3 px-4">E-mail</th>
              <th class="text-center py-3 px-4">Status</th>
              <th class="text-center py-3 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="cliente in filteredClientes" 
              :key="cliente.id"
              class="border-b hover:bg-gray-50"
            >
              <td class="py-3 px-4 font-medium">{{ cliente.nome }}</td>
              <td class="py-3 px-4">{{ cliente.cpfCnpj }}</td>
              <td class="py-3 px-4">{{ cliente.telefone }}</td>
              <td class="py-3 px-4">{{ cliente.email }}</td>
              <td class="py-3 px-4 text-center">
                <span 
                  class="px-3 py-1 rounded-full text-xs font-medium"
                  :class="cliente.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                >
                  {{ cliente.active ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center justify-center space-x-2">
                  <router-link 
                    :to="`/clientes/${cliente.id}`"
                    class="text-blue-600 hover:text-blue-800"
                  >
                    👁️ Ver
                  </router-link>
                  <button 
                    @click="editCliente(cliente)"
                    class="text-green-600 hover:text-green-800"
                  >
                    ✏️ Editar
                  </button>
                  <button 
                    @click="toggleStatus(cliente)"
                    class="text-red-600 hover:text-red-800"
                  >
                    {{ cliente.active ? '❌ Desativar' : '✅ Ativar' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Novo/Editar Cliente -->
    <div 
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div 
        class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <h3 class="text-xl font-semibold mb-4">
          {{ editingCliente ? 'Editar Cliente' : 'Novo Cliente' }}
        </h3>
        
        <form @submit.prevent="saveCliente" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="label">Nome *</label>
              <input 
                v-model="form.nome"
                type="text"
                required
                class="input"
              />
            </div>

            <div>
              <label class="label">CPF/CNPJ</label>
              <input 
                v-model="form.cpfCnpj"
                type="text"
                class="input"
              />
            </div>

            <div>
              <label class="label">E-mail *</label>
              <input 
                v-model="form.email"
                type="email"
                required
                :disabled="!!editingCliente"
                class="input"
              />
            </div>

            <div>
              <label class="label">Telefone</label>
              <input 
                v-model="form.telefone"
                type="tel"
                class="input"
              />
            </div>

            <div v-if="!editingCliente">
              <label class="label">Senha *</label>
              <input 
                v-model="form.senha"
                type="password"
                required
                minlength="6"
                class="input"
              />
            </div>
          </div>

          <div>
            <label class="label">Endereço</label>
            <textarea 
              v-model="form.endereco"
              rows="3"
              class="input"
            ></textarea>
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <div class="flex space-x-3 pt-4">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useClientesStore } from '@/stores/clientes'

const clientesStore = useClientesStore()

const loading = ref(false)
const saving = ref(false)
const showModal = ref(false)
const editingCliente = ref(null)
const searchTerm = ref('')
const error = ref('')

const form = ref({
  nome: '',
  cpfCnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  senha: ''
})

const filteredClientes = computed(() => {
  if (!searchTerm.value) return clientesStore.clientes
  
  const term = searchTerm.value.toLowerCase()
  return clientesStore.clientes.filter(c => 
    c.nome.toLowerCase().includes(term) ||
    c.email.toLowerCase().includes(term) ||
    c.cpfCnpj?.includes(term)
  )
})

const editCliente = (cliente) => {
  editingCliente.value = cliente
  form.value = {
    nome: cliente.nome,
    cpfCnpj: cliente.cpfCnpj || '',
    email: cliente.email,
    telefone: cliente.telefone || '',
    endereco: cliente.endereco || '',
    senha: ''
  }
  showModal.value = true
}

const saveCliente = async () => {
  error.value = ''
  saving.value = true
  
  try {
    if (editingCliente.value) {
      await clientesStore.updateCliente(editingCliente.value.id, form.value)
    } else {
      await clientesStore.createCliente(form.value)
    }
    closeModal()
  } catch (err) {
    error.value = err.message || 'Erro ao salvar cliente'
  } finally {
    saving.value = false
  }
}

const toggleStatus = async (cliente) => {
  const action = cliente.active ? 'desativar' : 'ativar'
  if (confirm(`Deseja realmente ${action} este cliente?`)) {
    await clientesStore.toggleClienteStatus(cliente.id, !cliente.active)
  }
}

const closeModal = () => {
  showModal.value = false
  editingCliente.value = null
  error.value = ''
  form.value = {
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    senha: ''
  }
}

onMounted(async () => {
  loading.value = true
  await clientesStore.fetchClientes()
  loading.value = false
})
</script>
