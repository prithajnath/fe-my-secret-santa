"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { format } from "date-fns"

interface Message {
  id: string
  content: string
  isFromGiver: boolean
  createdAt: Date
}

interface MessageThreadProps {
  conversationId: string
  messages: Message[]
  isGiver: boolean
}

export default function MessageThread({ conversationId, messages, isGiver }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messageList, setMessageList] = useState(messages)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messageList])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)

    // Optimistically add message to UI
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      content: newMessage,
      isFromGiver: isGiver,
      createdAt: new Date(),
    }

    setMessageList([...messageList, tempMessage])
    setNewMessage("")

    // TODO: Implement API call to send message
    setTimeout(() => {
      setSending(false)
    }, 500)
  }

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2">
        {messageList.map((message) => {
          const isOwnMessage = message.isFromGiver === isGiver
          return (
            <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isOwnMessage ? "order-2" : "order-1"}`}>
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    isOwnMessage ? "bg-black text-white rounded-br-none" : "bg-gray-100 text-gray-900 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed break-words">{message.content}</p>
                </div>
                <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? "text-right" : "text-left"}`}>
                  {format(message.createdAt, "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 pt-4">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 resize-none min-h-[60px] max-h-[120px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button type="submit" disabled={!newMessage.trim() || sending} className="self-end">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
