import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from './components/layout/Navbar';
import LeftSidebar from './components/layout/LeftSidebar';
import BottomNav from './components/layout/BottomNav';
import AuthModal from './components/modals/AuthModal';
import CreatePostModal from './components/modals/CreatePostModal';
import NotificationsModal from './components/modals/NotificationsModal';
import PostDetailModal from './components/modals/PostDetailModal';
import Toast from './components/common/Toast';
import CalendarView from './components/views/CalendarView';
import ComplaintsView from './components/views/ComplaintsView';
import ForumView from './components/views/ForumView';
import ResourcesView from './components/views/ResourcesView';
import useDebounce from './hooks/useDebounce';
import useToast from './hooks/useToast';
import {
  authApi,
  commentApi,
  forumApi,
  notificationApi,
  subforumApi,
  threadApi,
  workRequestApi,
} from './api/unihubApi';

const formatSearch = (value) => value.trim().toLowerCase();

export default function App() {
  const [forums, setForums] = useState([]);
  const [currentView, setCurrentView] = useState('home');
  const [selectedForumId, setSelectedForumId] = useState(null);
  const [selectedSubforumId, setSelectedSubforumId] = useState(null);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [selectedThreadData, setSelectedThreadData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 250);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [workRequestsBySubforum, setWorkRequestsBySubforum] = useState({});
  const [searchedThreads, setSearchedThreads] = useState([]);
  const { toasts, success, error, removeToast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    const authError = params.get('authError');

    if (!authStatus && !authError) return;

    if (authStatus === 'success') {
      success('Signed in successfully');
      setIsAuthModalOpen(false);
    }

    if (authError) {
      error(authError);
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }, [success, error]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const mergeSubforumsIntoForum = useCallback((forumId, subforums) => {
    setForums((previousForums) =>
      previousForums.map((forum) =>
        forum.id === forumId
          ? { ...forum, subforums, subforumCount: subforums.length }
          : forum,
      ),
    );
  }, []);

  const mergeThreadsIntoSubforum = useCallback((subforumId, threads) => {
    setForums((previousForums) =>
      previousForums.map((forum) => ({
        ...forum,
        threadCount: forum.subforums.reduce(
          (sum, subforum) =>
            sum + (subforum.id === subforumId ? threads.length : subforum.threads?.length || subforum.threadCount || 0),
          0,
        ),
        subforums: forum.subforums.map((subforum) =>
          subforum.id === subforumId
            ? {
                ...subforum,
                threads,
                threadCount: threads.length,
              }
            : subforum,
        ),
      })),
    );
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const [notificationResult, unread] = await Promise.all([
        notificationApi.getNotifications({ page: 1, limit: 50 }),
        notificationApi.getUnreadCount(),
      ]);
      setNotifications(notificationResult.notifications);
      setUnreadCount(unread);
    } catch {
      // Silent to avoid interrupting bootstrap when unauthenticated.
    }
  }, []);

  const bootstrap = useCallback(async () => {
    setIsBootstrapping(true);
    try {
      const [forumList, me] = await Promise.all([
        forumApi.getForums(),
        authApi.getMe().catch(() => null),
      ]);

      setCurrentUser(me);
      const forumsWithSubforums = await Promise.all(
        forumList.map(async (forum) => {
          const subforums = await forumApi.getSubforums(forum.id);
          return {
            ...forum,
            subforums,
            subforumCount: subforums.length,
          };
        }),
      );

      setForums(forumsWithSubforums);

      const initialForum = forumsWithSubforums[0];
      if (initialForum) {
        setSelectedForumId(initialForum.id);
        const initialSubforum = initialForum.subforums[0];
        if (initialSubforum) {
          setSelectedSubforumId(initialSubforum.id);
        }
      }

      if (me) {
        await loadNotifications();
      }
    } catch (bootstrapError) {
      error(bootstrapError.message || 'Failed to load backend data');
    } finally {
      setIsBootstrapping(false);
    }
  }, [error, loadNotifications]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

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

  const isSubforumJoined = useMemo(
    () => Boolean(currentUser && selectedSubforumId && currentUser.joinedSubForums?.includes(selectedSubforumId)),
    [currentUser, selectedSubforumId],
  );

  const isSubforumMuted = useMemo(
    () => Boolean(currentUser && selectedSubforumId && currentUser.mutedSubForums?.includes(selectedSubforumId)),
    [currentUser, selectedSubforumId],
  );

  const selectedSubforumThreads = useMemo(() => selectedSubforum?.threads || [], [selectedSubforum]);

  useEffect(() => {
    const loadSubforumData = async () => {
      if (!selectedSubforumId) return;

      try {
        const [{ threads }, workRequests] = await Promise.all([
          threadApi.getThreadsBySubforum(selectedSubforumId, 1, 50),
          selectedForum?.type === 'collab'
            ? workRequestApi.getWorkRequestsBySubforum(selectedSubforumId)
            : Promise.resolve([]),
        ]);

        mergeThreadsIntoSubforum(selectedSubforumId, threads);
        setWorkRequestsBySubforum((previous) => ({
          ...previous,
          [selectedSubforumId]: workRequests,
        }));
      } catch (loadError) {
        error(loadError.message || 'Failed to load subforum data');
      }
    };

    loadSubforumData();
  }, [selectedSubforumId, selectedForum?.type, mergeThreadsIntoSubforum, error]);

  useEffect(() => {
    const loadSearchThreads = async () => {
      const query = formatSearch(debouncedSearchQuery);
      if (!query) {
        setSearchedThreads([]);
        return;
      }

      try {
        const { threads } = await threadApi.searchThreads({ q: query, page: 1, limit: 20 });
        setSearchedThreads(threads);
      } catch {
        setSearchedThreads([]);
      }
    };

    loadSearchThreads();
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (!selectedThreadId) {
      setSelectedThreadData(null);
      return;
    }

    const loadThreadData = async () => {
      try {
        const [thread, comments] = await Promise.all([
          threadApi.getThread(selectedThreadId),
          commentApi.getThreadComments(selectedThreadId),
        ]);
        setSelectedThreadData({ ...thread, comments });
      } catch (threadError) {
        error(threadError.message || 'Failed to load thread details');
      }
    };

    loadThreadData();
  }, [selectedThreadId, error]);

  useEffect(() => {
    if (!currentUser) return;

    const intervalId = setInterval(async () => {
      try {
        const unread = await notificationApi.getUnreadCount();
        setUnreadCount(unread);
      } catch {
        // Ignore polling failures.
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [currentUser]);

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

    const matchedThreads = searchedThreads.map((thread) => {
      const forum = forums.find((item) => item.id === thread.forumId);
      const subforum = forum?.subforums.find((item) => item.id === thread.subForumId);

      return {
        ...thread,
        forumId: forum?.id || thread.forumId,
        forumName: forum?.name || 'Forum',
        subforumId: subforum?.id || thread.subForumId,
        subforumName: subforum?.name || 'Subforum',
      };
    });

    return { forums, matchedForums, matchedSubforums, matchedThreads };
  }, [forums, debouncedSearchQuery, searchedThreads]);

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

  const activeNotifications = unreadCount;

  const markNotificationRead = async (notificationId) => {
    try {
      await notificationApi.readOne(notificationId);
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) =>
          notification.id === notificationId ? { ...notification, isRead: true } : notification,
        ),
      );
      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (notificationError) {
      error(notificationError.message || 'Failed to update notification');
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await notificationApi.readAll();
      setNotifications((previousNotifications) =>
        previousNotifications.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
    } catch (notificationError) {
      error(notificationError.message || 'Failed to mark all notifications as read');
    }
  };

  const findThreadLocationByThreadId = useCallback((threadId) => {
    for (const forum of forums) {
      for (const subforum of forum.subforums) {
        const thread = subforum.threads.find((item) => item.id === threadId);
        if (thread) {
          return { forumId: forum.id, subforumId: subforum.id, threadId: thread.id };
        }
      }
    }

    return null;
  }, [forums]);

  const openThread = useCallback(({ forumId, subforumId, threadId }) => {
    setCurrentView('home');
    setSelectedForumId(forumId);
    setSelectedSubforumId(subforumId);
    setSelectedThreadId(threadId);
  }, []);

  const openThreadById = useCallback(async (threadId) => {
    let threadTarget = findThreadLocationByThreadId(threadId);
    if (!threadTarget) {
      const thread = await threadApi.getThread(threadId);
      threadTarget = {
        forumId: thread.forumId,
        subforumId: thread.subForumId,
        threadId: thread.id,
      };
    }

    if (threadTarget) {
      openThread(threadTarget);
    }
  }, [findThreadLocationByThreadId, openThread]);

  const handleOpenNotification = async (notification) => {
    try {
      if (notification.entityType === 'Thread') {
        await openThreadById(notification.entityId);
      } else if (notification.entityType === 'Comment') {
        const comment = await commentApi.getComment(notification.entityId);
        if (comment.threadId) {
          await openThreadById(comment.threadId);
        }
      }

      await markNotificationRead(notification.id);
      setIsNotificationsOpen(false);
    } catch (notificationError) {
      error(notificationError.message || 'Failed to open notification target');
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

  const handleGoogleLogin = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setCurrentUser(null);
      setNotifications([]);
      setUnreadCount(0);
      success('Logged out successfully');
      setIsAuthModalOpen(false);
    } catch (logoutError) {
      error(logoutError.message || 'Logout failed');
    }
  };

  const handleCreateThread = async (threadData) => {
    try {
      const thread = await threadApi.createThread({
        title: threadData.title,
        content: threadData.content,
        subForumId: threadData.subforumId,
        tags: threadData.tags,
        attachments: threadData.attachments,
        notifyAlumni: threadData.notifyAlumni,
      });

      const targetSubforum = forums
        .flatMap((forum) => forum.subforums)
        .find((subforum) => subforum.id === threadData.subforumId);
      const existingThreads = targetSubforum?.threads || [];
      mergeThreadsIntoSubforum(threadData.subforumId, [thread, ...existingThreads]);

      setSelectedForumId(threadData.forumId || selectedForumId);
      setSelectedSubforumId(threadData.subforumId);
      setSelectedThreadId(thread.id);
      setIsCreateModalOpen(false);
      success('Thread created successfully');
    } catch (createError) {
      error(createError.message || 'Failed to create thread');
    }
  };

  const handleAddComment = async (threadId, content, parentCommentId) => {
    try {
      await commentApi.createComment({ threadId, content, parentCommentId });

      const [thread, comments] = await Promise.all([
        threadApi.getThread(threadId),
        commentApi.getThreadComments(threadId),
      ]);

      setSelectedThreadData({ ...thread, comments });
      setForums((previousForums) =>
        previousForums.map((forum) => ({
          ...forum,
          subforums: forum.subforums.map((subforum) => ({
            ...subforum,
            threads: subforum.threads.map((item) =>
              item.id === threadId ? { ...item, replies: comments.length } : item,
            ),
          })),
        })),
      );
    } catch (commentError) {
      error(commentError.message || 'Failed to add comment');
    }
  };

  const handleDeleteThread = async (threadId) => {
    try {
      await threadApi.deleteThread(threadId);
      if (selectedSubforumId) {
        const currentThreads = selectedSubforum?.threads || [];
        mergeThreadsIntoSubforum(
          selectedSubforumId,
          currentThreads.filter((thread) => thread.id !== threadId),
        );
      }
      setSelectedThreadId(null);
      setSelectedThreadData(null);
      success('Thread deleted successfully');
    } catch (deleteError) {
      error(deleteError.message || 'Failed to delete thread');
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationApi.remove(notificationId);
      setNotifications((previous) => previous.filter((item) => item.id !== notificationId));
      await loadNotifications();
    } catch (deleteError) {
      error(deleteError.message || 'Failed to delete notification');
    }
  };

  const updateCurrentUserSubforumState = useCallback((subforumId, field, shouldAdd) => {
    setCurrentUser((previousUser) => {
      if (!previousUser) return previousUser;
      const currentList = previousUser[field] || [];
      const nextList = shouldAdd
        ? Array.from(new Set([...currentList, subforumId]))
        : currentList.filter((item) => item !== subforumId);

      return {
        ...previousUser,
        [field]: nextList,
      };
    });
  }, []);

  const handleJoinSubforum = async () => {
    if (!selectedSubforumId) return;
    try {
      await subforumApi.join(selectedSubforumId);
      updateCurrentUserSubforumState(selectedSubforumId, 'joinedSubForums', true);
      success('Joined subforum');
    } catch (joinError) {
      error(joinError.message || 'Failed to join subforum');
    }
  };

  const handleLeaveSubforum = async () => {
    if (!selectedSubforumId) return;
    try {
      await subforumApi.leave(selectedSubforumId);
      updateCurrentUserSubforumState(selectedSubforumId, 'joinedSubForums', false);
      success('Left subforum');
    } catch (leaveError) {
      error(leaveError.message || 'Failed to leave subforum');
    }
  };

  const handleMuteSubforum = async () => {
    if (!selectedSubforumId) return;
    try {
      await subforumApi.mute(selectedSubforumId);
      updateCurrentUserSubforumState(selectedSubforumId, 'mutedSubForums', true);
      success('Subforum muted');
    } catch (muteError) {
      error(muteError.message || 'Failed to mute subforum');
    }
  };

  const handleUnmuteSubforum = async () => {
    if (!selectedSubforumId) return;
    try {
      await subforumApi.unmute(selectedSubforumId);
      updateCurrentUserSubforumState(selectedSubforumId, 'mutedSubForums', false);
      success('Subforum unmuted');
    } catch (unmuteError) {
      error(unmuteError.message || 'Failed to unmute subforum');
    }
  };

  const handleCreateWorkRequest = async (payload) => {
    if (!selectedSubforumId || !selectedForum) return;

    const targetSubForumIds = selectedForum.subforums
      .map((subforum) => subforum.id)
      .filter((subforumId) => subforumId !== selectedSubforumId);

    if (!targetSubForumIds.length) {
      error('Add at least one additional subforum in this collab forum to target');
      return;
    }

    try {
      await workRequestApi.createWorkRequest(selectedSubforumId, {
        ...payload,
        targetSubForumIds,
      });

      const workRequests = await workRequestApi.getWorkRequestsBySubforum(selectedSubforumId);
      setWorkRequestsBySubforum((previous) => ({
        ...previous,
        [selectedSubforumId]: workRequests,
      }));
      success('Work request created');
    } catch (workRequestError) {
      error(workRequestError.message || 'Failed to create work request');
    }
  };

  const selectedThreadView = selectedThreadData || (selectedThread
    ? {
        ...(selectedThreadData || selectedThread),
        forumId: selectedForum?.id ?? null,
        forumName: selectedForum?.name ?? '',
        subforumId: selectedSubforum?.id ?? null,
        subforumName: selectedSubforum?.name ?? '',
        comments: selectedThreadData?.comments || [],
      }
    : null);

  useEffect(() => {
    if (!selectedForum?.id) return;

    const hasCompleteSubforums = selectedForum.subforums.every((subforum) => subforum.threads !== undefined);
    if (hasCompleteSubforums) return;

    const refreshSubforums = async () => {
      try {
        const subforums = await forumApi.getSubforums(selectedForum.id);
        mergeSubforumsIntoForum(selectedForum.id, subforums);
      } catch {
        // Keep existing data if refresh fails.
      }
    };

    refreshSubforums();
  }, [selectedForum?.id, selectedForum?.subforums, mergeSubforumsIntoForum]);

  if (isBootstrapping) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <p className="text-sm opacity-70">Connecting to backend at localhost:5000...</p>
      </div>
    );
  }

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
          setIsAuthModalOpen(true);
        }}
        onOpenSignup={() => {
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
        currentUser={currentUser}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDarkMode={isDarkMode}
        currentUser={currentUser}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        isDarkMode={isDarkMode}
        notifications={notifications}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        onOpenNotification={handleOpenNotification}
        onDeleteNotification={handleDeleteNotification}
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
              currentUser={currentUser}
              selectedSubforumThreads={selectedSubforumThreads}
              workRequests={workRequestsBySubforum[selectedSubforumId] || []}
              isSubforumJoined={isSubforumJoined}
              isSubforumMuted={isSubforumMuted}
              onJoinSubforum={handleJoinSubforum}
              onLeaveSubforum={handleLeaveSubforum}
              onMuteSubforum={handleMuteSubforum}
              onUnmuteSubforum={handleUnmuteSubforum}
              onCreateWorkRequest={handleCreateWorkRequest}
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
        onDeleteThread={handleDeleteThread}
        currentUser={currentUser}
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

      <div className="fixed right-5 top-20 z-140 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            isDarkMode={isDarkMode}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  );
}
