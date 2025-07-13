"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export interface Document {
  id: string
  name: string
  file_path: string
  file_size: number
  file_type: string
  category: string
  description: string
  version: number
  is_active: boolean
  project_id: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

export function useDocuments(projectId: string) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDocuments = async () => {
    if (!projectId) {
      setDocuments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", projectId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const uploadDocument = async (file: File, category: string, description?: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `${projectId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(fileName, file)

      if (uploadError) throw uploadError

      // Create document record
      const { data, error } = await supabase
        .from("documents")
        .insert([
          {
            name: file.name,
            file_path: uploadData.path,
            file_size: file.size,
            file_type: file.type,
            category,
            description: description || "",
            project_id: projectId,
            uploaded_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setDocuments((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase.from("documents").update({ is_active: false }).eq("id", id)

      if (error) throw error

      setDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const getDocumentUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600) // 1 hour expiry

    return data?.signedUrl
  }

  useEffect(() => {
    fetchDocuments()

    // Set up real-time subscription
    const channel = supabase
      .channel("documents_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setDocuments((prev) => [payload.new as Document, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setDocuments((prev) => prev.map((d) => (d.id === payload.new.id ? (payload.new as Document) : d)))
          } else if (payload.eventType === "DELETE") {
            setDocuments((prev) => prev.filter((d) => d.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return {
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
    refetch: fetchDocuments,
  }
}
