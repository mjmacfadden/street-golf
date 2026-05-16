import React, { useState } from 'react';
import { MapPin, Image as ImageIcon, Trash2, Plus, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [courseName, setCourseName] = useState('');
  const [courseCity, setCourseCity] = useState('');
  const [courseAddress, setCourseAddress] = useState('');
  const [holes, setHoles] = useState<HoleInProgress[]>([]);
  const [expandedHole, setExpandedHole] = useState<string | null>(null);
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">City</label>
                <input
                  type="text"
                  value={courseCity}
                  onChange={(e) => setCourseCity(e.target.value)}
                  placeholder="Glendale"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15 transition"
                />
              </div>
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Address</label>
                <input
                  type="text"
                  value={courseAddress}
                  onChange={(e) => setCourseAddress(e.target.value)}
                  placeholder="123 Main St"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-lime/50 focus:bg-white/15 transition"
                />
              </div>
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
                <button className="group bg-gradient-to-b from-white/10 to-white/5 border border-white/20 hover:border-lime/50 rounded-lg p-3 transition hover:bg-white/15">
                  <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime transition">
                    <MapPin size={18} />
                    <div className="text-left">
                      <div className="text-xs font-bold uppercase tracking-wider">
                        {currentHole.teeLocation ? '✓' : 'Drop'} Tee
                      </div>
                      <div className="text-xs text-white/50">Location</div>
                    </div>
                  </div>
                </button>

                <button className="group bg-gradient-to-b from-white/10 to-white/5 border border-white/20 hover:border-lime/50 rounded-lg p-3 transition hover:bg-white/15">
                  <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime transition">
                    <ImageIcon size={18} />
                    <div className="text-left">
                      <div className="text-xs font-bold uppercase tracking-wider">
                        {currentHole.teeImage ? '✓' : 'Add'} Photo
                      </div>
                      <div className="text-xs text-white/50">Tee</div>
                    </div>
                  </div>
                </button>
              </div>

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
                <button className="group bg-gradient-to-b from-white/10 to-white/5 border border-white/20 hover:border-lime/50 rounded-lg p-3 transition hover:bg-white/15">
                  <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime transition">
                    <MapPin size={18} />
                    <div className="text-left">
                      <div className="text-xs font-bold uppercase tracking-wider">
                        {currentHole.pinLocation ? '✓' : 'Drop'} Pin
                      </div>
                      <div className="text-xs text-white/50">Location</div>
                    </div>
                  </div>
                </button>

                <button className="group bg-gradient-to-b from-white/10 to-white/5 border border-white/20 hover:border-lime/50 rounded-lg p-3 transition hover:bg-white/15">
                  <div className="flex items-center justify-center gap-2 text-white/70 group-hover:text-lime transition">
                    <ImageIcon size={18} />
                    <div className="text-left">
                      <div className="text-xs font-bold uppercase tracking-wider">
                        {currentHole.pinImage ? '✓' : 'Add'} Photo
                      </div>
                      <div className="text-xs text-white/50">Pin</div>
                    </div>
                  </div>
                </button>
              </div>

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

        {/* Publish Button */}
        {holes.length > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full bg-gradient-to-r from-lime to-lime/80 text-dark py-4 rounded-xl font-black text-lg shadow-xl shadow-lime/20 hover:shadow-lime/40 transition uppercase tracking-wider"
          >
            Publish Course ({holes.length} {holes.length === 1 ? 'Hole' : 'Holes'})
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
    </div>
  );
}
