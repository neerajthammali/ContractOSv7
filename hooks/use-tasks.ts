"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  assignee: string
  due_date: string
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export function useTasks(projectId: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchTasks = async () => {
    if (!projectId) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData: Omit<Task, "id" | "created_by" | "created_at" | "updated_at">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            ...taskData,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setTasks((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id)

      if (error) throw error

      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateTaskStatus = async (id: string, status: string) => {
    return updateTask(id, { status })
  }

  useEffect(() => {
    fetchTasks()

    // Set up real-time subscription
    const channel = supabase
      .channel("tasks_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new as Task, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) => prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t)))
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refetch: fetchTasks,
  }
}
