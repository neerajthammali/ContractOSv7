"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useProjects } from "@/hooks/use-projects"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Calendar, DollarSign, Users, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ProjectSetupWizardProps {
  open: boolean
  onClose: () => void
}

export function ProjectSetupWizard({ open, onClose }: ProjectSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user } = useAuth()
  const { createProject } = useProjects(user)

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    location: "",
    description: "",
    start_date: "",
    end_date: "",
    budget: "",
    status: "planning",
    team_size: "",
    project_type: "",
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const totalSteps = 5
  const progress = (currentStep / totalSteps) * 100

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {}

    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.name = "Project name is required"
        if (!formData.client.trim()) errors.client = "Client name is required"
        if (!formData.location.trim()) errors.location = "Location is required"
        break
      case 2:
        if (!formData.start_date) errors.start_date = "Start date is required"
        if (!formData.end_date) errors.end_date = "End date is required"
        if (formData.start_date && formData.end_date && new Date(formData.start_date) >= new Date(formData.end_date)) {
          errors.end_date = "End date must be after start date"
        }
        break
      case 3:
        if (!formData.budget || Number.parseFloat(formData.budget) <= 0) {
          errors.budget = "Valid budget amount is required"
        }
        break
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return

    setLoading(true)
    setError(null)

    try {
      const projectData = {
        ...formData,
        budget: Number.parseFloat(formData.budget) || 0,
        team_size: Number.parseInt(formData.team_size) || 0,
        progress: 0,
      }

      const newProject = await createProject(projectData)
      router.push(`/projects/${newProject.id}`)
      onClose()
    } catch (err: any) {
      setError(err.message || "Failed to create project")
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>Let's start with the basic details of your construction project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Downtown Office Complex"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className={validationErrors.name ? "border-red-500" : ""}
                />
                {validationErrors.name && <p className="text-sm text-red-500">{validationErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="client">Client Name *</Label>
                <Input
                  id="client"
                  placeholder="e.g., ABC Construction Ltd."
                  value={formData.client}
                  onChange={(e) => updateFormData("client", e.target.value)}
                  className={validationErrors.client ? "border-red-500" : ""}
                />
                {validationErrors.client && <p className="text-sm text-red-500">{validationErrors.client}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Site Location *</Label>
                <Input
                  id="location"
                  placeholder="e.g., 123 Main St, New York, NY"
                  value={formData.location}
                  onChange={(e) => updateFormData("location", e.target.value)}
                  className={validationErrors.location ? "border-red-500" : ""}
                />
                {validationErrors.location && <p className="text-sm text-red-500">{validationErrors.location}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the project scope and objectives"
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline & Schedule
              </CardTitle>
              <CardDescription>Set the project timeline and key dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => updateFormData("start_date", e.target.value)}
                    className={validationErrors.start_date ? "border-red-500" : ""}
                  />
                  {validationErrors.start_date && <p className="text-sm text-red-500">{validationErrors.start_date}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Expected End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => updateFormData("end_date", e.target.value)}
                    className={validationErrors.end_date ? "border-red-500" : ""}
                  />
                  {validationErrors.end_date && <p className="text-sm text-red-500">{validationErrors.end_date}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_type">Project Type</Label>
                <Select value={formData.project_type} onValueChange={(value) => updateFormData("project_type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="industrial">Industrial</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="renovation">Renovation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Budget Details
              </CardTitle>
              <CardDescription>Set the project budget and financial parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (USD) *</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 500000"
                  value={formData.budget}
                  onChange={(e) => updateFormData("budget", e.target.value)}
                  className={validationErrors.budget ? "border-red-500" : ""}
                />
                {validationErrors.budget && <p className="text-sm text-red-500">{validationErrors.budget}</p>}
                {formData.budget && Number.parseFloat(formData.budget) > 0 && (
                  <p className="text-sm text-green-600">
                    Budget: ${Number.parseFloat(formData.budget).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Project Status</Label>
                <Select value={formData.status} onValueChange={(value) => updateFormData("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team & Resources
              </CardTitle>
              <CardDescription>Configure team size and resource requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_size">Expected Team Size</Label>
                <Input
                  id="team_size"
                  type="number"
                  placeholder="e.g., 15"
                  value={formData.team_size}
                  onChange={(e) => updateFormData("team_size", e.target.value)}
                />
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Next Steps</h4>
                <p className="text-sm text-blue-700">After creating the project, you'll be able to:</p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Add team members and assign roles</li>
                  <li>• Upload project documents and blueprints</li>
                  <li>• Create detailed task schedules</li>
                  <li>• Set up milestone tracking</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Review & Confirm
              </CardTitle>
              <CardDescription>Review your project details before creating</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Project Name:</strong> {formData.name}
                </div>
                <div>
                  <strong>Client:</strong> {formData.client}
                </div>
                <div>
                  <strong>Location:</strong> {formData.location}
                </div>
                <div>
                  <strong>Type:</strong> {formData.project_type || "Not specified"}
                </div>
                <div>
                  <strong>Start Date:</strong> {new Date(formData.start_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>End Date:</strong> {new Date(formData.end_date).toLocaleDateString()}
                </div>
                <div>
                  <strong>Budget:</strong> ${Number.parseFloat(formData.budget || "0").toLocaleString()}
                </div>
                <div>
                  <strong>Team Size:</strong> {formData.team_size || "Not specified"} members
                </div>
              </div>
              {formData.description && (
                <div>
                  <strong>Description:</strong>
                  <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                Step {currentStep} of {totalSteps}
              </span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">{renderStep()}</div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1}>
            Previous
          </Button>

          {currentStep === totalSteps ? (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          ) : (
            <Button onClick={handleNext}>Next</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
