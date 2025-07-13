-- Enhanced Chat System Database Schema
-- Run this script to add comprehensive chat functionality

-- Create chat messages table with enhanced features
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL CHECK (length(trim(content)) > 0),
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_email TEXT,
  reply_to UUID REFERENCES public.chat_messages(id),
  mentions UUID[], -- Array of user IDs mentioned in the message
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat participants table to track who has access to project chats
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Create chat reactions table for message reactions
CREATE TABLE IF NOT EXISTS public.chat_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (length(trim(emoji)) > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for chat messages
CREATE POLICY "Users can view messages in projects they participate in" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.project_id = chat_messages.project_id 
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in projects they participate in" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_participants 
      WHERE chat_participants.project_id = chat_messages.project_id 
      AND chat_participants.user_id = auth.uid()
    ) AND auth.uid() = sender_id
  );

CREATE POLICY "Users can edit their own messages" ON public.chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Create RLS policies for chat participants
CREATE POLICY "Users can view participants in their projects" ON public.chat_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = chat_participants.project_id 
      AND projects.created_by = auth.uid()
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Project owners can manage participants" ON public.chat_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = chat_participants.project_id 
      AND projects.created_by = auth.uid()
    )
  );

-- Create RLS policies for chat reactions
CREATE POLICY "Users can view reactions in accessible projects" ON public.chat_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_messages 
      JOIN public.chat_participants ON chat_participants.project_id = chat_messages.project_id
      WHERE chat_messages.id = chat_reactions.message_id 
      AND chat_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own reactions" ON public.chat_reactions
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_project_id ON public.chat_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_mentions ON public.chat_messages USING GIN(mentions);

CREATE INDEX IF NOT EXISTS idx_chat_participants_project_id ON public.chat_participants(project_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON public.chat_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON public.chat_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_chat_reactions_user_id ON public.chat_reactions(user_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create trigger for updated_at timestamps
CREATE TRIGGER handle_updated_at_chat_messages 
  BEFORE UPDATE ON public.chat_messages 
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Function to automatically add project creator as chat participant
CREATE OR REPLACE FUNCTION public.add_project_creator_to_chat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chat_participants (project_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add project creator to chat
CREATE TRIGGER add_creator_to_chat_trigger
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.add_project_creator_to_chat();

-- Function to update last_read_at when user sends a message
CREATE OR REPLACE FUNCTION public.update_last_read_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_participants 
  SET last_read_at = NOW()
  WHERE project_id = NEW.project_id AND user_id = NEW.sender_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_read_at
CREATE TRIGGER update_last_read_trigger
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_last_read_on_message();

SELECT 'Enhanced chat system database setup completed successfully!' as status;
