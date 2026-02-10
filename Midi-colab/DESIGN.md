# Design System: MIDI Colab - Real-time Collaborative Music Creation
**Project ID:** midi-colab-realtime

## 1. Visual Theme & Atmosphere

MIDI Colab embodies a **futuristic music studio** atmosphere - sleek, professional, and immersive. The design creates a sense of being inside a high-end digital audio workstation with holographic interfaces floating in a deep space environment. Glassmorphism effects suggest advanced technology while maintaining approachability for musicians of all skill levels.

The overall mood is **energetic yet focused** - combining the excitement of collaborative creation with the precision of professional music production. The interface feels like a living, breathing instrument that responds to user interaction with smooth animations and particle effects.

## 2. Color Palette & Roles

- **Cosmic Purple (#6366f1)**: Primary brand color used for active states, gradients, and interactive elements - represents creativity and innovation
- **Electric Blue (#3b82f6)**: Secondary accent for status indicators and highlights - conveys technology and connectivity
- **Neon Cyan (#06b6d4)**: Used for success states and engine controls - represents energy and activity
- **Vibrant Pink (#ec4899)**: Accent color for sound selection and creative elements - adds playfulness to the professional interface
- **Sunset Orange (#f97316)**: Used for warnings and secondary actions - provides warmth and approachability
- **Deep Space Black (#0f172a)**: Primary background creating depth and focus - grounds the interface in professionalism
- **Midnight Blue (#1e293b)**: Secondary backgrounds and glassmorphism layers - provides subtle contrast
- **Soft Gray (#64748b)**: Text and secondary elements - ensures readability without visual competition

## 3. Typography Rules

**Primary Font Stack**: 'Righteous' (Google Fonts) for display headings + 'Poppins' (Google Fonts) for body text

- **Display Headings**: Righteous font in sizes 4xl-7xl with tight letter-spacing (-0.02em) and bold weights - creates bold, musical impact
- **Section Headers**: Poppins Bold (600-700) in 2xl-3xl sizes - professional and readable
- **Body Text**: Poppins Regular (400) in lg-xl sizes - clean and highly legible for music notation
- **UI Labels**: Poppins Medium (500) in base-sm sizes - clear hierarchy for controls
- **Accent Text**: Gradient text effects using primary color palette for important elements

Typography follows a **rhythmic hierarchy** - larger text creates visual "beats" while smaller text provides supporting "melody."

## 4. Component Stylings

* **Glass Cards**: Multi-layered backdrop blur (16px) with subtle white transparency (5-10%) and soft borders - creates floating interface elements
* **Gradient Buttons**: Linear gradients with rounded corners (2xl radius) and hover scale effects - primary actions feel energetic
* **Status Indicators**: Circular badges with animated pulses and color-coded states - provide instant system feedback
* **Navigation Elements**: Floating sidebars with blur effects and smooth transitions - maintain context while exploring
* **Interactive Controls**: Hover states with color shifts, scale transforms, and particle effects - responsive and engaging

## 5. Layout Principles

**Asymmetric Sidebar Layout**: Fixed-width sidebar (320px) for controls, flexible main area for piano interface - balances information density with creative space

**Generous Whitespace**: 6-8 spacing units between major sections, 4 units for related elements - prevents visual clutter while maintaining flow

**Z-index Hierarchy**: Header (z-50), Sidebars (z-40), Modals (z-50+), Tooltips (z-30) - clear depth relationships

**Responsive Grid**: 3-column layout in sidebar, single-column piano interface - adapts to different screen sizes while maintaining usability

**Visual Flow**: Left-to-right reading pattern with piano as focal point - guides users from controls to creative action

## 6. Design System Notes for Stitch Generation

**Core Visual Language:**
- Glassmorphism with multi-layer transparency effects
- Dynamic gradient backgrounds with subtle animation
- Particle systems and floating elements for engagement
- Neon glow effects for active states
- Rounded corners (xl-3xl) for modern feel
- Professional color palette with vibrant accents

**Animation Philosophy:**
- Micro-interactions for feedback (150-300ms duration)
- Floating animations for ambient interest
- Scale transforms on hover for interactivity
- Smooth transitions for state changes
- Particle effects for celebration moments

**Typography Scale:**
- 7xl: Hero titles (64px+)
- 4xl-6xl: Section headers (36-56px)
- 2xl-3xl: Component titles (24-32px)
- xl-lg: Body text (18-20px)
- base-sm: UI labels (14-16px)

**Component Patterns:**
- Gradient borders with transparency
- Multi-layer glass effects
- Animated status indicators
- Bento-style card layouts
- Professional control panels

**Anti-patterns to Avoid:**
- Flat, lifeless interfaces
- Generic blue color schemes
- Static, non-responsive elements
- Poor contrast ratios
- Overwhelming visual complexity

**Stitch Prompting Guidelines:**
- Use "futuristic music studio" as core aesthetic
- Emphasize glassmorphism and particle effects
- Include gradient backgrounds and neon accents
- Focus on professional yet playful tone
- Ensure high contrast for accessibility
- Use musical metaphors in descriptions