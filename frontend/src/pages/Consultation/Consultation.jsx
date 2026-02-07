import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './Consultation.module.css';
import Button from '../../components/Button';
import ConsentModal from '../../components/ConsentModal';
import ConsultationDashboard from '../../components/ConsultationDashboard';
import { useRecording } from '../../hooks/useRecording';
import { api } from '../../services/api';

const STEPS = ['Record', 'Process', 'Review'];
const ACCEPTED_AUDIO_TYPES = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/x-m4a', 'audio/aac'];

export default function Consultation() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [consultationId, setConsultationId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef(null);

  const {
    isRecording,
    isPaused,
    audioBlob,
    setAudioBlob,
    formattedDuration,
    error: recordingError,
    setError,
    hasConsent,
    grantConsent,
    startRecording,
    stopRecording,
    resetRecording
  } = useRecording();

  // Process an audio blob (from recording or file upload)
  const processAudio = async (blob, fileName) => {
    setCurrentStep(1);
    setProcessing(true);

    try {
      const response = await api.transcribe(blob, null, fileName);
      setResults(response);
      setConsultationId(response.consultation_id);
      setCurrentStep(2);
    } catch (error) {
      console.error('Error processing audio:', error);
      alert('Failed to process audio. Please try again.');
      setCurrentStep(0);
    } finally {
      setProcessing(false);
    }
  };

  // Handle recording start
  const handleStartRecording = async () => {
    if (!hasConsent) {
      setShowConsentModal(true);
      return;
    }
    await startRecording();
  };

  // Handle consent acceptance
  const handleConsentAccept = async () => {
    grantConsent();
    setShowConsentModal(false);
    await startRecording();
  };

  // Handle recording stop and process
  const handleStopRecording = async () => {
    const blob = await stopRecording();
    if (blob) {
      await processAudio(blob, 'recording.webm');
    }
  };

  // Validate and process an audio file
  const handleAudioFile = (file) => {
    if (!file) return;

    const isAudio = file.type.startsWith('audio/') || ACCEPTED_AUDIO_TYPES.includes(file.type);
    if (!isAudio) {
      setError('Please upload an audio file (MP3, WAV, WebM, MP4, OGG, AAC).');
      return;
    }

    // 25MB limit (matches backend client_max_body_size)
    if (file.size > 25 * 1024 * 1024) {
      setError('File too large. Maximum size is 25MB.');
      return;
    }

    if (!hasConsent) {
      // Store the file for after consent
      setAudioBlob(file);
      setUploadedFileName(file.name);
      setShowConsentModal(true);
      return;
    }

    setUploadedFileName(file.name);
    setAudioBlob(file);
    processAudio(file, file.name);
  };

  // Handle consent for file upload flow
  const handleConsentAcceptForFile = () => {
    grantConsent();
    setShowConsentModal(false);
    if (audioBlob && uploadedFileName) {
      processAudio(audioBlob, uploadedFileName);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    const file = e.dataTransfer.files?.[0];
    handleAudioFile(file);
  };

  const handleFileSelect = (e) => {
    setError(null);
    const file = e.target.files?.[0];
    handleAudioFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  // New recording
  const handleNewRecording = () => {
    resetRecording();
    setResults(null);
    setUploadedFileName(null);
    setConsultationId(null);
    setSaving(false);
    setSaved(false);
    setCurrentStep(0);
  };

  const handleSaveToRecords = async () => {
    if (!consultationId || !results) return;
    setSaving(true);
    try {
      const notesParts = [];
      if (results.summary?.chiefComplaint) {
        notesParts.push(`Chief Complaint: ${results.summary.chiefComplaint}`);
      }
      if (results.keyPoints?.diagnosis?.length) {
        notesParts.push(`Diagnosis: ${results.keyPoints.diagnosis.join(', ')}`);
      }
      if (results.prescription?.medicines?.length) {
        const meds = results.prescription.medicines
          .map(m => `${m.name} ${m.dosage} - ${m.frequency} for ${m.duration}`)
          .join('; ');
        notesParts.push(`Medicines: ${meds}`);
      }
      if (results.summary?.plan?.length) {
        notesParts.push(`Plan: ${results.summary.plan.join('; ')}`);
      }
      await api.saveConsultationNotes(consultationId, notesParts.join('\n'));
      setSaved(true);
    } catch (error) {
      console.error('Error saving notes:', error);
      alert('Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.consultation}>
      {/* Page Header */}
      <section className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.breadcrumb}>
            <span>Services</span>
            <span>/</span>
            <span>AI Consultation</span>
          </div>
          <h1>AI-Powered <span className={styles.highlight}>Consultation Recording</span></h1>
          <p className={styles.headerDescription}>
            Record doctor-patient conversations or upload audio files and let AI generate prescriptions and summaries
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className={styles.interface}>
        <div className={styles.container}>
          {/* Step Indicator */}
          <div className={styles.stepIndicator}>
            {STEPS.map((step, index) => (
              <div key={step} className={styles.stepWrapper}>
                <div className={`${styles.step} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}>
                  <div className={styles.stepNumber}>
                    {index < currentStep ? '\u2713' : index + 1}
                  </div>
                  <span>{step}</span>
                </div>
                {index < STEPS.length - 1 && <div className={styles.stepLine}></div>}
              </div>
            ))}
          </div>

          {/* Step 1: Recording */}
          {currentStep === 0 && (
            <div className={styles.recordingSection}>
              <div
                className={`${styles.recordingCard} ${dragActive ? styles.dragActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Drag overlay */}
                {dragActive && (
                  <div className={styles.dragOverlay}>
                    <div className={styles.dragContent}>
                      <span className={styles.dragIcon}>📁</span>
                      <p>Drop audio file here</p>
                    </div>
                  </div>
                )}

                <div className={styles.recordingIcon}>
                  <div className={`${styles.micCircle} ${isRecording ? styles.recording : ''}`}>
                    <span>🎙️</span>
                  </div>
                  {isRecording && (
                    <div className={styles.pulseRings}>
                      <div className={styles.ring}></div>
                      <div className={styles.ring}></div>
                      <div className={styles.ring}></div>
                    </div>
                  )}
                </div>

                <h2>Record Consultation</h2>
                <p className={styles.recordingDesc}>
                  {isRecording
                    ? 'Recording in progress...'
                    : 'Click the button below to start recording or drag & drop an audio file'}
                </p>

                <div className={styles.timerDisplay}>
                  <span className={styles.timer}>{formattedDuration}</span>
                </div>

                <div className={styles.waveformContainer}>
                  <div className={`${styles.waveform} ${isRecording ? styles.active : ''}`}>
                    {Array(20).fill(0).map((_, i) => (
                      <div key={i} className={styles.waveBar}></div>
                    ))}
                  </div>
                </div>

                <div className={styles.recordingControls}>
                  {!isRecording ? (
                    <>
                      <Button variant="primary" onClick={handleStartRecording}>
                        ● Start Recording
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        📁 Upload Audio
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={handleStopRecording}
                      className={styles.stopBtn}
                    >
                      ■ Stop Recording
                    </Button>
                  )}
                </div>

                {!isRecording && (
                  <p className={styles.dropHint}>
                    or drag & drop an audio file (MP3, WAV, WebM, MP4, OGG)
                  </p>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {recordingError && (
                  <div className={styles.errorMessage}>{recordingError}</div>
                )}

                <div className={styles.consentReminder}>
                  {hasConsent ? (
                    <span className={styles.consentGranted}>✓ Patient consent obtained</span>
                  ) : (
                    <span className={styles.consentRequired}>
                      ⚠ Patient consent required before recording
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {currentStep === 1 && (
            <div className={styles.processingSection}>
              <div className={styles.processingCard}>
                <div className={styles.processingAnimation}>
                  <div className={styles.processingCircle}>
                    <div className={styles.spinnerRing}></div>
                    <span className={styles.aiIcon}>🤖</span>
                  </div>
                </div>
                <h3>AI Processing</h3>
                <p>Analyzing conversation and generating results...</p>
                <div className={styles.processingSteps}>
                  <div className={`${styles.processStep} ${styles.done}`}>
                    <span className={styles.check}>✓</span>
                    Transcribing audio
                  </div>
                  <div className={`${styles.processStep} ${styles.activeStep}`}>
                    <div className={styles.miniSpinner}></div>
                    Extracting key information
                  </div>
                  <div className={styles.processStep}>
                    <span className={styles.pending}>○</span>
                    Generating prescription
                  </div>
                  <div className={styles.processStep}>
                    <span className={styles.pending}>○</span>
                    Creating summary
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === 2 && results && (
            <div className={styles.resultsSection}>
              <ConsultationDashboard
                transcript={results.transcript}
                keyPoints={results.keyPoints}
                prescription={results.prescription}
                summary={results.summary}
              />

              <div className={styles.finalActions}>
                <Button variant="secondary" onClick={handleNewRecording}>
                  New Recording
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveToRecords}
                  disabled={saving || saved}
                >
                  {saved ? 'Saved to Records' : saving ? 'Saving...' : 'Confirm & Save to Records'}
                </Button>
                {consultationId && (
                  <Link to={`/my-consultations?id=${consultationId}`} className={styles.viewLink}>
                    View in My Consultations
                  </Link>
                )}
              </div>
              {saved && (
                <div className={styles.saveSuccess}>
                  Consultation notes saved successfully.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ConsentModal
        isOpen={showConsentModal}
        onAccept={uploadedFileName ? handleConsentAcceptForFile : handleConsentAccept}
        onDecline={() => {
          setShowConsentModal(false);
          setUploadedFileName(null);
        }}
      />
    </div>
  );
}
