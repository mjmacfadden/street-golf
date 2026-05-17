import React, { useEffect, useState } from 'react';
import { X, MapPin, Copy, Check, AlertCircle } from 'lucide-react';
import { Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { motion } from 'framer-motion';

interface LocationVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClear?: () => void;
  location: { lat: number; lng: number };
  locationName: string;
  accuracy?: number;
}

export const LocationVerificationModal: React.FC<LocationVerificationModalProps> = ({
  isOpen,
  onClose,
  onClear,
  location,
  locationName,
  accuracy,
}) => {
  const [copied, setCopied] = useState(false);
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(navigator.userAgent);

  const handleCopyLocation = () => {
    const text = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-dark border border-lime/30 rounded-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-lime/20 to-lime/10 border-b border-lime/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="text-lime" size={20} />
            <h2 className="text-lg font-bold text-white uppercase italic">{locationName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition"
          >
            <X size={20} className="text-white/60 hover:text-white" />
          </button>
        </div>

        {/* Desktop Accuracy Warning */}
        {!isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-500/20 border-b border-orange-500/30 px-6 py-3 flex items-start gap-3"
          >
            <AlertCircle size={18} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-200">
              Desktop location accuracy is limited. Mobile GPS provides better precision for testing purposes.
            </p>
          </motion.div>
        )}

        {/* Map */}
        <div className="h-64 bg-slate-900 relative overflow-hidden">
          <Map
            defaultZoom={18}
            defaultCenter={location}
            mapId="location-verification-map"
            gestureHandling="greedy"
            disableDefaultUI
            className="w-full h-full"
          >
            <AdvancedMarker position={location}>
              <Pin background="#BFFF00" glyphColor="#0a0a0a" borderColor="#ffffff" />
            </AdvancedMarker>
          </Map>
        </div>

        {/* Details */}
        <div className="p-6 space-y-4">
          {/* Coordinates */}
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wider mb-2">Coordinates</p>
            <div className="flex items-center gap-2">
              <code className="text-sm text-lime font-mono bg-black/50 px-3 py-2 rounded-lg flex-1">
                {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </code>
              <button
                onClick={handleCopyLocation}
                className="p-2 bg-lime/20 hover:bg-lime/30 text-lime rounded-lg transition"
                title="Copy coordinates"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          {/* Accuracy */}
          {accuracy !== undefined && (
            <div>
              <p className="text-xs text-white/60 uppercase tracking-wider mb-2">GPS Accuracy</p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm text-white font-mono">±{Math.round(accuracy)}m</p>
                  <p className="text-xs text-white/50">
                    {accuracy < 10 ? '✓ Excellent' : accuracy < 20 ? 'Good' : 'Fair'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Clear & Retry Button */}
          {onClear && (
            <button
              onClick={() => {
                onClear();
                onClose();
              }}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg py-2 text-sm font-bold uppercase transition"
            >
              Clear & Retry
            </button>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-white/5 border-t border-white/10 px-6 py-3">
          <p className="text-xs text-white/50">
            Check the map to verify the location is accurate before saving.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
