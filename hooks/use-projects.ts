"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

export interface Project {
  id: string
  name: string
  client: string
  location: string
  status: string
  description: string
  budget: number
  start_date: string
  end_date: string
  progress: number
  project_type: string
  team_size: number
  created_by: string
  created_at: string
  updated_at: string
}

export function useProjects(user: User | null) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchProjects = async () => {
    if (!user) {
      setProjects([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: Omit<Project, "id" | "created_by" | "created_at" | "updated_at">) => {
    if (!user) throw new Error("User not authenticated")

    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            ...projectData,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setProjects((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setProjects((prev) => prev.map((p) => (p.id === id ? data : p)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) throw error

      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchProjects()

    // Set up real-time subscription
    const channel = supabase
      .channel("projects_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "projects",
          filter: user ? `created_by=eq.${user.id}` : "",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setProjects((prev) => [payload.new as Project, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setProjects((prev) => prev.map((p) => (p.id === payload.new.id ? (payload.new as Project) : p)))
          } else if (payload.eventType === "DELETE") {
            setProjects((prev) => prev.filter((p) => p.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  }
}
