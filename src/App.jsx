import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/layout/Navbar';
import LeftSidebar from './components/layout/LeftSidebar';
import RightSidebar from './components/layout/RightSidebar';
import AuthModal from './components/modals/AuthModal';
import CreatePostModal from './components/modals/CreatePostModal';
import PostDetailModal from './components/modals/PostDetailModal';
import CalendarView from './components/views/CalendarView';
import ComplaintsView from './components/views/ComplaintsView';
import ForumView from './components/views/ForumView';
import ResourcesView from './components/views/ResourcesView';
import { CATEGORIES, INITIAL_POSTS } from './constants/appData';

export default function App() {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('hot');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('forum');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authType, setAuthType] = useState('login');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const filteredPosts = useMemo(() => {
    const result = [...posts];

    const categoryFiltered = selectedCategory ? result.filter((post) => post.category === selectedCategory) : result;

    const searchFiltered = searchQuery
      ? categoryFiltered.filter(
          (post) =>
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.category.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : categoryFiltered;

    switch (sortBy) {
      case 'hot':
        return searchFiltered.sort((a, b) => b.hotScore - a.hotScore);
      case 'new':
        return searchFiltered.sort((a, b) => b.newScore - a.newScore);
      case 'top':
        return searchFiltered.sort((a, b) => b.topScore - a.topScore);
      case 'rising':
        return searchFiltered.sort((a, b) => b.risingScore - a.risingScore);
      default:
        return searchFiltered;
    }
  }, [posts, selectedCategory, sortBy, searchQuery]);

  const handleVote = (postId, direction) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        let newVotes = post.votes;
        let newUserVote = post.userVote;

        if (direction === 'up') {
          if (post.userVote === 'up') {
            newVotes -= 1;
            newUserVote = null;
          } else if (post.userVote === 'down') {
            newVotes += 2;
            newUserVote = 'up';
          } else {
            newVotes += 1;
            newUserVote = 'up';
          }
        } else if (post.userVote === 'down') {
          newVotes += 1;
          newUserVote = null;
        } else if (post.userVote === 'up') {
          newVotes -= 2;
          newUserVote = 'down';
        } else {
          newVotes -= 1;
          newUserVote = 'down';
        }

        return { ...post, votes: newVotes, userVote: newUserVote };
      }),
    );
  };

  const addComment = (postId, content, parentId) => {
    const newComment = {
      id: Math.random().toString(36).slice(2, 11),
      author: 'current_user',
      content,
      timestamp: 'just now',
      votes: 1,
      replies: [],
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== postId) return post;

        const updateComments = (comments) => {
          if (!parentId) return [newComment, ...comments];
          return comments.map((comment) => {
            if (comment.id === parentId) {
              return { ...comment, replies: [newComment, ...comment.replies] };
            }
            return { ...comment, replies: updateComments(comment.replies) };
          });
        };

        const comments = updateComments(post.comments);
        return {
          ...post,
          comments,
          commentCount: post.commentCount + 1,
        };
      }),
    );
  };

  const goHome = () => {
    setSelectedCategory(null);
    setCurrentView('forum');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-reddit-bg-dark text-reddit-text-dark' : 'bg-reddit-bg-light text-gray-900'}`}>
      <Navbar
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        onOpenLogin={() => {
          setAuthType('login');
          setIsAuthModalOpen(true);
        }}
        onOpenSignup={() => {
          setAuthType('signup');
          setIsAuthModalOpen(true);
        }}
        onGoHome={goHome}
      />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} isDarkMode={isDarkMode} type={authType} />

      <div className="max-w-7xl mx-auto flex gap-6 px-4 py-5">
        <LeftSidebar
          currentView={currentView}
          selectedCategory={selectedCategory}
          setCurrentView={setCurrentView}
          setSelectedCategory={setSelectedCategory}
          isDarkMode={isDarkMode}
          categories={CATEGORIES}
        />

        <main className="flex-1 min-w-0">
          {currentView === 'forum' && (
            <ForumView
              isDarkMode={isDarkMode}
              sortBy={sortBy}
              setSortBy={setSortBy}
              filteredPosts={filteredPosts}
              handleVote={handleVote}
              setSelectedPost={setSelectedPost}
              categories={CATEGORIES}
            />
          )}
          {currentView === 'resources' && <ResourcesView isDarkMode={isDarkMode} />}
          {currentView === 'calendar' && <CalendarView isDarkMode={isDarkMode} />}
          {currentView === 'complaints' && <ComplaintsView isDarkMode={isDarkMode} />}
        </main>

        <RightSidebar isDarkMode={isDarkMode} categories={CATEGORIES} onStartThread={() => setIsCreateModalOpen(true)} />
      </div>

      <CreatePostModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} isDarkMode={isDarkMode} categories={CATEGORIES} />

      <PostDetailModal
        selectedPost={selectedPost}
        onClose={() => setSelectedPost(null)}
        isDarkMode={isDarkMode}
        onAddComment={addComment}
        categories={CATEGORIES}
      />
    </div>
  );
}
