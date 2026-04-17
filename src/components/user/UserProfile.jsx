import { Badge, Button } from '../ui';
import { Mail, Calendar, MessageCircle, UserCheck, Users } from 'lucide-react';
import PostCard from '../posts/PostCard';

export default function UserProfile({ user, isDarkMode = false, onClose = null, posts = [] }) {
  return (
    <div className={`${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'} overflow-hidden rounded-3xl border`}>
      {/* Header Background */}
      <div className={`h-24 ${user.role === 'alumni' ? 'bg-amber-500' : 'bg-sky-500'}`} />

      {/* Profile Content */}
      <div className="px-6 pb-6">
        {/* Avatar and basic info */}
        <div className="flex items-end gap-4 -mt-12 mb-6">
          <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 ${isDarkMode ? 'border-slate-950' : 'border-white'} ${user.role === 'alumni' ? 'bg-amber-500' : 'bg-sky-500'} text-4xl font-bold text-white`}>
            {user.name[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-sm opacity-60">{user.email}</p>
          </div>
          <Button variant="primary" isDarkMode={isDarkMode}>
            Follow
          </Button>
        </div>

        {/* Role and Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <Badge variant={user.role === 'alumni' ? 'alumni' : 'student'} size="md">
              {user.role === 'alumni' ? '👨‍🎓 Alumni' : '📚 Student'}
            </Badge>
            <p className="text-xs opacity-60 mt-2">Joined {user.joinDate}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{user.postCount || 5}</p>
            <p className="text-xs opacity-60">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{user.commentCount || 12}</p>
            <p className="text-xs opacity-60">Comments</p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-6">
            <p className="text-sm leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Contact and details */}
        <div className="space-y-2 mb-6 text-sm">
          <div className="flex items-center gap-2 opacity-70">
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2 opacity-70">
            <Calendar className="w-4 h-4" />
            <span>Joined {user.joinDate}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mb-6">
          <Button variant="primary" isDarkMode={isDarkMode} className="flex-1 flex items-center justify-center gap-2">
            <MessageCircle className="w-4 h-4" /> Message
          </Button>
          <Button variant="secondary" isDarkMode={isDarkMode} className="flex-1 flex items-center justify-center gap-2">
            <Users className="w-4 h-4" /> View Posts
          </Button>
        </div>

        {/* Recent posts */}
        {posts && posts.length > 0 && (
          <div className="border-t dark:border-reddit-border-dark pt-6">
            <h3 className="text-lg font-bold mb-4">Recent Posts</h3>
            <div className="space-y-3">
              {posts.slice(0, 3).map((post) => (
                <div
                  key={post.id}
                  className={`p-3 rounded ${isDarkMode ? 'bg-reddit-bg-dark' : 'bg-gray-50'} cursor-pointer hover:opacity-70 transition-opacity`}
                >
                  <p className="text-sm font-medium line-clamp-2">{post.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs opacity-60">
                    <span>{post.votes} upvotes</span>
                    <span>{post.commentCount} comments</span>
                    <span>{post.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
