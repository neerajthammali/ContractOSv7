"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, Plus, Mail, UserCheck, UserX, Crown, Shield, Eye, AlertCircle, Search } from "lucide-react"
import { useProjects } from "@/hooks/use-projects"
import { useAuth } from "@/hooks/use-auth"

export function TeamContent() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState("member")

  const { projects, loading, error } = useProjects()
  const { user } = useAuth()

  const getUserInitials = (email: string) => {
    return email
      .split("@")[0]
      .split(".")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2)
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-4 w-4 text-yellow-600" />
      case "manager":
        return <Shield className="h-4 w-4 text-blue-600" />
      case "member":
        return <UserCheck className="h-4 w-4 text-green-600" />
      case "viewer":
        return <Eye className="h-4 w-4 text-gray-600" />
      default:
        return <UserCheck className="h-4 w-4 text-green-600" />
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: "bg-yellow-100 text-yellow-800",
      manager: "bg-blue-100 text-blue-800",
      member: "bg-green-100 text-green-800",
      viewer: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={colors[role as keyof typeof colors] || colors.member}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const handleInviteTeamMember = async () => {
    // This would integrate with your team management system
    console.log("Inviting:", inviteEmail, "as", inviteRole, "to project", selectedProjectId)
    setShowInviteDialog(false)
    setInviteEmail("")
    setInviteRole("member")
  }

  // Mock team members data - replace with actual data from your backend
  const mockTeamMembers = [
    {
      id: "1",
      email: "john.doe@company.com",
      name: "John Doe",
      role: "admin",
      status: "active",
      joinedAt: "2024-01-15",
      lastActive: "2024-01-20",
    },
    {
      id: "2",
      email: "jane.smith@company.com",
      name: "Jane Smith",
      role: "manager",
      status: "active",
      joinedAt: "2024-01-16",
      lastActive: "2024-01-19",
    },
    {
      id: "3",
      email: "mike.wilson@company.com",
      name: "Mike Wilson",
      role: "member",
      status: "active",
      joinedAt: "2024-01-17",
      lastActive: "2024-01-18",
    },
    {
      id: "4",
      email: "sarah.johnson@company.com",
      name: "Sarah Johnson",
      role: "viewer",
      status: "pending",
      joinedAt: "2024-01-18",
      lastActive: null,
    },
  ]

  const filteredMembers = mockTeamMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-gray-600">Manage project team members and permissions</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Error loading projects: {error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Team Members</h1>
            <p className="text-gray-600">Manage project team members and permissions</p>
          </div>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin - Full access</SelectItem>
                    <SelectItem value="manager">Manager - Manage team and tasks</SelectItem>
                    <SelectItem value="member">Member - Create and edit</SelectItem>
                    <SelectItem value="viewer">Viewer - Read only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteTeamMember} disabled={!inviteEmail || !selectedProjectId}>
                Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Selection</CardTitle>
          <CardDescription>Choose a project to view its team members</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project..." />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedProjectId && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""} in this project
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm ? "Try adjusting your search terms" : "Invite team members to collaborate"}
                </p>
                <Button onClick={() => setShowInviteDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Invite First Member
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getUserInitials(member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{member.name}</h4>
                          {getRoleIcon(member.role)}
                          {getRoleBadge(member.role)}
                          {member.status === "pending" && (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                          <span>Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                          {member.lastActive && (
                            <span>Last active {new Date(member.lastActive).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.status === "pending" ? (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Mail className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                          <Button size="sm" variant="outline">
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Select defaultValue={member.role}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline">
                            <UserX className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
