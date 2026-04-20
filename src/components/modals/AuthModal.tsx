import { useUI } from "@/lib/uiStore";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Modal } from "../Modal";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, GraduationCap, ExternalLink } from "lucide-react";
import { authApi, API_BASE } from "@/lib/api";
import { meQuery, qk } from "@/lib/queries";
import { toast } from "sonner";

export function AuthModal() {
  const { authOpen, setAuthOpen } = useUI();
  const { data: user } = useQuery(meQuery());
  const qc = useQueryClient();

  const logoutMut = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      qc.setQueryData(qk.me, null);
      qc.invalidateQueries();
      setAuthOpen(false);
      toast.success("Signed out");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const goLogin = () => {
    // Browser redirect, NOT fetch — backend OAuth flow needs full navigation.
    window.location.href = authApi.googleUrl();
  };

  return (
    <Modal
      open={authOpen}
      onClose={() => setAuthOpen(false)}
      title={user ? "Your profile" : "Welcome to PeerHive"}
      maxWidth="max-w-md"
    >
      {user ? (
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              ) : (
                user.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="font-display font-bold text-lg truncate">{user.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5 truncate">
                <Mail className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>
          {(user.branch || user.graduationYear || user.bio) && (
            <div className="rounded-xl bg-secondary p-4 space-y-2 text-sm">
              {(user.branch || user.graduationYear) && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  {user.branch}
                  {user.branch && user.graduationYear ? " · " : ""}
                  {user.graduationYear ? `Class of ${user.graduationYear}` : ""}
                </div>
              )}
              {user.bio && <p className="text-muted-foreground">{user.bio}</p>}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Joined" value={user.joinedSubForums?.length ?? 0} />
            <Stat label="Muted" value={user.mutedSubForums?.length ?? 0} />
            <Stat label="Role" value={user.role} />
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMut.mutate()}
            disabled={logoutMut.isPending}
            className="w-full"
          >
            <LogOut className="h-4 w-4" /> {logoutMut.isPending ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      ) : (
        <div className="p-6 space-y-5 text-center">
          <p className="text-sm text-muted-foreground">
            Sign in with your <strong>@iitdh.ac.in</strong> Google account to post, comment and join
            subforums.
          </p>
          <Button
            onClick={goLogin}
            className="w-full bg-primary text-primary-foreground border-0"
          >
            <ExternalLink className="h-4 w-4" /> Continue with Google
          </Button>
          <p className="text-[11px] text-muted-foreground">
            You'll be redirected to Google, then back to PeerHive.
          </p>
          <p className="text-[11px] text-muted-foreground/70">API: {API_BASE}</p>
        </div>
      )}
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-secondary p-3">
      <div className="text-lg font-display font-bold capitalize">{value}</div>
      <div className="text-[11px] uppercase text-muted-foreground tracking-wider">{label}</div>
    </div>
  );
}
