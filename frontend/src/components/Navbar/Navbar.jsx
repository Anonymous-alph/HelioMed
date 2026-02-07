import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navContainer}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>&#9877;</div>
          Helio Med
        </Link>

        <div className={styles.navLinks}>
          <NavLink
            to="/"
            className={({ isActive }) => isActive ? styles.active : ''}
          >
            Home
          </NavLink>

          {isAuthenticated && (
            <div className={styles.navDropdown}>
              <span className={styles.dropdownToggle}>
                Services <span className={styles.dropdownArrow}>&#9660;</span>
              </span>
              <div className={styles.dropdownMenu}>
                <Link to="/consultation">New Consultation</Link>
                <Link to="/scan-prescription">Scan Prescription</Link>
                <Link to="/my-consultations">My Consultations</Link>
                <Link to="/store-locator">Store Locator</Link>
                <Link to="/query-bot">Query Bot</Link>
              </div>
            </div>
          )}

          {isAuthenticated ? (
            <button onClick={handleLogout} className={styles.navCta}>
              {user?.name && <span>{user.name} &middot; </span>}Logout
            </button>
          ) : (
            <NavLink to="/login" className={styles.navCta}>
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
