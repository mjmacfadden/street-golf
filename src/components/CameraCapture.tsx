import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
  location: 'tee' | 'pin';
}

export default function CameraCapture({
  onCapture,
  onCancel,
  location,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get camera stream
  useEffect(() => {
    const startCamera = async () => {
      try {
        console.log('Requesting camera access...');
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        console.log('Camera stream obtained:', mediaStream);
        setStream(mediaStream);
      } catch (err) {
        console.error('Camera error:', err);
        let errorMsg = 'Unable to access camera. Please check permissions.';
        
        if (err instanceof DOMException) {
          if (err.name === 'NotAllowedError') {
            errorMsg = 'Camera access was denied. Please allow camera permissions and try again.';
          } else if (err.name === 'NotFoundError') {
            errorMsg = 'No camera found on this device.';
          } else if (err.name === 'NotReadableError') {
            errorMsg = 'Camera is already in use. Close other apps and try again.';
          }
        }
        
        setError(errorMsg);
        setLoading(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        console.log('Stopping camera stream...');
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Attach stream to video element after it mounts
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log('Setting video stream to video element...');
      videoRef.current.srcObject = stream;
      
      videoRef.current.onloadedmetadata = () => {
        console.log('Video metadata loaded, attempting playback...');
        videoRef.current?.play().then(() => {
          console.log('Video playing successfully');
          setLoading(false);
        }).catch((err) => {
          console.error('Play error:', err);
          setError('Failed to start video playback: ' + err.message);
          setLoading(false);
        });
      };

      // Timeout fallback
      const timeoutId = setTimeout(() => {
        console.log('Metadata timeout, attempting to play anyway...');
        if (videoRef.current && videoRef.current.readyState >= 1) {
          videoRef.current.play().then(() => {
            console.log('Playback started via timeout');
            setLoading(false);
          }).catch((err) => {
            console.error('Play error on fallback:', err);
            setError('Failed to start video playback');
            setLoading(false);
          });
        }
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [stream]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const photoUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        setPhoto(photoUrl);
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  const confirmPhoto = () => {
    if (photo && canvasRef.current) {
      canvasRef.current.toBlob(
        (blob) => {
          if (blob) {
            onCapture(blob);
          }
        },
        'image/jpeg',
        0.9
      );
    }
  };

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-dark border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
        >
          <h3 className="text-white font-bold mb-2">Camera Not Available</h3>
          <p className="text-white/70 text-sm mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 bg-white/10 text-white font-bold py-2 rounded-lg hover:bg-white/20 transition"
            >
              Cancel
            </button>
            <button
              onClick={onCancel}
              className="flex-1 bg-lime text-dark font-bold py-2 rounded-lg hover:bg-lime/90 transition"
            >
              Use File Upload
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="bg-dark border border-white/20 rounded-2xl p-6 max-w-sm w-full mx-4"
      >
        {/* Camera or Photo Preview */}
        {photo ? (
          <div className="w-full aspect-square mb-4 rounded-xl overflow-hidden bg-black/50">
            <img src={photo} alt="Captured" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-full aspect-square mb-4 rounded-xl overflow-hidden bg-black relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="text-white/60 text-center">
                  <div className="w-10 h-10 border-3 border-lime border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-sm">Initializing camera...</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Canvas for capture (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Controls */}
        <div className="flex gap-3">
          {photo ? (
            <>
              <button
                onClick={retakePhoto}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition"
              >
                Retake
              </button>
              <button
                onClick={confirmPhoto}
                className="flex-1 bg-lime hover:bg-lime/90 text-dark font-bold py-2 rounded-lg transition"
              >
                Use Photo
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onCancel}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-2 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={capturePhoto}
                className="flex-1 bg-lime hover:bg-lime/90 text-dark font-bold py-2 rounded-lg transition"
              >
                Capture
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
