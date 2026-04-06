# AlumniConnect (React + Vite)

AlumniConnect is a Reddit-style campus community platform for students and alumni.
It includes discussion threads, resources, upcoming events, and a grievance submission flow.

## Tech Stack

- React 19
- Vite 6
- Tailwind CSS 4
- Lucide icons
- Motion (animations)

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
```

4. Preview production build:

```bash
npm run preview
```

## Project Structure

```text
src/
   App.jsx
   main.jsx
   index.css
   constants/
      appData.js
   components/
      layout/
         Navbar.jsx
         LeftSidebar.jsx
         RightSidebar.jsx
      modals/
         AuthModal.jsx
         CreatePostModal.jsx
         PostDetailModal.jsx
      posts/
         SortButton.jsx
         SortBar.jsx
         PostCard.jsx
         CommentForm.jsx
         CommentItem.jsx
      views/
         ForumView.jsx
         ResourcesView.jsx
         CalendarView.jsx
         ComplaintsView.jsx
```

## Available Scripts

- `npm run dev`: Run local development server
- `npm run build`: Create production build
- `npm run preview`: Preview production build locally
- `npm run clean`: Remove build output folder

## Notes

- The codebase has been migrated from TypeScript/TSX to JavaScript/JSX.
- Data and mock state are stored in `src/constants/appData.js`.
- UI is organized into feature-focused components for easier maintenance.
