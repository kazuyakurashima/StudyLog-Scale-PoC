# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**StudyLog Next** is a Japanese elementary school student learning management application built for summer intensive course tracking. The app supports students, parents, and teachers with study record management, progress tracking, and feedback features.

- **Target Users**: 6th grade elementary students, parents, teachers
- **Usage Period**: July 21 - August 6, 2025 (17 days)
- **Tech Stack**: React 19 + TypeScript + Vite + Tailwind CSS + Supabase
- **Current Branch**: confirm-clean

## Essential Commands

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Install dependencies
npm install
```

### Database Management
```bash
# Setup database (TypeScript script)
npx ts-node scripts/setup-database.ts

# Clear test data (SQL script)
# Run scripts/clear-test-data.sql in Supabase SQL Editor
```

### Deployment
```bash
# Deploy to Vercel
vercel

# Set environment variables for Vercel
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
```

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.4.0 with custom font configuration
- **Icons**: Lucide React 0.454.0
- **State Management**: React useState (no external state management)

### Backend & Database
- **Database**: Supabase PostgreSQL
- **Authentication**: Simple role-based switching (no passwords)
- **Real-time**: Supabase real-time subscriptions
- **Hosting**: Vercel (configured via vercel.json)

## Project Structure

```
studylog-next/
├── docs/                          # Comprehensive documentation
│   ├── requirements.md            # Detailed project requirements (Japanese)
│   ├── deployment-guide.md        # Production deployment guide
│   ├── supabase-setup.md          # Database setup instructions
│   ├── database-schema-v2.sql     # Latest database schema
│   └── database-migration-v2.md   # Migration guide
├── scripts/                       # Database utilities
│   ├── clear-test-data.sql        # Clean test data
│   ├── database-setup.sql         # Initial schema
│   └── setup-database.ts          # Setup automation
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # Main progress dashboard (581 lines)
│   │   ├── StudyRecordForm.tsx    # Study record input form (370 lines)
│   │   ├── FeedbackPage.tsx       # Parent/teacher feedback (488 lines)
│   │   ├── UserSwitcher.tsx       # Role switching component (79 lines)
│   │   └── ui/                    # Reusable UI components
│   │       ├── Button.tsx         # Styled button component
│   │       ├── Card.tsx           # Card layout component
│   │       ├── EmotionButton.tsx  # Emotion selection button
│   │       ├── Input.tsx          # Text input component
│   │       ├── Select.tsx         # Dropdown select component
│   │       └── Textarea.tsx       # Textarea component
│   ├── lib/
│   │   └── supabase.ts            # Supabase client & type definitions
│   ├── App.tsx                    # Main application (122 lines)
│   └── main.tsx                   # React entry point
├── public/                        # Static assets
├── dist/                          # Production build output
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind customization
├── vite.config.js                 # Vite configuration
├── vercel.json                    # Vercel deployment config
└── .env.local                     # Environment variables (not in git)
```

## Key Features

### 1. Study Record Management
- Subject selection: aptitude, japanese, math, science, social
- Study date vs record date tracking
- Class vs homework differentiation
- Attempt number tracking for progress monitoring
- Emotion recording (good/normal/hard with emojis)
- Comment system (300 character limit)

### 2. Multi-Role Interface
- **Student Mode**: Record studies, view personal progress
- **Parent Mode**: View progress, send encouragement
- **Teacher Mode**: View progress, provide feedback
- Simple role switching without authentication

### 3. Progress Dashboard
- Continuation counter (X/17 days)
- Today's study records display
- Subject-wise accuracy statistics with progress bars
- Recent emotion tracking (last 5 days)
- Real-time updates every 30 seconds

### 4. Feedback System
- Three reaction types: 👏 (clap), 👍 (thumbs), 💪 (muscle)
- Message comments up to 500 characters
- Real-time feedback display
- Parent/teacher role differentiation

## Database Schema

### Core Tables
```sql
-- Study records with extended tracking
study_records (
  id, date, study_date, subject, content_type,
  attempt_number, questions_total, questions_correct,
  emotion, comment, created_at, updated_at
)

-- Feedback and reactions
feedbacks (
  id, record_id, sender_type, reaction_type,
  message, created_at
)
```

### Views & Functions
- `study_history_view`: Combined study records with feedback
- `get_study_streak()`: Calculate continuation days
- `get_subject_accuracy()`: Subject-wise accuracy calculation

## Environment Configuration

### Required Environment Variables
```bash
# .env.local (not in git)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### Supabase Configuration
- Row Level Security (RLS) enabled with public policies
- Real-time subscriptions enabled
- Automatic updated_at triggers
- Comprehensive indexing for performance

## Development Patterns

### State Management
- React useState for local component state
- No external state management library
- Supabase real-time subscriptions for data synchronization
- Automatic re-fetching every 30 seconds

### Component Structure
- Functional components with TypeScript
- Props interfaces defined for all components
- Reusable UI component library in `/src/components/ui/`
- Clear separation between data fetching and presentation

### Data Fetching
- Supabase client initialized in `/src/lib/supabase.ts`
- Type-safe database operations with TypeScript interfaces
- Error boundaries and loading states
- Real-time subscriptions for live updates

### Styling Approach
- Tailwind CSS utility-first approach
- Custom configuration for Japanese fonts
- Responsive design with mobile-first approach
- Custom animations for engagement

## UI/UX Design Guidelines

### Color Palette
- **Primary**: Blue-500 (#3B82F6)
- **Success**: Green-500 (#10B981)
- **Warning**: Yellow-500 (#F59E0B)
- **Error**: Red-500 (#EF4444)
- **Background**: Gradient from blue-50 to purple-50

### Typography & Fonts
- **Font Stack**: Inter, Hiragino Sans, Hiragino Kaku Gothic ProN, Noto Sans JP
- **Sizes**: text-2xl (headings), text-base (body), text-sm (small)
- **Responsive**: Optimized for iPad portrait (768px) and mobile (375px)

### Component Patterns
- Large touch-friendly buttons (44px minimum)
- Card-based layouts with subtle shadows
- Consistent spacing using Tailwind's system
- Emoji-based emotion indicators
- Progress bars for statistics display

## Important Notes

### Japanese Context
- All UI text is in Japanese
- Designed for Japanese elementary school system
- Cultural considerations in feedback and emotion expressions
- Subject names match Japanese curriculum

### Performance Considerations
- Lightweight bundle with minimal dependencies
- Efficient database queries with proper indexing
- Real-time updates balanced with performance
- Image assets optimized for web delivery

### Security
- Row Level Security policies for data protection
- Environment variables properly configured
- No sensitive data in client-side code
- Anonymous access with controlled permissions