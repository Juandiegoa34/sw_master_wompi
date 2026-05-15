'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type ChatRole = 'assistant' | 'user'

type ChatMessage = {
  id: string
  role: ChatRole
  content: string
}

type ChatMatch = {
  id: string
  entrepreneur_id: string
  slug: string
  business_name: string | null
  description: string | null
  category: string | null
  city: string | null
  business_phone: string | null
  instagram_handle: string | null
  website_url: string | null
  other_socials: string | null
  directory_image_path: string | null
  offers_discount: boolean | null
  discount_details: string | null
  similarity: number | null
}

type ChatResponsePayload = {
  reply?: unknown
  error?: unknown
  matches?: unknown
}

const SUGGESTIONS = [
  'Busco joyeria hecha a mano en Medellin',
  'Quiero negocios de tecnologia para emprender',
  'Buscame marcas de ropa con descuento',
]

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function formatSimilarity(value: number | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${Math.round(value * 100)}%`
}

function isChatResponsePayload(value: unknown): value is ChatResponsePayload {
  return typeof value === 'object' && value !== null
}

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hola. Puedo conversar contigo y tambien ayudarte a encontrar el emprendimiento ideal.',
    },
  ])
  const [matches, setMatches] = useState<ChatMatch[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const node = scrollRef.current
    if (!node) return

    node.scrollTop = node.scrollHeight
  }, [isOpen, messages, matches])

  const quickActions = useMemo(
    () =>
      SUGGESTIONS.map((suggestion) => (
        <button
          key={suggestion}
          type="button"
          onClick={() => setInput(suggestion)}
          className="sw-chat-chip"
        >
          {suggestion}
        </button>
      )),
    []
  )

  async function sendMessage(messageText: string) {
    const trimmed = messageText.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = {
      id: makeId(),
      role: 'user',
      content: trimmed,
    }

    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsLoading(true)
    setMatches([])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed }),
      })

      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new Error('La respuesta del servidor no fue válida (JSON inválido)')
      }

      if (!isChatResponsePayload(payload)) {
        throw new Error('Respuesta inválida del servidor')
      }

      if (!response.ok) {
        throw new Error(payload instanceof Object && 'error' in payload ? (payload.error as string) : 'No se pudo completar la búsqueda')
      }

      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: payload instanceof Object && 'reply' in payload ? (payload.reply as string) : 'Respuesta inválida del servidor',
      }

      setMessages((current) => [...current, assistantMessage])
      setMatches(Array.isArray(payload.matches) ? (payload.matches as ChatMatch[]) : [])
    } catch (error) {
      const fallback = error instanceof Error ? error.message : 'Ocurrio un error inesperado'
      setMessages((current) => [
        ...current,
        {
          id: makeId(),
          role: 'assistant',
          content: fallback,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="sw-chat-launcher"
        aria-label={isOpen ? 'Cerrar chat de busqueda' : 'Abrir chat de busqueda'}
      >
        <span className="sw-chat-launcher-dot" aria-hidden="true" />
        <span className="sw-chat-launcher-text">Buscar con IA</span>
      </button>

      {isOpen && (
        <section className="sw-chat-panel" aria-label="Asistente de SW Mujeres">
          <header className="sw-chat-header">
            <div>
              <div className="sw-chat-eyebrow">SW Mujeres</div>
              <h2 className="sw-chat-title">Encuentra tu emprendimiento ideal</h2>
            </div>
            <button type="button" onClick={() => setIsOpen(false)} className="sw-chat-close">
              Cerrar
            </button>
          </header>

          <div ref={scrollRef} className="sw-chat-body">
            <div className="sw-chat-suggestions">{quickActions}</div>

            <div className="sw-chat-messages">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={message.role === 'user' ? 'sw-chat-message sw-chat-message-user' : 'sw-chat-message sw-chat-message-assistant'}
                >
                  <span className="sw-chat-message-role">
                    {message.role === 'user' ? 'Tu' : 'SW Mujeres'}
                  </span>
                  <p>{message.content}</p>
                </article>
              ))}

              {isLoading && (
                <article className="sw-chat-message sw-chat-message-assistant">
                  <span className="sw-chat-message-role">SW Mujeres</span>
                  <p>Pensando tu respuesta...</p>
                </article>
              )}
            </div>

            {matches.length > 0 && (
              <div className="sw-chat-results">
                <div className="sw-chat-results-title">Resultados encontrados</div>
                <div className="sw-chat-results-list">
                  {matches.map((match) => (
                    <Link key={match.id} href={`/directorio/${match.slug}`} className="sw-chat-result-card">
                      <div className="sw-chat-result-media">
                        {match.directory_image_path ? (
                          <Image
                            src={match.directory_image_path}
                            alt={match.business_name ?? 'Negocio encontrado'}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="sw-chat-result-fallback" aria-hidden="true">
                            {match.business_name?.slice(0, 1) ?? 'S'}
                          </div>
                        )}
                      </div>
                      <div className="sw-chat-result-copy">
                        <div className="sw-chat-result-name">{match.business_name}</div>
                        <div className="sw-chat-result-meta">{match.category ?? 'Sin categoria'} · {match.city ?? 'Sin ciudad'}</div>
                        <div className="sw-chat-result-meta">{match.business_phone ?? 'Sin telefono'}</div>
                        <div className="sw-chat-result-similarity">Coincidencia {formatSimilarity(match.similarity)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            className="sw-chat-form"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage(input)
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ej. joyeria artesanal en Medellin"
              rows={2}
              className="sw-chat-input"
            />
            <button type="submit" disabled={isLoading || !input.trim()} className="sw-chat-submit">
              {isLoading ? 'Buscando...' : 'Buscar'}
            </button>
          </form>
        </section>
      )}
    </>
  )
}
