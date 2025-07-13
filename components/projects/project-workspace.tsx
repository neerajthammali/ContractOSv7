"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, Users, Plus, MapPin, DollarSign, Clock, Edit, CalendarIcon } from "lucide-react"
import { KanbanBoard } from "@/components/tasks/kanban-board"
import { TaskCreateDialog } from "@/components/tasks/task-create-dialog"
import { ProjectEditDialog } from "@/components/projects/project-edit-dialog"
import { DocumentManager } from "@/components/documents/document-manager"
import { ChatSystem } from "@/components/chat/chat-system"
import { BudgetTracker } from "@/components/budget/budget-tracker"
import { DailyReports } from "@/components/reports/daily-reports"
import { useTasks } from "@/hooks/use-tasks"
import { useProjects } from "@/hooks/use-projects"
import { useAuth } from "@/hooks/use-auth"

interface Project {
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
}

interface ProjectWorkspaceProps {
  project: Project
}

export function ProjectWorkspace({ project: initialProject }: ProjectWorkspaceProps) {
  const [showTaskDialog, setShowTaskDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const { user } = useAuth()
  const { projects } = useProjects(user)
  const { tasks } = useTasks(initialProject.id)

  // Get the latest project data from the hook
  const project = projects.find((p) => p.id === initialProject.id) || initialProject

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "planning":
        return "bg-blue-500"
      case "on-hold":
        return "bg-yellow-500"
      case "completed":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const daysRemaining = Math.ceil((new Date(project.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === "done").length
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {project.location}
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="h-4 w-4" />
                {project.client}
              </div>
              <Badge variant="outline">{project.project_type}</Badge>
            </div>
          </div>
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Budget</p>
                  <p className="text-lg font-semibold">${project.budget.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Team Size</p>
                  <p className="text-lg font-semibold">{project.team_size}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Days Remaining</p>
                  <p className="text-lg font-semibold">{daysRemaining}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Task Progress</p>
                  <p className="text-lg font-semibold">{taskCompletionRate}%</p>
                </div>
                <div className="w-8">
                  <Progress value={taskCompletionRate} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-1">Total Tasks</h4>
            <p className="text-2xl font-bold text-blue-700">{totalTasks}</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-900 mb-1">In Progress</h4>
            <p className="text-2xl font-bold text-yellow-700">{inProgressTasks}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-1">Completed</h4>
            <p className="text-2xl font-bold text-green-700">{completedTasks}</p>
          </div>
        </div>

        {project.description && (
          <div>
            <h3 className="font-medium mb-2">Project Description</h3>
            <p className="text-gray-600">{project.description}</p>
          </div>
        )}
      </div>

      {/* Project Workspace Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Task Management</h2>
            <Button onClick={() => setShowTaskDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
          <KanbanBoard projectId={project.id} />
        </TabsContent>

        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Project Schedule
              </CardTitle>
              <CardDescription>Timeline and milestone tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Project Timeline</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Start Date:</span>
                        <span>{new Date(project.start_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>End Date:</span>
                        <span>{new Date(project.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>
                          {Math.ceil(
                            (new Date(project.end_date).getTime() - new Date(project.start_date).getTime()) /
                              (1000 * 60 * 60 * 24),
                          )}{" "}
                          days
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Progress Overview</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                      <div className="flex justify-between text-sm">
                        <span>Task Completion</span>
                        <span>{taskCompletionRate}%</span>
                      </div>
                      <Progress value={taskCompletionRate} className="h-2" />
                    </div>
                  </div>
                </div>
                <div className="h-64 flex items-center justify-center text-gray-500 border rounded-lg">
                  Gantt chart visualization will be implemented here
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentManager projectId={project.id} />
        </TabsContent>

        <TabsContent value="reports">
          <DailyReports projectId={project.id} />
        </TabsContent>

        <TabsContent value="chat">
          <ChatSystem projectId={project.id} />
        </TabsContent>

        <TabsContent value="budget">
          <BudgetTracker projectId={project.id} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showTaskDialog && (
        <TaskCreateDialog open={showTaskDialog} onClose={() => setShowTaskDialog(false)} projectId={project.id} />
      )}

      {showEditDialog && (
        <ProjectEditDialog open={showEditDialog} onClose={() => setShowEditDialog(false)} project={project} />
      )}
    </div>
  )
}
