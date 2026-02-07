import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styles from './MyConsultations.module.css';
import ConsultationDashboard from '../../components/ConsultationDashboard';
import { api } from '../../services/api';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function statusBadgeClass(status) {
  switch (status) {
    case 'completed': return styles.badgeCompleted;
    case 'chat': return styles.badgeChat;
    default: return styles.badgeDraft;
  }
}

export default function MyConsultations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');

  const [consultations, setConsultations] = useState([]);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load list
  useEffect(() => {
    api.getConsultations()
      .then(setConsultations)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Load detail when id changes
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    api.getConsultation(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  // Normalize detail data for ConsultationDashboard
  const dashboardProps = detail ? {
    transcript: detail.transcript || null,
    keyPoints: detail.key_points || null,
    prescription: detail.prescriptions?.[0] ? {
      medicines: detail.prescriptions[0].medicines || [],
      instructions: detail.prescriptions[0].instructions || [],
      date: detail.prescriptions[0].created_at ? formatDate(detail.prescriptions[0].created_at) : '',
    } : null,
    summary: detail.summary || null,
  } : null;

  const hasData = dashboardProps && (
    dashboardProps.transcript ||
    dashboardProps.keyPoints ||
    dashboardProps.prescription ||
    dashboardProps.summary
  );

  // Detail view
  if (selectedId) {
    return (
      <div className={styles.page}>
        <section className={styles.pageHeader}>
          <div className={styles.container}>
            <div className={styles.breadcrumb}>
              <Link to="/my-consultations">My Consultations</Link>
              <span>/</span>
              <span>Detail</span>
            </div>
            <h1>{detail?.title || 'Consultation Detail'}</h1>
            {detail && (
              <p className={styles.headerMeta}>
                {formatDate(detail.created_at)} &middot; <span className={statusBadgeClass(detail.status)}>{detail.status}</span>
              </p>
            )}
          </div>
        </section>

        <section className={styles.content}>
          <div className={styles.container}>
            {detailLoading ? (
              <div className={styles.loadingCard}>Loading consultation...</div>
            ) : detail ? (
              <>
                {hasData ? (
                  <ConsultationDashboard {...dashboardProps} />
                ) : (
                  <div className={styles.emptyDetail}>
                    <p>This consultation was created via chat and has no recorded audio data.</p>
                  </div>
                )}

                <div className={styles.detailActions}>
                  <Link to="/my-consultations" className={styles.backBtn}>
                    Back to Consultations
                  </Link>
                  <Link to={`/query-bot?consultation=${detail.id}`} className={styles.chatBtn}>
                    Chat about this
                  </Link>
                </div>
              </>
            ) : (
              <div className={styles.emptyDetail}>
                <p>Consultation not found.</p>
                <Link to="/my-consultations" className={styles.backBtn}>Back to Consultations</Link>
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // List view
  return (
    <div className={styles.page}>
      <section className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.breadcrumb}>
            <span>Services</span>
            <span>/</span>
            <span>My Consultations</span>
          </div>
          <h1>My <span className={styles.highlight}>Consultations</span></h1>
          <p className={styles.headerDescription}>
            Browse your past consultations, view analysis dashboards, and continue conversations.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.container}>
          {loading ? (
            <div className={styles.loadingCard}>Loading consultations...</div>
          ) : consultations.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>No consultations yet</h3>
              <p>Record your first consultation or start a chat to get started.</p>
              <div className={styles.emptyActions}>
                <Link to="/consultation" className={styles.chatBtn}>New Consultation</Link>
                <Link to="/query-bot" className={styles.backBtn}>Open Chat</Link>
              </div>
            </div>
          ) : (
            <div className={styles.consultationList}>
              {consultations.map((c) => (
                <Link
                  key={c.id}
                  to={`/my-consultations?id=${c.id}`}
                  className={styles.consultationCard}
                >
                  <div className={styles.cardTop}>
                    <h3>{c.title || 'Untitled Consultation'}</h3>
                    <span className={statusBadgeClass(c.status)}>{c.status}</span>
                  </div>
                  <div className={styles.cardBottom}>
                    <span className={styles.cardDate}>{formatDate(c.created_at)}</span>
                    {c.transcript && <span className={styles.cardTag}>Has transcript</span>}
                    {c.summary && <span className={styles.cardTag}>Has summary</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
