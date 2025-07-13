import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import { ProjectWorkspace } from "@/components/projects/project-workspace"

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch project details
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single()

  if (!project) {
    redirect("/dashboard")
  }

  return <ProjectWorkspace project={project} />
}
