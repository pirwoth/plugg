interface FeedTabsProps {
  active: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "local", label: "🇺🇬 Local" },
  { id: "trending", label: "🔥 Trending" },
  { id: "new", label: "🆕 New" },
];

const FeedTabs = ({ active, onTabChange }: FeedTabsProps) => {
  return (
    <div className="flex border-b border-border bg-card sticky top-0 z-40">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            active === tab.id
              ? "text-primary"
              : "text-muted-foreground"
          }`}
        >
          {tab.label}
          {active === tab.id && (
            <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default FeedTabs;
