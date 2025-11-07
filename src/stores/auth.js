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
    loading.value = true
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          user.value = firebaseUser
          await loadUserProfile(firebaseUser.uid)
        } else {
          user.value = null
          userProfile.value = null
        }
        loading.value = false
        unsubscribe()
        resolve()
      })
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
      console.log('✅ Autenticação bem-sucedida. UID:', userCredential.user.uid)
      
      // IMPORTANTE: Setar o user antes de carregar o perfil
      user.value = userCredential.user
      
      await loadUserProfile(userCredential.user.uid)
      console.log('📄 Perfil carregado:', userProfile.value)
      
      // Verificar se é admin
      if (!userProfile.value) {
        await logout()
        throw new Error('Perfil de usuário não encontrado no Firestore. Verifique se o Document ID é igual ao UID do Authentication.')
      }
      
      if (userProfile.value.tipo !== 'admin') {
        await logout()
        throw new Error(`Acesso negado. Tipo de usuário: "${userProfile.value.tipo}". Apenas administradores podem acessar este painel.`)
      }
      
      console.log('✅ Usuário admin verificado')
      console.log('👤 User setado:', !!user.value)
      
      // Registrar usuário no OneSignal
      try {
        if (window.OneSignalDeferred) {
          window.OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.login(userCredential.user.uid)
          })
        }
      } catch (error) {
        console.warn('⚠️ Erro ao registrar no OneSignal:', error)
      }
      
      router.push('/')
    } catch (error) {
      console.error('❌ Erro no login:', error)
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
