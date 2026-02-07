import { useState } from 'react';
import styles from './ConsentModal.module.css';
import Button from '../Button';

export default function ConsentModal({ isOpen, onAccept, onDecline }) {
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.icon}>🎙️</span>
          <h2>Recording Consent Required</h2>
        </div>

        <div className={styles.content}>
          <p>
            Before we begin recording, please confirm that you have obtained the patient's
            explicit consent to record this consultation.
          </p>

          <div className={styles.requirements}>
            <h4>Recording Requirements:</h4>
            <ul>
              <li>Patient must be informed that the consultation will be recorded</li>
              <li>Patient understands the recording will be used for AI-assisted prescription generation</li>
              <li>Recording will be processed securely and in compliance with HIPAA regulations</li>
              <li>Patient has the right to request deletion of their recording at any time</li>
            </ul>
          </div>

          <label className={styles.checkbox}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>I confirm that patient consent has been obtained for this recording</span>
          </label>
        </div>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onDecline}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={onAccept}
            disabled={!agreed}
          >
            Proceed with Recording
          </Button>
        </div>
      </div>
    </div>
  );
}
