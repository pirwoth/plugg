import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onSearch: () => void;
  onRefresh: () => void;
  onOpenFavorites?: () => void;
}

const Header = ({ onRefresh }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-50">
      <button
        onClick={onRefresh}
        className="font-display text-2xl font-bold tracking-tight text-foreground lowercase"
        aria-label="Refresh feed"
      >
        plugg
      </button>
      <button
        onClick={() => navigate("/settings")}
        className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>
    </header>
  );
};

export default Header;
