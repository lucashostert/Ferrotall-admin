import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  setDoc,
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db, auth } from '@/firebase/config'

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref([])
  const loading = ref(false)

  const fetchClientes = async () => {
    loading.value = true
    try {
      const q = query(
        collection(db, 'users'),
        where('tipo', '==', 'cliente'),
        orderBy('nome')
      )
      const snapshot = await getDocs(q)
      clientes.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erro ao buscar clientes:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getCliente = async (id) => {
    try {
      const docRef = doc(db, 'users', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      throw error
    }
  }

  const createCliente = async (clienteData) => {
    loading.value = true
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        clienteData.email,
        clienteData.senha
      )

      // Criar documento no Firestore (setDoc para criar novo documento)
      const userDoc = {
        email: clienteData.email,
        nome: clienteData.nome,
        tipo: 'cliente',
        cpfCnpj: clienteData.cpfCnpj || '',
        endereco: clienteData.endereco || '',
        telefone: clienteData.telefone || '',
        ativo: true,
        criadoEm: Timestamp.now()
      }

      // Usar setDoc ao invés de updateDoc para criar o documento
      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc)
      
      await fetchClientes()
      return userCredential.user.uid
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateCliente = async (id, clienteData) => {
    loading.value = true
    try {
      const docRef = doc(db, 'users', id)
      await updateDoc(docRef, {
        ...clienteData,
        atualizadoEm: Timestamp.now()
      })
      await fetchClientes()
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const toggleClienteStatus = async (id, ativo) => {
    try {
      const docRef = doc(db, 'users', id)
      await updateDoc(docRef, { ativo, atualizadoEm: Timestamp.now() })
      await fetchClientes()
    } catch (error) {
      console.error('Erro ao atualizar status do cliente:', error)
      throw error
    }
  }

  return {
    clientes,
    loading,
    fetchClientes,
    getCliente,
    createCliente,
    updateCliente,
    toggleClienteStatus
  }
})
