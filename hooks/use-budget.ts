"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase"

export interface BudgetItem {
  id: string
  category: string
  item_name: string
  description: string
  quantity: number
  unit_cost: number
  planned_cost: number
  actual_cost: number
  variance: number
  status: string
  supplier: string
  invoice_number: string
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  amount: number
  category: string
  description: string
  expense_date: string
  vendor: string
  receipt_url: string
  receipt_filename: string
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  client_address: string
  invoice_date: string
  due_date: string
  status: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total_amount: number
  notes: string
  project_id: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unit_price: number
  total_price: number
  invoice_id: string
  created_at: string
}

export function useBudget(projectId?: string) {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchBudgetItems = async () => {
    if (!projectId) {
      setBudgetItems([])
      return
    }

    try {
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setBudgetItems(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchExpenses = async () => {
    if (!projectId) {
      setExpenses([])
      return
    }

    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("project_id", projectId)
        .order("expense_date", { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchInvoices = async () => {
    if (!projectId) {
      setInvoices([])
      return
    }

    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([fetchBudgetItems(), fetchExpenses(), fetchInvoices()])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createBudgetItem = async (
    itemData: Omit<BudgetItem, "id" | "created_by" | "created_at" | "updated_at" | "planned_cost" | "variance">,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("budget_items")
        .insert([
          {
            ...itemData,
            project_id: projectId,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setBudgetItems((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateBudgetItem = async (id: string, updates: Partial<BudgetItem>) => {
    try {
      const { data, error } = await supabase
        .from("budget_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setBudgetItems((prev) => prev.map((item) => (item.id === id ? data : item)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteBudgetItem = async (id: string) => {
    try {
      const { error } = await supabase.from("budget_items").delete().eq("id", id)

      if (error) throw error

      setBudgetItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const createExpense = async (expenseData: Omit<Expense, "id" | "created_by" | "created_at" | "updated_at">) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("expenses")
        .insert([
          {
            ...expenseData,
            project_id: projectId,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setExpenses((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setExpenses((prev) => prev.map((expense) => (expense.id === id ? data : expense)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id)

      if (error) throw error

      setExpenses((prev) => prev.filter((expense) => expense.id !== id))
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const createInvoice = async (
    invoiceData: Omit<Invoice, "id" | "created_by" | "created_at" | "updated_at" | "tax_amount" | "total_amount">,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { data, error } = await supabase
        .from("invoices")
        .insert([
          {
            ...invoiceData,
            project_id: projectId,
            created_by: user.id,
          },
        ])
        .select()
        .single()

      if (error) throw error

      setInvoices((prev) => [data, ...prev])
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    try {
      const { data, error } = await supabase
        .from("invoices")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      setInvoices((prev) => prev.map((invoice) => (invoice.id === id ? data : invoice)))
      return data
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  const uploadReceipt = async (file: File, expenseId?: string) => {
    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("documents").getPublicUrl(filePath)

      return {
        url: publicUrl,
        filename: file.name,
        path: filePath,
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchAllData()

      // Set up real-time subscriptions
      const budgetChannel = supabase
        .channel("budget_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "budget_items",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setBudgetItems((prev) => [payload.new as BudgetItem, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setBudgetItems((prev) =>
                prev.map((item) => (item.id === payload.new.id ? (payload.new as BudgetItem) : item)),
              )
            } else if (payload.eventType === "DELETE") {
              setBudgetItems((prev) => prev.filter((item) => item.id !== payload.old.id))
            }
          },
        )
        .subscribe()

      const expenseChannel = supabase
        .channel("expense_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setExpenses((prev) => [payload.new as Expense, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setExpenses((prev) =>
                prev.map((expense) => (expense.id === payload.new.id ? (payload.new as Expense) : expense)),
              )
            } else if (payload.eventType === "DELETE") {
              setExpenses((prev) => prev.filter((expense) => expense.id !== payload.old.id))
            }
          },
        )
        .subscribe()

      const invoiceChannel = supabase
        .channel("invoice_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "invoices",
            filter: `project_id=eq.${projectId}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setInvoices((prev) => [payload.new as Invoice, ...prev])
            } else if (payload.eventType === "UPDATE") {
              setInvoices((prev) =>
                prev.map((invoice) => (invoice.id === payload.new.id ? (payload.new as Invoice) : invoice)),
              )
            } else if (payload.eventType === "DELETE") {
              setInvoices((prev) => prev.filter((invoice) => invoice.id !== payload.old.id))
            }
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(budgetChannel)
        supabase.removeChannel(expenseChannel)
        supabase.removeChannel(invoiceChannel)
      }
    } else {
      setLoading(false)
    }
  }, [projectId])

  return {
    budgetItems,
    expenses,
    invoices,
    loading,
    error,
    createBudgetItem,
    updateBudgetItem,
    deleteBudgetItem,
    createExpense,
    updateExpense,
    deleteExpense,
    createInvoice,
    updateInvoice,
    uploadReceipt,
    refetch: fetchAllData,
  }
}
