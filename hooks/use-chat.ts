"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase"

export interface ChatMessage {
  id: string
  content: string
  message_type: "text" | "file" | "image" | "system"
  file_url?: string
  file_name?: string
  file_size?: number
  file_type?: string
  project_id: string
  sender_id: string
  sender_name: string
  sender_email?: string
  reply_to?: string
  mentions?: string[]
  is_edited: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  reactions?: ChatReaction[]
}

export interface ChatParticipant {
  id: string
  project_id: string
  user_id: string
  role: "admin" | "member" | "viewer"
  joined_at: string
  last_read_at: string
  user_email?: string
  user_name?: string
}

export interface ChatReaction {
  id: string
  message_id: string
  user_id: string
  emoji: string
  created_at: string
}

export function useChat(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [participants, setParticipants] = useState<ChatParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  const fetchMessages = useCallback(async () => {
    if (!projectId) {
      setMessages([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch messages with reactions
      const { data: messagesData, error: messagesError } = await supabase
        .from("chat_messages")
        .select(`
          *,
          reactions:chat_reactions(*)
        `)
        .eq("project_id", projectId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true })

      if (messagesError) throw messagesError

      setMessages(messagesData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [projectId, supabase])

  const fetchParticipants = useCallback(async () => {
    if (!projectId) return

    try {
      const { data, error } = await supabase
        .from("chat_participants")
        .select(`
          *,
          user:auth.users(email)
        `)
        .eq("project_id", projectId)

      if (error) throw error
      setParticipants(data || [])
    } catch (err: any) {
      console.error("Error fetching participants:", err.message)
    }
  }, [projectId, supabase])

  const sendMessage = async (
    content: string,
    messageType: "text" | "file" | "image" = "text",
    fileData?: {
      url: string
      name: string
      size: number
      type: string
    },
    mentions?: string[],
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const messageData = {
        content,
        message_type: messageType,
        file_url: fileData?.url,
        file_name: fileData?.name,
        file_size: fileData?.size,
        file_type: fileData?.type,
        project_id: projectId,
        sender_id: user.id,
        sender_name: user.user_metadata?.full_name || user.email || "Unknown User",
        sender_email: user.email,
        mentions: mentions || [],
      }

      const { data, error } = await supabase.from("chat_messages").insert([messageData]).select().single()

      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .update({
          content: newContent,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteMessage = async (messageId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .update({
          is_deleted: true,
          content: "This message was deleted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("chat_reactions")
        .insert([
          {
            message_id: messageId,
            user_id: user.id,
            emoji,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const removeReaction = async (messageId: string, emoji: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase
        .from("chat_reactions")
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)

      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const addParticipant = async (userEmail: string, role: "admin" | "member" | "viewer" = "member") => {
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from("auth.users")
        .select("id")
        .eq("email", userEmail)
        .single()

      if (userError) throw new Error("User not found")

      const { data, error } = await supabase
        .from("chat_participants")
        .insert([
          {
            project_id: projectId,
            user_id: userData.id,
            role,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const markAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("project_id", projectId)
        .eq("user_id", user.id)

      if (error) throw error
      setUnreadCount(0)
    } catch (err: any) {
      console.error("Error marking as read:", err.message)
    }
  }

  const uploadFile = async (file: File) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `chat-files/${projectId}/${fileName}`

      const { data, error } = await supabase.storage.from("documents").upload(filePath, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath)

      return {
        url: publicUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchMessages()
    fetchParticipants()

    // Set up real-time subscription for messages
    const messagesChannel = supabase
      .channel("chat_messages_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as ChatMessage])
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? (payload.new as ChatMessage) : m)))
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    // Set up real-time subscription for reactions
    const reactionsChannel = supabase
      .channel("chat_reactions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_reactions",
        },
        () => {
          // Refetch messages to get updated reactions
          fetchMessages()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(reactionsChannel)
    }
  }, [projectId, fetchMessages, fetchParticipants, supabase])

  return {
    messages,
    participants,
    loading,
    error,
    unreadCount,
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    addParticipant,
    markAsRead,
    uploadFile,
    refetch: fetchMessages,
  }
}
