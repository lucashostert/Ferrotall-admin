import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/firebase/config'

export const useMateriaisStore = defineStore('materiais', () => {
  const materiais = ref([])
  const loading = ref(false)

  // Lista padrão de materiais
  const materiaisPadrao = [
    'Cavaco de ferro',
    'Cavaco de alumínio',
    'Cavaco de inox',
    'Cavaco de cobre',
    'Cavaco de bronze',
    'Cavaco de latão',
    'Bucha de bronze',
    'Pedaço de inox',
    'Pedaço de alumínio',
    'Sucata miúda',
    'Sucata pesada',
    'Oxicorte',
    'Estamparia'
  ]

  const fetchMateriais = async () => {
    loading.value = true
    try {
      const q = query(
        collection(db, 'materiais'),
        where('active', '==', true),
        orderBy('nome')
      )
      const snapshot = await getDocs(q)
      materiais.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Erro ao buscar materiais:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const createMaterial = async (materialData) => {
    loading.value = true
    try {
      const docRef = await addDoc(collection(db, 'materiais'), {
        nome: materialData.nome,
        precoPadrao: parseFloat(materialData.precoPadrao) || 0,
        precosPersonalizados: {},
        active: true,
        createdAt: Timestamp.now()
      })
      await fetchMateriais()
      return docRef.id
    } catch (error) {
      console.error('Erro ao criar material:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const updateMaterial = async (id, materialData) => {
    loading.value = true
    try {
      const docRef = doc(db, 'materiais', id)
      await updateDoc(docRef, {
        ...materialData,
        updatedAt: Timestamp.now()
      })
      await fetchMateriais()
    } catch (error) {
      console.error('Erro ao atualizar material:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const setPrecoPersonalizado = async (materialId, clienteId, preco) => {
    try {
      const docRef = doc(db, 'materiais', materialId)
      await updateDoc(docRef, {
        [`precosPersonalizados.${clienteId}`]: parseFloat(preco),
        updatedAt: Timestamp.now()
      })
      await fetchMateriais()
    } catch (error) {
      console.error('Erro ao definir preço personalizado:', error)
      throw error
    }
  }

  const deleteMaterial = async (id) => {
    loading.value = true
    try {
      // Soft delete
      const docRef = doc(db, 'materiais', id)
      await updateDoc(docRef, {
        active: false,
        deletedAt: Timestamp.now()
      })
      await fetchMateriais()
    } catch (error) {
      console.error('Erro ao deletar material:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  const initMateriais = async () => {
    // Verifica se já existem materiais, senão cria os padrões
    const snapshot = await getDocs(collection(db, 'materiais'))
    if (snapshot.empty) {
      for (const nome of materiaisPadrao) {
        await createMaterial({ nome, precoPadrao: 0 })
      }
    }
  }

  return {
    materiais,
    loading,
    materiaisPadrao,
    fetchMateriais,
    createMaterial,
    updateMaterial,
    setPrecoPersonalizado,
    deleteMaterial,
    initMateriais
  }
})
