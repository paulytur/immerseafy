type AdminFilterTabsProps = {
  tabs: { value: string; label: string; href: string; count?: number }[];
  active: string;
};

export default function AdminFilterTabs({ tabs, active }: AdminFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2 rounded-xl border border-teal/15 bg-ocean-mid/30 p-1.5">
      {tabs.map((tab) => (
        <a
          key={tab.value}
          href={tab.href}
          data-active={active === tab.value}
          className="admin-filter-tab inline-flex items-center gap-2"
        >
          {tab.label}
          {tab.count != null && tab.count > 0 ? (
            <span className="admin-filter-tab-count">{tab.count}</span>
          ) : null}
        </a>
      ))}
    </div>
  );
}
