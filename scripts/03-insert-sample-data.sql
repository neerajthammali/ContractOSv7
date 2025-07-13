-- ContractOS Sample Data
-- Run this script to populate the database with sample data for testing

-- Note: This script should be run after a user has signed up
-- Replace the user_id values with actual user IDs from your auth.users table

-- First, let's check if we have any users
DO $$
DECLARE
    user_count INTEGER;
    sample_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    IF user_count = 0 THEN
        RAISE NOTICE 'No users found. Please sign up first before running this script.';
    ELSE
        -- Get the first user ID for sample data
        SELECT id INTO sample_user_id FROM auth.users LIMIT 1;
        
        -- Insert sample projects
        INSERT INTO public.projects (
            name, client, location, status, description, budget, 
            start_date, end_date, progress, project_type, team_size, created_by
        ) VALUES 
        (
            'Downtown Office Complex', 
            'ABC Corporation', 
            '123 Main Street, New York, NY 10001', 
            'active', 
            'Modern 15-story office building with underground parking and retail space on ground floor',
            2500000, 
            '2024-01-15', 
            '2024-12-31', 
            35, 
            'commercial', 
            25, 
            sample_user_id
        ),
        (
            'Luxury Residential Villa', 
            'Smith Family Trust', 
            '456 Oak Avenue, Los Angeles, CA 90210', 
            'planning', 
            'Custom 4-bedroom luxury villa with pool, garden, and smart home integration',
            850000, 
            '2024-03-01', 
            '2024-10-15', 
            0, 
            'residential', 
            12, 
            sample_user_id
        ),
        (
            'Highway Bridge Renovation', 
            'State Department of Transportation', 
            'Interstate 95, Miami, FL', 
            'active', 
            'Complete structural renovation of 500-meter highway bridge including seismic upgrades',
            1200000, 
            '2024-02-01', 
            '2024-08-30', 
            60, 
            'infrastructure', 
            18, 
            sample_user_id
        ),
        (
            'Industrial Warehouse Complex', 
            'LogiCorp Industries', 
            '789 Industrial Blvd, Chicago, IL 60601', 
            'completed', 
            'Multi-building warehouse complex with automated sorting systems',
            3200000, 
            '2023-06-01', 
            '2024-01-15', 
            100, 
            'industrial', 
            30, 
            sample_user_id
        );

        -- Insert sample tasks for the first project
        INSERT INTO public.tasks (
            title, description, status, priority, assignee, due_date, project_id, created_by
        ) 
        SELECT 
            task_data.title,
            task_data.description,
            task_data.status,
            task_data.priority,
            task_data.assignee,
            task_data.due_date,
            p.id,
            sample_user_id
        FROM (
            SELECT 'Foundation Excavation' as title, 'Complete excavation for building foundation' as description, 'done' as status, 'high' as priority, 'John Smith' as assignee, '2024-02-15'::date as due_date
            UNION ALL
            SELECT 'Steel Frame Installation', 'Install main structural steel framework', 'in-progress', 'high', 'Mike Johnson', '2024-04-30'
            UNION ALL
            SELECT 'Electrical Rough-in', 'Install electrical conduits and wiring', 'todo', 'medium', 'Sarah Wilson', '2024-06-15'
            UNION ALL
            SELECT 'HVAC System Installation', 'Install heating, ventilation, and air conditioning systems', 'backlog', 'medium', 'David Brown', '2024-07-30'
            UNION ALL
            SELECT 'Interior Finishing', 'Complete interior walls, flooring, and fixtures', 'backlog', 'low', 'Lisa Davis', '2024-09-15'
        ) task_data
        CROSS JOIN (
            SELECT id FROM public.projects WHERE name = 'Downtown Office Complex' LIMIT 1
        ) p;

        -- Insert sample milestones
        INSERT INTO public.milestones (
            title, description, due_date, status, completion_percentage, project_id, created_by
        )
        SELECT 
            milestone_data.title,
            milestone_data.description,
            milestone_data.due_date,
            milestone_data.status,
            milestone_data.completion_percentage,
            p.id,
            sample_user_id
        FROM (
            SELECT 'Foundation Complete' as title, 'Foundation work finished and inspected' as description, '2024-03-01'::date as due_date, 'completed' as status, 100 as completion_percentage
            UNION ALL
            SELECT 'Structural Frame Complete', 'Main building structure completed', '2024-05-15', 'pending', 75
            UNION ALL
            SELECT 'Roof Installation', 'Building envelope sealed', '2024-07-01', 'pending', 0
            UNION ALL
            SELECT 'Final Inspection', 'Building ready for occupancy', '2024-12-15', 'pending', 0
        ) milestone_data
        CROSS JOIN (
            SELECT id FROM public.projects WHERE name = 'Downtown Office Complex' LIMIT 1
        ) p;

        -- Insert sample budget items
        INSERT INTO public.budget_items (
            category, description, planned_cost, actual_cost, project_id, created_by
        )
        SELECT 
            budget_data.category,
            budget_data.description,
            budget_data.planned_cost,
            budget_data.actual_cost,
            p.id,
            sample_user_id
        FROM (
            SELECT 'Materials' as category, 'Steel, concrete, and other building materials' as description, 800000 as planned_cost, 750000 as actual_cost
            UNION ALL
            SELECT 'Labor', 'Construction crew wages and benefits', 600000, 580000
            UNION ALL
            SELECT 'Equipment', 'Heavy machinery rental and operation', 300000, 320000
            UNION ALL
            SELECT 'Permits', 'Building permits and inspections', 50000, 45000
            UNION ALL
            SELECT 'Utilities', 'Temporary power, water, and utilities', 75000, 70000
        ) budget_data
        CROSS JOIN (
            SELECT id FROM public.projects WHERE name = 'Downtown Office Complex' LIMIT 1
        ) p;

        RAISE NOTICE 'Sample data inserted successfully for user: %', sample_user_id;
    END IF;
END $$;
