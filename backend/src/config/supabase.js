const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Supabase credentials not found. Storage features will not work.');
}

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Bucket names
const BUCKETS = {
  PROPERTIES: 'properties',
  DOCUMENTS: 'documents'
};

/**
 * Get public URL for a file in Supabase Storage
 */
const getPublicUrl = (bucket, filePath) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Upload file to Supabase Storage
 */
const uploadFile = async (bucket, filePath, fileBuffer, contentType) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    path: data.path,
    url: getPublicUrl(bucket, data.path)
  };
};

/**
 * Delete file from Supabase Storage
 */
const deleteFile = async (bucket, filePath) => {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    console.error(`Delete failed: ${error.message}`);
    return false;
  }

  return true;
};

/**
 * Extract file path from Supabase public URL
 */
const getFilePathFromUrl = (url, bucket) => {
  // URL format: https://xxx.supabase.co/storage/v1/object/public/bucket/path/to/file
  const pattern = new RegExp(`/storage/v1/object/public/${bucket}/(.+)$`);
  const match = url.match(pattern);
  return match ? match[1] : null;
};

module.exports = {
  supabase,
  BUCKETS,
  getPublicUrl,
  uploadFile,
  deleteFile,
  getFilePathFromUrl
};
