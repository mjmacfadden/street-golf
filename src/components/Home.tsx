import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Heart, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { addFavorite, removeFavorite, getUserFavorites } from '../utils/courseService';
import type { Course as FirestoreCourse } from '../utils/courseService';
import type { Course } from '../constants/course';

interface HomeProps {
  courses: (Course | FirestoreCourse)[];
  onSelectCourse: (course: Course | FirestoreCourse) => void;
  onPlayNow: () => void;
  loading?: boolean;
}

export default function Home({ courses, onSelectCourse, onPlayNow, loading = false }: HomeProps) {
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favLoading, setFavLoading] = useState(false);
  const [showFavoriteLoginModal, setShowFavoriteLoginModal] = useState(false);

  // Load user's favorites
  useEffect(() => {
    if (currentUser) {
      getUserFavorites(currentUser.uid).then(favIds => {
        setFavorites(new Set(favIds));
      });
    }
  }, [currentUser]);

  // Filter courses based on search
  const filteredCourses = courses.filter(course => {
    const name = 'courseName' in course ? course.courseName : course.name;
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const displayCourses = searchTerm ? filteredCourses : courses;
  const currentCourse = displayCourses[currentIndex];

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayCourses.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === displayCourses.length - 1 ? 0 : prev + 1));
  };

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser || !currentCourse) {
      if (!currentUser) {
        setShowFavoriteLoginModal(true);
      }
      return;
    }

    const courseId = 'id' in currentCourse ? currentCourse.id : currentCourse.id;
    setFavLoading(true);

    try {
      if (favorites.has(courseId)) {
        await removeFavorite(currentUser.uid, courseId);
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(courseId);
          return newSet;
        });
      } else {
        await addFavorite(currentUser.uid, courseId);
        setFavorites(prev => new Set(prev).add(courseId));
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setFavLoading(false);
    }
  };

  const getHeaderImage = (course: Course | FirestoreCourse): string => {
    if ('headerImage' in course && course.headerImage) {
      return course.headerImage;
    }
    return '/street-golf/images/golf-course.jpg';
  };

  const getCourseName = (course: Course | FirestoreCourse): string => {
    return 'courseName' in course ? course.courseName : course.name;
  };

  const getCreatorName = (course: Course | FirestoreCourse): string | undefined => {
    if ('creatorName' in course) {
      return course.creatorName;
    }
    return undefined;
  };

  const getHoles = (course: Course | FirestoreCourse): any[] => {
    return course.holes;
  };

  const isFavorited = currentCourse && favorites.has('id' in currentCourse ? currentCourse.id : currentCourse.id);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-dark">
        <div className="text-lime text-xl font-bold">Loading courses...</div>
      </div>
    );
  }

  if (displayCourses.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-dark flex-col gap-4">
        <div className="text-white text-xl font-bold">No courses found</div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-lime font-bold hover:underline"
          >
            Clear search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Favorite Login Modal */}
      <AnimatePresence>
        {showFavoriteLoginModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFavoriteLoginModal(false)}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark rounded-2xl p-8 max-w-sm w-full mx-4 border border-white/10"
            >
              <div className="text-center">
                <div className="inline-block p-3 bg-red-500/20 rounded-full mb-4">
                  <Heart className="w-6 h-6 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-white mb-2">
                  Create an Account
                </h2>
                <p className="text-white/60 mb-6">
                  Sign in to save your favorite courses and access them anytime
                </p>
                <AuthModal onClose={() => setShowFavoriteLoginModal(false)} />
                <button
                  onClick={() => setShowFavoriteLoginModal(false)}
                  className="w-full px-4 py-3 mt-3 bg-white/10 text-white font-bold rounded-lg hover:bg-white/20 transition"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course Carousel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative bg-black">
          {/* Search Bar - Positioned over carousel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute top-0 left-0 right-0 z-20 p-4"
          >
            <div className="flex items-center gap-2 max-w-2xl mx-auto">
              <motion.div
                animate={{ width: searchOpen ? '100%' : 'auto' }}
                className="flex items-center gap-2 flex-1"
              >
                {searchOpen && (
                  <input
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentIndex(0);
                    }}
                    placeholder="Search courses..."
                    className="flex-1 px-4 py-2 bg-black/40 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-lime/50 focus:bg-black/50"
                  />
                )}
              </motion.div>

              {searchOpen ? (
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchTerm('');
                    setCurrentIndex(0);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg text-white transition"
                >
                  <X size={20} />
                </button>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 hover:bg-white/20 rounded-lg text-white transition"
                >
                  <Search size={20} />
                </button>
              )}
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {currentCourse && (
              <motion.div
                key={`course-${currentIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                {/* Header Image */}
                <img
                  src={getHeaderImage(currentCourse)}
                  alt={getCourseName(currentCourse)}
                  className="w-full h-full object-cover"
                />

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />

                {/* Play Now Button */}
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    onSelectCourse(currentCourse);
                    onPlayNow();
                  }}
                  className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                >
                  <div className="flex flex-col items-center gap-3 bg-black/40 hover:bg-black/60 rounded-full p-6 transition backdrop-blur-sm">
                    <Play size={48} className="text-lime fill-lime" />
                    <span className="text-white font-bold text-lg">Play Now</span>
                  </div>
                </motion.button>

                {/* Navigation Arrows */}
                {displayCourses.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevious}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-lg backdrop-blur-sm transition"
                    >
                      <ChevronLeft size={28} className="text-white" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 bg-white/20 hover:bg-white/40 rounded-lg backdrop-blur-sm transition"
                    >
                      <ChevronRight size={28} className="text-white" />
                    </button>
                  </>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Course Information */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-6 space-y-4">
            {currentCourse && (
              <>
                {/* Header with Name and Favorite */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-dark">{getCourseName(currentCourse)}</h2>
                    {getCreatorName(currentCourse) && (
                      <p className="text-dark/60 text-sm mt-1">By: {getCreatorName(currentCourse)}</p>
                    )}
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition disabled:cursor-not-allowed"
                    title={'Add to favorites'}
                  >
                    <Heart
                      size={28}
                      className={`transition ${
                        isFavorited ? 'text-red-500 fill-red-500' : 'text-dark/40'
                      }`}
                    />
                  </motion.button>
                </div>

                {/* Holes List */}
                <div>
                  <h3 className="text-sm font-bold text-dark/70 uppercase tracking-wider mb-3">
                    Holes ({getHoles(currentCourse).length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getHoles(currentCourse).map((hole, idx) => (
                      <div
                        key={`${hole.id || idx}`}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-dark">
                            {typeof hole.number !== 'undefined' ? hole.number : idx + 1}
                          </span>
                          <span className="text-sm text-dark/60">Par {hole.par}</span>
                        </div>
                        <p className="text-sm text-dark/70 truncate mt-1">{hole.name}</p>
                        {hole.hazard && (
                          <div className="text-xs text-orange-600 font-bold mt-1">⚠ Hazard</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
