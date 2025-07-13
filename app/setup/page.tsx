import { DatabaseSetup } from "@/components/database-setup"

export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <DatabaseSetup />
    </div>
  )
}
