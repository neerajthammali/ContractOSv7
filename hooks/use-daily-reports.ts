"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export interface DailyReport {
  id: string
  report_date: string
  weather_conditions: string
  temperature: number
  work_completed: string
  work_planned_tomorrow: string
  labor_hours: number
  labor_count: number
  materials_used: string
  equipment_used: string
  issues_encountered: string
  safety_incidents: string
  safety_meeting_held: boolean
  photos: string[]
  progress_percentage: number
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface ReportPhoto {
  id: string
  photo_url: string
  caption: string
  category: string
  report_id: string
  uploaded_by: string
  created_at: string
}

export function useDailyReports(projectId: string) {
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchReports = async () => {
    if (!projectId) {
      setReports([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("daily_reports")
        .select("*")
        .eq("project_id", projectId)
        .order("report_date", { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createReport = async (reportData: Omit<DailyReport, "id" | "created_by" | "created_at" | "updated_at">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("daily_reports")
        .insert([
          {
            ...reportData,
            project_id: projectId,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setReports((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateReport = async (id: string, updates: Partial<DailyReport>) => {
    try {
      const { data, error } = await supabase
        .from("daily_reports")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setReports((prev) => prev.map((report) => (report.id === id ? data : report)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from("daily_reports").delete().eq("id", id)

      if (error) throw error

      setReports((prev) => prev.filter((report) => report.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const uploadReportPhoto = async (reportId: string, file: File, caption: string, category: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Upload file to Supabase Storage
      const fileExt = file.name.split(".").pop()
      const fileName = `reports/${reportId}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("report-photos")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Create photo record
      const { data, error } = await supabase
        .from("report_photos")
        .insert([
          {
            photo_url: uploadData.path,
            caption,
            category,
            report_id: reportId,
            uploaded_by: user.id,
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

  useEffect(() => {
    fetchReports()

    // Set up real-time subscription
    const channel = supabase
      .channel("daily_reports_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_reports",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setReports((prev) => [payload.new as DailyReport, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setReports((prev) =>
              prev.map((report) => (report.id === payload.new.id ? (payload.new as DailyReport) : report)),
            )
          } else if (payload.eventType === "DELETE") {
            setReports((prev) => prev.filter((report) => report.id !== payload.old.id))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  return {
    reports,
    loading,
    error,
    createReport,
    updateReport,
    deleteReport,
    uploadReportPhoto,
    refetch: fetchReports,
  }
}
