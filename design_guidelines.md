# Positopia Companion App - Design Guidelines

## Design Approach
**Reference-Based Approach**: Inspired by educational apps like ABCmouse and Khan Academy Kids, featuring bright, engaging interfaces specifically designed for children's interaction patterns. The design integrates book aesthetic from Positopia World featuring Dune the Bunny character.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Primary (Soft Teal): 165.65 26.44% 65.88%
- Secondary (Dark Text): 0 0% 8.24%
- Background (Warm Cream): 70.91 21.57% 90%
- Accent (Gentle Purple): 292.13 48.03% 75.1%

**Traffic Light Colors:**
- Red (Bad Emotions): Traditional red with child-safe brightness
- Yellow (Nervous Emotions): Traditional yellow with child-safe brightness  
- Green (Good Emotions): Traditional green with child-safe brightness

### B. Typography
- **Primary Font**: Inter (clean, readable for children)
- **Monospace Font**: IBM Plex Mono (for admin interface and technical elements)
- **Sizes**: Extra large for main CTAs and traffic light buttons, generous sizing throughout for young readers

### C. Layout System
**Spacing Primitives**: Use Tailwind units of 1, 2, 4, 8, 12, and 16 for consistent rhythm (base 0.25rem)
- Core spacing: p-4, m-8, gap-4
- Large breathing room: p-12, py-16
- Mobile-first approach optimized for tablets

### D. Component Library

**Traffic Light Interface (Main Feature):**
- Three large, circular buttons (red/yellow/green) in traffic light vertical arrangement
- Touch-friendly sizing (minimum 80px diameter on mobile, larger on tablets)
- Rounded corners: 0.875rem (14px) radius throughout
- Simple text input field below for feeling description
- Clear, playful labeling for each emotion category

**Admin Panel:**
- Clean, organized CRUD interfaces for content management
- Audio upload with drag-and-drop functionality
- Volume sliders and TTS voice profile selectors
- Category management system (red/yellow/green/general)
- File management tables with edit/delete actions

**Content Display:**
- Audio player controls with large, colorful play/pause buttons
- Affirmation cards with book-inspired illustrations
- Activity suggestion cards with Dune the Bunny character
- Joke display with cheerful typography and animations

**Navigation:**
- Simple, icon-based navigation for child users
- Distinct admin toggle/login for parent/educator access
- Breadcrumb navigation in admin panel

### E. Visual Elements
- **Character Integration**: Dune the Bunny appears throughout as friendly guide
- **Book Illustrations**: Use provided Positopia World imagery as decorative elements
- **Iconography**: Large, friendly icons (FontAwesome or Heroicons) for activities and emotions
- **Buttons**: Oversized, rounded, with high contrast and obvious clickable appearance

### F. Animations
Use sparingly, only for:
- Button press feedback (gentle scale/color change)
- Traffic light selection confirmation
- Content reveal transitions (smooth fade-in)
- Character appearance/encouragement moments

## Images
**Hero Section**: Feature Dune the Bunny character prominently with traffic light interface - use warm, inviting book illustrations as background elements

**Decorative Images**: 
- Scatter book illustrations throughout interface as mood-enhancing elements
- Use character poses from provided assets to guide users through emotional journey
- Activity cards feature relevant illustrations from book pages

**Admin Panel**: Clean, minimal imagery - focus on functionality with small thumbnail previews of uploaded audio/content

## Responsive Behavior
- **Mobile/Tablet First**: Optimize for touch interaction, minimum 44px touch targets
- **Large Text**: Ensure readability for young children across all devices  
- **Simplified Navigation**: Reduce cognitive load with obvious, single-purpose controls
- **Portrait Orientation**: Primary design for tablet portrait mode