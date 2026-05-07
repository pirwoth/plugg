import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

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
        <span className="text-2xl font-bold tracking-tight text-foreground">plugg</span>
      </button>
    </header>
  );
};

export default Header;
