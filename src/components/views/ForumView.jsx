import { Search } from 'lucide-react';
import PostCard from '../posts/PostCard';
import SortBar from '../posts/SortBar';

export default function ForumView({
  isDarkMode,
  sortBy,
  setSortBy,
  filteredPosts,
  handleVote,
  setSelectedPost,
  categories,
}) {
  return (
    <>
      <SortBar sortBy={sortBy} setSortBy={setSortBy} isDarkMode={isDarkMode} />

      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onVote={handleVote}
            onOpen={() => setSelectedPost(post)}
            isDarkMode={isDarkMode}
            categories={categories}
          />
        ))}
        {filteredPosts.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <Search className="w-16 h-16 mx-auto mb-4" />
            <p className="text-xl font-medium">No threads found</p>
          </div>
        )}
      </div>
    </>
  );
}
