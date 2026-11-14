export const Navbar = ({ children }) => (
  <nav className="navbar" aria-label="Account navigation">
    <div className="navbar-brand">DropPilot</div>
    <div className="navbar-links">{children}</div>
  </nav>
);

export default Navbar;

