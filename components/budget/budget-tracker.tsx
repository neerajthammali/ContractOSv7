"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  FileText,
  AlertCircle,
  Calculator,
  Upload,
  Receipt,
  Eye,
} from "lucide-react"
import { useBudget } from "@/hooks/use-budget"
import { Skeleton } from "@/components/ui/skeleton"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts"

interface BudgetTrackerProps {
  projectId: string
}

const budgetCategories = [
  "Labor",
  "Materials",
  "Equipment",
  "Subcontractors",
  "Permits",
  "Utilities",
  "Transportation",
  "Other",
]

const budgetStatuses = [
  { value: "planned", label: "Planned", color: "bg-blue-100 text-blue-800" },
  { value: "approved", label: "Approved", color: "bg-green-100 text-green-800" },
  { value: "ordered", label: "Ordered", color: "bg-yellow-100 text-yellow-800" },
  { value: "received", label: "Received", color: "bg-purple-100 text-purple-800" },
  { value: "paid", label: "Paid", color: "bg-gray-100 text-gray-800" },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"]

export function BudgetTracker({ projectId }: BudgetTrackerProps) {
  const [showAddBudgetDialog, setShowAddBudgetDialog] = useState(false)
  const [showAddExpenseDialog, setShowAddExpenseDialog] = useState(false)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [editingExpense, setEditingExpense] = useState<any>(null)
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [budgetFormData, setBudgetFormData] = useState({
    category: "",
    item_name: "",
    description: "",
    quantity: 1,
    unit_cost: 0,
    actual_cost: 0,
    status: "planned",
    supplier: "",
    invoice_number: "",
  })

  const [expenseFormData, setExpenseFormData] = useState({
    amount: 0,
    category: "",
    description: "",
    expense_date: new Date().toISOString().split("T")[0],
    vendor: "",
    receipt_url: "",
    receipt_filename: "",
  })

  const [invoiceFormData, setInvoiceFormData] = useState({
    invoice_number: "",
    client_name: "",
    client_email: "",
    client_address: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    status: "draft",
    subtotal: 0,
    tax_rate: 0,
    notes: "",
  })

  const {
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
    uploadReceipt,
  } = useBudget(projectId)

  // Calculate budget summary
  const totalPlanned = budgetItems.reduce((sum, item) => sum + item.planned_cost, 0)
  const totalActual = budgetItems.reduce((sum, item) => sum + item.actual_cost, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalSpent = totalActual + totalExpenses
  const totalVariance = totalSpent - totalPlanned
  const budgetUtilization = totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0

  // Prepare chart data
  const categoryData = budgetCategories
    .map((category) => {
      const categoryBudget = budgetItems.filter((item) => item.category === category)
      const categoryExpenses = expenses.filter((expense) => expense.category === category)
      const planned = categoryBudget.reduce((sum, item) => sum + item.planned_cost, 0)
      const actual = categoryBudget.reduce((sum, item) => sum + item.actual_cost, 0)
      const expenseTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0)
      const total = actual + expenseTotal

      return {
        category,
        planned,
        actual: total,
        variance: total - planned,
      }
    })
    .filter((item) => item.planned > 0 || item.actual > 0)

  const pieData = categoryData.map((item) => ({
    name: item.category,
    value: item.actual,
    planned: item.planned,
  }))

  const handleCreateBudgetItem = async () => {
    try {
      await createBudgetItem(budgetFormData)
      setShowAddBudgetDialog(false)
      resetBudgetForm()
    } catch (error) {
      console.error("Failed to create budget item:", error)
    }
  }

  const handleUpdateBudgetItem = async () => {
    if (!editingItem) return

    try {
      await updateBudgetItem(editingItem.id, budgetFormData)
      setEditingItem(null)
      resetBudgetForm()
    } catch (error) {
      console.error("Failed to update budget item:", error)
    }
  }

  const handleDeleteBudgetItem = async (id: string) => {
    if (confirm("Are you sure you want to delete this budget item?")) {
      try {
        await deleteBudgetItem(id)
      } catch (error) {
        console.error("Failed to delete budget item:", error)
      }
    }
  }

  const handleCreateExpense = async () => {
    try {
      await createExpense(expenseFormData)
      setShowAddExpenseDialog(false)
      resetExpenseForm()
    } catch (error) {
      console.error("Failed to create expense:", error)
    }
  }

  const handleUpdateExpense = async () => {
    if (!editingExpense) return

    try {
      await updateExpense(editingExpense.id, expenseFormData)
      setEditingExpense(null)
      resetExpenseForm()
    } catch (error) {
      console.error("Failed to update expense:", error)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await deleteExpense(id)
      } catch (error) {
        console.error("Failed to delete expense:", error)
      }
    }
  }

  const handleCreateInvoice = async () => {
    try {
      await createInvoice(invoiceFormData)
      setShowInvoiceDialog(false)
      resetInvoiceForm()
    } catch (error) {
      console.error("Failed to create invoice:", error)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingReceipt(true)
    try {
      const result = await uploadReceipt(file)
      setExpenseFormData((prev) => ({
        ...prev,
        receipt_url: result.url,
        receipt_filename: result.filename,
      }))
    } catch (error) {
      console.error("Failed to upload receipt:", error)
    } finally {
      setUploadingReceipt(false)
    }
  }

  const resetBudgetForm = () => {
    setBudgetFormData({
      category: "",
      item_name: "",
      description: "",
      quantity: 1,
      unit_cost: 0,
      actual_cost: 0,
      status: "planned",
      supplier: "",
      invoice_number: "",
    })
  }

  const resetExpenseForm = () => {
    setExpenseFormData({
      amount: 0,
      category: "",
      description: "",
      expense_date: new Date().toISOString().split("T")[0],
      vendor: "",
      receipt_url: "",
      receipt_filename: "",
    })
  }

  const resetInvoiceForm = () => {
    setInvoiceFormData({
      invoice_number: "",
      client_name: "",
      client_email: "",
      client_address: "",
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: "",
      status: "draft",
      subtotal: 0,
      tax_rate: 0,
      notes: "",
    })
  }

  const startEditingBudget = (item: any) => {
    setEditingItem(item)
    setBudgetFormData({
      category: item.category,
      item_name: item.item_name,
      description: item.description,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      actual_cost: item.actual_cost,
      status: item.status,
      supplier: item.supplier || "",
      invoice_number: item.invoice_number || "",
    })
  }

  const startEditingExpense = (expense: any) => {
    setEditingExpense(expense)
    setExpenseFormData({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      expense_date: expense.expense_date,
      vendor: expense.vendor || "",
      receipt_url: expense.receipt_url || "",
      receipt_filename: expense.receipt_filename || "",
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = budgetStatuses.find((s) => s.value === status)
    return <Badge className={statusConfig?.color || "bg-gray-100 text-gray-800"}>{statusConfig?.label || status}</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Tracking</CardTitle>
          <CardDescription>Loading budget data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
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
        <AlertDescription>Error loading budget data: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Budget Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Planned Budget</p>
                <p className="text-2xl font-bold">${totalPlanned.toLocaleString()}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Variance</p>
                <p className={`text-2xl font-bold ${totalVariance >= 0 ? "text-red-600" : "text-green-600"}`}>
                  ${totalVariance >= 0 ? "+" : ""}${totalVariance.toLocaleString()}
                </p>
              </div>
              {totalVariance >= 0 ? (
                <TrendingUp className="h-8 w-8 text-red-500" />
              ) : (
                <TrendingDown className="h-8 w-8 text-green-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Budget Utilization</p>
                <p className="text-2xl font-bold">{budgetUtilization.toFixed(1)}%</p>
                <Progress value={Math.min(budgetUtilization, 100)} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {categoryData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Budget vs Actual by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, ""]} />
                  <Bar dataKey="planned" fill="#8884d8" name="Planned" />
                  <Bar dataKey="actual" fill="#82ca9d" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spending Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget Management Tabs */}
      <Tabs defaultValue="budget" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budget">Budget Items</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Budget Items</CardTitle>
                  <CardDescription>Track planned vs actual project costs</CardDescription>
                </div>
                <Dialog
                  open={showAddBudgetDialog || !!editingItem}
                  onOpenChange={(open) => {
                    if (!open) {
                      setShowAddBudgetDialog(false)
                      setEditingItem(null)
                      resetBudgetForm()
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setShowAddBudgetDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Budget Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? "Edit Budget Item" : "Add Budget Item"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={budgetFormData.category}
                          onValueChange={(value) => setBudgetFormData((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {budgetCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="item_name">Item Name</Label>
                        <Input
                          id="item_name"
                          value={budgetFormData.item_name}
                          onChange={(e) => setBudgetFormData((prev) => ({ ...prev, item_name: e.target.value }))}
                          placeholder="e.g., Steel beams"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={budgetFormData.description}
                          onChange={(e) => setBudgetFormData((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="Detailed description..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input
                          id="quantity"
                          type="number"
                          value={budgetFormData.quantity}
                          onChange={(e) => setBudgetFormData((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit_cost">Unit Cost ($)</Label>
                        <Input
                          id="unit_cost"
                          type="number"
                          step="0.01"
                          value={budgetFormData.unit_cost}
                          onChange={(e) =>
                            setBudgetFormData((prev) => ({ ...prev, unit_cost: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="actual_cost">Actual Cost ($)</Label>
                        <Input
                          id="actual_cost"
                          type="number"
                          step="0.01"
                          value={budgetFormData.actual_cost}
                          onChange={(e) =>
                            setBudgetFormData((prev) => ({ ...prev, actual_cost: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={budgetFormData.status}
                          onValueChange={(value) => setBudgetFormData((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {budgetStatuses.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                          id="supplier"
                          value={budgetFormData.supplier}
                          onChange={(e) => setBudgetFormData((prev) => ({ ...prev, supplier: e.target.value }))}
                          placeholder="Supplier name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoice_number">Invoice Number</Label>
                        <Input
                          id="invoice_number"
                          value={budgetFormData.invoice_number}
                          onChange={(e) => setBudgetFormData((prev) => ({ ...prev, invoice_number: e.target.value }))}
                          placeholder="Invoice #"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddBudgetDialog(false)
                          setEditingItem(null)
                          resetBudgetForm()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={editingItem ? handleUpdateBudgetItem : handleCreateBudgetItem}>
                        {editingItem ? "Update" : "Create"} Item
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {budgetItems.length === 0 ? (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No budget items yet</h3>
                  <p className="text-gray-600 mb-4">Start tracking your project costs</p>
                  <Button onClick={() => setShowAddBudgetDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Item
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {budgetItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{item.item_name}</h4>
                          <Badge variant="outline">{item.category}</Badge>
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Quantity:</span>
                            <span className="ml-1 font-medium">{item.quantity}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Unit Cost:</span>
                            <span className="ml-1 font-medium">${item.unit_cost.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Planned:</span>
                            <span className="ml-1 font-medium">${item.planned_cost.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Actual:</span>
                            <span
                              className={`ml-1 font-medium ${item.variance >= 0 ? "text-red-600" : "text-green-600"}`}
                            >
                              ${item.actual_cost.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        {item.supplier && <p className="text-xs text-gray-500 mt-1">Supplier: {item.supplier}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEditingBudget(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteBudgetItem(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Expenses</CardTitle>
                  <CardDescription>Track actual project expenses with receipts</CardDescription>
                </div>
                <Dialog
                  open={showAddExpenseDialog || !!editingExpense}
                  onOpenChange={(open) => {
                    if (!open) {
                      setShowAddExpenseDialog(false)
                      setEditingExpense(null)
                      resetExpenseForm()
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button onClick={() => setShowAddExpenseDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expense_amount">Amount ($)</Label>
                        <Input
                          id="expense_amount"
                          type="number"
                          step="0.01"
                          value={expenseFormData.amount}
                          onChange={(e) => setExpenseFormData((prev) => ({ ...prev, amount: Number(e.target.value) }))}
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expense_category">Category</Label>
                        <Select
                          value={expenseFormData.category}
                          onValueChange={(value) => setExpenseFormData((prev) => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {budgetCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="expense_description">Description</Label>
                        <Textarea
                          id="expense_description"
                          value={expenseFormData.description}
                          onChange={(e) => setExpenseFormData((prev) => ({ ...prev, description: e.target.value }))}
                          placeholder="What was this expense for?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expense_date">Date</Label>
                        <Input
                          id="expense_date"
                          type="date"
                          value={expenseFormData.expense_date}
                          onChange={(e) => setExpenseFormData((prev) => ({ ...prev, expense_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vendor">Vendor</Label>
                        <Input
                          id="vendor"
                          value={expenseFormData.vendor}
                          onChange={(e) => setExpenseFormData((prev) => ({ ...prev, vendor: e.target.value }))}
                          placeholder="Vendor/supplier name"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Receipt</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingReceipt}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadingReceipt ? "Uploading..." : "Upload Receipt"}
                          </Button>
                          {expenseFormData.receipt_filename && (
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">{expenseFormData.receipt_filename}</span>
                              {expenseFormData.receipt_url && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(expenseFormData.receipt_url, "_blank")}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddExpenseDialog(false)
                          setEditingExpense(null)
                          resetExpenseForm()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={editingExpense ? handleUpdateExpense : handleCreateExpense}>
                        {editingExpense ? "Update" : "Create"} Expense
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses recorded</h3>
                  <p className="text-gray-600 mb-4">Start tracking your project expenses</p>
                  <Button onClick={() => setShowAddExpenseDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Expense
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">${expense.amount.toLocaleString()}</h4>
                          <Badge variant="outline">{expense.category}</Badge>
                          {expense.receipt_url && <Receipt className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-1 font-medium">
                              {new Date(expense.expense_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Vendor:</span>
                            <span className="ml-1 font-medium">{expense.vendor || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Receipt:</span>
                            <span className="ml-1 font-medium">
                              {expense.receipt_filename ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-auto p-0 text-blue-600"
                                  onClick={() => window.open(expense.receipt_url, "_blank")}
                                >
                                  View
                                </Button>
                              ) : (
                                "None"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => startEditingExpense(expense)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteExpense(expense.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Invoices</CardTitle>
                  <CardDescription>Manage project invoices and billing</CardDescription>
                </div>
                <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="invoice_number">Invoice Number</Label>
                        <Input
                          id="invoice_number"
                          value={invoiceFormData.invoice_number}
                          onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, invoice_number: e.target.value }))}
                          placeholder="INV-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_name">Client Name</Label>
                        <Input
                          id="client_name"
                          value={invoiceFormData.client_name}
                          onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                          placeholder="Client company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="client_email">Client Email</Label>
                        <Input
                          id="client_email"
                          type="email"
                          value={invoiceFormData.client_email}
                          onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, client_email: e.target.value }))}
                          placeholder="client@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="invoice_date">Invoice Date</Label>
                        <Input
                          id="invoice_date"
                          type="date"
                          value={invoiceFormData.invoice_date}
                          onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, invoice_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date</Label>
                        <Input
                          id="due_date"
                          type="date"
                          value={invoiceFormData.due_date}
                          onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtotal">Subtotal ($)</Label>
                        <Input
                          id="subtotal"
                          type="number"
                          step="0.01"
                          value={invoiceFormData.subtotal}
                          onChange={(e) =>
                            setInvoiceFormData((prev) => ({ ...prev, subtotal: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                        <Input
                          id="tax_rate"
                          type="number"
                          step="0.01"
                          value={invoiceFormData.tax_rate}
                          onChange={(e) =>
                            setInvoiceFormData((prev) => ({ ...prev, tax_rate: Number(e.target.value) }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={invoiceFormData.status}
                          onValueChange={(value) => setInvoiceFormData((prev) => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="client_address">Client Address</Label>
                        <Textarea
                          id="client_address"
                          value={invoiceFormData.client_address}
                          onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, client_address: e.target.value }))}
                          placeholder="Client billing address"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={invoiceFormData.notes}
                          onChange={(e) => setInvoiceFormData((prev) => ({ ...prev, notes: e.target.value }))}
                          placeholder="Additional notes or terms"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Button variant="outline" onClick={() => setShowInvoiceDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateInvoice}>Create Invoice</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices created</h3>
                  <p className="text-gray-600 mb-4">Create your first invoice for this project</p>
                  <Button onClick={() => setShowInvoiceDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Invoice
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{invoice.invoice_number}</h4>
                          <Badge variant={invoice.status === "paid" ? "default" : "outline"}>{invoice.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{invoice.client_name}</p>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-1 font-medium">
                              {new Date(invoice.invoice_date).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Due:</span>
                            <span className="ml-1 font-medium">{new Date(invoice.due_date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Subtotal:</span>
                            <span className="ml-1 font-medium">${invoice.subtotal.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Total:</span>
                            <span className="ml-1 font-medium">${invoice.total_amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
