import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc,
  addDoc, 
  updateDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useColetasStore = defineStore('coletas', () => {
  const coletas = ref([])
  const loading = ref(false)

  const fetchColetas = async (filtros = {}) => {
    loading.value = true
    try {
      let q = query(collection(db, 'coletas'), orderBy('dataColeta', 'desc'))

      if (filtros.clienteId) {
        q = query(q, where('clienteId', '==', filtros.clienteId))
      }

      if (filtros.dataInicio && filtros.dataFim) {
        q = query(
          q,
          where('dataColeta', '>=', filtros.dataInicio),
          where('dataColeta', '<=', filtros.dataFim)
        )
      }

      if (filtros.limit) {
        q = query(q, limit(filtros.limit))
      }

      const snapshot = await getDocs(q)
      coletas.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erro ao buscar coletas:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const getColeta = async (id) => {
    try {
      const docRef = doc(db, 'coletas', id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      }
      return null
    } catch (error) {
      console.error('Erro ao buscar coleta:', error)
      throw error
    }
  }

  const createColeta = async (coletaData) => {
    loading.value = true
    try {
      // Calcular totais
      const materiais = coletaData.materiais.map(m => ({
        ...m,
        pesoLiquido: parseFloat(m.pesoBruto) - parseFloat(m.pesoRecipiente),
        valorTotal: (parseFloat(m.pesoBruto) - parseFloat(m.pesoRecipiente)) * parseFloat(m.precoUnitario)
      }))

      const valorTotalColeta = materiais.reduce((sum, m) => sum + m.valorTotal, 0)

      const coleta = {
        clienteId: coletaData.clienteId,
        coletorId: coletaData.coletorId,
        dataColeta: coletaData.dataColeta || Timestamp.now(),
        recipiente: {
          tipo: coletaData.recipiente.tipo,
          localizacao: coletaData.recipiente.localizacao
        },
        materiais,
        valorTotalColeta,
        statusPagamento: 'pendente',
        createdAt: Timestamp.now()
      }

      const docRef = await addDoc(collection(db, 'coletas'), coleta)
      
      // Se veio de uma solicitação, marcar como concluída
      if (coletaData.solicitacaoId) {
        await updateDoc(doc(db, 'solicitacoes', coletaData.solicitacaoId), {
          status: 'concluida',
          dataConclusao: Timestamp.now(),
          coletaId: docRef.id
        })
      }

      await fetchColetas()
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar coleta:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateStatusPagamento = async (id, status) => {
    try {
      const docRef = doc(db, 'coletas', id)
      await updateDoc(docRef, {
        statusPagamento: status,
        dataPagamento: status === 'pago' ? Timestamp.now() : null,
        updatedAt: Timestamp.now()
      })
      await fetchColetas()
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error)
      throw error
    }
  }

  const getColetasPorPeriodo = async (dataInicio, dataFim) => {
    try {
      const q = query(
        collection(db, 'coletas'),
        where('dataColeta', '>=', dataInicio),
        where('dataColeta', '<=', dataFim),
        orderBy('dataColeta', 'desc')
      )
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erro ao buscar coletas por período:', error)
      throw error
    }
  }

  const totalPorMaterial = computed(() => {
    const totais = {}
    coletas.value.forEach(coleta => {
      coleta.materiais.forEach(material => {
        if (!totais[material.nomeMaterial]) {
          totais[material.nomeMaterial] = {
            peso: 0,
            valor: 0,
            quantidade: 0
          }
        }
        totais[material.nomeMaterial].peso += material.pesoLiquido
        totais[material.nomeMaterial].valor += material.valorTotal
        totais[material.nomeMaterial].quantidade++
      })
    })
    return totais
  })

  return {
    coletas,
    loading,
    totalPorMaterial,
    fetchColetas,
    getColeta,
    createColeta,
    updateStatusPagamento,
    getColetasPorPeriodo
  }
})
