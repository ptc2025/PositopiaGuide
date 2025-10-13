# Positopia Companion App

## Overview
An interactive emotional learning web app for children based on the Positopia World book featuring Dune the Bunny. Children use a traffic light interface (red/yellow/green buttons) to describe their feelings and receive AI-selected personalized responses including musical tracks, affirmations, activities, and jokes.

## Recent Changes (Oct 13, 2025)
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
4. **Admin Panel**: Full CRUD for all content types
5. **Auto-Categorization**: AI categorizes uploaded audio files by emotion

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

### AI Integration
- `POST /api/categorize` - Categorize child's emotion input
- `POST /api/select-content` - Select personalized response content

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
- `server/objectStorage.ts` - Object storage service
- `server/openai.ts` - OpenAI integration
- `client/src/pages/home.tsx` - Main traffic light interface
- `client/src/pages/admin.tsx` - Admin dashboard
- `client/src/components/admin/audio-manager.tsx` - Audio upload & management
- `design_guidelines.md` - UI/UX design specifications
- `tailwind.config.ts` - Tailwind configuration with custom colors
