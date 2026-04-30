import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  onSearch: () => void;
  onRefresh: () => void;
  onOpenFavorites?: () => void;
}

const Header = ({ onRefresh }: HeaderProps) => {
  const navigate = useNavigate();

  return (
    <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-background border-b border-border/50 sticky top-0 z-50">
      <button
        onClick={onRefresh}
        className="flex items-center"
        aria-label="Plugg Home"
      >
        <img src="/logo.png" alt="plugg" className="h-6 w-auto opacity-90" />
      </button>
    </header>
  );
};

export default Header;
