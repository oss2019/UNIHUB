import { useEffect, useMemo, useState, useRef } from "react";
import {
  LayoutDashboard,
  Bug,
  Inbox,
  GitPullRequest,
  MessagesSquare,
  MessageSquare,
  GraduationCap,
  BookOpen,
  Users,
  Check,
  X,
  Search,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Pin,
  RefreshCw,
  LogOut,
  ExternalLink,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronRight,
  Sparkles,
  Info,
  Layers,
  Menu,
  FileText,
  Tag,
  Calendar,
  Building,
} from "lucide-react";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:6441";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "reports", label: "Issue Reports", icon: Bug },
  { key: "forumRequests", label: "Forum Requests", icon: Inbox },
  { key: "subForumRequests", label: "SubForum Requests", icon: GitPullRequest },
  { key: "forums", label: "Forums & Subforums", icon: MessagesSquare },
  { key: "threads", label: "Thread Moderation", icon: MessageSquare },
  { key: "courseReviews", label: "Course Reviews", icon: GraduationCap },
  { key: "resources", label: "Academic Resources", icon: BookOpen },
  { key: "team", label: "Team Members", icon: Users },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Stats & Dashboard
  const [reportStats, setReportStats] = useState({
    open: 0,
    "in-progress": 0,
    resolved: 0,
    dismissed: 0,
  });

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportStatusFilter, setReportStatusFilter] = useState("all");
  const [reportCategoryFilter, setReportCategoryFilter] = useState("all");
  const [reportSearch, setReportSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [previewScreenshot, setPreviewScreenshot] = useState(null);
  const [triageStatus, setTriageStatus] = useState("open");
  const [triageNote, setTriageNote] = useState("");

  // Forum Requests state
  const [forumRequestsStatus, setForumRequestsStatus] = useState("pending");
  const [forumRequests, setForumRequests] = useState([]);
  const [forumReviewNotes, setForumReviewNotes] = useState({});
  const [newForumModalOpen, setNewForumModalOpen] = useState(false);
  const [newForumForm, setNewForumForm] = useState({
    name: "",
    description: "",
    type: "normal",
  });

  // SubForum Requests state
  const [subForumRequestsStatus, setSubForumRequestsStatus] = useState("pending");
  const [subForumRequests, setSubForumRequests] = useState([]);
  const [subForumReviewNotes, setSubForumReviewNotes] = useState({});

  // Forums & Subforums state
  const [forums, setForums] = useState([]);
  const [selectedForum, setSelectedForum] = useState(null);
  const [forumSearch, setForumSearch] = useState("");
  const [forumForm, setForumForm] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [subForumsList, setSubForumsList] = useState([]);
  const [newSubforumModalOpen, setNewSubforumModalOpen] = useState(false);
  const [newSubforumForm, setNewSubforumForm] = useState({
    name: "",
    description: "",
  });

  // Threads state
  const [threadQuery, setThreadQuery] = useState("");
  const [threadResults, setThreadResults] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);

  // Course Reviews state
  const [courseReviews, setCourseReviews] = useState([]);
  const [courseReviewSearch, setCourseReviewSearch] = useState("");
  const [courseReviewModalOpen, setCourseReviewModalOpen] = useState(false);
  const [editingCourseReview, setEditingCourseReview] = useState(null);
  const [courseReviewForm, setCourseReviewForm] = useState({
    facultyName: "",
    review: "",
    photo: "",
  });

  // Academic Resources state
  const [resources, setResources] = useState([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("all");
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "course-material",
    tags: "",
    url: "",
    courseCode: "",
    courseName: "",
    semester: 1,
    fileType: "PDF",
    fileSize: "1.2 MB",
  });

  // Team state
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamCategoryFilter, setTeamCategoryFilter] = useState("all");
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    graduationYear: 2026,
    category: "dev-team",
    photo: "",
  });

  const isAdmin = currentUser?.role === "admin";

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const notify = (msg, isErr = false) => {
    if (isErr) {
      setError(msg);
      setMessage("");
    } else {
      setMessage(msg);
      setError("");
    }
    setTimeout(() => {
      setMessage("");
      setError("");
    }, 4500);
  };

  const parseJson = async (response) => {
    const text = await response.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  };

  const apiCall = async (path, options = {}) => {
    const isBackground = options.background;
    if (!isBackground) {
      clearAlerts();
      setLoading(true);
    } else {
      setSyncing(true);
    }

    try {
      const config = {
        method: options.method || "GET",
        credentials: "include",
        headers: {},
      };
      if (options.body) {
        config.headers["Content-Type"] = "application/json";
        config.body = JSON.stringify(options.body);
      }
      const response = await fetch(`${API_BASE_URL}${path}`, config);
      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data?.message || `Request failed (${response.status})`);
      }
      if (data?.message && !isBackground && options.method && options.method !== "GET") {
        notify(data.message);
      }
      return data;
    } catch (requestError) {
      if (!isBackground) {
        notify(requestError.message || "Something went wrong", true);
      }
      return null;
    } finally {
      if (!isBackground) setLoading(false);
      setSyncing(false);
    }
  };

  // Auth Handlers
  const loginWithGoogle = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const fetchCurrentUser = async (bg = false) => {
    const data = await apiCall("/auth/me", { background: bg });
    if (data) setCurrentUser(data?.data?.user || null);
  };

  const logout = async () => {
    const data = await apiCall("/auth/logout", { method: "POST" });
    if (data) {
      setCurrentUser(null);
      notify("Logged out successfully.");
    }
  };

  const refreshToken = async () => {
    const data = await apiCall("/auth/refresh", { method: "POST" });
    if (data) notify("Session token refreshed!");
  };

  // Reports Handlers
  const loadReports = async (bg = false) => {
    const query = new URLSearchParams();
    query.set("page", "1");
    query.set("limit", "100");
    if (reportStatusFilter !== "all") query.set("status", reportStatusFilter);
    if (reportCategoryFilter !== "all") query.set("category", reportCategoryFilter);
    if (reportSearch.trim()) query.set("search", reportSearch.trim());

    const data = await apiCall(`/api/reports?${query.toString()}`, { background: bg });
    if (data) {
      const payload = data?.data?.reports || data?.data?.pagination || [];
      const list = Array.isArray(payload) ? payload : payload.reports || [];
      setReports(list);
    }

    // Also fetch stats
    const statsData = await apiCall("/api/reports/stats", { background: true });
    if (statsData?.data?.stats) {
      setReportStats(statsData.data.stats);
    }
  };

  const saveReportTriage = async (id, status, adminNote) => {
    const data = await apiCall(`/api/reports/${id}`, {
      method: "PATCH",
      body: { status, adminNote },
    });
    if (data) {
      notify("Report triage updated successfully!");
      setSelectedReport(null);
      loadReports();
    }
  };

  const deleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this report?")) return;
    const data = await apiCall(`/api/reports/${id}`, { method: "DELETE" });
    if (data) {
      notify("Report deleted successfully.");
      setReports((prev) => prev.filter((r) => r._id !== id));
      if (selectedReport?._id === id) setSelectedReport(null);
    }
  };

  // Forum Requests Handlers
  const loadForumRequests = async (bg = false) => {
    const data = await apiCall(
      `/api/forum-requests?status=${forumRequestsStatus}`,
      { background: bg }
    );
    if (data) setForumRequests(data?.data?.requests || []);
  };

  const reviewForumRequest = async (requestId, status) => {
    const data = await apiCall(`/api/forum-requests/${requestId}/review`, {
      method: "PATCH",
      body: {
        status,
        reviewNote: forumReviewNotes[requestId] || "",
      },
    });
    if (data) {
      notify(`Forum request ${status}!`);
      loadForumRequests();
      loadForums(true);
    }
  };

  const handleCreateForumRequest = async (e) => {
    e.preventDefault();
    if (!newForumForm.name.trim()) return notify("Forum name is required.", true);

    const data = await apiCall("/api/forum-requests", {
      method: "POST",
      body: newForumForm,
    });
    if (data) {
      notify("Forum request submitted! Approve it to launch the forum.");
      setNewForumModalOpen(false);
      setNewForumForm({ name: "", description: "", type: "normal" });
      setForumRequestsStatus("pending");
      loadForumRequests();
    }
  };

  // SubForum Requests Handlers
  const loadSubForumRequests = async (bg = false) => {
    const data = await apiCall(
      `/api/subforum-requests?status=${subForumRequestsStatus}`,
      { background: bg }
    );
    if (data) setSubForumRequests(data?.data?.requests || []);
  };

  const reviewSubForumRequest = async (requestId, status) => {
    const data = await apiCall(`/api/subforum-requests/${requestId}/review`, {
      method: "PATCH",
      body: {
        status,
        reviewNote: subForumReviewNotes[requestId] || "",
      },
    });
    if (data) {
      notify(`Subforum request ${status}!`);
      loadSubForumRequests();
      if (selectedForum) loadSubForums(selectedForum._id);
    }
  };

  // Forums & Subforums Handlers
  const loadForums = async (bg = false) => {
    const data = await apiCall("/api/forums", { background: bg });
    if (!data) return;
    const list = data?.data?.forums || [];
    setForums(list);
    if (list.length > 0 && !selectedForum) {
      selectForum(list[0]);
    }
  };

  const selectForum = async (forum) => {
    setSelectedForum(forum);
    setForumForm({
      name: forum.name || "",
      description: forum.description || "",
      isActive: Boolean(forum.isActive),
    });
    loadSubForums(forum._id);
  };

  const loadSubForums = async (forumId) => {
    const data = await apiCall(`/api/forums/${forumId}/subforums`, { background: true });
    if (data) {
      setSubForumsList(data?.data?.subForums || []);
    }
  };

  const updateForum = async () => {
    if (!selectedForum) return notify("Select a forum first.", true);
    const data = await apiCall(`/api/forums/${selectedForum._id}`, {
      method: "PATCH",
      body: forumForm,
    });
    if (data) {
      notify("Forum details saved successfully!");
      loadForums();
    }
  };

  const deactivateForum = async () => {
    if (!selectedForum) return notify("Select a forum first.", true);
    if (!window.confirm(`Deactivate/delete forum "${selectedForum.name}"?`)) return;
    const data = await apiCall(`/api/forums/${selectedForum._id}`, {
      method: "DELETE",
    });
    if (data) {
      notify("Forum deactivated.");
      loadForums();
    }
  };

  const handleCreateSubforum = async (e) => {
    e.preventDefault();
    if (!selectedForum) return;
    if (!newSubforumForm.name.trim()) return notify("Subforum name is required.", true);

    const data = await apiCall(`/api/forums/${selectedForum._id}/subforum-requests`, {
      method: "POST",
      body: newSubforumForm,
    });
    if (data) {
      notify("Subforum request created! Check SubForum Requests tab to approve it.");
      setNewSubforumModalOpen(false);
      setNewSubforumForm({ name: "", description: "" });
      loadSubForumRequests(true);
    }
  };

  const deleteSubforum = async (subId, subName) => {
    if (!window.confirm(`Delete subforum "${subName}"?`)) return;
    const data = await apiCall(`/api/subforums/${subId}`, { method: "DELETE" });
    if (data) {
      notify("Subforum deleted.");
      if (selectedForum) loadSubForums(selectedForum._id);
    }
  };

  // Threads Handlers
  const searchThreads = async (bg = false) => {
    if (!threadQuery.trim()) return notify("Enter a search term to find threads.", true);
    const data = await apiCall(
      `/api/threads/search?q=${encodeURIComponent(threadQuery.trim())}`,
      { background: bg }
    );
    if (data) {
      const list = data?.data?.pagination?.threads || [];
      setThreadResults(list);
      if (list.length === 0 && !bg) notify("No threads found matching that title.");
    }
  };

  const selectThread = async (thread) => {
    const data = await apiCall(`/api/threads/${thread._id}`);
    if (data) setSelectedThread(data?.data?.thread || thread);
  };

  const setThreadPinned = async (value) => {
    if (!selectedThread) return;
    const data = await apiCall(`/api/threads/${selectedThread._id}`, {
      method: "PATCH",
      body: { isPinned: value },
    });
    if (data) {
      notify(value ? "Thread pinned to top!" : "Thread unpinned.");
      setSelectedThread((p) => ({ ...p, isPinned: value }));
      setThreadResults((prev) =>
        prev.map((t) => (t._id === selectedThread._id ? { ...t, isPinned: value } : t))
      );
    }
  };

  const deleteThread = async () => {
    if (!selectedThread) return;
    if (!window.confirm(`Delete thread "${selectedThread.title}"?`)) return;
    const data = await apiCall(`/api/threads/${selectedThread._id}`, {
      method: "DELETE",
    });
    if (data) {
      notify("Thread deleted successfully.");
      setThreadResults((prev) => prev.filter((t) => t._id !== selectedThread._id));
      setSelectedThread(null);
    }
  };

  // Course Reviews Handlers
  const loadCourseReviews = async (bg = false) => {
    const data = await apiCall("/api/faculty-reviews", { background: bg });
    if (data) {
      setCourseReviews(data?.data?.facultyReviews || []);
    }
  };

  const handleSaveCourseReview = async (e) => {
    e.preventDefault();
    if (!courseReviewForm.facultyName.trim()) {
      return notify("Course / Instructor name is required.", true);
    }
    if (!courseReviewForm.review.trim()) {
      return notify("Review content is required.", true);
    }

    if (editingCourseReview) {
      const data = await apiCall(`/api/faculty-reviews/${editingCourseReview._id}`, {
        method: "PATCH",
        body: {
          facultyName: courseReviewForm.facultyName.trim(),
          review: courseReviewForm.review.trim(),
          photo: courseReviewForm.photo || "",
        },
      });
      if (data) {
        notify("Course review updated!");
        setCourseReviewModalOpen(false);
        setEditingCourseReview(null);
        loadCourseReviews();
      }
    } else {
      const data = await apiCall("/api/faculty-reviews", {
        method: "POST",
        body: {
          facultyName: courseReviewForm.facultyName.trim(),
          review: courseReviewForm.review.trim(),
          photo: courseReviewForm.photo || undefined,
        },
      });
      if (data) {
        notify("Course review published!");
        setCourseReviewModalOpen(false);
        setCourseReviewForm({ facultyName: "", review: "", photo: "" });
        loadCourseReviews();
      }
    }
  };

  const deleteCourseReview = async (id, name) => {
    if (!window.confirm(`Delete review for "${name}"?`)) return;
    const data = await apiCall(`/api/faculty-reviews/${id}`, { method: "DELETE" });
    if (data) {
      notify("Course review deleted.");
      setCourseReviews((prev) => prev.filter((r) => r._id !== id));
    }
  };

  // Academic Resources Handlers
  const loadResources = async (bg = false) => {
    const query = new URLSearchParams();
    if (resourceCategoryFilter !== "all") query.set("category", resourceCategoryFilter);
    if (resourceSearch.trim()) query.set("search", resourceSearch.trim());

    const data = await apiCall(`/api/resources?${query.toString()}`, { background: bg });
    if (data) {
      setResources(data?.data?.resources || []);
    }
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.title.trim() || !resourceForm.url.trim() || !resourceForm.courseCode.trim()) {
      return notify("Title, URL, and Course Code are required.", true);
    }

    const payload = {
      title: resourceForm.title.trim(),
      description: resourceForm.description.trim() || "No description provided.",
      category: resourceForm.category,
      tags: resourceForm.tags
        ? resourceForm.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean)
        : [],
      url: resourceForm.url.trim(),
      courseCode: resourceForm.courseCode.trim().toUpperCase(),
      courseName: resourceForm.courseName.trim(),
      semester: Number(resourceForm.semester) || 1,
      fileType: resourceForm.fileType,
      fileSize: resourceForm.fileSize.trim() || "Web Link",
    };

    const data = await apiCall("/api/resources", {
      method: "POST",
      body: payload,
    });
    if (data) {
      notify("Academic resource created!");
      setResourceModalOpen(false);
      setResourceForm({
        title: "",
        description: "",
        category: "course-material",
        tags: "",
        url: "",
        courseCode: "",
        courseName: "",
        semester: 1,
        fileType: "PDF",
        fileSize: "1.2 MB",
      });
      loadResources();
    }
  };

  const deleteResource = async (id, title) => {
    if (!window.confirm(`Delete resource "${title}"?`)) return;
    const data = await apiCall(`/api/resources/${id}`, { method: "DELETE" });
    if (data) {
      notify("Resource deleted.");
      setResources((prev) => prev.filter((r) => r._id !== id));
    }
  };

  // Team Members Handlers
  const loadTeamMembers = async (bg = false) => {
    const query = teamCategoryFilter !== "all" ? `?category=${teamCategoryFilter}` : "";
    const data = await apiCall(`/api/team${query}`, { background: bg });
    if (data) {
      setTeamMembers(data?.data?.teamMembers || []);
    }
  };

  const handleSaveTeamMember = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return notify("Name is required.", true);

    const payload = {
      name: teamForm.name.trim(),
      graduationYear: Number(teamForm.graduationYear),
      category: teamForm.category,
      photo: teamForm.photo || undefined,
    };

    if (editingTeamMember) {
      const data = await apiCall(`/api/team/${editingTeamMember._id}`, {
        method: "PATCH",
        body: payload,
      });
      if (data) {
        notify("Team member updated!");
        setTeamModalOpen(false);
        setEditingTeamMember(null);
        loadTeamMembers();
      }
    } else {
      const data = await apiCall("/api/team", {
        method: "POST",
        body: payload,
      });
      if (data) {
        notify("Team member added!");
        setTeamModalOpen(false);
        setTeamForm({
          name: "",
          graduationYear: 2026,
          category: "dev-team",
          photo: "",
        });
        loadTeamMembers();
      }
    }
  };

  const deleteTeamMember = async (id, name) => {
    if (!window.confirm(`Delete team member "${name}"?`)) return;
    const data = await apiCall(`/api/team/${id}`, { method: "DELETE" });
    if (data) {
      notify("Team member removed.");
      setTeamMembers((prev) => prev.filter((m) => m._id !== id));
    }
  };

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      await fetchCurrentUser();
      loadForums();
      loadReports(true);
      loadForumRequests(true);
      loadSubForumRequests(true);
      loadCourseReviews(true);
      loadResources(true);
      loadTeamMembers(true);
    };
    init();
  }, []);

  // Tab switch loader
  useEffect(() => {
    if (activeTab === "reports") loadReports();
    if (activeTab === "forumRequests") loadForumRequests();
    if (activeTab === "subForumRequests") loadSubForumRequests();
    if (activeTab === "forums") loadForums();
    if (activeTab === "courseReviews") loadCourseReviews();
    if (activeTab === "resources") loadResources();
    if (activeTab === "team") loadTeamMembers();
  }, [
    activeTab,
    forumRequestsStatus,
    subForumRequestsStatus,
    reportStatusFilter,
    reportCategoryFilter,
    teamCategoryFilter,
    resourceCategoryFilter,
  ]);

  // Periodic Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      if (activeTab === "dashboard") {
        loadReports(true);
        loadForumRequests(true);
        loadSubForumRequests(true);
        loadForums(true);
      } else if (activeTab === "reports") {
        loadReports(true);
      } else if (activeTab === "forumRequests") {
        loadForumRequests(true);
      } else if (activeTab === "subForumRequests") {
        loadSubForumRequests(true);
      } else if (activeTab === "forums") {
        loadForums(true);
      } else if (activeTab === "threads" && threadQuery.trim()) {
        searchThreads(true);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [
    autoRefresh,
    activeTab,
    forumRequestsStatus,
    subForumRequestsStatus,
    reportStatusFilter,
    reportCategoryFilter,
    threadQuery,
  ]);

  // Filtered Forums
  const filteredForums = useMemo(() => {
    if (!forumSearch.trim()) return forums;
    const q = forumSearch.toLowerCase();
    return forums.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.description && f.description.toLowerCase().includes(q))
    );
  }, [forums, forumSearch]);

  // Filtered Course Reviews
  const filteredCourseReviews = useMemo(() => {
    if (!courseReviewSearch.trim()) return courseReviews;
    const q = courseReviewSearch.toLowerCase();
    return courseReviews.filter(
      (r) =>
        r.facultyName.toLowerCase().includes(q) ||
        r.review.toLowerCase().includes(q)
    );
  }, [courseReviews, courseReviewSearch]);

  // Pending counts for badges
  const pendingForumsCount = useMemo(
    () => forumRequests.filter((r) => r.status === "pending").length,
    [forumRequests]
  );
  const pendingSubForumsCount = useMemo(
    () => subForumRequests.filter((r) => r.status === "pending").length,
    [subForumRequests]
  );
  const openReportsCount = reportStats.open;

  return (
    <div className="admin-layout">
      {/* Mobile sidebar overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="brand-header">
          <div className="brand-badge-row">
            <img
              src="/Peerhive_Logo-removebg-preview.png"
              alt="PeerHive.IITDh"
              className="brand-logo"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div>
              <div className="brand-name">
                PeerHive<span className="brand-accent">.IITDh</span>
              </div>
              <div className="brand-sub">Admin Command Center</div>
            </div>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="user-profile-card">
          <div className="user-avatar-wrap">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="user-avatar"
              />
            ) : (
              <div className="user-avatar-placeholder">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "A"}
              </div>
            )}
            <span
              className={`user-status-dot ${currentUser ? "online" : "offline"}`}
            />
          </div>
          <div className="user-details">
            <div className="user-name truncate">
              {currentUser ? currentUser.name : "Not Logged In"}
            </div>
            <div className="user-meta">
              <span className={`role-pill ${isAdmin ? "admin" : "member"}`}>
                {currentUser?.role || "guest"}
              </span>
              <span className="text-xs text-muted truncate">
                {currentUser?.email || "Connect Google Account"}
              </span>
            </div>
          </div>
        </div>

        {/* Auth Buttons */}
        <div className="auth-button-container">
          {currentUser ? (
            <div className="auth-actions-row">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => fetchCurrentUser(false)}
                title="Refresh Session"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync
              </button>
              <button
                className="btn btn-danger-outline btn-sm"
                onClick={logout}
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <button className="btn btn-primary auth-signin-btn" onClick={loginWithGoogle}>
              <Shield className="w-4 h-4 shrink-0" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs-list">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            let badge = null;
            if (tab.key === "reports" && openReportsCount > 0) {
              badge = <span className="tab-badge">{openReportsCount}</span>;
            } else if (tab.key === "forumRequests" && pendingForumsCount > 0) {
              badge = <span className="tab-badge">{pendingForumsCount}</span>;
            } else if (tab.key === "subForumRequests" && pendingSubForumsCount > 0) {
              badge = <span className="tab-badge">{pendingSubForumsCount}</span>;
            }

            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setMobileMenuOpen(false);
                }}
                className={`nav-tab-btn ${isActive ? "active" : ""}`}
              >
                <Icon className="w-4 h-4 tab-icon" />
                <span className="tab-label">{tab.label}</span>
                {badge}
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="sidebar-footer">
          <div className="api-url truncate" title={API_BASE_URL}>
            Connected: {API_BASE_URL.replace(/https?:\/\//, "")}
          </div>
          <div className="version-info">PeerHive.IITDh v2.4 • Admin Portal</div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Top Navbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <button
              className="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="topbar-title-block">
              <h2 className="topbar-title">
                {TABS.find((t) => t.key === activeTab)?.label || "Dashboard"}
              </h2>
              <span className="topbar-subtitle">
                System Administration & Content Governance
              </span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="auto-refresh-control">
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <span className="auto-refresh-label">
                Auto Sync {syncing ? "• syncing…" : ""}
              </span>
            </div>

            <button
              className="btn btn-secondary btn-icon"
              onClick={() => {
                if (activeTab === "reports") loadReports();
                else if (activeTab === "forumRequests") loadForumRequests();
                else if (activeTab === "subForumRequests") loadSubForumRequests();
                else if (activeTab === "forums") loadForums();
                else if (activeTab === "courseReviews") loadCourseReviews();
                else if (activeTab === "resources") loadResources();
                else if (activeTab === "team") loadTeamMembers();
                else {
                  loadReports();
                  loadForums();
                }
                notify("Refreshed data.");
              }}
              title="Manual Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading || syncing ? "animate-spin" : ""}`} />
            </button>

            <a
              href="/peerhive/"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              title="Open Public Site"
            >
              <ExternalLink className="w-4 h-4" /> Open App
            </a>
          </div>
        </header>

        {/* Floating Alert / Toast */}
        {(message || error) && (
          <div className={`alert-banner ${error ? "alert-error" : "alert-success"}`}>
            {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span className="alert-text">{error || message}</span>
            <button className="alert-close" onClick={clearAlerts}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Admin Permission Warning */}
        {!isAdmin && currentUser && (
          <div className="permission-warning-banner">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <strong>Restricted Privilege Warning:</strong> You are signed in as{" "}
              <code>{currentUser.email}</code> with role <strong>{currentUser.role}</strong>.
              Administrative actions (approval, triage, deletion) require the <code>admin</code> role.
            </div>
          </div>
        )}

        {/* Tab Content Views */}
        <div className="admin-content-area">
          {/* ======================= DASHBOARD TAB ======================= */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="dashboard-hero">
                <div className="hero-content">
                  <div className="hero-tag">
                    <Sparkles className="w-3.5 h-3.5" /> Central Control Room
                  </div>
                  <h1 className="hero-title">
                    Welcome back, {currentUser?.name || "Administrator"}
                  </h1>
                  <p className="hero-description">
                    Manage forum proposals, resolve student issue reports, curate verified
                    course reviews, and maintain academic resources from one unified interface.
                  </p>
                </div>
                <div className="hero-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab("reports")}
                  >
                    <Bug className="w-4 h-4" /> Triage Issues ({openReportsCount} open)
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setActiveTab("forumRequests")}
                  >
                    <Inbox className="w-4 h-4" /> Review Requests ({pendingForumsCount})
                  </button>
                </div>
              </div>

              {/* Stats Overview Grid */}
              <div className="stats-metric-grid">
                <div
                  className="metric-card cursor-pointer"
                  onClick={() => setActiveTab("reports")}
                >
                  <div className="metric-header">
                    <span className="metric-title">Open Reports</span>
                    <div className="metric-icon-wrap">
                      <Bug className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="metric-value">{reportStats.open}</div>
                  <div className="metric-footer">
                    <span>{reportStats["in-progress"]} in progress</span>
                    <span className="metric-link">Review &rarr;</span>
                  </div>
                </div>

                <div
                  className="metric-card cursor-pointer"
                  onClick={() => setActiveTab("forumRequests")}
                >
                  <div className="metric-header">
                    <span className="metric-title">Forum Requests</span>
                    <div className="metric-icon-wrap">
                      <Inbox className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="metric-value">{pendingForumsCount}</div>
                  <div className="metric-footer">
                    <span>Pending review</span>
                    <span className="metric-link">Review &rarr;</span>
                  </div>
                </div>

                <div
                  className="metric-card cursor-pointer"
                  onClick={() => setActiveTab("subForumRequests")}
                >
                  <div className="metric-header">
                    <span className="metric-title">SubForum Requests</span>
                    <div className="metric-icon-wrap">
                      <GitPullRequest className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="metric-value">{pendingSubForumsCount}</div>
                  <div className="metric-footer">
                    <span>Awaiting approval</span>
                    <span className="metric-link">Manage &rarr;</span>
                  </div>
                </div>

                <div
                  className="metric-card cursor-pointer"
                  onClick={() => setActiveTab("forums")}
                >
                  <div className="metric-header">
                    <span className="metric-title">Active Forums</span>
                    <div className="metric-icon-wrap">
                      <MessagesSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="metric-value">{forums.length}</div>
                  <div className="metric-footer">
                    <span>Configured spaces</span>
                    <span className="metric-link">Explore &rarr;</span>
                  </div>
                </div>

                <div
                  className="metric-card cursor-pointer"
                  onClick={() => setActiveTab("courseReviews")}
                >
                  <div className="metric-header">
                    <span className="metric-title">Course Reviews</span>
                    <div className="metric-icon-wrap">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="metric-value">{courseReviews.length}</div>
                  <div className="metric-footer">
                    <span>Verified guides</span>
                    <span className="metric-link">Edit &rarr;</span>
                  </div>
                </div>

                <div
                  className="metric-card cursor-pointer"
                  onClick={() => setActiveTab("resources")}
                >
                  <div className="metric-header">
                    <span className="metric-title">Academic Resources</span>
                    <div className="metric-icon-wrap">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="metric-value">{resources.length}</div>
                  <div className="metric-footer">
                    <span>Notes & files</span>
                    <span className="metric-link">Browse &rarr;</span>
                  </div>
                </div>

                <div
                  className="metric-card cursor-pointer"
                  onClick={() => setActiveTab("team")}
                >
                  <div className="metric-header">
                    <span className="metric-title">Team & Council</span>
                    <div className="metric-icon-wrap">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="metric-value">{teamMembers.length}</div>
                  <div className="metric-footer">
                    <span>Active leaders</span>
                    <span className="metric-link">View &rarr;</span>
                  </div>
                </div>
              </div>

              {/* Quick Jump & Status Table */}
              <div className="grid-2col">
                <div className="panel-card">
                  <div className="panel-header">
                    <h3>Recent Issue Reports</h3>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setActiveTab("reports")}
                    >
                      View All
                    </button>
                  </div>
                  {reports.length === 0 ? (
                    <div className="empty-placeholder">No reported issues found.</div>
                  ) : (
                    <div className="quick-list">
                      {reports.slice(0, 5).map((r) => (
                        <div
                          key={r._id}
                          className="quick-list-item cursor-pointer"
                          onClick={() => {
                            setSelectedReport(r);
                            setTriageStatus(r.status);
                            setTriageNote(r.adminNote || "");
                            setActiveTab("reports");
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{r.title}</div>
                            <div className="text-xs text-muted truncate">
                              {r.reportedBy?.name || "User"} • {r.category}
                            </div>
                          </div>
                          <span className={`status-pill ${r.status}`}>{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="panel-card">
                  <div className="panel-header">
                    <h3>Pending Forum Requests</h3>
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => setActiveTab("forumRequests")}
                    >
                      View All
                    </button>
                  </div>
                  {forumRequests.filter((r) => r.status === "pending").length === 0 ? (
                    <div className="empty-placeholder">No pending requests! All clear.</div>
                  ) : (
                    <div className="quick-list">
                      {forumRequests
                        .filter((r) => r.status === "pending")
                        .slice(0, 5)
                        .map((req) => (
                          <div key={req._id} className="quick-list-item">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate">{req.name}</div>
                              <div className="text-xs text-muted truncate">
                                Type: {req.type} • Requested by: {req.requestedBy?.name || "Student"}
                              </div>
                            </div>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => reviewForumRequest(req._id, "approved")}
                            >
                              Approve
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= ISSUE REPORTS TAB ======================= */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              {/* Header & Controls */}
              <div className="filter-bar-card">
                <div className="filter-controls-row">
                  <div className="search-input-wrap">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search issue title or description..."
                      value={reportSearch}
                      onChange={(e) => setReportSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loadReports()}
                      className="form-input search-input"
                    />
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Status:</label>
                    <select
                      value={reportStatusFilter}
                      onChange={(e) => setReportStatusFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open ({reportStats.open})</option>
                      <option value="in-progress">In Progress ({reportStats["in-progress"]})</option>
                      <option value="resolved">Resolved ({reportStats.resolved})</option>
                      <option value="dismissed">Dismissed ({reportStats.dismissed})</option>
                    </select>
                  </div>

                  <div className="filter-group">
                    <label className="filter-label">Category:</label>
                    <select
                      value={reportCategoryFilter}
                      onChange={(e) => setReportCategoryFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="all">All Categories</option>
                      <option value="bug">Bug / Defect</option>
                      <option value="ui">UI / Layout</option>
                      <option value="performance">Performance</option>
                      <option value="content">Content</option>
                      <option value="account">Account</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <button className="btn btn-primary btn-sm" onClick={() => loadReports()}>
                    <Filter className="w-3.5 h-3.5" /> Filter
                  </button>
                </div>

                {/* Status Summary Pills */}
                <div className="status-pills-row">
                  <button
                    className={`filter-pill ${reportStatusFilter === "all" ? "active" : ""}`}
                    onClick={() => setReportStatusFilter("all")}
                  >
                    All ({reports.length})
                  </button>
                  <button
                    className={`filter-pill ${reportStatusFilter === "open" ? "active" : ""}`}
                    onClick={() => setReportStatusFilter("open")}
                  >
                    Open ({reportStats.open})
                  </button>
                  <button
                    className={`filter-pill ${reportStatusFilter === "in-progress" ? "active" : ""}`}
                    onClick={() => setReportStatusFilter("in-progress")}
                  >
                    In Progress ({reportStats["in-progress"]})
                  </button>
                  <button
                    className={`filter-pill ${reportStatusFilter === "resolved" ? "active" : ""}`}
                    onClick={() => setReportStatusFilter("resolved")}
                  >
                    Resolved ({reportStats.resolved})
                  </button>
                  <button
                    className={`filter-pill ${reportStatusFilter === "dismissed" ? "active" : ""}`}
                    onClick={() => setReportStatusFilter("dismissed")}
                  >
                    Dismissed ({reportStats.dismissed})
                  </button>
                </div>
              </div>

              {/* Reports Grid / Master-Detail */}
              <div className="grid-master-detail">
                {/* Reports List */}
                <div className="reports-list-col">
                  {reports.length === 0 ? (
                    <div className="panel-card text-center p-8">
                      <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
                      <h4 className="font-bold">No Reports Found</h4>
                      <p className="text-xs text-muted mt-1">
                        No issue tickets matching the selected filters.
                      </p>
                    </div>
                  ) : (
                    reports.map((r) => (
                      <div
                        key={r._id}
                        onClick={() => {
                          setSelectedReport(r);
                          setTriageStatus(r.status);
                          setTriageNote(r.adminNote || "");
                        }}
                        className={`report-card-item cursor-pointer ${
                          selectedReport?._id === r._id ? "selected" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className={`status-pill ${r.status}`}>{r.status}</span>
                          <span className="category-pill">{r.category}</span>
                          <span className="text-xs text-muted ml-auto">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <h4 className="report-item-title">{r.title}</h4>
                        <p className="report-item-snippet">{r.description}</p>
                        <div className="report-item-footer">
                          <span className="text-xs text-muted truncate">
                            Reporter: {r.reportedBy?.name || "Student"}
                          </span>
                          {r.screenshot && (
                            <span className="has-attachment-badge">
                              <Eye className="w-3 h-3" /> Screenshot
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Report Detail / Triage Action Pane */}
                <div className="report-detail-col">
                  {selectedReport ? (
                    <div className="panel-card space-y-4">
                      <div className="flex items-start justify-between gap-3 border-b pb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`status-pill ${selectedReport.status}`}>
                              {selectedReport.status}
                            </span>
                            <span className="category-pill">{selectedReport.category}</span>
                          </div>
                          <h3 className="text-lg font-bold">{selectedReport.title}</h3>
                          <div className="text-xs text-muted mt-0.5">
                            Ticket ID: <code>{selectedReport._id}</code> • Reported by{" "}
                            <strong>{selectedReport.reportedBy?.name || "Anonymous"}</strong> (
                            {selectedReport.reportedBy?.email || "No email"})
                          </div>
                        </div>
                        <button
                          className="btn btn-danger-outline btn-sm"
                          onClick={() => deleteReport(selectedReport._id)}
                          title="Delete Ticket"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>

                      {/* Description */}
                      <div className="detail-section">
                        <label className="field-label">Issue Description</label>
                        <div className="detail-text-box">{selectedReport.description}</div>
                      </div>

                      {/* Screenshot attachment preview */}
                      {selectedReport.screenshot && (
                        <div className="detail-section">
                          <label className="field-label">Attached Screenshot</label>
                          <div
                            className="screenshot-preview-card"
                            onClick={() => setPreviewScreenshot(selectedReport.screenshot)}
                          >
                            <img
                              src={selectedReport.screenshot}
                              alt="Screenshot"
                              className="screenshot-thumb"
                            />
                            <div className="screenshot-overlay">
                              <Eye className="w-4 h-4" /> Click to Expand
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Triage Form */}
                      <div className="triage-action-box">
                        <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
                          <Edit3 className="w-4 h-4 text-blue-500" /> Administrative Triage
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="field-label">Update Status</label>
                            <select
                              value={triageStatus}
                              onChange={(e) => setTriageStatus(e.target.value)}
                              className="form-select w-full"
                            >
                              <option value="open">Open (Needs Inspection)</option>
                              <option value="in-progress">In Progress (Forwarded to Dev)</option>
                              <option value="resolved">Resolved (Fix Shipped)</option>
                              <option value="dismissed">Dismissed (Duplicate / Not a Bug)</option>
                            </select>
                          </div>
                          <div>
                            <label className="field-label">
                              Admin Triage Note (Internal or for Reporter)
                            </label>
                            <textarea
                              rows={3}
                              placeholder="e.g. Bug verified in Chrome. Issue assigned to dev team."
                              value={triageNote}
                              onChange={(e) => setTriageNote(e.target.value)}
                              className="form-textarea w-full"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-2">
                            <button
                              className="btn btn-primary"
                              onClick={() =>
                                saveReportTriage(selectedReport._id, triageStatus, triageNote)
                              }
                            >
                              <Check className="w-4 h-4" /> Save Status & Note
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="panel-card empty-detail-pane">
                      <Bug className="w-12 h-12 text-muted mb-2" />
                      <h4>Select an issue report</h4>
                      <p className="text-xs text-muted">
                        Click on any report ticket from the left list to review its details, view
                        attachments, and update its triage status.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================= FORUM REQUESTS TAB ======================= */}
          {activeTab === "forumRequests" && (
            <div className="space-y-4">
              <div className="filter-bar-card">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <label className="filter-label">Filter by Status:</label>
                    <select
                      value={forumRequestsStatus}
                      onChange={(e) => setForumRequestsStatus(e.target.value)}
                      className="form-select"
                    >
                      <option value="pending">Pending Review</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setNewForumModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" /> Propose New Forum
                  </button>
                </div>
              </div>

              {forumRequests.length === 0 ? (
                <div className="panel-card text-center p-8">
                  <Inbox className="w-10 h-10 text-muted mx-auto mb-2" />
                  <h4>No {forumRequestsStatus} Forum Requests</h4>
                  <p className="text-xs text-muted mt-1">
                    Student-submitted forum requests will appear here for governance.
                  </p>
                </div>
              ) : (
                <div className="cards-grid">
                  {forumRequests.map((req) => (
                    <div key={req._id} className="panel-card req-card">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-base">{req.name}</h3>
                          <span className="text-xs text-muted">
                            Type: <strong className="uppercase">{req.type}</strong> • Requested by{" "}
                            {req.requestedBy?.name || "Student"}
                          </span>
                        </div>
                        <span className={`status-pill ${req.status}`}>{req.status}</span>
                      </div>
                      <p className="text-sm text-foreground mb-3">
                        {req.description || "No description provided."}
                      </p>

                      {req.status === "pending" && (
                        <div className="req-action-bar">
                          <input
                            type="text"
                            placeholder="Add approval / rejection note..."
                            value={forumReviewNotes[req._id] || ""}
                            onChange={(e) =>
                              setForumReviewNotes((prev) => ({
                                ...prev,
                                [req._id]: e.target.value,
                              }))
                            }
                            className="form-input flex-1 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => reviewForumRequest(req._id, "approved")}
                            >
                              <Check className="w-4 h-4" /> Approve
                            </button>
                            <button
                              className="btn btn-danger-outline btn-sm"
                              onClick={() => reviewForumRequest(req._id, "rejected")}
                            >
                              <X className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                      {req.reviewNote && (
                        <div className="text-xs text-muted bg-secondary p-2 rounded mt-2">
                          <strong>Note:</strong> {req.reviewNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================= SUBFORUM REQUESTS TAB ======================= */}
          {activeTab === "subForumRequests" && (
            <div className="space-y-4">
              <div className="filter-bar-card">
                <div className="flex items-center gap-2">
                  <label className="filter-label">Filter Status:</label>
                  <select
                    value={subForumRequestsStatus}
                    onChange={(e) => setSubForumRequestsStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {subForumRequests.length === 0 ? (
                <div className="panel-card text-center p-8">
                  <GitPullRequest className="w-10 h-10 text-muted mx-auto mb-2" />
                  <h4>No {subForumRequestsStatus} Subforum Requests</h4>
                </div>
              ) : (
                <div className="cards-grid">
                  {subForumRequests.map((req) => (
                    <div key={req._id} className="panel-card req-card">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-base">{req.name}</h3>
                          <span className="text-xs text-muted">
                            Target Forum:{" "}
                            <strong>
                              {typeof req.forum === "object" ? req.forum?.name : "General"}
                            </strong>{" "}
                            • Requested by {req.requestedBy?.name || "Student"}
                          </span>
                        </div>
                        <span className={`status-pill ${req.status}`}>{req.status}</span>
                      </div>
                      <p className="text-sm text-foreground mb-3">
                        {req.description || "No description provided."}
                      </p>

                      {req.status === "pending" && (
                        <div className="req-action-bar">
                          <input
                            type="text"
                            placeholder="Add review note..."
                            value={subForumReviewNotes[req._id] || ""}
                            onChange={(e) =>
                              setSubForumReviewNotes((prev) => ({
                                ...prev,
                                [req._id]: e.target.value,
                              }))
                            }
                            className="form-input flex-1 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => reviewSubForumRequest(req._id, "approved")}
                            >
                              <Check className="w-4 h-4" /> Approve
                            </button>
                            <button
                              className="btn btn-danger-outline btn-sm"
                              onClick={() => reviewSubForumRequest(req._id, "rejected")}
                            >
                              <X className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        </div>
                      )}
                      {req.reviewNote && (
                        <div className="text-xs text-muted bg-secondary p-2 rounded mt-2">
                          <strong>Note:</strong> {req.reviewNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================= FORUMS & SUBFORUMS TAB ======================= */}
          {activeTab === "forums" && (
            <div className="grid-2col">
              {/* Left Column: Forums List */}
              <div className="space-y-3">
                <div className="panel-card">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold">Campus Forums ({filteredForums.length})</h3>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setNewForumModalOpen(true)}
                    >
                      <Plus className="w-3.5 h-3.5" /> New Forum
                    </button>
                  </div>
                  <div className="search-input-wrap mb-3">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search forums..."
                      value={forumSearch}
                      onChange={(e) => setForumSearch(e.target.value)}
                      className="form-input search-input"
                    />
                  </div>

                  <div className="forums-vertical-list">
                    {filteredForums.map((f) => (
                      <div
                        key={f._id}
                        onClick={() => selectForum(f)}
                        className={`forum-list-item cursor-pointer ${
                          selectedForum?._id === f._id ? "selected" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm truncate">{f.name}</h4>
                          <span
                            className={`badge-status ${f.isActive ? "active" : "inactive"}`}
                          >
                            {f.isActive ? "Active" : "Disabled"}
                          </span>
                        </div>
                        <p className="text-xs text-muted line-clamp-2 mt-1">
                          {f.description || "No description"}
                        </p>
                        <div className="text-[11px] text-muted mt-2 flex items-center justify-between">
                          <span>Type: {f.type}</span>
                          <span>Subforums: {f.subForumCount ?? "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Forum Editor + Subforums */}
              <div className="space-y-4">
                {selectedForum ? (
                  <>
                    <div className="panel-card space-y-4">
                      <div className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-bold">Edit Forum: {selectedForum.name}</h3>
                        <button
                          className="btn btn-danger-outline btn-sm"
                          onClick={deactivateForum}
                        >
                          <Trash2 className="w-4 h-4" /> Deactivate
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="field-label">Forum Name</label>
                          <input
                            type="text"
                            value={forumForm.name}
                            onChange={(e) =>
                              setForumForm((p) => ({ ...p, name: e.target.value }))
                            }
                            className="form-input w-full"
                          />
                        </div>
                        <div>
                          <label className="field-label">Description</label>
                          <textarea
                            rows={3}
                            value={forumForm.description}
                            onChange={(e) =>
                              setForumForm((p) => ({ ...p, description: e.target.value }))
                            }
                            className="form-textarea w-full"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id="forumIsActive"
                            checked={forumForm.isActive}
                            onChange={(e) =>
                              setForumForm((p) => ({ ...p, isActive: e.target.checked }))
                            }
                          />
                          <label htmlFor="forumIsActive" className="text-sm font-medium">
                            Forum Active and Visible to Students
                          </label>
                        </div>
                        <div className="flex justify-end pt-2">
                          <button className="btn btn-primary" onClick={updateForum}>
                            <Check className="w-4 h-4" /> Save Forum Changes
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subforums under this Forum */}
                    <div className="panel-card space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">
                          Subforums in {selectedForum.name} ({subForumsList.length})
                        </h4>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setNewSubforumModalOpen(true)}
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Subforum
                        </button>
                      </div>

                      {subForumsList.length === 0 ? (
                        <div className="text-xs text-muted p-4 text-center">
                          No subforums yet under this forum. Click "Add Subforum" to create one.
                        </div>
                      ) : (
                        <div className="subforums-table">
                          {subForumsList.map((sub) => (
                            <div key={sub._id} className="subforum-row-item">
                              <div>
                                <div className="font-semibold text-sm">{sub.name}</div>
                                <div className="text-xs text-muted line-clamp-1">
                                  {sub.description || "No description"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted">
                                  Members: {sub.memberCount || 0}
                                </span>
                                <button
                                  className="btn btn-icon btn-sm text-red-500 hover:bg-red-500/10"
                                  onClick={() => deleteSubforum(sub._id, sub.name)}
                                  title="Delete Subforum"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="panel-card empty-detail-pane">
                    <h4>Select a forum</h4>
                    <p className="text-xs text-muted">
                      Pick any forum from the left to edit its details and manage subforums.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= THREAD MODERATION TAB ======================= */}
          {activeTab === "threads" && (
            <div className="grid-2col">
              <div className="space-y-3">
                <div className="panel-card">
                  <h3 className="font-bold mb-3">Search Campus Threads</h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Search title, e.g. 'Placement' or 'Hostel'..."
                      value={threadQuery}
                      onChange={(e) => setThreadQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && searchThreads()}
                      className="form-input flex-1"
                    />
                    <button className="btn btn-primary" onClick={() => searchThreads()}>
                      <Search className="w-4 h-4" /> Search
                    </button>
                  </div>

                  <div className="threads-list">
                    {threadResults.map((t) => (
                      <div
                        key={t._id}
                        onClick={() => selectThread(t)}
                        className={`thread-list-item cursor-pointer ${
                          selectedThread?._id === t._id ? "selected" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-semibold text-sm line-clamp-1">{t.title}</h4>
                          {t.isPinned && (
                            <span className="pinned-badge">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted mt-1 flex items-center justify-between">
                          <span>Author: {t.author?.name || "Student"}</span>
                          <span>Comments: {t.commentCount ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                {selectedThread ? (
                  <div className="panel-card space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b pb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {selectedThread.isPinned && (
                            <span className="pinned-badge">
                              <Pin className="w-3 h-3" /> Pinned
                            </span>
                          )}
                          <span className="text-xs text-muted">
                            Thread ID: <code>{selectedThread._id}</code>
                          </span>
                        </div>
                        <h3 className="text-lg font-bold">{selectedThread.title}</h3>
                        <div className="text-xs text-muted mt-0.5">
                          Posted by <strong>{selectedThread.author?.name || "Unknown"}</strong> •{" "}
                          {selectedThread.createdAt
                            ? new Date(selectedThread.createdAt).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <label className="field-label">Thread Content</label>
                      <div className="detail-text-box whitespace-pre-wrap">
                        {selectedThread.content}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setThreadPinned(!selectedThread.isPinned)}
                      >
                        <Pin className="w-4 h-4" />{" "}
                        {selectedThread.isPinned ? "Unpin Thread" : "Pin Thread to Top"}
                      </button>
                      <button className="btn btn-danger" onClick={deleteThread}>
                        <Trash2 className="w-4 h-4" /> Delete Thread
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="panel-card empty-detail-pane">
                    <MessageSquare className="w-10 h-10 text-muted mb-2" />
                    <h4>Select a thread</h4>
                    <p className="text-xs text-muted">
                      Search and select any thread to moderate, pin/unpin, or remove it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================= COURSE REVIEWS TAB ======================= */}
          {activeTab === "courseReviews" && (
            <div className="space-y-4">
              <div className="filter-bar-card">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="search-input-wrap">
                    <Search className="search-icon" />
                    <input
                      type="text"
                      placeholder="Search by instructor or course keyword..."
                      value={courseReviewSearch}
                      onChange={(e) => setCourseReviewSearch(e.target.value)}
                      className="form-input search-input"
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingCourseReview(null);
                      setCourseReviewForm({ facultyName: "", review: "", photo: "" });
                      setCourseReviewModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Add Course Review
                  </button>
                </div>
              </div>

              {filteredCourseReviews.length === 0 ? (
                <div className="panel-card text-center p-8">
                  <GraduationCap className="w-10 h-10 text-muted mx-auto mb-2" />
                  <h4>No Course Reviews Published</h4>
                  <p className="text-xs text-muted mt-1">
                    Add verified faculty and course reviews to guide students in academic planning.
                  </p>
                </div>
              ) : (
                <div className="cards-grid">
                  {filteredCourseReviews.map((rev) => (
                    <div key={rev._id} className="panel-card course-review-card">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          {rev.photo ? (
                            <img
                              src={rev.photo}
                              alt={rev.facultyName}
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                              {rev.facultyName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-sm">{rev.facultyName}</h4>
                            <span className="text-xs text-muted">Verified Course Review</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-icon btn-sm text-muted hover:text-foreground"
                            onClick={() => {
                              setEditingCourseReview(rev);
                              setCourseReviewForm({
                                facultyName: rev.facultyName || "",
                                review: rev.review || "",
                                photo: rev.photo || "",
                              });
                              setCourseReviewModalOpen(true);
                            }}
                            title="Edit Review"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="btn btn-icon btn-sm text-red-500 hover:bg-red-500/10"
                            onClick={() => deleteCourseReview(rev._id, rev.facultyName)}
                            title="Delete Review"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-foreground line-clamp-4 mt-2 bg-secondary/30 p-2.5 rounded-lg border-l-2 border-primary">
                        {rev.review}
                      </p>
                      <div className="text-[11px] text-muted mt-2">
                        Added:{" "}
                        {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ======================= ACADEMIC RESOURCES TAB ======================= */}
          {activeTab === "resources" && (
            <div className="space-y-4">
              <div className="filter-bar-card">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="search-input-wrap">
                      <Search className="search-icon" />
                      <input
                        type="text"
                        placeholder="Search resources..."
                        value={resourceSearch}
                        onChange={(e) => setResourceSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && loadResources()}
                        className="form-input search-input"
                      />
                    </div>
                    <select
                      value={resourceCategoryFilter}
                      onChange={(e) => setResourceCategoryFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="all">All Categories</option>
                      <option value="course-material">Course Material</option>
                      <option value="lab-manual">Lab Manual</option>
                      <option value="project">Project</option>
                      <option value="placement">Placement</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => setResourceModalOpen(true)}
                  >
                    <Plus className="w-4 h-4" /> Add Resource
                  </button>
                </div>
              </div>

              {resources.length === 0 ? (
                <div className="panel-card text-center p-8">
                  <BookOpen className="w-10 h-10 text-muted mx-auto mb-2" />
                  <h4>No Academic Resources Found</h4>
                  <p className="text-xs text-muted mt-1">
                    Upload syllabus, notes, lab sheets, and slides for students.
                  </p>
                </div>
              ) : (
                <div className="resources-table-wrap panel-card">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Resource Title</th>
                        <th>Course Code</th>
                        <th>Semester</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Downloads</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.map((res) => (
                        <tr key={res._id}>
                          <td>
                            <div className="font-semibold text-sm">{res.title}</div>
                            <div className="text-xs text-muted line-clamp-1">
                              {res.courseName}
                            </div>
                          </td>
                          <td>
                            <span className="code-pill">{res.courseCode}</span>
                          </td>
                          <td>Sem {res.semester}</td>
                          <td>
                            <span className="category-pill">{res.category}</span>
                          </td>
                          <td>{res.fileType}</td>
                          <td>{res.downloadsCount || 0}</td>
                          <td>
                            <div className="flex gap-1.5">
                              <a
                                href={res.url}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-icon btn-sm text-blue-500 hover:bg-blue-500/10"
                                title="Open Link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <button
                                className="btn btn-icon btn-sm text-red-500 hover:bg-red-500/10"
                                onClick={() => deleteResource(res._id, res.title)}
                                title="Delete Resource"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ======================= TEAM MANAGEMENT TAB ======================= */}
          {activeTab === "team" && (
            <div className="space-y-4">
              <div className="filter-bar-card">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <label className="filter-label">Council / Team Category:</label>
                    <select
                      value={teamCategoryFilter}
                      onChange={(e) => setTeamCategoryFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="all">All Groups</option>
                      <option value="dev-team">Dev Team</option>
                      <option value="academic-council">Academic Council (Alumni)</option>
                      <option value="current-academic-council">Current Council</option>
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingTeamMember(null);
                      setTeamForm({
                        name: "",
                        graduationYear: 2026,
                        category: "dev-team",
                        photo: "",
                      });
                      setTeamModalOpen(true);
                    }}
                  >
                    <Plus className="w-4 h-4" /> Add Team Member
                  </button>
                </div>
              </div>

              {teamMembers.length === 0 ? (
                <div className="panel-card text-center p-8">
                  <Users className="w-10 h-10 text-muted mx-auto mb-2" />
                  <h4>No Team Members Found</h4>
                </div>
              ) : (
                <div className="cards-grid">
                  {teamMembers.map((member) => (
                    <div key={member._id} className="panel-card team-card">
                      <div className="flex items-center gap-3">
                        {member.photo ? (
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-12 h-12 rounded-xl object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate">{member.name}</h4>
                          <div className="text-xs text-muted">
                            Class of '{String(member.graduationYear).slice(-2)}
                          </div>
                          <span className="category-pill mt-1 inline-block">
                            {member.category}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <button
                            className="btn btn-icon btn-sm text-muted hover:text-foreground"
                            onClick={() => {
                              setEditingTeamMember(member);
                              setTeamForm({
                                name: member.name,
                                graduationYear: member.graduationYear,
                                category: member.category,
                                photo: member.photo || "",
                              });
                              setTeamModalOpen(true);
                            }}
                            title="Edit Member"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="btn btn-icon btn-sm text-red-500 hover:bg-red-500/10"
                            onClick={() => deleteTeamMember(member._id, member.name)}
                            title="Delete Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================= MODALS ======================= */}

      {/* Screenshot Preview Modal */}
      {previewScreenshot && (
        <div className="modal-backdrop" onClick={() => setPreviewScreenshot(null)}>
          <div className="modal-window modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Screenshot Evidence</h3>
              <button
                className="btn btn-icon"
                onClick={() => setPreviewScreenshot(null)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 text-center">
              <img
                src={previewScreenshot}
                alt="Enlarged screenshot"
                className="max-h-[75vh] max-w-full rounded-lg mx-auto shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Propose/Create Forum Modal */}
      {newForumModalOpen && (
        <div className="modal-backdrop" onClick={() => setNewForumModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create / Propose Forum</h3>
              <button
                className="btn btn-icon"
                onClick={() => setNewForumModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateForumRequest} className="p-5 space-y-3">
              <div>
                <label className="field-label">Forum Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Competitive Programming"
                  value={newForumForm.name}
                  onChange={(e) =>
                    setNewForumForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea
                  rows={3}
                  placeholder="What is this forum about?"
                  value={newForumForm.description}
                  onChange={(e) =>
                    setNewForumForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="form-textarea w-full"
                />
              </div>
              <div>
                <label className="field-label">Forum Type</label>
                <select
                  value={newForumForm.type}
                  onChange={(e) =>
                    setNewForumForm((p) => ({ ...p, type: e.target.value }))
                  }
                  className="form-select w-full"
                >
                  <option value="normal">Normal (Discussion & General)</option>
                  <option value="collab">Collab (Work Requests & Projects)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setNewForumModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Forum
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Subforum Modal */}
      {newSubforumModalOpen && selectedForum && (
        <div className="modal-backdrop" onClick={() => setNewSubforumModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Subforum to {selectedForum.name}</h3>
              <button
                className="btn btn-icon"
                onClick={() => setNewSubforumModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSubforum} className="p-5 space-y-3">
              <div>
                <label className="field-label">Subforum Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Codeforces & LeetCode"
                  value={newSubforumForm.name}
                  onChange={(e) =>
                    setNewSubforumForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="field-label">Description</label>
                <textarea
                  rows={3}
                  placeholder="Channel topic or purpose..."
                  value={newSubforumForm.description}
                  onChange={(e) =>
                    setNewSubforumForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="form-textarea w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setNewSubforumModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Subforum Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Course Review Modal */}
      {courseReviewModalOpen && (
        <div className="modal-backdrop" onClick={() => setCourseReviewModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCourseReview ? "Edit Course Review" : "Add New Course Review"}
              </h3>
              <button
                className="btn btn-icon"
                onClick={() => setCourseReviewModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCourseReview} className="p-5 space-y-3">
              <div>
                <label className="field-label">Course / Instructor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS201 - Data Structures / Prof. Arvind"
                  value={courseReviewForm.facultyName}
                  onChange={(e) =>
                    setCourseReviewForm((p) => ({ ...p, facultyName: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="field-label">Assessment & Review *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Course rigor, grading policy, practical lab advice..."
                  value={courseReviewForm.review}
                  onChange={(e) =>
                    setCourseReviewForm((p) => ({ ...p, review: e.target.value }))
                  }
                  className="form-textarea w-full"
                />
              </div>
              <div>
                <label className="field-label">Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={courseReviewForm.photo}
                  onChange={(e) =>
                    setCourseReviewForm((p) => ({ ...p, photo: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setCourseReviewModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCourseReview ? "Update Review" : "Publish Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      {resourceModalOpen && (
        <div className="modal-backdrop" onClick={() => setResourceModalOpen(false)}>
          <div className="modal-window modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Upload Academic Resource</h3>
              <button
                className="btn btn-icon"
                onClick={() => setResourceModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveResource} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Resource Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Endsem Revision Notes 2025"
                    value={resourceForm.title}
                    onChange={(e) =>
                      setResourceForm((p) => ({ ...p, title: e.target.value }))
                    }
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="field-label">Course Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS201"
                    value={resourceForm.courseCode}
                    onChange={(e) =>
                      setResourceForm((p) => ({ ...p, courseCode: e.target.value }))
                    }
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Course Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Data Structures & Algorithms"
                    value={resourceForm.courseName}
                    onChange={(e) =>
                      setResourceForm((p) => ({ ...p, courseName: e.target.value }))
                    }
                    className="form-input w-full"
                  />
                </div>
                <div>
                  <label className="field-label">Semester (1–8)</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={resourceForm.semester}
                    onChange={(e) =>
                      setResourceForm((p) => ({ ...p, semester: e.target.value }))
                    }
                    className="form-input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Category</label>
                  <select
                    value={resourceForm.category}
                    onChange={(e) =>
                      setResourceForm((p) => ({ ...p, category: e.target.value }))
                    }
                    className="form-select w-full"
                  >
                    <option value="course-material">Course Material</option>
                    <option value="lab-manual">Lab Manual</option>
                    <option value="project">Project</option>
                    <option value="placement">Placement</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">File Type</label>
                  <select
                    value={resourceForm.fileType}
                    onChange={(e) =>
                      setResourceForm((p) => ({ ...p, fileType: e.target.value }))
                    }
                    className="form-select w-full"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="Drive">Google Drive</option>
                    <option value="GitHub">GitHub Repository</option>
                    <option value="ZIP">ZIP Archive</option>
                    <option value="Link">Web Link</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Resource URL (Direct or Drive Link) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/..."
                  value={resourceForm.url}
                  onChange={(e) =>
                    setResourceForm((p) => ({ ...p, url: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>

              <div>
                <label className="field-label">Description</label>
                <textarea
                  rows={2}
                  placeholder="What is covered in this resource?"
                  value={resourceForm.description}
                  onChange={(e) =>
                    setResourceForm((p) => ({ ...p, description: e.target.value }))
                  }
                  className="form-textarea w-full"
                />
              </div>

              <div>
                <label className="field-label">Tags (comma-separated)</label>
                <input
                  type="text"
                  placeholder="midsem, trees, graphs, algorithms"
                  value={resourceForm.tags}
                  onChange={(e) =>
                    setResourceForm((p) => ({ ...p, tags: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setResourceModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Team Member Modal */}
      {teamModalOpen && (
        <div className="modal-backdrop" onClick={() => setTeamModalOpen(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTeamMember ? "Edit Team Member" : "Add Team Member"}
              </h3>
              <button
                className="btn btn-icon"
                onClick={() => setTeamModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTeamMember} className="p-5 space-y-3">
              <div>
                <label className="field-label">Member Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={teamForm.name}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="field-label">Graduation Year *</label>
                <input
                  type="number"
                  required
                  min="2016"
                  max="2035"
                  value={teamForm.graduationYear}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, graduationYear: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>
              <div>
                <label className="field-label">Team Category</label>
                <select
                  value={teamForm.category}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="form-select w-full"
                >
                  <option value="dev-team">Dev Team</option>
                  <option value="academic-council">Academic Council (Alumni)</option>
                  <option value="current-academic-council">Current Academic Council</option>
                </select>
              </div>
              <div>
                <label className="field-label">Photo URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={teamForm.photo}
                  onChange={(e) =>
                    setTeamForm((p) => ({ ...p, photo: e.target.value }))
                  }
                  className="form-input w-full"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setTeamModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTeamMember ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
