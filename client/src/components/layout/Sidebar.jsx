export const Sidebar = ({ items = [], activeId, onNavigate }) => (
  <aside className="sidebar">
    <nav aria-label="Workspace navigation">
      {items.map((item) => (
        <button
          className={item.id === activeId ? 'active' : ''}
          aria-current={item.id === activeId ? 'page' : undefined}
          key={item.id}
          onClick={() => onNavigate?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  </aside>
);

export default Sidebar;

