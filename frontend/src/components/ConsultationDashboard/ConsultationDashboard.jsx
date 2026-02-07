import styles from './ConsultationDashboard.module.css';

export default function ConsultationDashboard({ transcript, keyPoints, prescription, summary }) {
  return (
    <div className={styles.resultsGrid}>
      {/* Transcript */}
      {transcript && (
        <div className={styles.resultCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>📝</span>
            <h3>Conversation Transcript</h3>
          </div>
          <div className={styles.cardContent}>
            <pre className={styles.transcript}>{transcript}</pre>
          </div>
        </div>
      )}

      {/* Key Points */}
      {keyPoints && (
        <div className={styles.resultCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>🔍</span>
            <h3>Key Points Identified</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.keypointsGrid}>
              {keyPoints.symptoms?.length > 0 && (
                <div className={styles.keypointSection}>
                  <h4>Symptoms</h4>
                  <ul>
                    {keyPoints.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {keyPoints.diagnosis?.length > 0 && (
                <div className={styles.keypointSection}>
                  <h4>Diagnosis</h4>
                  <ul>
                    {keyPoints.diagnosis.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              {keyPoints.allergies?.length > 0 && (
                <div className={styles.keypointSection}>
                  <h4>Allergies</h4>
                  <ul>
                    {keyPoints.allergies.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}
              {keyPoints.notes?.length > 0 && (
                <div className={styles.keypointSection}>
                  <h4>Notes</h4>
                  <ul>
                    {keyPoints.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prescription */}
      {prescription && (prescription.medicines?.length > 0 || prescription.instructions?.length > 0) && (
        <div className={styles.resultCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>💊</span>
            <h3>Generated Prescription</h3>
            <div className={styles.cardActions}>
              <button className={styles.actionBtn}>Print</button>
            </div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.prescription}>
              <div className={styles.rxHeader}>
                <span className={styles.rxSymbol}>℞</span>
                <div className={styles.rxInfo}>
                  {prescription.date && <span>Date: {prescription.date}</span>}
                  {prescription.patientName && <span>Patient: {prescription.patientName}</span>}
                </div>
              </div>
              {prescription.medicines?.length > 0 && (
                <div className={styles.medicines}>
                  <h4>Medicines Prescribed</h4>
                  {prescription.medicines.map((med, i) => (
                    <div key={i} className={styles.medicineItem}>
                      <span className={styles.medNumber}>{i + 1}</span>
                      <div className={styles.medInfo}>
                        <strong>{med.name}</strong>
                        <span>{med.dosage} - {med.frequency} for {med.duration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {prescription.instructions?.length > 0 && (
                <div className={styles.instructions}>
                  <h4>Instructions</h4>
                  <ul>
                    {prescription.instructions.map((inst, i) => (
                      <li key={i}>{inst}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (summary.chiefComplaint || summary.history || summary.assessment?.length > 0 || summary.plan?.length > 0) && (
        <div className={styles.resultCard}>
          <div className={styles.cardHeader}>
            <span className={styles.cardIcon}>📄</span>
            <h3>Visit Summary</h3>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.summary}>
              {summary.chiefComplaint && (
                <div className={styles.summarySection}>
                  <h5>Chief Complaint</h5>
                  <p>{summary.chiefComplaint}</p>
                </div>
              )}
              {summary.history && (
                <div className={styles.summarySection}>
                  <h5>History</h5>
                  <p>{summary.history}</p>
                </div>
              )}
              {summary.assessment?.length > 0 && (
                <div className={styles.summarySection}>
                  <h5>Assessment</h5>
                  {summary.assessment.map((a, i) => (
                    <div key={i} className={styles.assessmentItem}>
                      <span className={styles.icdCode}>{a.code}</span>
                      <span>{a.description}</span>
                    </div>
                  ))}
                </div>
              )}
              {summary.plan?.length > 0 && (
                <div className={styles.summarySection}>
                  <h5>Treatment Plan</h5>
                  <ul>
                    {summary.plan.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
