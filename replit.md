# Positopia Companion App

## Overview
An interactive emotional learning web app for children based on the Positopia World book featuring Dune the Bunny. Children use a traffic light interface (red/yellow/green buttons) to describe their feelings and receive AI-selected personalized responses including musical tracks, affirmations, activities, and jokes.

## Recent Changes (Oct 23, 2025)

### Breathing Page Complete Overhaul
- Redesigned with "Magical Breathing" title and Dune the Bunny as animated guide
- Added 4 customizable breathing patterns: Calm & Easy, Box Breathing, Sleepy Time, Energy Boost
- Implemented three-tab interface: Exercise, Customize, Progress
- Added visual customization with 4 themes (Balloon, Flower, Ocean Wave, Butterfly)
- Created adjustable speed controls (0.5x to 1.5x) for different age groups
- Built achievement system with 5 milestone badges and session tracking
- Added floating particle animations and progress ring visualization
- Included sound toggle for audio breathing cues
- Implemented session timer and cycle counter for progress tracking
- Enhanced with instructional tooltips from Dune character guide

### Complete Children's Book Theme Implementation
- Applied comprehensive storybook theme to all pages: Calendar, History, Breathing, Admin, and 404
- All pages now have cartoon backyard background with animated floating clouds
- All content cards use storybook-card styling with wooden border effects
- Implemented consistent child-friendly typography across all pages
- Verified theme consistency through end-to-end testing
- Ensured no emojis are used anywhere in the UI

## Previous Changes (Oct 21, 2025)

### Authentication Consistency Fix
- Fixed profile-select page to properly update component state when setting family code
- Separated input field state from actual family code state to prevent UI issues
- Dashboard now uses useEffect pattern consistent with other pages
- Profile selection ensures family code is saved to localStorage when selecting a child
- All pages accessible with same authentication token without re-authentication
- Resolved issue where dashboard would redirect back to profile selection unnecessarily

### Check-In Calendar & AI Insights (Oct 18, 2025)
- Implemented visual emotion calendar showing red/yellow/green days
- Monthly view with emotion color coding for each day
- Click on days to view detailed check-ins with timestamps
- AI-powered insights analyze emotional patterns and trends
- Monthly statistics track total check-ins and emotion distribution
- Streak tracking for consecutive green (positive) days
- Calendar accessible from main navigation

### UI Redesign - Abstract Traffic Light Interface
- Redesigned emotion selection as pure circular colored buttons
- Removed all text and descriptions for true abstract representation
- Three 128px circles arranged vertically like a real traffic light
- Clean, minimalist design focused on color association
- Smooth hover and click animations for tactile feedback
- Maintained accessibility with aria-labels

### Audio & Text-to-Speech Enhancement
- Implemented auto-play functionality for background music when responses are shown
- ~~Added text-to-speech (TTS) for affirmations using Web Speech API~~
- **Upgraded to OpenAI's Text-to-Speech API for natural, human-like voices**
- Using "Nova" voice profile - warm, friendly female voice perfect for children
- Created CombinedAudioPlayer component for synchronized playback
- Music plays at 50% volume while AI voice reads affirmations
- Single play/pause button controls both audio streams simultaneously
- Added restart button to replay both music and affirmation
- Voice speaks at 0.9x speed for better child comprehension

### Previous Updates (Oct 13, 2025)

### Multi-Child & Family Support
- Added `children` and `emotionCheckIns` database tables for profile management
- Implemented family code system for grouping children (families/classrooms)
- Built profile selection UI with colorful avatar system
- Created child profile CRUD operations with secure family-scoped queries
- Automatic emotion check-in logging when children share feelings

### Analytics & Insights
- Built parent/teacher dashboard with family-wide analytics
- Emotion breakdown tracking (red/yellow/green distribution)
- Per-child statistics and recent activity timeline
- Individual child emotion history page with chronological check-ins

### Wellness Features
- Breathing exercise page with animated guides (Box, 4-7-8, Simple Deep)
- Visual breathing circle with color-coded phases and countdown timer
- Play/pause/reset controls for guided meditation practice

### Previous Updates
- Implemented complete object storage integration for audio file uploads
- Added AI-powered auto-categorization for audio files (red/yellow/green/general)
- Created object storage service with presigned URL upload functionality
- Built comprehensive audio manager UI with file upload capabilities
- Configured PostgreSQL database with Drizzle ORM for all content types
- Fixed object path normalization to use bucket-relative paths
- Added contentType support for different audio formats (MP3, WAV, etc.)
- Improved error handling for upload failures and categorization issues
- Created database seed script with age-appropriate initial content
- Added fallback path normalization endpoint for failed AI categorization

## Project Architecture

### Database Schema
- **audio_files**: Musical tracks with emotion categories and volume settings
- **affirmations**: Positive messages categorized by emotion
- **activities**: Suggested activities for different emotional states
- **jokes**: Kid-friendly jokes to lift spirits
- **tts_settings**: Text-to-speech configuration (planned: emotion-specific profiles)
- **children**: Child profiles with names, avatar colors, and family codes
- **emotionCheckIns**: Emotion tracking with timestamps, feelings, and detected emotions

### Tech Stack
- **Frontend**: React, Wouter (routing), TanStack Query, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **AI**: OpenAI GPT-4o-mini (emotion categorization & content selection)
- **Storage**: Google Cloud Object Storage (audio files)
- **Styling**: Tailwind CSS with custom child-friendly design system

### Key Features
1. **Traffic Light Interface**: Red/yellow/green buttons for emotion input
2. **AI Response System**: Categorizes emotions and selects appropriate content
3. **Audio Playback**: Streams music from object storage with volume control
4. **Multi-Child Profiles**: Family code system for grouping children
5. **Emotion History**: Track emotional check-ins over time per child
6. **Parent/Teacher Dashboard**: Analytics and insights across all children
7. **Breathing Exercises**: Guided meditation with animated breathing circles
8. **Admin Panel**: Full CRUD for all content types
9. **Auto-Categorization**: AI categorizes uploaded audio files by emotion

### Design System
- **Colors**: Soft teal primary, gentle purple secondary, warm cream backgrounds
- **Typography**: Inter font family, large readable text
- **Interactions**: Child-friendly 80px minimum touch targets
- **Layout**: Mobile-first, tablet-optimized (768px breakpoint)
- **Border Radius**: Friendly rounded corners (0.875rem)

### Object Storage Setup
- **Bucket ID**: replit-objstore-87950f76-4bb1-4a97-905d-e8420e4cb00e
- **Public Path**: /replit-objstore-87950f76-4bb1-4a97-905d-e8420e4cb00e/public
- **Private Path**: /replit-objstore-87950f76-4bb1-4a97-905d-e8420e4cb00e/.private
- **Audio Storage**: Private directory with presigned URL access

## API Endpoints

### Object Storage
- `POST /api/audio/upload-url` - Generate presigned upload URL
- `POST /api/audio/categorize` - AI categorize uploaded audio
- `GET /objects/:objectPath(*)` - Download private objects
- `GET /public-objects/:filePath(*)` - Search and download public objects

### Content Management
- `GET/POST /api/audio` - Audio files CRUD
- `PATCH/DELETE /api/audio/:id` - Update/delete audio
- `GET/POST /api/affirmations` - Affirmations CRUD
- `GET/POST /api/activities` - Activities CRUD
- `GET/POST /api/jokes` - Jokes CRUD
- `GET/POST /api/tts-settings` - TTS configuration CRUD
- `POST /api/calendar-insights` - Generate AI insights from emotion patterns

### Child Profiles & Tracking
- `GET /api/children?familyCode={code}` - Get children by family code
- `POST /api/children` - Create new child profile
- `PUT /api/children/:id` - Update child profile
- `DELETE /api/children/:id` - Delete child profile
- `GET /api/emotion-checkins?childId={id}` - Get child's emotion history
- `GET /api/dashboard?familyCode={code}` - Get family dashboard analytics

### AI Integration
- `POST /api/analyze-emotion` - Analyze emotion and select content (logs check-in)

## User Preferences
- Child-friendly UI design is critical - large buttons, bright colors, simple language
- Audio files must use object storage (not local paths)
- AI should select age-appropriate, positive content
- Admin panel should be comprehensive but straightforward

## Running the Project
- Command: `npm run dev` (via "Start application" workflow)
- Server runs on port 5000
- Frontend and backend served on same port via Vite
- Database migrations: `npm run db:push` (or `--force` if needed)

## Important Files
- `shared/schema.ts` - Database schema and types
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database storage layer
- `server/objectStorage.ts` - Object storage service
- `server/openai.ts` - OpenAI integration
- `client/src/pages/home.tsx` - Main traffic light interface
- `client/src/pages/profile-select.tsx` - Child profile selection
- `client/src/pages/history.tsx` - Individual emotion history
- `client/src/pages/calendar.tsx` - Check-in calendar with insights
- `client/src/pages/dashboard.tsx` - Family analytics dashboard
- `client/src/pages/breathing.tsx` - Breathing exercises
- `client/src/pages/admin.tsx` - Admin dashboard
- `client/src/components/admin/audio-manager.tsx` - Audio upload & management
- `client/src/components/check-in-calendar.tsx` - Calendar component
- `design_guidelines.md` - UI/UX design specifications
- `tailwind.config.ts` - Tailwind configuration with custom colors
