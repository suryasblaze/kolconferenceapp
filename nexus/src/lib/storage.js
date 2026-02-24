/**
 * Supabase Storage Utilities
 * Handles file uploads, downloads, and management for meeting files
 */

import { supabase } from './supabase';

const BUCKET_NAME = 'meeting-files';
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {object} - { valid: boolean, error?: string }
 */
export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed. Allowed: PDF, images, Office docs, text files' };
  }

  return { valid: true };
};

/**
 * Generate storage path for a file
 * @param {string} meetingId - Meeting ID
 * @param {string} fileName - Original file name
 * @returns {string} - Storage path
 */
const generateStoragePath = (meetingId, fileName) => {
  // Sanitize filename
  const sanitizedName = fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 100);

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  // Path structure: {meeting_id}/{timestamp}_{random}_{filename}
  return `${meetingId}/${timestamp}_${randomStr}_${sanitizedName}`;
};

/**
 * Upload a file to Supabase Storage
 * @param {File} file - File to upload
 * @param {string} meetingId - Meeting ID to associate with
 * @returns {Promise<object>} - { success: boolean, path?: string, url?: string, error?: string }
 */
export const uploadFile = async (file, meetingId) => {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  try {
    const storagePath = generateStoragePath(meetingId, file.name);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    // Get public URL (for signed URLs if bucket is private)
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    };
  } catch (error) {
    return { success: false, error: 'Failed to upload file' };
  }
};

/**
 * Upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {string} meetingId - Meeting ID
 * @returns {Promise<object[]>} - Array of upload results
 */
export const uploadFiles = async (files, meetingId) => {
  const results = [];

  for (const file of files) {
    const result = await uploadFile(file, meetingId);
    results.push({
      ...result,
      originalName: file.name
    });
  }

  return results;
};

/**
 * Get a signed URL for downloading a file (for private buckets)
 * @param {string} storagePath - Path in storage
 * @param {number} expiresIn - Expiry time in seconds (default 1 hour)
 * @returns {Promise<object>} - { success: boolean, url?: string, error?: string }
 */
export const getSignedUrl = async (storagePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    return { success: false, error: 'Failed to get download URL' };
  }
};

/**
 * Download a file
 * @param {string} storagePath - Path in storage
 * @returns {Promise<object>} - { success: boolean, blob?: Blob, error?: string }
 */
export const downloadFile = async (storagePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(storagePath);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, blob: data };
  } catch (error) {
    return { success: false, error: 'Failed to download file' };
  }
};

/**
 * Delete a file from storage
 * @param {string} storagePath - Path in storage
 * @returns {Promise<object>} - { success: boolean, error?: string }
 */
export const deleteFile = async (storagePath) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete file' };
  }
};

/**
 * Delete multiple files
 * @param {string[]} storagePaths - Array of storage paths
 * @returns {Promise<object>} - { success: boolean, error?: string }
 */
export const deleteFiles = async (storagePaths) => {
  if (!storagePaths || storagePaths.length === 0) {
    return { success: true };
  }

  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(storagePaths);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete files' };
  }
};

/**
 * List files for a meeting
 * @param {string} meetingId - Meeting ID
 * @returns {Promise<object>} - { success: boolean, files?: object[], error?: string }
 */
export const listMeetingFiles = async (meetingId) => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(meetingId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, files: data };
  } catch (error) {
    return { success: false, error: 'Failed to list files' };
  }
};

export default {
  validateFile,
  uploadFile,
  uploadFiles,
  getSignedUrl,
  downloadFile,
  deleteFile,
  deleteFiles,
  listMeetingFiles,
  ALLOWED_TYPES,
  MAX_FILE_SIZE
};
