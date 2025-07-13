import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  redirect("/dashboard")
}
