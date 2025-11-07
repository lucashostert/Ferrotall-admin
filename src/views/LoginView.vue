<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 px-4">
    <div class="max-w-md w-full">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <div class="text-center mb-8">
          <h1 class="text-4xl font-bold text-ferrotall-primary mb-2">Ferrotall</h1>
          <p class="text-gray-600">Painel Administrativo</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label class="label">E-mail</label>
            <input 
              v-model="email"
              type="email"
              required
              class="input"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label class="label">Senha</label>
            <input 
              v-model="password"
              type="password"
              required
              class="input"
              placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p class="text-sm text-red-600">{{ error }}</p>
          </div>

          <button 
            type="submit"
            :disabled="loading"
            class="w-full btn btn-primary py-3 text-lg"
          >
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>

          <div class="text-center">
            <button 
              type="button"
              @click="showResetPassword = true"
              class="text-sm text-blue-600 hover:text-blue-800"
            >
              Esqueci minha senha
            </button>
          </div>
        </form>
      </div>

      <p class="text-center text-white text-sm mt-4">
        © 2025 Ferrotall Sucatas - Todos os direitos reservados
      </p>
    </div>

    <!-- Modal Reset Password -->
    <div 
      v-if="showResetPassword"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="showResetPassword = false"
    >
      <div 
        class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
        @click.stop
      >
        <h3 class="text-xl font-semibold mb-4">Recuperar Senha</h3>
        <p class="text-gray-600 mb-4">
          Digite seu e-mail para receber instruções de recuperação.
        </p>
        <input 
          v-model="resetEmail"
          type="email"
          class="input mb-4"
          placeholder="seu@email.com"
        />
        <div class="flex space-x-3">
          <button 
            @click="handleResetPassword"
            class="btn btn-primary flex-1"
          >
            Enviar
          </button>
          <button 
            @click="showResetPassword = false"
            class="btn btn-secondary flex-1"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const resetEmail = ref('')
const error = ref('')
const loading = ref(false)
const showResetPassword = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true
  
  try {
    await authStore.login(email.value, password.value)
  } catch (err) {
    error.value = err.message || 'Erro ao fazer login. Verifique suas credenciais.'
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  try {
    await authStore.resetPassword(resetEmail.value)
    alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.')
    showResetPassword.value = false
    resetEmail.value = ''
  } catch (err) {
    alert('Erro ao enviar e-mail de recuperação.')
  }
}
</script>
