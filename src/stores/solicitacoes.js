import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  collection, 
  doc,
  getDocs, 
  getDoc,
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useSolicitacoesStore = defineStore('solicitacoes', () => {
  const solicitacoes = ref([])
  const loading = ref(false)
  let unsubscribe = null

  const fetchSolicitacoes = async (status = null) => {
    loading.value = true
    try {
      let q = query(
        collection(db, 'solicitacoes'),
        orderBy('dataSolicitacao', 'desc')
      )

      if (status) {
        q = query(q, where('status', '==', status))
      }

      const snapshot = await getDocs(q)
      solicitacoes.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erro ao buscar solicitações:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getSolicitacao = async (id) => {
    try {
      const docRef = doc(db, 'solicitacoes', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar solicitação:', error)
      throw error
    }
  }

  const updateStatus = async (id, status, dados = {}) => {
    try {
      const docRef = doc(db, 'solicitacoes', id)
      const updates = {
        status,
        updatedAt: Timestamp.now(),
        ...dados
      }

      if (status === 'agendada') {
        updates.dataAgendamento = Timestamp.now()
      } else if (status === 'concluida') {
        updates.dataConclusao = Timestamp.now()
      }

      await updateDoc(docRef, updates)
      await fetchSolicitacoes()
    } catch (error) {
      console.error('Erro ao atualizar status da solicitação:', error)
      throw error
    }
  }

  const listenToSolicitacoes = (callback) => {
    const q = query(
      collection(db, 'solicitacoes'),
      where('status', '==', 'pendente'),
      orderBy('dataSolicitacao', 'desc')
    )

    unsubscribe = onSnapshot(q, (snapshot) => {
      const novasSolicitacoes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      
      if (callback) {
        callback(novasSolicitacoes)
      }
      
      solicitacoes.value = novasSolicitacoes
    })
  }

  const stopListening = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return {
    solicitacoes,
    loading,
    fetchSolicitacoes,
    getSolicitacao,
    updateStatus,
    listenToSolicitacoes,
    stopListening
  }
})
