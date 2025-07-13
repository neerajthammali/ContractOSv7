"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Database, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase"

export function DatabaseSetup() {
  const [setupStatus, setSetupStatus] = useState<{
    step: number
    message: string
    error?: string
    completed: boolean
  }>({
    step: 0,
    message: "Ready to setup database",
    completed: false,
  })

  const [isRunning, setIsRunning] = useState(false)
  const supabase = createClient()

  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from(tableName).select("*").limit(1)

      return !error
    } catch {
      return false
    }
  }

  const runDatabaseSetup = async () => {
    setIsRunning(true)
    setSetupStatus({ step: 1, message: "Starting database setup...", completed: false })

    try {
      // Step 1: Check if tables already exist
      setSetupStatus({ step: 1, message: "Checking existing database structure...", completed: false })

      const tablesExist = await checkTableExists("projects")

      if (tablesExist) {
        setSetupStatus({
          step: 4,
          message: "Database is already set up and working correctly!",
          completed: true,
        })
        setIsRunning(false)
        return
      }

      // Step 2: Create projects table
      setSetupStatus({ step: 2, message: "Creating projects table...", completed: false })

      // Create projects table using direct SQL
      const { error: projectsError } = await supabase.from("_temp_setup").select("*").limit(1)

      // Since we can't execute arbitrary SQL from the client, we'll use a different approach
      // We'll try to create a simple record to test if the table exists, and if not, show instructions

      const { data: testData, error: testError } = await supabase.from("projects").select("id").limit(1)

      if (testError && testError.message.includes('relation "public.projects" does not exist')) {
        // Table doesn't exist, we need manual setup
        setSetupStatus({
          step: 2,
          message: "Manual database setup required",
          error: "Please run the SQL scripts in your Supabase dashboard",
          completed: false,
        })
        setIsRunning(false)
        return
      }

      // Step 3: Test tasks table
      setSetupStatus({ step: 3, message: "Checking tasks table...", completed: false })

      const { error: tasksTestError } = await supabase.from("tasks").select("id").limit(1)

      if (tasksTestError && tasksTestError.message.includes('relation "public.tasks" does not exist')) {
        setSetupStatus({
          step: 3,
          message: "Tasks table missing",
          error: "Please run the complete SQL setup scripts",
          completed: false,
        })
        setIsRunning(false)
        return
      }

      // Step 4: Verify setup
      setSetupStatus({ step: 4, message: "Verifying database setup...", completed: false })

      const projectsExist = await checkTableExists("projects")
      const tasksExist = await checkTableExists("tasks")

      if (projectsExist && tasksExist) {
        setSetupStatus({
          step: 4,
          message: "Database setup completed successfully!",
          completed: true,
        })
      } else {
        throw new Error("Database verification failed")
      }
    } catch (error: any) {
      setSetupStatus({
        step: setupStatus.step,
        message: "Database setup failed",
        error: error.message,
        completed: false,
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Database Setup
        </CardTitle>
        <CardDescription>Set up the ContractOS database tables and security policies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {setupStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>{setupStatus.error}</p>
                <div className="text-sm">
                  <p className="font-medium">Manual Setup Required:</p>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li>Open your Supabase Dashboard</li>
                    <li>Go to SQL Editor</li>
                    <li>Run the database setup scripts provided</li>
                    <li>Return here and click "Check Database" to verify</li>
                  </ol>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {setupStatus.completed ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isRunning ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            )}
            <span className={setupStatus.completed ? "text-green-700" : "text-gray-700"}>{setupStatus.message}</span>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Setup Instructions:</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900 mb-2">Quick Setup (Recommended):</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Copy the SQL script from the "Database Scripts" section below</li>
                <li>Open your Supabase Dashboard → SQL Editor</li>
                <li>Paste and run the script</li>
                <li>Return here and click "Check Database"</li>
              </ol>
            </div>
          </div>
        </div>

        <Button
          onClick={runDatabaseSetup}
          disabled={isRunning}
          className="w-full"
          variant={setupStatus.completed ? "outline" : "default"}
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking database...
            </>
          ) : setupStatus.completed ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Database Ready
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Check Database
            </>
          )}
        </Button>

        {setupStatus.completed && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Database setup is complete! You can now create projects and manage tasks.
            </AlertDescription>
          </Alert>
        )}

        {/* SQL Scripts Section */}
        <div className="mt-6 space-y-4">
          <h4 className="font-medium">Database Setup Script:</h4>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            <pre>{`-- ContractOS Database Setup
-- Copy and paste this entire script into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  client TEXT NOT NULL CHECK (length(trim(client)) > 0),
  location TEXT NOT NULL CHECK (length(trim(location)) > 0),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed')),
  description TEXT,
  budget NUMERIC DEFAULT 0 CHECK (budget >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  project_type TEXT CHECK (project_type IN ('residential', 'commercial', 'industrial', 'infrastructure', 'renovation')),
  team_size INTEGER DEFAULT 0 CHECK (team_size >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in-progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee TEXT,
  due_date DATE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks in own projects" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in own projects" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in own projects" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in own projects" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;`}</pre>
          </div>
          <Button
            onClick={() =>
              navigator.clipboard.writeText(`-- ContractOS Database Setup
-- Copy and paste this entire script into Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  client TEXT NOT NULL CHECK (length(trim(client)) > 0),
  location TEXT NOT NULL CHECK (length(trim(location)) > 0),
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on-hold', 'completed')),
  description TEXT,
  budget NUMERIC DEFAULT 0 CHECK (budget >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  project_type TEXT CHECK (project_type IN ('residential', 'commercial', 'industrial', 'infrastructure', 'renovation')),
  team_size INTEGER DEFAULT 0 CHECK (team_size >= 0),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL CHECK (length(trim(title)) > 0),
  description TEXT,
  status TEXT DEFAULT 'backlog' CHECK (status IN ('backlog', 'todo', 'in-progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee TEXT,
  due_date DATE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for tasks
CREATE POLICY "Users can view tasks in own projects" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks in own projects" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in own projects" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in own projects" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = tasks.project_id 
      AND projects.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;`)
            }
            variant="outline"
            size="sm"
          >
            Copy SQL Script
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
