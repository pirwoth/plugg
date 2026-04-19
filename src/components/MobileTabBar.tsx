import { Home, Search, Heart, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface MobileTabBarProps {
  /** Kept for API compatibility; tab bar is always pinned to the bottom now. */
  offsetForPlayer?: boolean;
}

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Search", path: "/search" },
  { icon: Heart, label: "Favourites", path: "/favorites" },
  { icon: User, label: "Profile", path: "/account" },
];

const MobileTabBar = (_: MobileTabBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur border-t border-border"
      aria-label="Primary"
    >
      <ul className="max-w-lg mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map(({ icon: Icon, label, path }) => {
          const active = location.pathname === path;
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
                <Icon size={24} fill={active ? "currentColor" : "none"} strokeWidth={active ? 2 : 1.75} />
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileTabBar;
