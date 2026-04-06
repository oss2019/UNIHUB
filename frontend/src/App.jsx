import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/layout/Navbar';
import LeftSidebar from './components/layout/LeftSidebar';
import BottomNav from './components/layout/BottomNav';
import AuthModal from './components/modals/AuthModal';
import CreatePostModal from './components/modals/CreatePostModal';
import NotificationsModal from './components/modals/NotificationsModal';
import PostDetailModal from './components/modals/PostDetailModal';
import CalendarView from './components/views/CalendarView';
import ComplaintsView from './components/views/ComplaintsView';
import ForumView from './components/views/ForumView';
import ResourcesView from './components/views/ResourcesView';
import useDebounce from './hooks/useDebounce';
import { CURRENT_USER, FORUMS, NOTIFICATIONS } from './constants/appData';

const generateId = () => Math.random().toString(36).slice(2, 11);

const formatSearch = (value) => value.trim().toLowerCase();

export default function App() {
  const [forums, setForums] = useState(FORUMS);
  const [currentView, setCurrentView] = useState('home');
  const [selectedForumId, setSelectedForumId] = useState(null);
  const [selectedSubforumId, setSelectedSubforumId] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [authType, setAuthType] = useState('login');
  const [notifications, setNotifications] = useState(NOTIFICATIONS);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const selectedForum = useMemo(
    () => forums.find((forum) => forum.id === selectedForumId) ?? null,
    [forums, selectedForumId],
  );

  const selectedSubforum = useMemo(
    () => selectedForum?.subforums.find((subforum) => subforum.id === selectedSubforumId) ?? null,
    [selectedForum, selectedSubforumId],
  );

  const selectedThread = useMemo(
    () => selectedSubforum?.threads.find((thread) => thread.id === selectedThreadId) ?? null,
    [selectedSubforum, selectedThreadId],
  );

  const searchResults = useMemo(() => {
    const query = formatSearch(debouncedSearchQuery);
    if (!query) {
      return { forums, matchedForums: forums, matchedSubforums: [], matchedThreads: [] };
    }

    const matchedForums = forums.filter((forum) => {
      const forumText = [forum.name, forum.description, forum.id].join(' ').toLowerCase();
      return forumText.includes(query);
    });

    const matchedSubforums = forums.flatMap((forum) =>
      forum.subforums
        .filter((subforum) => {
          const text = [forum.name, subforum.name, subforum.description, ...(subforum.tags ?? [])].join(' ').toLowerCase();
          return text.includes(query);
        })
        .map((subforum) => ({ ...subforum, forumId: forum.id, forumName: forum.name })),
    );

    const matchedThreads = forums.flatMap((forum) =>
      forum.subforums.flatMap((subforum) =>
        subforum.threads
          .filter((thread) => {
            const text = [forum.name, subforum.name, thread.title, thread.excerpt, thread.content, thread.author, ...(thread.tags ?? [])].join(' ').toLowerCase();
            return text.includes(query);
          })
          .map((thread) => ({ ...thread, forumId: forum.id, forumName: forum.name, subforumId: subforum.id, subforumName: subforum.name })),
      ),
    );

    return { forums, matchedForums, matchedSubforums, matchedThreads };
  }, [forums, debouncedSearchQuery]);

  const topForums = useMemo(() => forums.slice(0, 4), [forums]);

  const communityStats = useMemo(() => {
    const forumCount = forums.length;
    const subforumCount = forums.reduce((count, forum) => count + forum.subforums.length, 0);
    const threadCount = forums.reduce(
      (count, forum) => count + forum.subforums.reduce((subCount, subforum) => subCount + subforum.threads.length, 0),
      0,
    );
    return { forumCount, subforumCount, threadCount };
  }, [forums]);

  const activeNotifications = notifications.filter((notification) => !notification.isRead).length;

  const markNotificationRead = (notificationId) => {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification,
      ),
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((previousNotifications) =>
      previousNotifications.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const findThreadLocationByCommentId = (commentId) => {
    const hasComment = (comments = []) =>
      comments.some((comment) => comment.id === commentId || hasComment(comment.replies || []));

    for (const forum of forums) {
      for (const subforum of forum.subforums) {
        for (const thread of subforum.threads) {
          if (hasComment(thread.comments || [])) {
            return { forumId: forum.id, subforumId: subforum.id, threadId: thread.id };
          }
        }
      }
    }

    return null;
  };

  const findThreadLocationByThreadId = (threadId) => {
    for (const forum of forums) {
      for (const subforum of forum.subforums) {
        const thread = subforum.threads.find((item) => item.id === threadId);
        if (thread) {
          return { forumId: forum.id, subforumId: subforum.id, threadId: thread.id };
        }
      }
    }

    return null;
  };

  const handleOpenNotification = (notification) => {
    const threadTarget =
      notification.entityType === 'Thread'
        ? findThreadLocationByThreadId(notification.entityId)
        : findThreadLocationByCommentId(notification.entityId);

    if (threadTarget) {
      openThread(threadTarget);
      markNotificationRead(notification.id);
      setIsNotificationsOpen(false);
    }
  };

  const resetHierarchy = () => {
    setSelectedForumId(null);
    setSelectedSubforumId(null);
    setSelectedThreadId(null);
  };

  const goHome = () => {
    resetHierarchy();
    setSearchQuery('');
    setCurrentView('home');
  };

  const openForum = (forumId) => {
    setCurrentView('home');
    setSelectedForumId(forumId);
    setSelectedSubforumId(null);
    setSelectedThreadId(null);
  };

  const openSubforum = (forumId, subforumId) => {
    setCurrentView('home');
    setSelectedForumId(forumId);
    setSelectedSubforumId(subforumId);
    setSelectedThreadId(null);
  };

  const openThread = ({ forumId, subforumId, threadId }) => {
    setCurrentView('home');
    setSelectedForumId(forumId);
    setSelectedSubforumId(subforumId);
    setSelectedThreadId(threadId);
  };

  const handleAuthSubmit = (userData) => {
    alert(`${userData.isSignUp ? 'Sign Up' : 'Log In'} successful!\nEmail: ${userData.email}\nRole: ${userData.role}`);
  };

  const handleCreateThread = (threadData) => {
    const targetForumId = threadData.forumId || selectedForumId || forums[0]?.id;

    if (!targetForumId) {
      return;
    }

    setForums((previousForums) =>
      previousForums.map((forum) => {
        if (forum.id !== targetForumId) return forum;

        const targetSubforumId = threadData.subforumId || selectedSubforumId || forum.subforums[0]?.id;
        const newThread = {
          id: generateId(),
          title: threadData.title,
          excerpt: threadData.content.slice(0, 120),
          content: threadData.content,
          author: CURRENT_USER.name,
          authorRole: CURRENT_USER.role,
          createdAt: 'just now',
          views: 0,
          replies: 0,
          likes: 0,
          tags: threadData.tags || [],
          attachments: [],
          isPinned: false,
          isSolved: false,
          comments: [],
        };

        return {
          ...forum,
          threadCount: forum.threadCount + 1,
          subforums: forum.subforums.map((subforum) => {
            if (subforum.id !== targetSubforumId) return subforum;

            return {
              ...subforum,
              threadCount: subforum.threadCount + 1,
              activeNow: subforum.activeNow + 1,
              threads: [newThread, ...subforum.threads],
            };
          }),
        };
      }),
    );

    setSelectedForumId(targetForumId);
    setSelectedSubforumId(threadData.subforumId || selectedSubforumId || forums[0]?.subforums[0]?.id || null);
    setSelectedThreadId(null);
    setIsCreateModalOpen(false);
  };

  const handleAddComment = (threadId, content, parentId) => {
    const newComment = {
      id: generateId(),
      author: CURRENT_USER.name,
      content,
      timestamp: 'just now',
      votes: 1,
      replies: [],
    };

    setForums((previousForums) =>
      previousForums.map((forum) => ({
        ...forum,
        subforums: forum.subforums.map((subforum) => ({
          ...subforum,
          threads: subforum.threads.map((thread) => {
            if (thread.id !== threadId) return thread;

            const updateComments = (comments) => {
              if (!parentId) {
                return [newComment, ...comments];
              }

              return comments.map((comment) => {
                if (comment.id === parentId) {
                  return { ...comment, replies: [newComment, ...(comment.replies || [])] };
                }

                return { ...comment, replies: updateComments(comment.replies || []) };
              });
            };

            return {
              ...thread,
              comments: updateComments(thread.comments || []),
              replies: thread.replies + 1,
            };
          }),
        })),
      })),
    );
  };

  const selectedThreadView = selectedThread
    ? {
        ...selectedThread,
        forumId: selectedForum?.id ?? null,
        forumName: selectedForum?.name ?? '',
        subforumId: selectedSubforum?.id ?? null,
        subforumName: selectedSubforum?.name ?? '',
      }
    : null;

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      <Navbar
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onToggleTheme={() => setIsDarkMode((previous) => !previous)}
        onOpenLogin={() => {
          setAuthType('login');
          setIsAuthModalOpen(true);
        }}
        onOpenSignup={() => {
          setAuthType('signup');
          setIsAuthModalOpen(true);
        }}
        onGoHome={goHome}
        activeNotifications={activeNotifications}
        selectedForum={selectedForum}
        selectedSubforum={selectedSubforum}
        forums={forums}
        currentView={currentView}
        setCurrentView={setCurrentView}
        setSelectedForumId={setSelectedForumId}
        setSelectedSubforumId={setSelectedSubforumId}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} isDarkMode={isDarkMode} onSubmit={handleAuthSubmit} authType={authType} />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        isDarkMode={isDarkMode}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onOpenNotification={handleOpenNotification}
      />

      <div className="mx-auto flex w-full max-w-7xl gap-4 px-4 pb-28 pt-6 lg:gap-6 lg:px-5">
        <LeftSidebar
          currentView={currentView}
          selectedForumId={selectedForumId}
          selectedSubforumId={selectedSubforumId}
          setCurrentView={setCurrentView}
          setSelectedForumId={setSelectedForumId}
          setSelectedSubforumId={setSelectedSubforumId}
          isDarkMode={isDarkMode}
          forums={forums}
          onGoHome={goHome}
        />

        <main className="min-w-0 flex-1 pb-2">
          {currentView === 'home' && (
            <ForumView
              isDarkMode={isDarkMode}
              forums={forums}
              selectedForum={selectedForum}
              selectedSubforum={selectedSubforum}
              searchQuery={debouncedSearchQuery}
              searchResults={searchResults}
              topForums={topForums}
              communityStats={communityStats}
              currentUser={CURRENT_USER}
              onOpenForum={openForum}
              onOpenSubforum={openSubforum}
              onOpenThread={openThread}
              onBackToForums={goHome}
              onCreateThread={() => setIsCreateModalOpen(true)}
            />
          )}
          {currentView === 'resources' && <ResourcesView isDarkMode={isDarkMode} />}
          {currentView === 'calendar' && <CalendarView isDarkMode={isDarkMode} />}
          {currentView === 'complaints' && <ComplaintsView isDarkMode={isDarkMode} />}
          {currentView === 'reports' && <ComplaintsView isDarkMode={isDarkMode} />}
        </main>
      </div>

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        isDarkMode={isDarkMode}
        forums={forums}
        selectedForumId={selectedForumId}
        selectedSubforumId={selectedSubforumId}
        onSubmit={handleCreateThread}
      />

      <PostDetailModal
        selectedThread={selectedThreadView}
        onClose={() => setSelectedThreadId(null)}
        isDarkMode={isDarkMode}
        onAddComment={handleAddComment}
      />

      <BottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
        isDarkMode={isDarkMode}
        forums={forums}
        selectedForumId={selectedForumId}
        setSelectedForumId={setSelectedForumId}
        setSelectedSubforumId={setSelectedSubforumId}
        onGoHome={goHome}
      />
    </div>
  );
}
