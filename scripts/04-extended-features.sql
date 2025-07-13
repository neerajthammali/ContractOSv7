-- Extended features: Documents, Chat, Budget, Invoices, Daily Reports

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(100),
    category VARCHAR(100) DEFAULT 'general',
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    file_url TEXT,
    file_name TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    reply_to UUID REFERENCES chat_messages(id) ON DELETE SET NULL,
    mentions TEXT[], -- Array of user emails mentioned
    reactions JSONB DEFAULT '{}',
    edited_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat participants table
CREATE TABLE IF NOT EXISTS chat_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, user_id)
);

-- Budget items table
CREATE TABLE IF NOT EXISTS budget_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_cost DECIMAL(12,2) DEFAULT 0,
    planned_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    actual_cost DECIMAL(12,2) DEFAULT 0,
    variance DECIMAL(12,2) GENERATED ALWAYS AS (actual_cost - planned_cost) STORED,
    status VARCHAR(50) DEFAULT 'planned',
    supplier VARCHAR(255),
    invoice_number VARCHAR(100),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    expense_date DATE NOT NULL,
    vendor VARCHAR(255),
    receipt_url TEXT,
    receipt_filename TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_address TEXT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal * tax_rate / 100) STORED,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100)) STORED,
    notes TEXT,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily reports table
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_date DATE NOT NULL,
    weather_conditions VARCHAR(100),
    temperature_high INTEGER,
    temperature_low INTEGER,
    labor_count INTEGER DEFAULT 0,
    equipment_used TEXT[],
    materials_delivered TEXT[],
    work_completed TEXT NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    safety_incidents INTEGER DEFAULT 0,
    safety_meeting_held BOOLEAN DEFAULT false,
    issues_encountered TEXT,
    photos TEXT[], -- Array of photo URLs
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(project_id, report_date)
);

-- Enable RLS on all tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents for their projects" ON documents
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert documents for their projects" ON documents
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update documents for their projects" ON documents
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete documents for their projects" ON documents
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages for their projects" ON chat_messages
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM chat_participants WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages for their projects" ON chat_messages
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM chat_participants WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON chat_messages
    FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants for their projects" ON chat_participants
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Project owners can manage participants" ON chat_participants
    FOR ALL USING (
        project_id IN (SELECT id FROM projects WHERE created_by = auth.uid())
    );

-- RLS Policies for budget_items
CREATE POLICY "Users can view budget items for their projects" ON budget_items
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert budget items for their projects" ON budget_items
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update budget items for their projects" ON budget_items
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete budget items for their projects" ON budget_items
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses for their projects" ON expenses
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert expenses for their projects" ON expenses
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update expenses for their projects" ON expenses
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete expenses for their projects" ON expenses
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices for their projects" ON invoices
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert invoices for their projects" ON invoices
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update invoices for their projects" ON invoices
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete invoices for their projects" ON invoices
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

-- RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items for their projects" ON invoice_items
    FOR SELECT USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE project_id IN (
                SELECT id FROM projects WHERE created_by = auth.uid()
                OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can insert invoice items for their projects" ON invoice_items
    FOR INSERT WITH CHECK (
        invoice_id IN (
            SELECT id FROM invoices WHERE project_id IN (
                SELECT id FROM projects WHERE created_by = auth.uid()
                OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can update invoice items for their projects" ON invoice_items
    FOR UPDATE USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE project_id IN (
                SELECT id FROM projects WHERE created_by = auth.uid()
                OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
            )
        )
    );

CREATE POLICY "Users can delete invoice items for their projects" ON invoice_items
    FOR DELETE USING (
        invoice_id IN (
            SELECT id FROM invoices WHERE project_id IN (
                SELECT id FROM projects WHERE created_by = auth.uid()
                OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
            )
        )
    );

-- RLS Policies for daily_reports
CREATE POLICY "Users can view daily reports for their projects" ON daily_reports
    FOR SELECT USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert daily reports for their projects" ON daily_reports
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can update daily reports for their projects" ON daily_reports
    FOR UPDATE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

CREATE POLICY "Users can delete daily reports for their projects" ON daily_reports
    FOR DELETE USING (
        project_id IN (
            SELECT id FROM projects WHERE created_by = auth.uid()
            OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_participants_project_user ON chat_participants(project_id, user_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_project_id ON budget_items(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project_id ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_date ON daily_reports(project_id, report_date);

-- Functions for automatic participant management
CREATE OR REPLACE FUNCTION add_project_creator_to_chat()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO chat_participants (project_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (project_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically add project creator to chat
DROP TRIGGER IF EXISTS trigger_add_creator_to_chat ON projects;
CREATE TRIGGER trigger_add_creator_to_chat
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION add_project_creator_to_chat();

-- Function to update last_read_at when user sends a message
CREATE OR REPLACE FUNCTION update_last_read_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_participants 
    SET last_read_at = NOW()
    WHERE project_id = NEW.project_id AND user_id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last read timestamp
DROP TRIGGER IF EXISTS trigger_update_last_read ON chat_messages;
CREATE TRIGGER trigger_update_last_read
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_last_read_on_message();
