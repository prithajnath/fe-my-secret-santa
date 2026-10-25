"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Loader2, Users } from "lucide-react"
import { format } from "date-fns"
import { groupsApi, messagesApi } from "@/lib/api"
import type { GroupDetail, GroupMessage, MessageSender } from "@/types"

const POLL_INTERVAL_MS = 5000

interface GroupChatProps {
  groupId: number
  currentUser: MessageSender
}

export default function GroupChat({ groupId, currentUser }: GroupChatProps) {
  const [group, setGroup] = useState<GroupDetail | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<GroupMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pendingIds = useRef(new Set<number>())

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const [groupData, messageData] = await Promise.all([
          groupsApi.get(groupId),
          messagesApi.getGroupMessages(groupId),
        ])
        setGroup(groupData)
        setMessages(messageData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load messages")
      } finally {
        setLoading(false)
      }
    }
    fetchChat()
  }, [groupId])

  // Poll for new messages while the tab is visible
  useEffect(() => {
    const interval = setInterval(async () => {
      if (document.hidden) return
      try {
        const data = await messagesApi.getGroupMessages(groupId)
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
  }, [groupId])

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
    const tempMessage: GroupMessage = {
      id: Date.now(),
      text: newMessage,
      created_at: new Date().toISOString(),
      is_own_message: true,
      sender: currentUser,
    }

    pendingIds.current.add(tempMessage.id)
    setMessages((prev) => [...prev, tempMessage])
    const messageText = newMessage
    setNewMessage("")

    try {
      const sentMessage = await messagesApi.sendGroupMessage(groupId, messageText)
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

  if (error && !group) {
    return (
      <Card className="p-6 bg-red-50 border-red-200 text-center">
        <p className="text-red-800">{error}</p>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl md:text-4xl font-light">{group?.name}</h1>
        <p className="text-gray-600 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Group chat · {group?.member_count} {group?.member_count === 1 ? "member" : "members"} ·{" "}
          <Link href={`/groups/${groupId}`} className="underline hover:text-black">
            View group
          </Link>
        </p>
      </div>

      <Card className="p-6 md:p-8 bg-white/50 border border-black/5">
        <div className="flex flex-col h-[600px]">
          {error && (
            <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>
          )}

          <div className="flex-1 overflow-y-auto space-y-1 mb-6 pr-2">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No messages yet. Say hi to the group!</p>
              </div>
            ) : (
              messages.map((message, i) => {
                const isOwnMessage = message.is_own_message
                // Only label the first message in a run from the same sender
                const startsRun = i === 0 || messages[i - 1].sender.id !== message.sender.id
                return (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${isOwnMessage ? "justify-end" : "justify-start"} ${startsRun ? "pt-3" : ""}`}
                  >
                    {!isOwnMessage && (
                      <div className="w-8 flex-shrink-0">
                        {startsRun && (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={message.sender.avatar_url} alt={message.sender.first_name} />
                            <AvatarFallback>{message.sender.first_name[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    <div className="max-w-[75%]">
                      {!isOwnMessage && startsRun && (
                        <p className="text-xs font-medium text-gray-700 mb-1">{message.sender.first_name}</p>
                      )}
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
              placeholder="Message the group..."
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
      </Card>
    </>
  )
}
