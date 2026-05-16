import { storage } from '../config/firebase';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';

export interface UploadProgress {
  progress: number; // 0-100
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * Compress image before upload - optimized for mobile
 * @param file - Original image file
 * @param maxWidth - Maximum width in pixels (default: 640 for mobile)
 * @param maxHeight - Maximum height in pixels (default: 640 for mobile)
 * @param quality - JPEG quality (0-1, default: 0.65 for small file size)
 * @returns Promise with compressed blob
 */
const compressImage = (
  file: File,
  maxWidth: number = 640,
  maxHeight: number = 640,
  quality: number = 0.65
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * Upload image to Firebase Storage
 * @param file - Image file to upload
 * @param userId - Current user ID
 * @param courseId - Course ID (use 'preview' for temp uploads)
 * @param location - 'tee' or 'pin'
 * @returns Promise with download URL
 */
export const uploadImage = async (
  file: File,
  userId: string,
  courseId: string,
  location: 'tee' | 'pin'
): Promise<string> => {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File must be less than 50MB');
  }

  try {
    // Compress image
    const compressedBlob = await compressImage(file);

    // Create storage reference
    const timestamp = Date.now();
    const fileName = `${location}-${timestamp}.jpg`;
    const storageRef = ref(
      storage,
      `courses/${userId}/${courseId}/${location}/${fileName}`
    );

    // Upload
    await uploadBytes(storageRef, compressedBlob, {
      contentType: 'image/jpeg',
    });

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    throw new Error('Upload failed: Unknown error');
  }
};

/**
 * Delete image from Firebase Storage
 * @param imageUrl - Download URL of image to delete
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract storage path from URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');

    if (path) {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    }
  } catch (error) {
    console.warn('Failed to delete image:', error);
    // Don't throw - deletion is non-critical
  }
};

/**
 * Validate image file
 * @param file - File to validate
 * @returns Error message or null if valid
 */
export const validateImageFile = (file: File): string | null => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are supported';
  }

  if (file.size > 50 * 1024 * 1024) {
    return 'File must be less than 50MB';
  }

  if (file.size < 10 * 1024) {
    return 'File must be at least 10KB';
  }

  return null;
};
