import { useRef, useCallback, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Crosshair, X, Loader2, AlertCircle } from 'lucide-react';

export default function WebcamCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanTimeoutRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [livenessState, setLivenessState] = useState('idle'); // 'idle', 'scanning', 'blinking', 'verified'
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [crosshairSize, setCrosshairSize] = useState(window.innerWidth < 480 ? 120 : 180);

  useEffect(() => {
    const handleResize = () => {
      setCrosshairSize(window.innerWidth < 480 ? 120 : 180);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const clearLivenessTimers = useCallback(() => {
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    const startVideo = async () => {
      try {
        setError(null);
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (!active) {
          mediaStream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (!videoRef.current) return;

        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setLivenessState('scanning');
        setProgress(15);
        clearLivenessTimers();

        scanTimeoutRef.current = setTimeout(() => {
          if (!active) return;
          setLivenessState('blinking');
          progressIntervalRef.current = setInterval(() => {
            if (!active) return;
            setProgress((prev) => {
              const next = Math.min(prev + 12, 100);
              if (next >= 100) {
                clearLivenessTimers();
                setLivenessState('verified');
                return 100;
              }
              return next;
            });
          }, 150);
        }, 800);
      } catch (err) {
        console.error('Error accessing webcam: ', err);
        if (active) {
          setError('Failed to access webcam. Please check your camera permissions and ensure no other application is using it.');
        }
      }
    };

    startVideo();

    return () => {
      active = false;
      clearLivenessTimers();
    };
  }, [clearLivenessTimers]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.play().catch((err) => console.error(err));
    }
  }, [stream]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const captureFrame = useCallback((event) => {
    event.preventDefault();
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0) {
      alert('Camera initializing, please wait a second.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL('image/jpeg', 0.8));
  }, [onCapture]);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(2, 6, 23, 0.9)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-panel animate-fade-in"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: 'calc(100vh - 2rem)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          alignItems: 'center',
          position: 'relative',
          overflowY: 'auto',
          margin: 'auto',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={24} />
        </button>

        <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Camera size={24} className="text-gradient" /> Face Authentication & Liveness
        </h3>

        {error ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', alignItems: 'center', textAlign: 'center', padding: '2rem 1rem' }}>
            <AlertCircle size={48} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)' }}>Webcam Access Failed</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>{error}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ marginTop: '1rem', width: '100%' }}
            >
              Reload Page
            </button>
          </div>
        ) : (
          <>
            <div
              className="scanner-container"
              style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)',
                border: '2px solid var(--primary)',
                width: '100%',
                backgroundColor: '#000',
                minHeight: '280px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {!stream && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                  <Loader2 className="animate-spin" size={48} style={{ color: 'var(--primary)' }} />
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>Initializing Biometric Scanner...</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Please allow camera access if prompted by your browser.</span>
                </div>
              )}
              
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  display: stream ? 'block' : 'none',
                  width: '100%',
                  height: 'auto',
                  opacity: 0.9,
                }}
              />

              {stream && (
                <div className="scanner-overlay">
                  <div className="scanner-line"></div>
                  <div className="target-box">
                    <Crosshair
                      size={crosshairSize}
                      color="rgba(99, 102, 241, 0.6)"
                      strokeWidth={1}
                      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {stream ? (
              <>
                <div
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    border: '1px solid var(--glass-border)',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 600, color: livenessState === 'verified' ? 'var(--secondary)' : 'var(--primary)' }}>
                      {livenessState === 'scanning' && 'Positioning face...'}
                      {livenessState === 'blinking' && 'Blink slowly to verify liveness...'}
                      {livenessState === 'verified' && 'Anti-spoofing check passed'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {livenessState === 'verified' ? '100%' : `${Math.min(progress, 100)}%`}
                    </span>
                  </div>

                  {livenessState !== 'verified' ? (
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.15s ease-out' }} />
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', lineHeight: '1.2' }}>
                      Simulated eye-blink landmark analysis passed. (Production extension hook ready)
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                  {livenessState === 'verified' 
                    ? 'Verification complete. You can now capture the photo.' 
                    : 'Wait for verification to complete, then use the capture button.'}
                </p>

                <button
                  type="button"
                  onClick={captureFrame}
                  disabled={livenessState !== 'verified'}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '1.2rem',
                    fontSize: '1.1rem',
                    letterSpacing: '1px',
                    textTransform: 'uppercase',
                    opacity: livenessState === 'verified' ? 1 : 0.5,
                    cursor: livenessState === 'verified' ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {livenessState === 'verified' ? (
                    <>
                      <Camera size={22} /> Capture Photo
                    </>
                  ) : (
                    <>
                      <Loader2 className="animate-spin" size={20} /> Verifying Face ({Math.min(progress, 100)}%)
                    </>
                  )}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0 0.5rem', lineHeight: '1.4' }}>
                  <strong>Note:</strong> Liveness verification currently uses a guided demo flow plus backend image validation.
                </p>
              </>
            ) : (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', padding: '1rem 0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Waiting for camera authorization...</span>
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>,
    document.body
  );
}
