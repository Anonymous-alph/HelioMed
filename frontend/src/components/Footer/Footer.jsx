import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerBrand}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>⚕</div>
            Helio Med
          </div>
          <p>
            AI-powered healthcare platform committed to delivering exceptional
            care through innovative technology and compassionate service.
          </p>
        </div>

        <div className={styles.footerLinks}>
          <h4>Platform</h4>
          <ul>
            <li><Link to="/consultation">AI Consultation</Link></li>
            <li><Link to="/query-bot">Query Bot</Link></li>
            <li><Link to="/store-locator">Store Locator</Link></li>
          </ul>
        </div>

        <div className={styles.footerLinks}>
          <h4>Legal</h4>
          <ul>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
            <li><a href="#">HIPAA Compliance</a></li>
          </ul>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} Helio Med. All rights reserved. HIPAA Compliant.</p>
      </div>
    </footer>
  );
}
