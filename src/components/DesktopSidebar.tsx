import { Home, Search, Heart, User, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

interface DesktopSidebarProps {
  onSearch: () => void;
  onOpenFavorites: () => void;
  onRefresh: () => void;
}

const DesktopSidebar = ({ onSearch, onOpenFavorites, onRefresh }: DesktopSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { icon: Home, label: "Home", onClick: onRefresh, active: location.pathname === "/" },
    { icon: Search, label: "Search", onClick: onSearch, active: location.pathname === "/search" },
    { icon: Heart, label: "Favourites", onClick: onOpenFavorites, active: location.pathname === "/favorites" },
    { icon: User, label: "Profile", onClick: () => navigate("/account"), active: location.pathname === "/account" },
    { icon: Settings, label: "Settings", onClick: () => navigate("/settings"), active: location.pathname === "/settings" },
  ];

  return (
    <aside className="sticky top-0 h-screen flex flex-col py-4 pr-2">
      <button
        onClick={onRefresh}
        className="flex items-center px-3 py-2 mb-4 self-start"
        aria-label="Plugg home"
      >
        <span className="font-display text-3xl font-bold tracking-tight text-foreground lowercase">
          plugg
        </span>
      </button>

      <nav className="flex flex-col gap-1">
        {items.map(({ icon: Icon, label, onClick, active }) => (
          <button
            key={label}
            onClick={onClick}
            className={`flex items-center gap-4 px-3 py-3 rounded-full hover:bg-secondary transition-colors self-start ${
              active ? "text-primary font-semibold" : "text-foreground"
            }`}
          >
            <Icon size={22} />
            <span className="text-base hidden xl:inline">{label}</span>
          </button>
        ))}
      </nav>

      <button
        onClick={() => navigate("/auth")}
        className="mt-4 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity self-start"
      >
        <span className="hidden xl:inline">Sign in</span>
        <span className="xl:hidden">In</span>
      </button>
    </aside>
  );
};

export default DesktopSidebar;
