import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/firebase/config'

/**
 * Envia notificação via OneSignal para um usuário específico
 * @param {string} userId - Firebase UID do usuário
 * @param {string} title - Título da notificação
 * @param {string} message - Mensagem da notificação
 * @param {object} data - Dados adicionais
 */
export const sendNotificationToUser = async (userId, title, message, data = {}) => {
  const oneSignalAppId = import.meta.env.VITE_ONESIGNAL_APP_ID
  const oneSignalApiKey = import.meta.env.VITE_ONESIGNAL_REST_API_KEY

  if (!oneSignalAppId || !oneSignalApiKey) {
    console.error('OneSignal não configurado')
    return
  }

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${oneSignalApiKey}`
      },
      body: JSON.stringify({
        app_id: oneSignalAppId,
        include_external_user_ids: [userId],
        headings: { en: title, pt: title },
        contents: { en: message, pt: message },
        data: data
      })
    })

    const result = await response.json()
    
    // Salvar notificação no Firestore
    await saveNotificationToFirestore(userId, title, message, data)
    
    return result
  } catch (error) {
    console.error('Erro ao enviar notificação:', error)
    throw error
  }
}

/**
 * Salva a notificação no Firestore para histórico
 */
const saveNotificationToFirestore = async (userId, title, message, data) => {
  try {
    const userRef = doc(db, 'users', userId)
    await updateDoc(userRef, {
      notifications: arrayUnion({
        title,
        message,
        data,
        timestamp: new Date(),
        read: false
      })
    })
  } catch (error) {
    console.error('Erro ao salvar notificação no Firestore:', error)
  }
}

/**
 * Notifica cliente sobre nova solicitação recebida
 */
export const notifyCollectionScheduled = async (clientId, coletaData) => {
  await sendNotificationToUser(
    clientId,
    'Coleta Agendada',
    `Sua coleta foi agendada para breve. Tenha o recipiente pronto!`,
    {
      type: 'collection_scheduled',
      coletaId: coletaData.id
    }
  )
}

/**
 * Notifica cliente sobre coleta concluída
 */
export const notifyCollectionCompleted = async (clientId, coletaData) => {
  await sendNotificationToUser(
    clientId,
    'Coleta Concluída',
    `Coleta realizada! Valor: R$ ${coletaData.valorTotalColeta.toFixed(2)}`,
    {
      type: 'collection_completed',
      coletaId: coletaData.id,
      valor: coletaData.valorTotalColeta
    }
  )
}

/**
 * Notifica admin sobre nova solicitação
 */
export const notifyAdminNewRequest = async (adminIds, solicitacaoData) => {
  for (const adminId of adminIds) {
    await sendNotificationToUser(
      adminId,
      'Nova Solicitação de Coleta',
      `${solicitacaoData.clienteNome} solicitou uma coleta - ${solicitacaoData.percentual}%`,
      {
        type: 'new_request',
        solicitacaoId: solicitacaoData.id
      }
    )
  }
}
