import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import Button from '../../components/Button';

export default function Home() {
  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.heroLabel}>Codefest-Winning Healthcare</div>
            <h1>Your Health, <span className={styles.highlight}>Reimagined</span></h1>
            <p className={styles.heroDescription}>
              Experience the perfect synthesis of medical expertise and personalized care.
              We combine artifical intelligence with individualized approaches to wellness,
              ensuring every patient receives truly <b><i>reimagined</i></b> healthcare.
            </p>
            <div className={styles.heroCta}>
              <Link to="/consultation">
                <Button variant="primary">Start Consultation</Button>
              </Link>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={`${styles.visualCard} ${styles.visualCard1}`}>
              <div className={styles.cardPreviewHeader}>
                <span className={styles.cardDot}></span>
                <span className={styles.cardDot}></span>
                <span className={styles.cardDot}></span>
              </div>
              <div className={styles.cardPreviewBody}>
                <span className={styles.cardPreviewIcon}>🎙️</span>
                <span className={styles.cardPreviewTitle}>AI Consultation</span>
                <div className={styles.cardPreviewWave}>
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className={styles.miniBar}></div>
                  ))}
                </div>
                <span className={styles.cardPreviewLabel}>Record & Transcribe</span>
              </div>
            </div>

            <div className={`${styles.visualCard} ${styles.visualCard2}`}>
              <div className={styles.cardPreviewHeader}>
                <span className={styles.cardDot}></span>
                <span className={styles.cardDot}></span>
                <span className={styles.cardDot}></span>
              </div>
              <div className={styles.cardPreviewBody}>
                <span className={styles.cardPreviewIcon}>💊</span>
                <span className={styles.cardPreviewTitle}>Prescription</span>
                <div className={styles.rxPreview}>
                  <span className={styles.rxSymbol}>&#8478;</span>
                  <div className={styles.rxLines}>
                    <div className={styles.rxLine}></div>
                    <div className={`${styles.rxLine} ${styles.rxLineShort}`}></div>
                    <div className={styles.rxLine}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`${styles.visualCard} ${styles.visualCard3}`}>
              <div className={styles.cardPreviewHeader}>
                <span className={styles.cardDot}></span>
                <span className={styles.cardDot}></span>
                <span className={styles.cardDot}></span>
              </div>
              <div className={styles.cardPreviewBody}>
                <span className={styles.cardPreviewIcon}>🤖</span>
                <span className={styles.cardPreviewTitle}>Query Bot</span>
                <div className={styles.chatPreview}>
                  <div className={`${styles.chatBubble} ${styles.chatUser}`}>How do I...</div>
                  <div className={`${styles.chatBubble} ${styles.chatBot}`}>Here's what I suggest</div>
                </div>
              </div>
            </div>

            <div className={`${styles.floatingElement} ${styles.floatingStat}`}>
              <span className={styles.statNumber}>98%</span>
              <span className={styles.statLabel}>Patient Satisfaction</span>
            </div>

            <div className={`${styles.floatingElement} ${styles.floatingBadge}`}>
              <div className={styles.badgeIcon}>🏆</div>
              <div className={styles.badgeText}>Top-Rated<br />Facility 2025</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Marquee */}
      <div className={styles.featuresMarquee}>
        <div className={styles.marqueeContent}>
          <div className={styles.marqueeItem}>Helio Med</div>
          <div className={styles.marqueeItem}>Your Health, Reimagined</div>
          <div className={styles.marqueeItem}>Helio Med</div>
          <div className={styles.marqueeItem}>Your Health, Reimagined</div>
          <div className={styles.marqueeItem}>Helio Med</div>
          <div className={styles.marqueeItem}>Your Health, Reimagined</div>
          <div className={styles.marqueeItem}>Helio Med</div>
          <div className={styles.marqueeItem}>Your Health, Reimagined</div>
          <div className={styles.marqueeItem}>Helio Med</div>
          <div className={styles.marqueeItem}>Your Health, Reimagined</div>
        </div>
      </div>

      {/* About Section */}
      <section className={styles.about}>
        <div className={styles.aboutContent}>
          <div className={styles.sectionIntro}>
            <div className={styles.sectionLabel}>About Helio Med</div>
            <h2 className={styles.sectionTitle}>Where Compassion Meets Innovation</h2>
          </div>
          <p className={styles.aboutDescription}>
            At Helio Med, we believe that exceptional healthcare goes beyond treatments and procedures.
            Our mission is to provide a sanctuary where patients feel valued, heard, and empowered on
            their journey to wellness. With a team of world-class medical professionals and access to
            the latest advancements in medical technology, we are dedicated to delivering personalized
            care that addresses the unique needs of each individual.
          </p>
          <ul className={styles.aboutFeatures}>
            <li>State-of-the-art facilities designed for comfort and healing</li>
            <li>Multidisciplinary approach ensuring comprehensive care</li>
            <li>Commitment to ongoing research and medical innovation</li>
            <li>Focus on preventive care and long-term wellness</li>
          </ul>
        </div>
      </section>

      <hr className={styles.divider} />

      {/* Services Grid - Our Medical Services */}
      <section className={styles.services}>
        <div className={styles.container}>
          <div className={styles.sectionIntroCenter}>
            <div className={styles.sectionLabel}>Comprehensive Care</div>
            <h2 className={styles.sectionTitle}>Our Medical Services</h2>
            <p className={styles.sectionDescription}>
              From inquiry responses to personal assistance, we offer a full spectrum of medical services designed to support your health at every stage.
            </p>
          </div>

          <div className={styles.servicesGrid}>
            <div className={styles.serviceCard}>
              <span className={styles.serviceIcon}>📍</span>
              <h3 className={styles.serviceTitle}>Store Locator</h3>
              <p className={styles.serviceDescription}>
                Upload your prescription, and instantly see the closest available pharmacies to pick it up.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <span className={styles.serviceIcon}>💊</span>
              <h3 className={styles.serviceTitle}>Prescription Inquiries</h3>
              <p className={styles.serviceDescription}>
                Our AI assistant clarifies any doubts regarding your prescription, like dosage amounts and timings.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <span className={styles.serviceIcon}>🎙️</span>
              <h3 className={styles.serviceTitle}>Doctor Conversation Recorder</h3>
              <p className={styles.serviceDescription}>
                Record your interaction with a medical professional, and our AI powered tool provides a summary of diagnosis, treatment options, prescriptions by the doctor, and future plans.
              </p>
            </div>

            <div className={styles.serviceCard}>
              <span className={styles.serviceIcon}>🔬</span>
              <h3 className={styles.serviceTitle}>Drug Image Detector</h3>
              <p className={styles.serviceDescription}>
                Upload an image of your medication, and our AI detection service will identify it and break it down so you can understand the chemicals involved, how they work, and possible side effects to be mindful of.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>1+</span>
            <span className={styles.statLabelStats}>Patients Treated Annually</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>100%</span>
            <span className={styles.statLabelStats}>Success Rate</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>24</span>
            <span className={styles.statLabelStats}>Hours of Excellence</span>
          </div>
        </div>
      </section>
    </div>
  );
}
