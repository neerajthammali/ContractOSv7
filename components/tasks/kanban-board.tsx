"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { useTasks } from "@/hooks/use-tasks"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TaskEditDialog } from "@/components/tasks/task-edit-dialog"

interface KanbanBoardProps {
  projectId: string
}

const columns = [
  { id: "backlog", title: "Backlog", color: "bg-gray-100" },
  { id: "todo", title: "To Do", color: "bg-blue-100" },
  { id: "in-progress", title: "In Progress", color: "bg-yellow-100" },
  { id: "done", title: "Done", color: "bg-green-100" },
]

export function KanbanBoard({ projectId }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<any>(null)
  const [editingTask, setEditingTask] = useState<any>(null)
  const { tasks, loading, error, updateTaskStatus, deleteTask } = useTasks(projectId)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleDragStart = (task: any) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.status === newStatus) return

    try {
      await updateTaskStatus(draggedTask.id, newStatus)
    } catch (error: any) {
      alert(error.message)
    } finally {
      setDraggedTask(null)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteTask(taskId)
      } catch (error: any) {
        alert(error.message)
      }
    }
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  const TaskCard = ({ task }: { task: any }) => (
    <Card
      className="mb-3 cursor-move hover:shadow-md transition-shadow"
      draggable
      onDragStart={() => handleDragStart(task)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
            <div className="flex items-center gap-1">
              <Badge className={`${getPriorityColor(task.priority)} text-white text-xs`}>{task.priority}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingTask(task)}>
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeleteTask(task.id)} className="text-red-600">
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {task.description && <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>}

          <div className="flex justify-between items-center text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
            </div>

            {task.assignee && (
              <div className="flex items-center gap-1">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">{task.assignee.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-xs">{task.assignee}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div key={column.id} className={`${column.color} rounded-lg p-4 min-h-[500px]`}>
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-6" />
            </div>
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4 mb-3" />
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-5 w-5 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error loading tasks: {error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`${column.color} rounded-lg p-4 min-h-[500px]`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-800">{column.title}</h3>
              <Badge variant="secondary">{getTasksByStatus(column.id).length}</Badge>
            </div>

            <div className="space-y-2">
              {getTasksByStatus(column.id).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}

              {getTasksByStatus(column.id).length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No tasks in {column.title.toLowerCase()}</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Task Edit Dialog */}
      {editingTask && (
        <TaskEditDialog
          open={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          projectId={projectId}
        />
      )}
    </>
  )
}
