"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Cloud,
  Thermometer,
  Users,
  Clock,
  AlertTriangle,
  Shield,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useDailyReports } from "@/hooks/use-daily-reports"
import { Skeleton } from "@/components/ui/skeleton"

interface DailyReportsProps {
  projectId: string
}

export function DailyReports({ projectId }: DailyReportsProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingReport, setEditingReport] = useState<any>(null)

  const [reportFormData, setReportFormData] = useState({
    report_date: new Date().toISOString().split("T")[0],
    weather_conditions: "",
    temperature: 0,
    work_completed: "",
    work_planned_tomorrow: "",
    labor_hours: 0,
    labor_count: 0,
    materials_used: "",
    equipment_used: "",
    issues_encountered: "",
    safety_incidents: "",
    safety_meeting_held: false,
    progress_percentage: 0,
    photos: [] as string[],
  })

  const { reports, loading, error, createReport, updateReport, deleteReport } = useDailyReports(projectId)

  const handleCreateReport = async () => {
    try {
      await createReport(reportFormData)
      setShowCreateDialog(false)
      resetForm()
    } catch (error) {
      console.error("Failed to create report:", error)
    }
  }

  const handleUpdateReport = async () => {
    if (!editingReport) return

    try {
      await updateReport(editingReport.id, reportFormData)
      setEditingReport(null)
      resetForm()
    } catch (error) {
      console.error("Failed to update report:", error)
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (confirm("Are you sure you want to delete this daily report?")) {
      try {
        await deleteReport(id)
      } catch (error) {
        console.error("Failed to delete report:", error)
      }
    }
  }

  const startEditing = (report: any) => {
    setEditingReport(report)
    setReportFormData({
      report_date: report.report_date,
      weather_conditions: report.weather_conditions || "",
      temperature: report.temperature || 0,
      work_completed: report.work_completed || "",
      work_planned_tomorrow: report.work_planned_tomorrow || "",
      labor_hours: report.labor_hours || 0,
      labor_count: report.labor_count || 0,
      materials_used: report.materials_used || "",
      equipment_used: report.equipment_used || "",
      issues_encountered: report.issues_encountered || "",
      safety_incidents: report.safety_incidents || "",
      safety_meeting_held: report.safety_meeting_held || false,
      progress_percentage: report.progress_percentage || 0,
      photos: report.photos || [],
    })
  }

  const resetForm = () => {
    setReportFormData({
      report_date: new Date().toISOString().split("T")[0],
      weather_conditions: "",
      temperature: 0,
      work_completed: "",
      work_planned_tomorrow: "",
      labor_hours: 0,
      labor_count: 0,
      materials_used: "",
      equipment_used: "",
      issues_encountered: "",
      safety_incidents: "",
      safety_meeting_held: false,
      progress_percentage: 0,
      photos: [],
    })
  }

  const getWeatherIcon = (conditions: string) => {
    const weather = conditions.toLowerCase()
    if (weather.includes("rain")) return "🌧️"
    if (weather.includes("sun") || weather.includes("clear")) return "☀️"
    if (weather.includes("cloud")) return "☁️"
    if (weather.includes("snow")) return "❄️"
    return "🌤️"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Site Reports</CardTitle>
          <CardDescription>Loading reports...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
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
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Error loading daily reports: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daily Site Reports
            </CardTitle>
            <CardDescription>Track daily progress, labor, materials, and site conditions</CardDescription>
          </div>
          <Dialog
            open={showCreateDialog || !!editingReport}
            onOpenChange={(open) => {
              if (!open) {
                setShowCreateDialog(false)
                setEditingReport(null)
                resetForm()
              }
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingReport ? "Edit Daily Report" : "Create Daily Report"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Basic Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="report_date">Report Date</Label>
                    <Input
                      id="report_date"
                      type="date"
                      value={reportFormData.report_date}
                      onChange={(e) => setReportFormData((prev) => ({ ...prev, report_date: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weather_conditions">Weather Conditions</Label>
                    <Input
                      id="weather_conditions"
                      value={reportFormData.weather_conditions}
                      onChange={(e) => setReportFormData((prev) => ({ ...prev, weather_conditions: e.target.value }))}
                      placeholder="e.g., Sunny, partly cloudy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature">Temperature (°F)</Label>
                    <Input
                      id="temperature"
                      type="number"
                      value={reportFormData.temperature}
                      onChange={(e) => setReportFormData((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="progress_percentage">Progress Percentage</Label>
                    <Input
                      id="progress_percentage"
                      type="number"
                      min="0"
                      max="100"
                      value={reportFormData.progress_percentage}
                      onChange={(e) =>
                        setReportFormData((prev) => ({ ...prev, progress_percentage: Number(e.target.value) }))
                      }
                    />
                  </div>
                </div>

                {/* Labor Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Labor Information</h3>
                  <div className="space-y-2">
                    <Label htmlFor="labor_count">Number of Workers</Label>
                    <Input
                      id="labor_count"
                      type="number"
                      value={reportFormData.labor_count}
                      onChange={(e) => setReportFormData((prev) => ({ ...prev, labor_count: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labor_hours">Total Labor Hours</Label>
                    <Input
                      id="labor_hours"
                      type="number"
                      value={reportFormData.labor_hours}
                      onChange={(e) => setReportFormData((prev) => ({ ...prev, labor_hours: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="safety_meeting"
                      checked={reportFormData.safety_meeting_held}
                      onCheckedChange={(checked) =>
                        setReportFormData((prev) => ({ ...prev, safety_meeting_held: !!checked }))
                      }
                    />
                    <Label htmlFor="safety_meeting">Safety meeting held today</Label>
                  </div>
                </div>

                {/* Work Details */}
                <div className="col-span-2 space-y-4">
                  <h3 className="font-medium text-lg">Work Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="work_completed">Work Completed Today</Label>
                      <Textarea
                        id="work_completed"
                        value={reportFormData.work_completed}
                        onChange={(e) => setReportFormData((prev) => ({ ...prev, work_completed: e.target.value }))}
                        placeholder="Describe the work completed today..."
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="work_planned_tomorrow">Work Planned for Tomorrow</Label>
                      <Textarea
                        id="work_planned_tomorrow"
                        value={reportFormData.work_planned_tomorrow}
                        onChange={(e) =>
                          setReportFormData((prev) => ({ ...prev, work_planned_tomorrow: e.target.value }))
                        }
                        placeholder="Describe planned work for tomorrow..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="materials_used">Materials Used</Label>
                      <Textarea
                        id="materials_used"
                        value={reportFormData.materials_used}
                        onChange={(e) => setReportFormData((prev) => ({ ...prev, materials_used: e.target.value }))}
                        placeholder="List materials used today..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="equipment_used">Equipment Used</Label>
                      <Textarea
                        id="equipment_used"
                        value={reportFormData.equipment_used}
                        onChange={(e) => setReportFormData((prev) => ({ ...prev, equipment_used: e.target.value }))}
                        placeholder="List equipment used today..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* Issues and Safety */}
                <div className="col-span-2 space-y-4">
                  <h3 className="font-medium text-lg">Issues and Safety</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="issues_encountered">Issues Encountered</Label>
                      <Textarea
                        id="issues_encountered"
                        value={reportFormData.issues_encountered}
                        onChange={(e) => setReportFormData((prev) => ({ ...prev, issues_encountered: e.target.value }))}
                        placeholder="Describe any issues or delays..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="safety_incidents">Safety Incidents</Label>
                      <Textarea
                        id="safety_incidents"
                        value={reportFormData.safety_incidents}
                        onChange={(e) => setReportFormData((prev) => ({ ...prev, safety_incidents: e.target.value }))}
                        placeholder="Report any safety incidents..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false)
                    setEditingReport(null)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={editingReport ? handleUpdateReport : handleCreateReport}>
                  {editingReport ? "Update" : "Create"} Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No daily reports yet</h3>
            <p className="text-gray-600 mb-4">Start tracking daily progress and site conditions</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Report
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="p-6 border rounded-lg space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium text-lg">
                        {new Date(report.report_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        {report.weather_conditions && (
                          <div className="flex items-center gap-1">
                            <Cloud className="h-4 w-4" />
                            <span>
                              {getWeatherIcon(report.weather_conditions)} {report.weather_conditions}
                            </span>
                          </div>
                        )}
                        {report.temperature > 0 && (
                          <div className="flex items-center gap-1">
                            <Thermometer className="h-4 w-4" />
                            <span>{report.temperature}°F</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.progress_percentage > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {report.progress_percentage}% Progress
                      </Badge>
                    )}
                    <Button variant="outline" size="sm" onClick={() => startEditing(report)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteReport(report.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Labor and Safety Summary */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm font-medium">Workers</span>
                    </div>
                    <p className="text-lg font-bold">{report.labor_count}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Hours</span>
                    </div>
                    <p className="text-lg font-bold">{report.labor_hours}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm font-medium">Safety</span>
                    </div>
                    <p className="text-lg font-bold">{report.safety_meeting_held ? "✓" : "✗"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-sm font-medium">Issues</span>
                    </div>
                    <p className="text-lg font-bold">{report.issues_encountered ? "!" : "✓"}</p>
                  </div>
                </div>

                {/* Work Details */}
                <div className="grid grid-cols-2 gap-6">
                  {report.work_completed && (
                    <div>
                      <h5 className="font-medium text-green-700 mb-2">Work Completed</h5>
                      <p className="text-sm text-gray-700">{report.work_completed}</p>
                    </div>
                  )}
                  {report.work_planned_tomorrow && (
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2">Planned for Tomorrow</h5>
                      <p className="text-sm text-gray-700">{report.work_planned_tomorrow}</p>
                    </div>
                  )}
                  {report.materials_used && (
                    <div>
                      <h5 className="font-medium text-purple-700 mb-2">Materials Used</h5>
                      <p className="text-sm text-gray-700">{report.materials_used}</p>
                    </div>
                  )}
                  {report.equipment_used && (
                    <div>
                      <h5 className="font-medium text-orange-700 mb-2">Equipment Used</h5>
                      <p className="text-sm text-gray-700">{report.equipment_used}</p>
                    </div>
                  )}
                </div>

                {/* Issues and Safety */}
                {(report.issues_encountered || report.safety_incidents) && (
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                    {report.issues_encountered && (
                      <div>
                        <h5 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          Issues Encountered
                        </h5>
                        <p className="text-sm text-gray-700">{report.issues_encountered}</p>
                      </div>
                    )}
                    {report.safety_incidents && (
                      <div>
                        <h5 className="font-medium text-red-700 mb-2 flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          Safety Incidents
                        </h5>
                        <p className="text-sm text-gray-700">{report.safety_incidents}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Progress Bar */}
                {report.progress_percentage > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Daily Progress</span>
                      <span>{report.progress_percentage}%</span>
                    </div>
                    <Progress value={report.progress_percentage} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
