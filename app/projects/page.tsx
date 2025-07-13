import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { ProjectsContent } from "@/components/projects/projects-content"

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <ProjectsContent />
}
