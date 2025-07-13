"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import {
  Send,
  Paperclip,
  Smile,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  AlertCircle,
  MessageSquare,
  Users,
  Download,
  Reply,
} from "lucide-react"
import { useChat, type ChatMessage } from "@/hooks/use-chat"
import { useAuth } from "@/hooks/use-auth"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ChatSystemProps {
  projectId: string
}

const EMOJI_OPTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🚀"]

export function ChatSystem({ projectId }: ChatSystemProps) {
  const [newMessage, setNewMessage] = useState("")
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [showParticipants, setShowParticipants] = useState(false)
  const [newParticipantEmail, setNewParticipantEmail] = useState("")
  const [newParticipantRole, setNewParticipantRole] = useState<"admin" | "member" | "viewer">("member")
  const [uploadingFile, setUploadingFile] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()
  const {
    messages,
    participants,
    loading,
    error,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    addParticipant,
    uploadFile,
    markAsRead,
  } = useChat(projectId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Mark messages as read when component mounts or messages change
    markAsRead()
  }, [messages, markAsRead])

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    try {
      // Extract mentions from message content
      const mentionRegex = /@(\S+)/g
      const mentions: string[] = []
      let match
      while ((match = mentionRegex.exec(newMessage)) !== null) {
        const mentionedEmail = match[1]
        const participant = participants.find((p) => p.user_email === mentionedEmail)
        if (participant) {
          mentions.push(participant.user_id)
        }
      }

      await sendMessage(newMessage.trim(), "text", undefined, mentions)
      setNewMessage("")
      setReplyingTo(null)
    } catch (error) {
      console.error("Failed to send message:", error)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return

    try {
      await editMessage(messageId, editContent.trim())
      setEditingMessage(null)
      setEditContent("")
    } catch (error) {
      console.error("Failed to edit message:", error)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
    } catch (error) {
      console.error("Failed to delete message:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      const fileData = await uploadFile(file)
      const messageType = file.type.startsWith("image/") ? "image" : "file"
      await sendMessage(`Shared a file: ${file.name}`, messageType, fileData)
    } catch (error) {
      console.error("Failed to upload file:", error)
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleAddParticipant = async () => {
    if (!newParticipantEmail.trim()) return

    try {
      await addParticipant(newParticipantEmail.trim(), newParticipantRole)
      setNewParticipantEmail("")
      setNewParticipantRole("member")
      setShowParticipants(false)
    } catch (error) {
      console.error("Failed to add participant:", error)
    }
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const message = messages.find((m) => m.id === messageId)
      const existingReaction = message?.reactions?.find((r) => r.user_id === user?.id && r.emoji === emoji)

      if (existingReaction) {
        await removeReaction(messageId, emoji)
      } else {
        await addReaction(messageId, emoji)
      }
    } catch (error) {
      console.error("Failed to handle reaction:", error)
    }
  }

  const startEditing = (message: ChatMessage) => {
    setEditingMessage(message.id)
    setEditContent(message.content)
  }

  const startReplying = (message: ChatMessage) => {
    setReplyingTo(message)
    setNewMessage(`@${message.sender_email} `)
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const renderMessage = (message: ChatMessage) => {
    const isOwn = message.sender_id === user?.id
    const replyToMessage = message.reply_to ? messages.find((m) => m.id === message.reply_to) : null

    return (
      <div
        key={message.id}
        className={`flex items-start space-x-3 group ${isOwn ? "flex-row-reverse space-x-reverse" : ""}`}
      >
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">{getInitials(message.sender_name)}</AvatarFallback>
        </Avatar>

        <div className={`flex-1 min-w-0 ${isOwn ? "text-right" : ""}`}>
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? "justify-end" : ""}`}>
            <span className="text-sm font-medium text-gray-900">{message.sender_name}</span>
            <span className="text-xs text-gray-500">{formatTime(message.created_at)}</span>
            {message.is_edited && (
              <Badge variant="outline" className="text-xs">
                edited
              </Badge>
            )}
          </div>

          {replyToMessage && (
            <div className="mb-2 p-2 bg-gray-50 rounded border-l-2 border-blue-500 text-sm">
              <div className="font-medium text-gray-600">{replyToMessage.sender_name}</div>
              <div className="text-gray-500 truncate">{replyToMessage.content}</div>
            </div>
          )}

          {editingMessage === message.id ? (
            <div className="flex gap-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleEditMessage(message.id)}
                className="text-sm min-h-[60px]"
              />
              <div className="flex flex-col gap-1">
                <Button size="sm" onClick={() => handleEditMessage(message.id)}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingMessage(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {message.message_type === "file" || message.message_type === "image" ? (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4" />
                    <span className="text-sm font-medium">{message.file_name}</span>
                    {message.file_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={message.file_url} download target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                  {message.message_type === "image" && message.file_url && (
                    <img
                      src={message.file_url || "/placeholder.svg"}
                      alt={message.file_name}
                      className="mt-2 max-w-xs rounded border"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-sm text-gray-700 break-words flex-1">{message.content}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <Smile className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <div className="grid grid-cols-4 gap-1 p-2">
                          {EMOJI_OPTIONS.map((emoji) => (
                            <Button
                              key={emoji}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleReaction(message.id, emoji)}
                            >
                              {emoji}
                            </Button>
                          ))}
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startReplying(message)}>
                          <Reply className="h-3 w-3 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(message.content)}>
                          <Copy className="h-3 w-3 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        {isOwn && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => startEditing(message)}>
                              <Edit className="h-3 w-3 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteMessage(message.id)} className="text-red-600">
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}

              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(
                    message.reactions.reduce(
                      (acc, reaction) => {
                        acc[reaction.emoji] = (acc[reaction.emoji] || []).concat(reaction)
                        return acc
                      },
                      {} as Record<string, typeof message.reactions>,
                    ),
                  ).map(([emoji, reactions]) => (
                    <Button
                      key={emoji}
                      variant="outline"
                      size="sm"
                      className={`h-6 px-2 text-xs ${
                        reactions.some((r) => r.user_id === user?.id) ? "bg-blue-50 border-blue-200" : ""
                      }`}
                      onClick={() => handleReaction(message.id, emoji)}
                    >
                      {emoji} {reactions.length}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>Team Communication</CardTitle>
          <CardDescription>Loading chat...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="flex-1 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Error loading chat: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Team Communication
            </CardTitle>
            <CardDescription>
              Real-time chat with {participants.length} team member{participants.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>

          <Dialog open={showParticipants} onOpenChange={setShowParticipants}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Manage Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Team Members</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Members</h4>
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">{participant.user_email}</div>
                        <div className="text-sm text-gray-500">{participant.role}</div>
                      </div>
                      <Badge variant="outline">{participant.role}</Badge>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Add New Member</h4>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@example.com"
                        value={newParticipantEmail}
                        onChange={(e) => setNewParticipantEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={newParticipantRole} onValueChange={(value: any) => setNewParticipantRole(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viewer">Viewer</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button onClick={handleAddParticipant} className="w-full">
                      Add Member
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-600">Start the conversation with your team</p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Preview */}
        {replyingTo && (
          <div className="px-4 py-2 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-blue-600">Replying to {replyingTo.sender_name}</span>
                <div className="text-gray-600 truncate">{replyingTo.content}</div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                ×
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex items-end space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />

            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
              <Paperclip className="h-4 w-4" />
            </Button>

            <div className="flex-1">
              <Textarea
                placeholder="Type a message... Use @email to mention someone"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                className="min-h-[40px] max-h-[120px] resize-none"
              />
            </div>

            <Button onClick={handleSendMessage} disabled={!newMessage.trim() || uploadingFile} size="sm">
              <Send className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-2 text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line. Use @email to mention team members.
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
