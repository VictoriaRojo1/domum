const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const { uploadFile, deleteFile, getFilePathFromUrl, BUCKETS } = require('../config/supabase');

// Use memory storage for Supabase uploads
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, PNG, WebP)'), false);
  }
};

// File filter for documents (PDFs, images, CAD files, ZIPs)
const documentFileFilter = (req, file, cb) => {
  const allowedTypes = [
    // PDFs
    'application/pdf',
    // Images (renders)
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff',
    // CAD files
    'application/acad', 'application/x-acad', 'application/dwg', 'image/vnd.dwg',
    'application/dxf', 'image/vnd.dxf',
    // Archives
    'application/zip', 'application/x-zip-compressed',
    'application/x-rar-compressed', 'application/vnd.rar'
  ];

  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.dwg', '.dxf', '.zip', '.rar'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Se aceptan: PDF, imágenes, DWG, DXF, ZIP, RAR'), false);
  }
};

// Configure multer for images
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Max 10 files at once
  }
});

// Configure multer for documents
const uploadDocuments = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size for documents
    files: 10 // Max 10 files at once
  }
});

/**
 * Generate unique filename
 */
const generateFilename = (originalname, ext = null) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const extension = ext || path.extname(originalname).toLowerCase();
  return `${uniqueSuffix}${extension}`;
};

/**
 * Process and upload image to Supabase Storage
 * Returns { filename, url, thumbnailUrl }
 */
const processAndUploadImage = async (file, options = {}) => {
  const { width = 1200, height = 800, quality = 80 } = options;

  // Generate unique filename with .webp extension
  const filename = generateFilename(file.originalname, '.webp');
  const thumbFilename = filename.replace('.webp', '-thumb.webp');

  // Process main image with Sharp
  const processedBuffer = await sharp(file.buffer)
    .resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({ quality })
    .toBuffer();

  // Create thumbnail
  const thumbnailBuffer = await sharp(file.buffer)
    .resize(400, 300, {
      fit: 'cover'
    })
    .webp({ quality: 70 })
    .toBuffer();

  // Upload main image to Supabase
  const mainUpload = await uploadFile(
    BUCKETS.PROPERTIES,
    filename,
    processedBuffer,
    'image/webp'
  );

  // Upload thumbnail to Supabase
  const thumbUpload = await uploadFile(
    BUCKETS.PROPERTIES,
    thumbFilename,
    thumbnailBuffer,
    'image/webp'
  );

  return {
    filename,
    url: mainUpload.url,
    thumbnailFilename: thumbFilename,
    thumbnailUrl: thumbUpload.url
  };
};

/**
 * Upload document to Supabase Storage (no processing)
 */
const uploadDocument = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname).toLowerCase();
  const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
  const filename = `${uniqueSuffix}-${baseName}${ext}`;

  const result = await uploadFile(
    BUCKETS.DOCUMENTS,
    filename,
    file.buffer,
    file.mimetype
  );

  return {
    filename,
    originalName: file.originalname,
    url: result.url,
    size: file.size,
    mimetype: file.mimetype
  };
};

/**
 * Delete image from Supabase Storage
 */
const deleteImage = async (imageUrl) => {
  const filePath = getFilePathFromUrl(imageUrl, BUCKETS.PROPERTIES);
  if (!filePath) {
    console.error('Could not extract file path from URL:', imageUrl);
    return false;
  }

  // Delete main image
  await deleteFile(BUCKETS.PROPERTIES, filePath);

  // Try to delete thumbnail
  const thumbPath = filePath.replace('.webp', '-thumb.webp');
  await deleteFile(BUCKETS.PROPERTIES, thumbPath);

  return true;
};

/**
 * Delete document from Supabase Storage
 */
const deleteDocument = async (documentUrl) => {
  const filePath = getFilePathFromUrl(documentUrl, BUCKETS.DOCUMENTS);
  if (!filePath) {
    console.error('Could not extract file path from URL:', documentUrl);
    return false;
  }

  return await deleteFile(BUCKETS.DOCUMENTS, filePath);
};

module.exports = {
  upload,
  uploadDocuments,
  processAndUploadImage,
  uploadDocument,
  deleteImage,
  deleteDocument
};
