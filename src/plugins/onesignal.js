// OneSignal Web SDK Integration
// Carrega o SDK do OneSignal via CDN

export const initOneSignal = () => {
  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID
  
  if (!appId) {
    console.warn('OneSignal App ID não configurado')
    return
  }

  // Carrega o script do OneSignal
  window.OneSignalDeferred = window.OneSignalDeferred || []
  
  window.OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: appId,
      allowLocalhostAsSecureOrigin: true,
      notifyButton: {
        enable: false,
      },
    })
    
    console.log('OneSignal inicializado')
  })

  // Adiciona o script se ainda não existir
  if (!document.getElementById('onesignal-sdk')) {
    const script = document.createElement('script')
    script.id = 'onesignal-sdk'
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js'
    script.async = true
    document.head.appendChild(script)
  }
}

export const setOneSignalExternalUserId = async (userId) => {
  if (window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.login(userId)
    })
  }
}

export const removeOneSignalExternalUserId = async () => {
  if (window.OneSignalDeferred) {
    window.OneSignalDeferred.push(async function(OneSignal) {
      await OneSignal.logout()
    })
  }
}

export default {
  install() {
    // Plugin vazio, inicialização manual
  }
}
