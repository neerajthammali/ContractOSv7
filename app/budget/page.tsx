import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase-server"
import { BudgetContent } from "@/components/budget/budget-content"

export default async function BudgetPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <BudgetContent />
}
