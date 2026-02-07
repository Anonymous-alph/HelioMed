import { useState, useRef, useCallback, useEffect } from 'react';

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  // Check for consent in session storage
  useEffect(() => {
    const consent = sessionStorage.getItem('recordingConsent');
    if (consent === 'true') {
      setHasConsent(true);
    }
  }, []);

  const grantConsent = useCallback(() => {
    setHasConsent(true);
    sessionStorage.setItem('recordingConsent', 'true');
  }, []);

  const startRecording = useCallback(async () => {
    if (!hasConsent) {
      setError('Recording consent is required before starting');
      return false;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType
        });
        setAudioBlob(blob);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access.');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone.');
      } else {
        setError('Failed to start recording. Please try again.');
      }
      return false;
    }
  }, [hasConsent]);

  // Returns a Promise<Blob> so callers get the blob directly
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        const recorder = mediaRecorderRef.current;

        // Override onstop to resolve with the blob
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType
          });
          setAudioBlob(blob);
          resolve(blob);
        };

        recorder.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
        clearInterval(timerRef.current);
        setIsRecording(false);
        setIsPaused(false);
      } else {
        resolve(null);
      }
    });
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      clearInterval(timerRef.current);
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      setIsPaused(false);
    }
  }, [isRecording, isPaused]);

  const resetRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      clearInterval(timerRef.current);
      setIsRecording(false);
      setIsPaused(false);
    }
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, [isRecording]);

  // Format duration as MM:SS
  const formattedDuration = `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    isRecording,
    isPaused,
    audioBlob,
    setAudioBlob,
    duration,
    formattedDuration,
    error,
    setError,
    hasConsent,
    grantConsent,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording
  };
}
