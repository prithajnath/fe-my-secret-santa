"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { messagesApi } from "@/lib/api"
import type { PairMessage } from "@/types"

const POLL_INTERVAL_MS = 5000

interface PairMessageThreadProps {
  channelId: string
  isGiver: boolean
}

export default function PairMessageThread({ channelId, isGiver }: PairMessageThreadProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<PairMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingIds = useRef(new Set<number>())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await messagesApi.getPairMessages(channelId)
        setMessages(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages")
      } finally {
        setLoading(false)
      }
    }
    fetchMessages()
  }, [channelId])

  // Poll for new messages while the tab is visible
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return
      try {
        const data = await messagesApi.getPairMessages(channelId)
        setMessages((prev) => {
          const pending = prev.filter((m) => pendingIds.current.has(m.id))
          const confirmed = prev.filter((m) => !pendingIds.current.has(m.id))
          // Keep the same array when nothing changed so we don't re-scroll
          if (data.length === confirmed.length && data.at(-1)?.id === confirmed.at(-1)?.id) return prev
          return [...data, ...pending]
        })
      } catch {
        // Ignore transient poll failures; the next tick will retry
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [channelId])

  useEffect(() => {
    if (!loading) {
      scrollToBottom()
    }
  }, [messages, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)

    // Optimistically add message to UI
    const tempMessage: PairMessage = {
      id: Date.now(),
      text: newMessage,
      direction: "sent",
      created_at: new Date().toISOString(),
    }

    pendingIds.current.add(tempMessage.id)
    setMessages((prev) => [...prev, tempMessage])
    const messageText = newMessage
    setNewMessage("")

    try {
      const sentMessage = await messagesApi.sendPairMessage(channelId, messageText)
      // Replace temp message with actual message, unless a poll already brought it in
      setMessages((prev) =>
        prev.some((m) => m.id === sentMessage.id)
          ? prev.filter((m) => m.id !== tempMessage.id)
          : prev.map((m) => (m.id === tempMessage.id ? sentMessage : m)),
      )
    } catch (err) {
      // Remove temp message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      pendingIds.current.delete(tempMessage.id)
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      {error && <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.direction === "sent"
            return (
              <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isOwnMessage ? "order-2" : "order-1"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isOwnMessage ? "bg-black text-white rounded-br-none" : "bg-gray-100 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm md:text-base leading-relaxed break-words">{message.text}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                    {format(new Date(message.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 pt-4">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isGiver ? "Ask about gift preferences..." : "Share your interests and hints..."}
          className="flex-1 resize-none min-h-[60px] max-h-[120px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button type="submit" disabled={!newMessage.trim() || sending} className="self-end">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
