# ContractOS - Construction Project Management SaaS

A modern, AI-powered construction project management platform built for civil engineers, site managers, and contractors.

## 🚀 Features

### Core Modules
- **Project Dashboard** - Comprehensive overview with KPIs and project status
- **Project Setup Wizard** - Multi-step project creation with smart defaults
- **Task Management** - Kanban-style task boards with drag-and-drop
- **Schedule Management** - Timeline and milestone tracking
- **Document Management** - Centralized file storage and organization
- **Daily Site Reports** - Progress tracking and site condition logging
- **Real-time Collaboration** - Team communication and updates
- **Budget Tracking** - Cost monitoring and financial reporting
- **Issue Management** - Risk tracking and resolution workflows

### Technical Features
- **Authentication** - Secure login with Supabase Auth (Email + Google OAuth)
- **Role-Based Access Control** - Granular permissions with RLS
- **Real-time Updates** - Live data synchronization
- **Responsive Design** - Mobile-first approach
- **Modern UI** - Built with shadcn/ui components

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment**: Vercel
- **Database**: PostgreSQL with Row Level Security (RLS)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Vercel account (for deployment)

### Local Development Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/contractos.git
   cd contractos
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Run the database schema script in Supabase SQL Editor

4. **Configure environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Update `.env.local` with your Supabase credentials:
   \`\`\`env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

5. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄️ Database Setup

The application uses PostgreSQL with the following main tables:

- `profiles` - User profiles extending Supabase auth
- `projects` - Construction projects
- `tasks` - Project tasks with Kanban workflow
- `milestones` - Project milestones and deadlines
- `issues` - Issue tracking and resolution
- `daily_reports` - Daily site progress reports
- `documents` - File storage metadata
- `budget_items` - Budget tracking and cost management

Run the provided SQL schema script in your Supabase SQL Editor to set up all tables, RLS policies, and indexes.

## 🚀 Deployment

### Deploy to Vercel

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure Environment Variables**
   - Add your Supabase credentials in Vercel dashboard
   - Set up any additional API keys

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch

### Manual Deployment
\`\`\`bash
npm run build
npm run start
\`\`\`

## 🔧 Configuration

### Supabase Configuration
- Enable Row Level Security (RLS) on all tables
- Set up authentication providers (Email, Google OAuth)
- Configure storage buckets for file uploads
- Enable Realtime for live updates

### Authentication Setup
The app supports:
- Email/Password authentication
- Google OAuth integration
- Automatic profile creation on signup

## 📱 Usage

### Getting Started
1. **Sign up** - Create an account or sign in with Google
2. **Create Project** - Use the project setup wizard
3. **Add Tasks** - Create and organize tasks using Kanban boards
4. **Invite Team** - Add team members and assign roles
5. **Track Progress** - Monitor project status and milestones

### Key Workflows
- **Project Creation**: Multi-step wizard with validation
- **Task Management**: Drag-and-drop Kanban interface
- **Progress Tracking**: Real-time updates and notifications
- **Document Sharing**: Centralized file management
- **Reporting**: Daily site reports and progress summaries

## 🔮 Roadmap

### Phase 1 (Current)
- ✅ Core project management
- ✅ Task management with Kanban
- ✅ User authentication and RLS
- ✅ Responsive design

### Phase 2 (Next)
- 📅 Advanced scheduling with Gantt charts
- 📄 Document management with OCR
- 📊 Advanced reporting and analytics
- 💬 Real-time chat and collaboration

### Phase 3 (Future)
- 🤖 AI-powered scheduling and optimization
- 📱 Mobile app (React Native)
- 🔗 Third-party integrations (Stripe, DocuSign)
- 📈 Advanced analytics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@contractos.com
- Documentation: [docs.contractos.com](https://docs.contractos.com)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Vercel](https://vercel.com/) - Deployment platform
