import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronLeft, AlertTriangle, Loader } from 'lucide-react';
import {
  getAllCourses,
  getAllUsers,
  deleteUserAndData,
  deleteCourseAdmin,
  type Course,
  type AdminUser,
} from '../utils/courseService';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [view, setView] = useState<'overview' | 'users' | 'courses'>('overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'user' | 'course'; id: string; name: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedCourses] = await Promise.all([getAllUsers(), getAllCourses()]);
      setUsers(fetchedUsers);
      setCourses(fetchedCourses);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleting(userId);
    try {
      await deleteUserAndData(userId);
      setUsers(users.filter(u => u.uid !== userId));
      setCourses(courses.filter(c => c.userId !== userId));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    setDeleting(courseId);
    try {
      await deleteCourseAdmin(courseId);
      setCourses(courses.filter(c => c.id !== courseId));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 pb-32">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-lime hover:text-lime/80 transition-colors mb-4 font-bold"
          >
            <ChevronLeft size={20} />
            Back to Profile
          </button>
          <h1 className="text-4xl font-black text-white uppercase italic">Admin Panel</h1>
          <p className="text-slate-400 mt-2">Manage users and courses</p>
        </motion.div>

        {/* Navigation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mb-8">
          <button
            onClick={() => setView('overview')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              view === 'overview'
                ? 'bg-lime text-black'
                : 'bg-slate-700/50 text-white hover:bg-slate-700 border border-slate-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setView('users')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              view === 'users'
                ? 'bg-lime text-black'
                : 'bg-slate-700/50 text-white hover:bg-slate-700 border border-slate-600'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setView('courses')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              view === 'courses'
                ? 'bg-lime text-black'
                : 'bg-slate-700/50 text-white hover:bg-slate-700 border border-slate-600'
            }`}
          >
            Courses ({courses.length})
          </button>
        </motion.div>

        {/* Overview View */}
        {view === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
                <div className="text-4xl font-black text-blue-400 mb-2">{users.length}</div>
                <div className="text-slate-300">Total Users</div>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
                <div className="text-4xl font-black text-green-400 mb-2">{courses.length}</div>
                <div className="text-slate-300">Total Courses</div>
              </div>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="w-full py-2 px-4 bg-lime/20 hover:bg-lime/30 text-lime font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </motion.div>
        )}

        {/* Users View */}
        {view === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="animate-spin text-lime" size={32} />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No users found</div>
            ) : (
              users.map(user => (
                <motion.div
                  key={user.uid}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{user.displayName || 'Unknown'}</h3>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <div className="flex gap-4 mt-2 text-xs text-slate-500">
                        <span>UID: {user.uid.slice(0, 12)}...</span>
                        <span>{user.courseCount} course{user.courseCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setConfirmDelete({
                          type: 'user',
                          id: user.uid,
                          name: user.displayName || user.email || 'User',
                        })
                      }
                      disabled={deleting === user.uid}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete user and all data"
                    >
                      {deleting === user.uid ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {/* Courses View */}
        {view === 'courses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="animate-spin text-lime" size={32} />
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-12 text-slate-400">No courses found</div>
            ) : (
              courses.map(course => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 hover:bg-slate-900/70 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{course.courseName}</h3>
                      <div className="flex gap-4 mt-2 text-xs text-slate-400">
                        <span>{course.holes.length} holes</span>
                        <span className={course.status === 'published' ? 'text-lime' : 'text-slate-500'}>
                          {course.status}
                        </span>
                        <span className="text-slate-500">{course.createdAt?.toLocaleDateString?.()}</span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setConfirmDelete({
                          type: 'course',
                          id: course.id,
                          name: course.courseName,
                        })
                      }
                      disabled={deleting === course.id}
                      className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete course"
                    >
                      {deleting === course.id ? <Loader size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <AlertTriangle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                <div>
                  <h3 className="text-xl font-black text-white mb-2">Confirm Delete</h3>
                  <p className="text-slate-300 text-sm">
                    Delete {confirmDelete.type === 'user' ? 'user' : 'course'}:{' '}
                    <span className="font-bold text-red-400">{confirmDelete.name}</span>?
                  </p>
                  {confirmDelete.type === 'user' && (
                    <p className="text-xs text-red-400 mt-3">⚠️ This will delete all their courses, rounds, and favorites!</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2 px-4 bg-slate-700/50 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete.type === 'user') {
                      handleDeleteUser(confirmDelete.id);
                    } else {
                      handleDeleteCourse(confirmDelete.id);
                    }
                  }}
                  disabled={deleting !== null}
                  className="flex-1 py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
