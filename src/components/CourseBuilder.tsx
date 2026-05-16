import React, { useState, useRef } from 'react';
import { MapPin, Image as ImageIcon, Trash2, Plus, AlertCircle, Loader, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { captureGPSLocation, formatAccuracy, isAccuracyGood } from '../utils/geolocation';
import { uploadImage, validateImageFile } from '../utils/imageUpload';
import { saveCourse } from '../utils/courseService';
import { useAuth } from '../context/AuthContext';
import CameraCapture from './CameraCapture';

interface HoleInProgress {
  id: string;
  name: string;
  par: number;
  teeLocation: { lat: number; lng: number } | null;
  pinLocation: { lat: number; lng: number } | null;
  teeDescription: string;
  pinDescription: string;
  teeImage: string | null;
  pinImage: string | null;
  tip: string;
  hazard: boolean;
}

export default function CourseBuilder() {
  const { currentUser } = useAuth();
  const teeCameraInputRef = useRef<HTMLInputElement>(null);
  const teeFileInputRef = useRef<HTMLInputElement>(null);
  const pinCameraInputRef = useRef<HTMLInputElement>(null);
  const pinFileInputRef = useRef<HTMLInputElement>(null);

  const [courseName, setCourseName] = useState('');
  const [holes, setHoles] = useState<HoleInProgress[]>([]);
  const [expandedHole, setExpandedHole] = useState<string | null>(null);
  
  // GPS states
  const [teeGpsLoading, setTeeGpsLoading] = useState(false);
  const [teeGpsError, setTeeGpsError] = useState<string | null>(null);
  const [pinGpsLoading, setPinGpsLoading] = useState(false);
  const [pinGpsError, setPinGpsError] = useState<string | null>(null);

  // Photo upload states
  const [teePhotoLoading, setTeePhotoLoading] = useState(false);
  const [teePhotoError, setTeePhotoError] = useState<string | null>(null);
  const [pinPhotoLoading, setPinPhotoLoading] = useState(false);
  const [pinPhotoError, setPinPhotoError] = useState<string | null>(null);

  // Photo menu states
  const [teePhotoMenuOpen, setTeePhotoMenuOpen] = useState(false);
  const [pinPhotoMenuOpen, setPinPhotoMenuOpen] = useState(false);

  // Camera modal states
  const [teeCameraOpen, setTeeCameraOpen] = useState(false);
  const [pinCameraOpen, setPinCameraOpen] = useState(false);

  // Publishing states
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const [currentHole, setCurrentHole] = useState<Partial<HoleInProgress>>({
    name: '',
    par: 3,
    teeLocation: null,
    pinLocation: null,
    teeDescription: '',
    pinDescription: '',
    teeImage: null,
    pinImage: null,
    tip: '',
    hazard: false,
  });

  const addHole = () => {
    if (currentHole.name && currentHole.teeLocation && currentHole.pinLocation) {
      const newHole: HoleInProgress = {
        id: `hole-${Date.now()}`,
        name: currentHole.name || '',
        par: currentHole.par || 3,
        teeLocation: currentHole.teeLocation,
        pinLocation: currentHole.pinLocation,
        teeDescription: currentHole.teeDescription || '',
        pinDescription: currentHole.pinDescription || '',
        teeImage: currentHole.teeImage || null,
        pinImage: currentHole.pinImage || null,
        tip: currentHole.tip || '',
        hazard: currentHole.hazard || false,
      };

      setHoles([...holes, newHole]);
      setCurrentHole({
        name: '',
        par: 3,
        teeLocation: null,
        pinLocation: null,
        teeDescription: '',
        pinDescription: '',
        teeImage: null,
        pinImage: null,
        tip: '',
        hazard: false,
      });
    }
  };

  const removeHole = (id: string) => {
    setHoles(holes.filter(h => h.id !== id));
  };

  const publishCourse = async () => {
    if (!currentUser) {
      setPublishError('You must be signed in to publish a course');
      return;
    }

    if (!courseName.trim()) {
      setPublishError('Please enter a course name');
      return;
    }

    if (holes.length === 0) {
      setPublishError('Please add at least one hole to your course');
      return;
    }

    setIsPublishing(true);
    setPublishError(null);
    setPublishSuccess(false);

    try {
      await saveCourse(currentUser.uid, {
        courseName,
        holes,
        status: 'published',
      });

      setPublishSuccess(true);

      // Reset form after 2 seconds
      setTimeout(() => {
        setCourseName('');
        setHoles([]);
        setCurrentHole({
          name: '',
          par: 3,
          teeLocation: null,
          pinLocation: null,
          teeDescription: '',
          pinDescription: '',
          teeImage: null,
          pinImage: null,
          tip: '',
          hazard: false,
        });
        setPublishSuccess(false);
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        setPublishError(error.message);
      } else {
        setPublishError('Failed to publish course. Please try again.');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const captureTeeLocation = async () => {
    setTeeGpsLoading(true);
    setTeeGpsError(null);
    try {
      const location = await captureGPSLocation();
      setCurrentHole({
        ...currentHole,
        teeLocation: { lat: location.lat, lng: location.lng },
      });
    } catch (error: any) {
      setTeeGpsError(error.message || 'Failed to capture GPS');
    } finally {
      setTeeGpsLoading(false);
    }
  };

  const capturePinLocation = async () => {
    setPinGpsLoading(true);
    setPinGpsError(null);
    try {
      const location = await captureGPSLocation();
      setCurrentHole({
        ...currentHole,
        pinLocation: { lat: location.lat, lng: location.lng },
      });
    } catch (error: any) {
      setPinGpsError(error.message || 'Failed to capture GPS');
    } finally {
      setPinGpsLoading(false);
    }
  };

  const handleTeePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const validation = validateImageFile(file);
    if (validation) {
      setTeePhotoError(validation);
      return;
    }

    setTeePhotoLoading(true);
    setTeePhotoError(null);

    try {
      const url = await uploadImage(
        file,
        currentUser.uid,
        'preview',
        'tee'
      );
      setCurrentHole({ ...currentHole, teeImage: url });
    } catch (error: any) {
      setTeePhotoError(error.message || 'Failed to upload photo');
    } finally {
      setTeePhotoLoading(false);
      setTeePhotoMenuOpen(false);
      if (teeFileInputRef.current) {
        teeFileInputRef.current.value = '';
      }
    }
  };

  const handlePinPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const validation = validateImageFile(file);
    if (validation) {
      setPinPhotoError(validation);
      return;
    }

    setPinPhotoLoading(true);
    setPinPhotoError(null);

    try {
      const url = await uploadImage(
        file,
        currentUser.uid,
        'preview',
        'pin'
      );
      setCurrentHole({ ...currentHole, pinImage: url });
    } catch (error: any) {
      setPinPhotoError(error.message || 'Failed to upload photo');
    } finally {
      setPinPhotoLoading(false);
      setPinPhotoMenuOpen(false);
      if (pinFileInputRef.current) {
        pinFileInputRef.current.value = '';
      }
    }
  };

  const handleTeeCameraCapture = async (blob: Blob) => {
    if (!currentUser) return;

    setTeePhotoLoading(true);
    setTeePhotoError(null);
    setTeeCameraOpen(false);

    try {
      const file = new File([blob], 'tee-photo.jpg', { type: 'image/jpeg' });
      const url = await uploadImage(
        file,
        currentUser.uid,
        'preview',
        'tee'
      );
      setCurrentHole({ ...currentHole, teeImage: url });
    } catch (error: any) {
      setTeePhotoError(error.message || 'Failed to upload photo');
    } finally {
      setTeePhotoLoading(false);
      setTeePhotoMenuOpen(false);
    }
  };

  const handlePinCameraCapture = async (blob: Blob) => {
    if (!currentUser) return;

    setPinPhotoLoading(true);
    setPinPhotoError(null);
    setPinCameraOpen(false);

    try {
      const file = new File([blob], 'pin-photo.jpg', { type: 'image/jpeg' });
      const url = await uploadImage(
        file,
        currentUser.uid,
        'preview',
        'pin'
      );
      setCurrentHole({ ...currentHole, pinImage: url });
    } catch (error: any) {
      setPinPhotoError(error.message || 'Failed to upload photo');
    } finally {
      setPinPhotoLoading(false);
      setPinPhotoMenuOpen(false);
    }
  };

  const canAddHole = currentHole.name && currentHole.teeLocation && currentHole.pinLocation;

  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="bg-gradient-to-b from-navy to-dark p-6 border-b border-white/10 flex-shrink-0">
        <h2 className="text-3xl font-black text-lime mb-1">BUILD YOUR COURSE</h2>
        <p className="text-white/60 text-sm">Create a custom street golf course</p>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-6 pb-32">
        {/* Course Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-lime text-dark flex items-center justify-center text-xs font-black">1</div>
            COURSE INFORMATION
          </h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Course Name</label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g., Downtown District Open"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15 transition"
              />
            </div>
          </div>
        </motion.div>

        {/* Add Hole Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
        >
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-lime text-dark flex items-center justify-center text-xs font-black">2</div>
            ADD HOLE {holes.length > 0 && <span className="text-lime ml-auto text-sm">({holes.length})</span>}
          </h3>

          <div className="space-y-4">
            {/* Hole Name & Par */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Hole Name</label>
                <input
                  type="text"
                  value={currentHole.name || ''}
                  onChange={(e) => setCurrentHole({ ...currentHole, name: e.target.value })}
                  placeholder="e.g., Main Street Marker"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15 transition"
                />
              </div>
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Par</label>
                <select
                  value={currentHole.par || 3}
                  onChange={(e) => setCurrentHole({ ...currentHole, par: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-lime/50 focus:bg-white/15 transition"
                >
                  <option value={3}>Par 3</option>
                  <option value={4}>Par 4</option>
                  <option value={5}>Par 5</option>
                </select>
              </div>
            </div>

            {/* TEE SECTION */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h4 className="text-white/80 text-xs font-bold uppercase tracking-wider">Tee Location</h4>
              
              {/* Drop Tee & Add Photo Tee */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={captureTeeLocation}
                  disabled={teeGpsLoading}
                  className={`group bg-gradient-to-b border rounded-lg p-3 transition ${
                    currentHole.teeLocation
                      ? 'from-lime/20 to-lime/10 border-lime/50 hover:border-lime/70'
                      : 'from-white/10 to-white/5 border-white/20 hover:border-lime/50 disabled:border-white/10 disabled:opacity-60 disabled:hover:bg-white/5'
                  } hover:bg-white/15`}
                >
                  <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime group-disabled:text-white/50 transition">
                    {teeGpsLoading ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <MapPin size={18} />
                    )}
                    <div className="text-left">
                      {currentHole.teeLocation ? (
                        <>
                          <div className="text-xs font-bold text-lime">✓ TEE LOCATION</div>
                          <div className="text-xs text-lime/80">
                            {currentHole.teeLocation.lat.toFixed(4)}, {currentHole.teeLocation.lng.toFixed(4)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHole({ ...currentHole, teeLocation: null });
                            }}
                            className="text-xs text-lime/60 hover:text-lime/80 mt-0.5"
                          >
                            Clear & Retry
                          </button>
                        </>
                      ) : teeGpsLoading ? (
                        <>
                          <div className="text-xs font-bold uppercase tracking-wider">Acquiring...</div>
                          <div className="text-xs text-white/50">GPS signal</div>
                        </>
                      ) : teeGpsError ? (
                        <>
                          <div className="text-xs font-bold uppercase tracking-wider text-red-400">Error</div>
                          <div className="text-xs text-red-400/70">{teeGpsError}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTeeGpsError(null);
                            }}
                            className="text-xs text-red-400/60 hover:text-red-400/80 mt-0.5"
                          >
                            Retry
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-bold uppercase tracking-wider">Drop Tee</div>
                          <div className="text-xs text-white/50">Location</div>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setTeePhotoMenuOpen(!teePhotoMenuOpen)}
                    disabled={teePhotoLoading}
                    className={`group w-full border rounded-lg overflow-hidden transition ${
                      currentHole.teeImage
                        ? 'border-lime/50 hover:border-lime/70'
                        : 'from-white/10 to-white/5 border-white/20 hover:border-lime/50 disabled:border-white/10 disabled:opacity-60'
                    }`}
                  >
                    {currentHole.teeImage ? (
                      <div className="relative h-24 bg-black/50">
                        <img
                          src={currentHole.teeImage}
                          alt="Tee"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHole({ ...currentHole, teeImage: null });
                            }}
                            className="text-lime text-sm font-bold hover:text-lime/70"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gradient-to-b from-white/10 to-white/5">
                        <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime group-disabled:text-white/50 transition">
                          {teePhotoLoading ? (
                            <Loader size={18} className="animate-spin" />
                          ) : (
                            <ImageIcon size={18} />
                          )}
                          <div className="text-left">
                            {teePhotoLoading ? (
                              <>
                                <div className="text-xs font-bold uppercase tracking-wider">Uploading...</div>
                                <div className="text-xs text-white/50">Photo</div>
                              </>
                            ) : teePhotoError ? (
                              <>
                                <div className="text-xs font-bold uppercase tracking-wider text-red-400">Error</div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTeePhotoError(null);
                                  }}
                                  className="text-xs text-red-400/60 hover:text-red-400/80 mt-0.5"
                                >
                                  Retry
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="text-xs font-bold uppercase tracking-wider">Add Photo</div>
                                <div className="text-xs text-white/50">Tee</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Photo Menu */}
                  <AnimatePresence>
                    {teePhotoMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-navy border border-white/20 rounded-lg overflow-hidden shadow-lg z-50"
                      >
                        <button
                          onClick={() => {
                            setTeeCameraOpen(true);
                            setTeePhotoMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-white hover:bg-white/10 transition text-sm font-semibold flex items-center gap-2 border-b border-white/10"
                        >
                          📷 Take Photo
                        </button>
                        <button
                          onClick={() => {
                            teeFileInputRef.current?.click();
                            setTeePhotoMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-white hover:bg-white/10 transition text-sm font-semibold flex items-center gap-2"
                        >
                          📁 Choose File
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  ref={teeCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleTeePhotoSelect}
                  className="hidden"
                />
                <input
                  ref={teeFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleTeePhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Tee Photo Error */}
              {teePhotoError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-400">{teePhotoError}</div>
                </div>
              )}

              {/* Tee Description */}
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Tee Description</label>
                <textarea
                  value={currentHole.teeDescription || ''}
                  onChange={(e) => setCurrentHole({ ...currentHole, teeDescription: e.target.value })}
                  placeholder="Describe the tee location..."
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15 transition text-sm resize-none"
                />
              </div>
            </div>

            {/* PIN SECTION */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h4 className="text-white/80 text-xs font-bold uppercase tracking-wider">Pin Location</h4>
              
              {/* Drop Pin & Add Photo Pin */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={capturePinLocation}
                  disabled={pinGpsLoading}
                  className={`group bg-gradient-to-b border rounded-lg p-3 transition ${
                    currentHole.pinLocation
                      ? 'from-lime/20 to-lime/10 border-lime/50 hover:border-lime/70'
                      : 'from-white/10 to-white/5 border-white/20 hover:border-lime/50 disabled:border-white/10 disabled:opacity-60 disabled:hover:bg-white/5'
                  } hover:bg-white/15`}
                >
                  <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime group-disabled:text-white/50 transition">
                    {pinGpsLoading ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <MapPin size={18} />
                    )}
                    <div className="text-left">
                      {currentHole.pinLocation ? (
                        <>
                          <div className="text-xs font-bold text-lime">✓ PIN LOCATION</div>
                          <div className="text-xs text-lime/80">
                            {currentHole.pinLocation.lat.toFixed(4)}, {currentHole.pinLocation.lng.toFixed(4)}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHole({ ...currentHole, pinLocation: null });
                            }}
                            className="text-xs text-lime/60 hover:text-lime/80 mt-0.5"
                          >
                            Clear & Retry
                          </button>
                        </>
                      ) : pinGpsLoading ? (
                        <>
                          <div className="text-xs font-bold uppercase tracking-wider">Acquiring...</div>
                          <div className="text-xs text-white/50">GPS signal</div>
                        </>
                      ) : pinGpsError ? (
                        <>
                          <div className="text-xs font-bold uppercase tracking-wider text-red-400">Error</div>
                          <div className="text-xs text-red-400/70">{pinGpsError}</div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPinGpsError(null);
                            }}
                            className="text-xs text-red-400/60 hover:text-red-400/80 mt-0.5"
                          >
                            Retry
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="text-xs font-bold uppercase tracking-wider">Drop Pin</div>
                          <div className="text-xs text-white/50">Location</div>
                        </>
                      )}
                    </div>
                  </div>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setPinPhotoMenuOpen(!pinPhotoMenuOpen)}
                    disabled={pinPhotoLoading}
                    className={`group w-full border rounded-lg overflow-hidden transition ${
                      currentHole.pinImage
                        ? 'border-lime/50 hover:border-lime/70'
                        : 'from-white/10 to-white/5 border-white/20 hover:border-lime/50 disabled:border-white/10 disabled:opacity-60'
                    }`}
                  >
                    {currentHole.pinImage ? (
                      <div className="relative h-24 bg-black/50">
                        <img
                          src={currentHole.pinImage}
                          alt="Pin"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHole({ ...currentHole, pinImage: null });
                            }}
                            className="text-lime text-sm font-bold hover:text-lime/70"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gradient-to-b from-white/10 to-white/5">
                        <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime group-disabled:text-white/50 transition">
                          {pinPhotoLoading ? (
                            <Loader size={18} className="animate-spin" />
                          ) : (
                            <ImageIcon size={18} />
                          )}
                          <div className="text-left">
                            {pinPhotoLoading ? (
                              <>
                                <div className="text-xs font-bold uppercase tracking-wider">Uploading...</div>
                                <div className="text-xs text-white/50">Photo</div>
                              </>
                            ) : pinPhotoError ? (
                              <>
                                <div className="text-xs font-bold uppercase tracking-wider text-red-400">Error</div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPinPhotoError(null);
                                  }}
                                  className="text-xs text-red-400/60 hover:text-red-400/80 mt-0.5"
                                >
                                  Retry
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="text-xs font-bold uppercase tracking-wider">Add Photo</div>
                                <div className="text-xs text-white/50">Pin</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Photo Menu */}
                  <AnimatePresence>
                    {pinPhotoMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-navy border border-white/20 rounded-lg overflow-hidden shadow-lg z-50"
                      >
                        <button
                          onClick={() => {
                            setPinCameraOpen(true);
                            setPinPhotoMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-white hover:bg-white/10 transition text-sm font-semibold flex items-center gap-2 border-b border-white/10"
                        >
                          📷 Take Photo
                        </button>
                        <button
                          onClick={() => {
                            pinFileInputRef.current?.click();
                            setPinPhotoMenuOpen(false);
                          }}
                          className="w-full px-4 py-3 text-white hover:bg-white/10 transition text-sm font-semibold flex items-center gap-2"
                        >
                          📁 Choose File
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input
                  ref={pinCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePinPhotoSelect}
                  className="hidden"
                />
                <input
                  ref={pinFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePinPhotoSelect}
                  className="hidden"
                />
              </div>

              {/* Pin Photo Error */}
              {pinPhotoError && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-400">{pinPhotoError}</div>
                </div>
              )}

              {/* Pin Description */}
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Pin Description</label>
                <textarea
                  value={currentHole.pinDescription || ''}
                  onChange={(e) => setCurrentHole({ ...currentHole, pinDescription: e.target.value })}
                  placeholder="Describe the pin/target location..."
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15 transition text-sm resize-none"
                />
              </div>
            </div>

            {/* INFO SECTION */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
              <h4 className="text-white/80 text-xs font-bold uppercase tracking-wider">Additional Info</h4>
              
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Course Tips</label>
                <textarea
                  value={currentHole.tip || ''}
                  onChange={(e) => setCurrentHole({ ...currentHole, tip: e.target.value })}
                  placeholder="Any advice for playing this hole? (distance, obstacles, etc.)"
                  rows={2}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15 transition text-sm resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="hazard"
                  checked={currentHole.hazard || false}
                  onChange={(e) => setCurrentHole({ ...currentHole, hazard: e.target.checked })}
                  className="w-5 h-5 accent-lime rounded cursor-pointer"
                />
                <label htmlFor="hazard" className="text-white/80 font-semibold cursor-pointer flex items-center gap-2">
                  <AlertCircle size={16} className="text-orange-400" />
                  Mark as Hazard
                </label>
              </div>
            </div>

            {/* Add Hole Button */}
            <button
              onClick={addHole}
              disabled={!canAddHole}
              className={`w-full py-3 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition ${
                canAddHole
                  ? 'bg-lime text-dark hover:bg-lime/90 shadow-lg shadow-lime/20 cursor-pointer'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <Plus size={18} />
              Add Hole
            </button>
          </div>
        </motion.div>

        {/* Holes List */}
        <AnimatePresence>
          {holes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-lime text-dark flex items-center justify-center text-xs font-black">3</div>
                COURSE HOLES ({holes.length})
              </h3>

              {holes.map((hole, idx) => (
                <motion.div
                  key={hole.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm cursor-pointer hover:border-lime/30 hover:bg-white/10 transition"
                  onClick={() => setExpandedHole(expandedHole === hole.id ? null : hole.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-lime/20 text-lime flex items-center justify-center font-black text-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold">{hole.name}</h4>
                        <p className="text-white/50 text-sm">Par {hole.par} {hole.hazard && '• Hazard'}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeHole(hole.id);
                      }}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-white/50 hover:text-red-400 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {expandedHole === hole.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-white/10 space-y-3 text-sm"
                      >
                        {hole.teeDescription && (
                          <div>
                            <p className="text-white/60 text-xs uppercase font-bold mb-1">Tee Location</p>
                            <p className="text-white/80">{hole.teeDescription}</p>
                          </div>
                        )}
                        {hole.pinDescription && (
                          <div>
                            <p className="text-white/60 text-xs uppercase font-bold mb-1">Pin Location</p>
                            <p className="text-white/80">{hole.pinDescription}</p>
                          </div>
                        )}
                        {hole.tip && (
                          <div>
                            <p className="text-white/60 text-xs uppercase font-bold mb-1">Tips</p>
                            <p className="text-white/80">{hole.tip}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Publish Error */}
        {publishError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"
          >
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-400">{publishError}</div>
          </motion.div>
        )}

        {/* Publish Success */}
        {publishSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 bg-lime/10 border border-lime/30 rounded-lg p-3 mb-4"
          >
            <div className="text-sm text-lime font-bold">✓ Course published successfully!</div>
          </motion.div>
        )}

        {/* Publish Button */}
        {holes.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={publishCourse}
            disabled={isPublishing}
            className={`w-full py-4 rounded-xl font-black text-lg shadow-xl uppercase tracking-wider transition ${
              isPublishing
                ? 'bg-lime/50 text-dark/50 shadow-lime/10 cursor-not-allowed'
                : 'bg-gradient-to-r from-lime to-lime/80 text-dark hover:shadow-lime/40 shadow-lime/20 cursor-pointer'
            }`}
          >
            {isPublishing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader size={20} className="animate-spin" />
                Publishing...
              </div>
            ) : (
              `Publish Course (${holes.length} ${holes.length === 1 ? 'Hole' : 'Holes'})`
            )}
          </motion.button>
        )}

        {/* Empty State */}
        {holes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-8 text-white/50"
          >
            <p className="text-sm">Add your first hole to get started</p>
          </motion.div>
        )}
      </div>
      </div>

      {/* Camera Modals */}
      <AnimatePresence>
        {teeCameraOpen && (
          <CameraCapture
            location="tee"
            onCapture={handleTeeCameraCapture}
            onCancel={() => setTeeCameraOpen(false)}
          />
        )}
        {pinCameraOpen && (
          <CameraCapture
            location="pin"
            onCapture={handlePinCameraCapture}
            onCancel={() => setPinCameraOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
