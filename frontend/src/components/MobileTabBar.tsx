import { Home, Search, Heart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

interface MobileTabBarProps {
  offsetForPlayer?: boolean;
}

const MobileTabBar = (_: MobileTabBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();

  const tabs = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: Heart, label: "Favourites", path: "/favorites" },
    { icon: User, label: "Profile", path: "/account" },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border"
      aria-label="Primary"
    >
      <ul className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
          const isProfile = path === "/account";

          return (
            <li key={path} className="flex-1">
              <button
                onClick={() => navigate(path)}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`w-full flex items-center justify-center py-2 rounded-full transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isProfile && user ? (
                  <div className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-colors ${active ? "border-primary" : "border-muted-foreground/40"}`}>
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name ?? "Profile"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                        <User size={14} className="text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <Icon size={24} fill={active ? "currentColor" : "none"} strokeWidth={active ? 2 : 1.75} />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileTabBar;
