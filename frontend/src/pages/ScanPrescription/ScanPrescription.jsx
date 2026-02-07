import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './ScanPrescription.module.css';
import Button from '../../components/Button';
import ConsultationDashboard from '../../components/ConsultationDashboard';
import { api } from '../../services/api';

const STEPS = ['Upload', 'Analyze', 'Results'];
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export default function ScanPrescription() {
  const [currentStep, setCurrentStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [consultationId, setConsultationId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const processImage = async (file) => {
    setCurrentStep(1);
    setProcessing(true);
    setError(null);

    try {
      const response = await api.scanPrescriptionImage(file);
      setResults(response);
      setConsultationId(response.consultation_id);
      setCurrentStep(2);
    } catch (err) {
      console.error('Error analyzing image:', err);
      setError(err.message || 'Failed to analyze image. Please try again.');
      setCurrentStep(0);
    } finally {
      setProcessing(false);
    }
  };

  const handleImageFile = (file) => {
    if (!file) return;

    const isImage = file.type.startsWith('image/') || ACCEPTED_TYPES.includes(file.type);
    if (!isImage) {
      setError('Please upload an image file (PNG, JPEG, GIF, WebP).');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError('Image too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    processImage(file);
  };

  const handleFileSelect = (e) => {
    setError(null);
    handleImageFile(e.target.files?.[0]);
    e.target.value = '';
  };

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
    handleImageFile(e.dataTransfer.files?.[0]);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setProcessing(false);
    setResults(null);
    setConsultationId(null);
    setPreview(null);
    setError(null);
  };

  return (
    <div className={styles.page}>
      {/* Page Header */}
      <section className={styles.pageHeader}>
        <div className={styles.container}>
          <div className={styles.breadcrumb}>
            <span>Services</span>
            <span>/</span>
            <span>Scan Prescription</span>
          </div>
          <h1>AI <span className={styles.highlight}>Prescription Scanner</span></h1>
          <p className={styles.headerDescription}>
            Upload a photo of a prescription or medical document and let AI extract medicines, dosages, and clinical details
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

          {/* Step 1: Upload */}
          {currentStep === 0 && (
            <div className={styles.uploadSection}>
              <div
                className={`${styles.uploadCard} ${dragActive ? styles.dragActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {dragActive && (
                  <div className={styles.dragOverlay}>
                    <div className={styles.dragContent}>
                      <span className={styles.dragIcon}>📸</span>
                      <p>Drop image here</p>
                    </div>
                  </div>
                )}

                <div className={styles.uploadIcon}>
                  <div className={styles.scanCircle}>
                    <span>📋</span>
                  </div>
                </div>

                <h2>Scan Prescription</h2>
                <p className={styles.uploadDesc}>
                  Upload a photo of a prescription, medication label, or clinical document
                </p>

                <div className={styles.uploadControls}>
                  <Button
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload Image
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // Use capture attribute for mobile camera
                      fileInputRef.current?.setAttribute('capture', 'environment');
                      fileInputRef.current?.click();
                      // Remove capture so next upload doesn't force camera
                      setTimeout(() => fileInputRef.current?.removeAttribute('capture'), 100);
                    }}
                  >
                    Take Photo
                  </Button>
                </div>

                <p className={styles.dropHint}>
                  or drag & drop an image (PNG, JPEG, WebP — max 10MB)
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {error && (
                  <div className={styles.errorMessage}>{error}</div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Processing */}
          {currentStep === 1 && (
            <div className={styles.processingSection}>
              <div className={styles.processingCard}>
                {preview && (
                  <div className={styles.previewContainer}>
                    <img src={preview} alt="Uploaded prescription" className={styles.previewImage} />
                  </div>
                )}
                <div className={styles.processingAnimation}>
                  <div className={styles.processingCircle}>
                    <div className={styles.spinnerRing}></div>
                    <span className={styles.aiIcon}>🤖</span>
                  </div>
                </div>
                <h3>AI Analyzing Image</h3>
                <p>Extracting prescription data from your image...</p>
                <div className={styles.processingSteps}>
                  <div className={`${styles.processStep} ${styles.done}`}>
                    <span className={styles.check}>✓</span>
                    Image uploaded
                  </div>
                  <div className={`${styles.processStep} ${styles.activeStep}`}>
                    <div className={styles.miniSpinner}></div>
                    Reading prescription details
                  </div>
                  <div className={styles.processStep}>
                    <span className={styles.pending}>○</span>
                    Extracting medicines & dosages
                  </div>
                  <div className={styles.processStep}>
                    <span className={styles.pending}>○</span>
                    Generating clinical summary
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {currentStep === 2 && results && (
            <div className={styles.resultsSection}>
              {preview && (
                <div className={styles.resultPreview}>
                  <div className={styles.resultCard}>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardIcon}>📸</span>
                      <h3>Scanned Image</h3>
                    </div>
                    <div className={styles.cardContent}>
                      <img src={preview} alt="Scanned prescription" className={styles.resultImage} />
                    </div>
                  </div>
                </div>
              )}

              <ConsultationDashboard
                keyPoints={results.keyPoints}
                prescription={results.prescription}
                summary={results.summary}
              />

              <div className={styles.finalActions}>
                <Button variant="secondary" onClick={handleReset}>
                  Scan Another
                </Button>
                {consultationId && (
                  <>
                    <Link to={`/my-consultations?id=${consultationId}`} className={styles.viewLink}>
                      View in My Consultations
                    </Link>
                    <Link to={`/query-bot?consultation=${consultationId}`} className={styles.chatLink}>
                      Chat about this
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
