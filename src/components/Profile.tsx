import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, Trash2, LogOut, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserCourses, deleteCourse, type Course as FirestoreCourse } from '../utils/courseService';

interface ProfileProps {
  onEditCourse?: (course: FirestoreCourse) => void;
  onLogout?: () => void;
  onDeleteCourse?: (courseId: string) => void;
}

export const Profile: React.FC<ProfileProps> = ({ onEditCourse, onLogout, onDeleteCourse }) => {
  const { currentUser, logout } = useAuth();
  const [courses, setCourses] = useState<FirestoreCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch user's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        setError(null);
        const userCourses = await getUserCourses(currentUser.uid);
        setCourses(userCourses);
      } catch (err) {
        console.error('Failed to fetch courses:', err);
        setError('Failed to load your courses');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [currentUser]);

  const handleDelete = async (courseId: string) => {
    if (!currentUser?.uid) return;

    try {
      setDeleting(courseId);
      await deleteCourse(currentUser.uid, courseId);
      setCourses(courses.filter(c => c.id !== courseId));
      setDeleteConfirm(null);
      if (onDeleteCourse) onDeleteCourse(courseId);
    } catch (err) {
      console.error('Failed to delete course:', err);
      setError('Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  const handleLogout = async () => {
    await logout();
    if (onLogout) onLogout();
  };

  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400">Not logged in</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 pb-32">
      <div className="max-w-2xl mx-auto">
        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy/50 border border-lime/30 rounded-3xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-1 uppercase italic">
                {currentUser.displayName || 'User'}
              </h2>
              <p className="text-lime font-bold text-sm">{currentUser.email}</p>
            </div>
            {currentUser.photoURL && (
              <img
                src={currentUser.photoURL}
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-lime"
              />
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 py-2 rounded-xl font-bold transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </motion.div>

        {/* Courses Section */}
        <div>
          <h3 className="text-xl font-black text-white mb-4 uppercase italic tracking-tight">
            My Courses ({courses.length})
          </h3>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-lime/20 border-t-lime rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!loading && courses.length === 0 && (
            <div className="bg-navy/30 border border-slate-700 rounded-3xl p-12 text-center">
              <p className="text-slate-400 mb-2">No courses yet</p>
              <p className="text-slate-500 text-sm">Go to the Build tab to create your first course</p>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div className="space-y-3">
              {courses.map((course, idx) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-white mb-1 truncate uppercase italic">
                        {course.courseName}
                      </h4>
                      <div className="flex gap-4 text-xs text-slate-400">
                        <span>{course.holes.length} holes</span>
                        <span>
                          {course.status === 'published' ? (
                            <span className="text-lime font-bold">Published</span>
                          ) : (
                            <span className="text-slate-500">Draft</span>
                          )}
                        </span>
                        <span>
                          Created {course.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => onEditCourse?.(course)}
                        className="p-2 bg-lime/20 hover:bg-lime/30 text-lime rounded-lg transition-colors"
                        title="Edit course"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(course.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                        title="Delete course"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-dark border border-red-500/30 rounded-2xl p-6 max-w-sm w-full"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-red-500/20 rounded-lg text-red-400">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 className="font-black text-white mb-1 uppercase italic">Delete Course?</h3>
                  <p className="text-sm text-slate-400">
                    This will permanently delete "{courses.find(c => c.id === deleteConfirm)?.courseName}" and all associated photos. This cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                  disabled={deleting === deleteConfirm}
                  className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting === deleteConfirm ? (
                    <>
                      <Loader size={16} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
