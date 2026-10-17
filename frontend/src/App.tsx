import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { CalendarPage } from "./pages/CalendarPage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { ForumPage } from "./pages/ForumPage";
import { SubforumPage } from "./pages/SubforumPage";
import { ThreadPage } from "./pages/ThreadPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { FacultyReviewsPage } from "./pages/FacultyReviewsPage";
import { TeamPage } from "./pages/TeamPage";
import { ReportsPage } from "./pages/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="onboarding" element={<OnboardingPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="course-reviews" element={<FacultyReviewsPage />} />
        <Route path="faculty-reviews" element={<FacultyReviewsPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="f/:slug" element={<ForumPage />} />
        <Route path="f/:slug/:subId" element={<SubforumPage />} />
        <Route path="f/:slug/:subId/:threadId" element={<ThreadPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
