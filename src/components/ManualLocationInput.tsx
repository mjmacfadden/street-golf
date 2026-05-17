import React, { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface ManualLocationInputProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (lat: number, lng: number) => void;
  initialLocation?: { lat: number; lng: number };
}

export const ManualLocationInput: React.FC<ManualLocationInputProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialLocation,
}) => {
  const [lat, setLat] = useState(initialLocation?.lat.toString() || '');
  const [lng, setLng] = useState(initialLocation?.lng.toString() || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      setError('Please enter valid latitude and longitude');
      return;
    }

    if (latitude < -90 || latitude > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (longitude < -180 || longitude > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    onSubmit(latitude, longitude);
    onClose();
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
        className="bg-dark border border-lime/30 rounded-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-lime/20 to-lime/10 border-b border-lime/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="text-lime" size={20} />
            <h2 className="text-lg font-bold text-white uppercase italic">Manual Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/10 rounded-lg transition"
          >
            <X size={20} className="text-white/60 hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-white/70">
            Enter latitude and longitude coordinates for testing (desktop only).
          </p>

          {/* Latitude Input */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-2">
              Latitude
            </label>
            <input
              type="number"
              value={lat}
              onChange={(e) => {
                setLat(e.target.value);
                setError(null);
              }}
              placeholder="e.g., 41.8781"
              step="0.0001"
              min="-90"
              max="90"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15"
            />
          </div>

          {/* Longitude Input */}
          <div>
            <label className="block text-xs font-bold text-white/80 uppercase mb-2">
              Longitude
            </label>
            <input
              type="number"
              value={lng}
              onChange={(e) => {
                setLng(e.target.value);
                setError(null);
              }}
              placeholder="e.g., -87.6298"
              step="0.0001"
              min="-180"
              max="180"
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-3">
            <p className="text-xs text-white/50">
              💡 Use Google Maps: right-click a location to copy coordinates, then paste them here.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2 bg-lime/20 hover:bg-lime/30 text-lime rounded-lg font-bold transition"
            >
              Set Location
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
