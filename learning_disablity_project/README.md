# AI Learning Disability Detection System - Frontend

A production-level React.js frontend application for AI-powered learning disability detection in children. This interactive, visually appealing platform helps educators and parents identify learning disabilities early through comprehensive assessments.

## ?? Features

### ?? Comprehensive Assessment Tests
- **Reading Assessment** - Measure reading speed (WPM) and comprehension accuracy
- **Writing Test** - Evaluate handwriting and motor control skills with canvas drawing
- **Math Assessment** - Dynamic questions based on difficulty levels
- **Attention Test** - Interactive reaction time game with visual elements

### ?? User Experience
- Bright, colorful, kid-friendly interface
- Smooth animations and transitions using Framer Motion
- 3D animated elements with React Three Fiber
- Responsive design for mobile and desktop
- Progress tracking and real-time feedback

### ?? Results & Analytics
- Detailed performance charts and graphs
- AI-powered disability predictions with confidence scores
- Personalized recommendations for parents and teachers
- Overall score calculation and breakdown by test area

## ?? Tech Stack

- **React 19** - Latest React with server components support
- **Vite** - Ultra-fast build tool
- **React Router v7** - Client-side routing
- **Framer Motion** - Animation library
- **React Three Fiber** - 3D graphics
- **Three.js** - 3D engine
- **Chart.js** - Data visualization
- **Tailwind CSS** - Utility-first CSS framework

## ?? Getting Started

### Installation

\\\ash
cd ""learning disablity project""

npm install --legacy-peer-deps

npm run dev
\\\

The application will be available at \http://localhost:5174/\

## ?? Project Structure

\\\
src/
+-- pages/                    # 7 Page components
+-- components/
¦   +-- ui/                  # Reusable UI components
¦   +-- Layout/              # Navbar, Footer
¦   +-- 3D/                  # 3D animations
+-- contexts/                # AppContext for state
+-- hooks/                   # Custom hooks
+-- services/                # API services
+-- utils/                   # Helper functions
\\\

## ?? Pages Included

1. **HomePage** - Landing page with 3D animations
2. **ChildFormPage** - User information collection
3. **AssessmentTestPage** - Test selection interface
4. **ReadingTestPage** - Reading comprehension test
5. **WritingTestPage** - Canvas drawing assessment
6. **MathTestPage** - Mathematical problem solving
7. **AttentionTestPage** - Reaction time game
8. **ResultsPage** - Results with charts and AI prediction

## ?? Design Features

- **Color Scheme**: Vibrant gradients (Coral, Turquoise, Yellow)
- **Typography**: Poppins font (300-700 weights)
- **Animations**: Framer Motion for smooth transitions
- **3D Elements**: Floating shapes and animations
- **Responsive**: Mobile-first responsive design
- **Accessibility**: Large buttons, high contrast, clear labels

## ?? State Management

- Context API via AppContext.jsx
- Custom hooks for forms and timers
- Local component state for tests

## ?? What's Inside

- ? 7 Complete Pages
- ? 20+ Reusable Components
- ? 3D Animations
- ? Charts & Graphs
- ? Timer & Progress Tracking
- ? Canvas Drawing Integration
- ? API Service Layer
- ? Responsive Design
- ? Smooth Animations
- ? Professional UI/UX

## ?? Key Components

### UI Components
- Button (animated with hover effects)
- InputField (with validation)
- Card (with hover animations)
- ProgressBar (smooth transitions)
- Timer (countdown display)
- Badge (status indicators)
- Loader (spinning animation)

### Layout Components
- Navbar (sticky header)
- Footer (with links)
- FeatureCard (showcase items)
- TestimonyCard (user testimonials)

### Pages (Custom)
- Each page is fully functional
- Includes animations
- Handles user interactions
- Manages component state

## ?? Test Features

### Reading Test
- Age-appropriate text
- Real-time timer
- WPM calculation
- Comprehension questions
- Accuracy scoring

### Writing Test  
- Canvas drawing pad
- Mouse & touch support
- Drawing preview
- Motor control analysis

### Math Test
- Dynamic questions
- Difficulty levels
- Instant feedback
- Progress tracking

### Attention Test
- Interactive game
- Reaction time measurement
- Visual feedback
- Score calculation

## ?? Dependencies

- react & react-dom
- react-router-dom
- framer-motion
- three & @react-three/fiber
- chart.js & react-chartjs-2
- tailwindcss

## ?? Production Build

\\\ash
npm run build
npm run preview
\\\

## ?? Usage

1. Visit home page
2. Click ""Start Assessment""
3. Enter child information
4. Select and complete tests
5. View results with AI predictions

## ?? Performance

- ? Fast page loads with Vite
- ?? Smooth 60fps animations
- ?? Optimized for mobile
- ?? Lazy loading ready

## ?? Files Generated

- 8 Page components (JSX)
- 20+ UI components
- 3 Context providers
- 4 Custom hooks
- 1 API service layer
- 1 Utility helpers file
- Tailwind configuration
- PostCSS configuration

---

**Version**: 1.0.0 | **Status**: Production Ready ?
