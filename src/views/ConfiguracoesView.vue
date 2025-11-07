<template>
  <div class="space-y-6">
    <h2 class="text-2xl font-bold">Configurações</h2>

    <div class="card">
      <h3 class="text-lg font-semibold mb-4">Dados da Empresa</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="label">Nome da Empresa</label>
          <input v-model="config.nomeEmpresa" type="text" class="input" />
        </div>
        <div>
          <label class="label">CNPJ</label>
          <input v-model="config.cnpj" type="text" class="input" />
        </div>
        <div>
          <label class="label">Telefone</label>
          <input v-model="config.telefone" type="tel" class="input" />
        </div>
        <div>
          <label class="label">E-mail</label>
          <input v-model="config.email" type="email" class="input" />
        </div>
        <div class="md:col-span-2">
          <label class="label">Endereço</label>
          <textarea v-model="config.endereco" rows="2" class="input"></textarea>
        </div>
      </div>
      <button @click="salvarConfig" class="btn btn-primary mt-4">💾 Salvar Configurações</button>
    </div>

    <div class="card">
      <h3 class="text-lg font-semibold mb-4">Sistema</h3>
      <p class="text-gray-600">Versão: 1.0.0</p>
      <p class="text-gray-600 mt-2">Desenvolvido para Ferrotall Sucatas</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const config = ref({
  nomeEmpresa: 'Ferrotall Sucatas',
  cnpj: '',
  telefone: '',
  email: '',
  endereco: ''
})

const salvarConfig = () => {
  alert('Configurações salvas!')
}
</script>
