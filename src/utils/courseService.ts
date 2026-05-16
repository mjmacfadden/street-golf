import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface CourseHole {
  id: string;
  name: string;
  par: number;
  teeLocation: { lat: number; lng: number };
  pinLocation: { lat: number; lng: number };
  teeDescription: string;
  pinDescription: string;
  teeImage: string | null; // Firebase Storage URL
  pinImage: string | null; // Firebase Storage URL
  tip: string;
  hazard: boolean;
}

export interface Course {
  id: string;
  userId: string;
  courseName: string;
  holes: CourseHole[];
  status: 'draft' | 'published';
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

/**
 * Save a course (draft or published)
 * @param userId - Current user ID
 * @param course - Course data without ID
 * @returns Course ID
 */
export const saveCourse = async (
  userId: string,
  course: Omit<Course, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'publishedAt'>
): Promise<string> => {
  try {
    // Validate course
    if (!course.courseName.trim()) {
      throw new Error('Course name is required');
    }

    if (course.holes.length === 0) {
      throw new Error('Course must have at least one hole');
    }

    // Validate all holes have required fields
    for (const hole of course.holes) {
      if (!hole.name.trim()) {
        throw new Error(`Hole ${hole.id} is missing a name`);
      }
      if (!hole.teeLocation) {
        throw new Error(`Hole "${hole.name}" is missing tee location`);
      }
      if (!hole.pinLocation) {
        throw new Error(`Hole "${hole.name}" is missing pin location`);
      }
    }

    // Create course document in user's courses subcollection
    const courseId = doc(collection(db, 'users', userId, 'courses')).id;
    const courseRef = doc(db, 'users', userId, 'courses', courseId);

    const now = new Date();
    const courseData = {
      ...course,
      id: courseId,
      userId,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
      ...(course.status === 'published' && {
        publishedAt: Timestamp.fromDate(now),
      }),
    };

    await setDoc(courseRef, courseData);

    // If publishing, also add to public courses collection
    if (course.status === 'published') {
      const publicRef = doc(db, 'courses', courseId);
      await setDoc(publicRef, {
        id: courseId,
        userId,
        courseName: course.courseName,
        holesCount: course.holes.length,
        createdAt: Timestamp.fromDate(now),
        publishedAt: Timestamp.fromDate(now),
        // Store first tee and pin images for preview
        previewTeeImage: course.holes[0]?.teeImage || null,
        previewPinImage: course.holes[0]?.pinImage || null,
      });
    }

    return courseId;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to save course: ${error.message}`);
    }
    throw new Error('Failed to save course: Unknown error');
  }
};

/**
 * Publish a draft course (make it public)
 * @param userId - Current user ID
 * @param courseId - Course ID to publish
 * @returns Updated course
 */
export const publishCourse = async (
  userId: string,
  courseId: string
): Promise<Course> => {
  try {
    const courseRef = doc(db, 'users', userId, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      throw new Error('Course not found');
    }

    const course = courseSnap.data() as Course;

    // Check if already published
    if (course.status === 'published') {
      return course;
    }

    // Update status to published
    const now = new Date();
    const publishedData = {
      ...course,
      status: 'published' as const,
      updatedAt: Timestamp.fromDate(now),
      publishedAt: Timestamp.fromDate(now),
    };

    await setDoc(courseRef, publishedData);

    // Add to public courses collection
    const publicRef = doc(db, 'courses', courseId);
    await setDoc(publicRef, {
      id: courseId,
      userId,
      courseName: course.courseName,
      holesCount: course.holes.length,
      createdAt: course.createdAt,
      publishedAt: Timestamp.fromDate(now),
      previewTeeImage: course.holes[0]?.teeImage || null,
      previewPinImage: course.holes[0]?.pinImage || null,
    });

    return publishedData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to publish course: ${error.message}`);
    }
    throw new Error('Failed to publish course: Unknown error');
  }
};

/**
 * Get all courses for a user (drafts and published)
 * @param userId - User ID
 * @returns Array of courses
 */
export const getUserCourses = async (userId: string): Promise<Course[]> => {
  try {
    const q = query(
      collection(db, 'users', userId, 'courses'),
      orderBy('updatedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
      } as Course;
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch user courses: ${error.message}`);
    }
    throw new Error('Failed to fetch user courses: Unknown error');
  }
};

/**
 * Get all published courses (for discovery)
 * @returns Array of published courses
 */
export const getPublishedCourses = async (): Promise<Course[]> => {
  try {
    const q = query(
      collection(db, 'courses'),
      orderBy('publishedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      // Get full course data from user's courses
      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        publishedAt: data.publishedAt?.toDate(),
      } as Course;
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch published courses: ${error.message}`);
    }
    throw new Error('Failed to fetch published courses: Unknown error');
  }
};

/**
 * Get a specific course by ID
 * @param userId - User ID (owner)
 * @param courseId - Course ID
 * @returns Course data
 */
export const getCourse = async (
  userId: string,
  courseId: string
): Promise<Course> => {
  try {
    const courseRef = doc(db, 'users', userId, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      throw new Error('Course not found');
    }

    const data = courseSnap.data();
    return {
      ...data,
      id: courseSnap.id,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      publishedAt: data.publishedAt?.toDate(),
    } as Course;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch course: ${error.message}`);
    }
    throw new Error('Failed to fetch course: Unknown error');
  }
};
