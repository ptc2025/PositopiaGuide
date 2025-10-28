# Positopia Companion App

## Overview
The Positopia Companion App is an interactive web application designed for children to learn about and express their emotions. Based on the "Positopia World" book, the app features Dune the Bunny and uses a simplified traffic light interface (red/yellow/green buttons) for children to indicate their feelings. An AI system then provides personalized responses, including musical tracks, affirmations, activities, and jokes, tailored to the child's emotional state. The project aims to provide a safe, engaging, and supportive digital environment for emotional learning, offering tools for self-regulation and positive reinforcement.

## User Preferences
- Child-friendly UI design is critical - large buttons, bright colors, simple language.
- Audio files must use object storage (not local paths).
- AI should select age-appropriate, positive content.
- Admin panel should be comprehensive but straightforward.
- The UI should not use emojis for consistency.
- I prefer detailed explanations.
- I want iterative development.
- Ask before making major changes.

## System Architecture
The application features a comprehensive storybook theme across all pages, including a cartoon backyard background with animated floating clouds and content cards with wooden border effects. It uses consistent child-friendly typography and prioritizes accessibility with 80px minimum touch targets and a mobile-first, tablet-optimized layout.

**Technical Implementations:**
- **Frontend**: React, Wouter for routing, TanStack Query for data fetching, and Shadcn UI components.
- **Backend**: Express.js and Node.js.
- **Database**: PostgreSQL (Neon) managed with Drizzle ORM, storing various content types, child profiles, and emotion check-ins.
- **Session Management**: PostgreSQL-backed session store (`connect-pg-simple`) for production-grade authentication and session persistence.
- **AI Integration**: OpenAI GPT-4o-mini is used for emotion categorization of user input and content selection. OpenAI's Text-to-Speech API ("Nova" voice) provides natural voice for affirmations.
- **Object Storage**: Google Cloud Object Storage is used for storing audio files, with presigned URLs for secure uploads and access.
- **Styling**: Tailwind CSS with a custom design system featuring soft teal, gentle purple, and warm cream colors, and friendly rounded corners.

**Feature Specifications:**
- **Traffic Light Interface**: Abstract red/yellow/green buttons for emotion input, auto-submitting default text for young children.
- **AI Response System**: Categorizes emotions and dynamically selects appropriate content (music, affirmations, activities, jokes).
- **Audio Playback**: Streams music from object storage, with synchronized playback of AI voice and background music.
- **Multi-Child & Family Support**: Secure family code system for grouping children, with profile selection and CRUD operations for child profiles.
- **Emotion History & Analytics**: Individual child emotion history, calendar view with visual emotion representation, and parent/teacher dashboard with family-wide analytics and AI-powered insights into emotional patterns.
- **Wellness Features**: Guided breathing exercise page with animated guides, customizable patterns, visual themes, speed controls, and achievement tracking.
- **Admin Panel**: Comprehensive interface for managing all content types (audio, affirmations, activities, jokes, TTS settings) with AI-powered auto-categorization for uploaded audio files.

## External Dependencies
- **Database**: PostgreSQL (specifically Neon for cloud hosting)
- **AI Services**: OpenAI (GPT-4o-mini for content selection/categorization, Text-to-Speech API for voice generation)
- **Object Storage**: Google Cloud Object Storage
- **Frontend Libraries**: React, Wouter, TanStack Query, Shadcn UI
- **Backend Libraries**: Express.js, Node.js, `connect-pg-simple` (for PostgreSQL session store), Drizzle ORM
- **Styling**: Tailwind CSS
- **Other**: `pg` (PostgreSQL client for Node.js)