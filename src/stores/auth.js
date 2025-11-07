import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase/config'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(true)

  const initAuth = () => {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        user.value = firebaseUser
        await loadUserProfile(firebaseUser.uid)
      } else {
        user.value = null
        userProfile.value = null
      }
      loading.value = false
    })
  }

  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid))
      if (userDoc.exists()) {
        userProfile.value = { id: uid, ...userDoc.data() }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      await loadUserProfile(userCredential.user.uid)
      
      // Verificar se é admin
      if (userProfile.value?.tipo !== 'admin') {
        await logout()
        throw new Error('Acesso negado. Apenas administradores podem acessar este painel.')
      }
      
      // Registrar usuário no OneSignal
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.login(userCredential.user.uid)
        })
      }
      
      router.push('/')
    } catch (error) {
      console.error('Erro no login:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      // Remover usuário do OneSignal
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.logout()
        })
      }
      
      await signOut(auth)
      user.value = null
      userProfile.value = null
      router.push('/login')
    } catch (error) {
      console.error('Erro no logout:', error)
      throw error
    }
  }

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error)
      throw error
    }
  }

  return {
    user,
    userProfile,
    loading,
    initAuth,
    login,
    logout,
    resetPassword
  }
})
