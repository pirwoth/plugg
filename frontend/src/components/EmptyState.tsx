import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, action, className = "" }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center text-center px-8 py-16 gap-3 ${className}`}>
    <div className="relative">
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }}
      />
      <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary border border-border flex items-center justify-center">
        <Icon size={28} className="text-primary" strokeWidth={1.75} />
      </div>
    </div>
    <p className="text-sm font-semibold text-foreground mt-1">{title}</p>
    {description && (
      <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">{description}</p>
    )}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
