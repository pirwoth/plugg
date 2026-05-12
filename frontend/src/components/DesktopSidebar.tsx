import { Home, Search, Heart, User, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface DesktopSidebarProps {
  onSearch: () => void;
  onOpenFavorites: () => void;
  onRefresh: () => void;
}

const DesktopSidebar = ({ onSearch, onOpenFavorites, onRefresh }: DesktopSidebarProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Listener";

  const items = [
    { icon: Home, label: "Home", onClick: onRefresh, active: pathname === "/" },
    { icon: Search, label: "Search", onClick: onSearch, active: pathname === "/search" },
    { icon: Heart, label: "Favourites", onClick: onOpenFavorites, active: pathname === "/favorites" },
    { icon: User, label: "Profile", onClick: () => router.push("/account"), active: pathname === "/account" },
    { icon: Settings, label: "Settings", onClick: () => router.push("/settings"), active: pathname === "/settings" },
  ];

  return (
    <aside className="sticky top-0 h-screen flex flex-col py-4 pr-2">
      <button
        onClick={onRefresh}
        className="flex items-center px-3 py-2 mb-4 self-start"
        aria-label="Plugg home"
      >
        <span className="text-2xl font-bold tracking-tight text-foreground">plugg</span>
      </button>

      <nav className="flex flex-col gap-1">
        {items.map(({ icon: Icon, label, onClick, active }) => {
          const isProfileTab = label === "Profile";
          return (
            <button
              key={label}
              onClick={onClick}
              className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-secondary transition-colors self-start ${
                active ? "text-primary font-semibold" : "text-foreground"
              }`}
            >
              {isProfileTab && user ? (
                <div className={`w-5 h-5 rounded-full overflow-hidden border transition-colors ${active ? "border-primary" : "border-foreground/20"}`}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                      <User size={12} className="text-primary" />
                    </div>
                  )}
                </div>
              ) : (
                <Icon size={22} />
              )}
              <span className="text-base hidden xl:inline">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Guest button remains at bottom, but user info is now in nav */}
      {!user && (
        <button
          onClick={() => router.push("/auth")}
          className="mt-4 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity self-start"
        >
          <span className="hidden xl:inline">Sign in</span>
          <span className="xl:hidden">In</span>
        </button>
      )}
    </aside>
  );
};

export default DesktopSidebar;
