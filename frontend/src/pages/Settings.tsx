import { ArrowLeft, Moon, Bell, Globe, Shield, LogOut, ChevronRight, Sun, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import AppShell from "@/components/AppShell";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const Toggle = ({ on, onChange, ariaLabel }: { on: boolean; onChange: () => void; ariaLabel?: string }) => (
  <button
    onClick={onChange}
    aria-pressed={on}
    aria-label={ariaLabel}
    className={`w-10 h-6 rounded-full transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ring-offset-2 ring-offset-background ${
      on ? "bg-primary" : "bg-secondary"
    }`}
  >
    <span
      className={`absolute top-0.5 block w-5 h-5 rounded-full bg-background transition-transform ${
        on ? "translate-x-[18px]" : "translate-x-0.5"
      }`}
    />
  </button>
);

const Settings = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  const themes = [
    { id: "light",  label: "Light",  icon: Sun },
    { id: "dark",   label: "Dark",   icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <AppShell
      title="Settings"
      titleLeading={
        <button onClick={() => navigate(-1)} className="p-1 text-muted-foreground hover:text-foreground" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
      }
    >
      <div className="divide-y divide-border">
        {/* Appearance */}
        <section className="px-5 py-5 space-y-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h3>

          <div>
            <p className="text-sm text-foreground mb-3">Theme</p>
            <div className="grid grid-cols-3 gap-2">
              {themes.map(({ id, label, icon: Icon }) => {
                const active = theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => setTheme(id)}
                    aria-pressed={active}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-colors ${
                      active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Reduce motion</span>
            <Toggle on={reducedMotion} onChange={() => setReducedMotion((m) => !m)} ariaLabel="Reduce motion" />
          </div>
        </section>

        {/* Notifications */}
        <section className="px-5 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Notifications</h3>
          <div className="flex items-center justify-between py-2">
            <span className="flex items-center gap-3 text-sm text-foreground">
              <Bell size={18} /> Push notifications
            </span>
            <Toggle on={notifications} onChange={() => setNotifications((n) => !n)} ariaLabel="Toggle push notifications" />
          </div>
        </section>

        {/* Account */}
        <section className="px-5 py-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Account</h3>

          <div className="py-2">
            <span className="flex items-center gap-3 text-sm text-foreground mb-2">
              <Globe size={18} /> Language
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold border border-primary text-primary bg-primary/10">
                English
              </span>
              <span className="text-xs text-muted-foreground">More languages coming soon</span>
            </div>
          </div>

          <button
            onClick={() => toast({ title: "Coming soon", description: "Privacy controls will be available shortly." })}
            className="w-full flex items-center justify-between py-3"
          >
            <span className="flex items-center gap-3 text-sm text-foreground">
              <Shield size={18} /> Privacy
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </section>

        {/* Danger */}
        <section className="px-5 py-5">
          <button
            onClick={() => toast({ title: "Signed out", description: "You are not signed in yet." })}
            className="w-full flex items-center gap-3 py-3 text-sm text-destructive"
          >
            <LogOut size={18} /> Sign out
          </button>
        </section>

        <p className="text-xs text-muted-foreground px-5 py-6">
          plugg © {new Date().getFullYear()} · v0.2
        </p>
      </div>
    </AppShell>
  );
};

export default Settings;
