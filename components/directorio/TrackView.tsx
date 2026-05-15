'use client'

import { useEffect } from 'react'

interface TrackViewProps {
  profileId: string
}

/**
 * Registra una vista de perfil en el servidor al montar el componente.
 * Fire-and-forget: no bloquea el render ni muestra nada al usuario.
 */
export default function TrackView({ profileId }: TrackViewProps) {
  useEffect(() => {
    const sessionKey = `sw_view_${profileId}`

    // Si ya se registró esta vista en la sesión actual, no volver a insertar
    if (sessionStorage.getItem(sessionKey)) return

    fetch('/api/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, type: 'view' }),
    })
      .then((res) => {
        // Solo marcar como "ya vista" si el servidor confirmó con 204.
        // Si el servidor devuelve error, no guardar la clave — el próximo
        // page load volverá a intentarlo.
        if (res.ok) sessionStorage.setItem(sessionKey, '1')
      })
      .catch(() => {
        // Silencioso — el tracking no debe afectar la experiencia de la compradora
      })
  }, [profileId])

  return null
}
