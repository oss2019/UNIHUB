import { useStore } from "@/lib/store";
import { Modal } from "../Modal";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, GraduationCap } from "lucide-react";

export function AuthModal() {
  const { authOpen, setAuthOpen, user, login, logout } = useStore();

  return (
    <Modal open={authOpen} onClose={() => setAuthOpen(false)} title={user ? "Your profile" : "Welcome to PeerHive"} maxWidth="max-w-md">
      {user ? (
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-primary text-2xl font-bold text-primary-foreground">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="font-display font-bold text-lg">{user.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-secondary p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary" /> {user.branch} · Class of {user.graduationYear}</div>
            {user.bio && <p className="text-muted-foreground">{user.bio}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Joined" value={user.joinedSubForums.length} />
            <Stat label="Muted" value={user.mutedSubForums.length} />
            <Stat label="Role" value={user.role} />
          </div>
          <Button variant="outline" onClick={logout} className="w-full">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      ) : (
        <div className="p-6 space-y-5 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in with your institute Google account to post, comment and join subforums.
          </p>
          <Button onClick={login} className="w-full bg-gradient-primary text-primary-foreground border-0">
            Continue with Google
          </Button>
          <p className="text-[11px] text-muted-foreground">Demo mode — clicking signs you in instantly.</p>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="text-lg font-display font-bold">{value}</div>
      <div className="text-[11px] uppercase text-muted-foreground tracking-wider">{label}</div>
    </div>
  );
}
