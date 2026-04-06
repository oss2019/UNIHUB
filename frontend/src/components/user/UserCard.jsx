import { Badge, Button } from '../ui';
import { MessageSquare, UserPlus } from 'lucide-react';

export default function UserCard({ author, role = 'student', isDarkMode = false, onClick = null, showStats = false }) {
  const roleColors = {
    alumni: 'alumni',
    student: 'student',
  };

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
    >
      {/* Avatar */}
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${role === 'alumni' ? 'bg-amber-500' : 'bg-sky-500'} text-sm font-bold text-white`}>
        {author[0].toUpperCase()}
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold truncate">{author}</span>
          <Badge variant={roleColors[role]} size="xs">
            {role === 'alumni' ? '👨‍🎓' : '📚'} {role === 'alumni' ? 'Alumni' : 'Student'}
          </Badge>
        </div>
        {showStats && <p className="text-xs opacity-60">5 posts • 12 comments</p>}
      </div>

      {/* Action buttons */}
      {showStats && (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" isDarkMode={isDarkMode} className="p-1">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button variant="primary" size="sm" isDarkMode={isDarkMode} className="p-1">
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
