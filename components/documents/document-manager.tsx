"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Search,
  Plus,
  File,
  ImageIcon,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react"
import { useDocuments } from "@/hooks/use-documents"
import { Skeleton } from "@/components/ui/skeleton"

interface DocumentManagerProps {
  projectId: string
}

const documentCategories = [
  { value: "general", label: "General" },
  { value: "contract", label: "Contract" },
  { value: "blueprint", label: "Blueprint" },
  { value: "permit", label: "Permit" },
  { value: "rfi", label: "RFI" },
  { value: "photo", label: "Photo" },
  { value: "report", label: "Report" },
  { value: "invoice", label: "Invoice" },
]

export function DocumentManager({ projectId }: DocumentManagerProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    category: "general",
    description: "",
  })
  const [uploading, setUploading] = useState(false)

  const { documents, loading, error, uploadDocument, deleteDocument, getDocumentUrl } = useDocuments(projectId)

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (fileType.includes("spreadsheet") || fileType.includes("excel")) return <FileSpreadsheet className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      general: "bg-gray-100 text-gray-800",
      contract: "bg-blue-100 text-blue-800",
      blueprint: "bg-purple-100 text-purple-800",
      permit: "bg-green-100 text-green-800",
      rfi: "bg-yellow-100 text-yellow-800",
      photo: "bg-pink-100 text-pink-800",
      report: "bg-indigo-100 text-indigo-800",
      invoice: "bg-orange-100 text-orange-800",
    }
    return colors[category as keyof typeof colors] || colors.general
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleFileUpload = async () => {
    if (!uploadData.file) return

    setUploading(true)
    try {
      await uploadDocument(uploadData.file, uploadData.category, uploadData.description)
      setShowUploadDialog(false)
      setUploadData({ file: null, category: "general", description: "" })
    } catch (error: any) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (document: any) => {
    try {
      const url = await getDocumentUrl(document.file_path)
      if (url) {
        const link = document.createElement("a")
        link.href = url
        link.download = document.name
        link.click()
      }
    } catch (error) {
      console.error("Download failed:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocument(id)
      } catch (error: any) {
        console.error("Delete failed:", error)
      }
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Management</CardTitle>
          <CardDescription>Loading documents...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-10 w-10" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-20" />
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
        <AlertDescription>Error loading documents: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Document Management</CardTitle>
            <CardDescription>Upload and manage project documents, blueprints, and contracts</CardDescription>
          </div>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadData((prev) => ({ ...prev, file: e.target.files?.[0] || null }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={uploadData.category}
                    onValueChange={(value) => setUploadData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {documentCategories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the document..."
                    value={uploadData.description}
                    onChange={(e) => setUploadData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleFileUpload} disabled={!uploadData.file || uploading}>
                    {uploading ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {documentCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {documents.length === 0 ? "No documents uploaded" : "No documents match your filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {documents.length === 0
                ? "Upload your first document to get started"
                : "Try adjusting your search or filter criteria"}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => setShowUploadDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDocuments.map((document) => (
              <div key={document.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0">{getFileIcon(document.file_type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{document.name}</h4>
                    <Badge className={getCategoryColor(document.category)}>
                      {documentCategories.find((c) => c.value === document.category)?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{document.description || "No description"}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{formatFileSize(document.file_size)}</span>
                    <span>v{document.version}</span>
                    <span>{new Date(document.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(document.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
