import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { TeamContent } from "@/components/team/team-content"

export default async function TeamPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <TeamContent />
}
