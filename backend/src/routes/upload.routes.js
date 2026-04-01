const express = require('express');
const prisma = require('../config/database');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const {
  upload,
  uploadDocuments,
  processAndUploadImage,
  uploadDocument,
  deleteImage,
  deleteDocument
} = require('../middleware/upload.middleware');

const router = express.Router();

/**
 * POST /api/upload/property/:propertyId
 * Upload images for a property
 */
router.post('/property/:propertyId',
  authenticate,
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, images: true }
    });

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    // Process and upload images to Supabase Storage
    const processedImages = [];

    for (const file of req.files) {
      try {
        const result = await processAndUploadImage(file);
        processedImages.push({
          filename: result.filename,
          thumbnail: result.thumbnailFilename,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl
        });
      } catch (error) {
        console.error('Error processing image:', error);
        // Continue with other images even if one fails
      }
    }

    if (processedImages.length === 0) {
      return res.status(500).json({ error: 'No se pudieron procesar las imágenes' });
    }

    // Update property with new images (store URLs)
    const existingImages = property.images || [];
    const newImageUrls = processedImages.map(img => img.url);
    const allImages = [...existingImages, ...newImageUrls];

    await prisma.property.update({
      where: { id: propertyId },
      data: { images: allImages }
    });

    res.json({
      message: `${processedImages.length} imagen(es) subida(s) exitosamente`,
      images: processedImages,
      allImages
    });
  })
);

/**
 * DELETE /api/upload/property/:propertyId/image
 * Delete a specific image from a property
 */
router.delete('/property/:propertyId/image',
  authenticate,
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'URL de imagen requerida' });
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, images: true }
    });

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    // Remove image from array
    const updatedImages = (property.images || []).filter(img => img !== imageUrl);

    // Delete file from Supabase Storage
    await deleteImage(imageUrl);

    // Update property
    await prisma.property.update({
      where: { id: propertyId },
      data: { images: updatedImages }
    });

    res.json({
      message: 'Imagen eliminada',
      images: updatedImages
    });
  })
);

/**
 * POST /api/upload/temp
 * Upload temporary image (for new properties not yet created)
 */
router.post('/temp',
  authenticate,
  upload.array('images', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    const processedImages = [];

    for (const file of req.files) {
      try {
        const result = await processAndUploadImage(file);
        processedImages.push({
          filename: result.filename,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl
        });
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    if (processedImages.length === 0) {
      return res.status(500).json({ error: 'No se pudieron procesar las imágenes' });
    }

    res.json({
      message: `${processedImages.length} imagen(es) subida(s)`,
      images: processedImages
    });
  })
);

// =============================================
// DOCUMENT UPLOADS (Planos, Renders, PDFs)
// =============================================

/**
 * POST /api/upload/attachment/:propertyId
 * Upload attachments for a property (planos, renders, PDFs)
 */
router.post('/attachment/:propertyId',
  authenticate,
  uploadDocuments.array('attachments', 10),
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, attachments: true }
    });

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    // Upload attachments to Supabase Storage
    const uploadedAttachments = [];

    for (const file of req.files) {
      try {
        const result = await uploadDocument(file);
        uploadedAttachments.push(result);
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }

    if (uploadedAttachments.length === 0) {
      return res.status(500).json({ error: 'No se pudieron subir los archivos' });
    }

    // Update property with new attachments (store URLs)
    const existingAttachments = property.attachments || [];
    const newAttachmentUrls = uploadedAttachments.map(att => att.url);
    const allAttachments = [...existingAttachments, ...newAttachmentUrls];

    await prisma.property.update({
      where: { id: propertyId },
      data: { attachments: allAttachments }
    });

    res.json({
      message: `${uploadedAttachments.length} archivo(s) subido(s) exitosamente`,
      attachments: uploadedAttachments,
      allAttachments
    });
  })
);

/**
 * DELETE /api/upload/attachment/:propertyId
 * Delete a specific attachment from a property
 */
router.delete('/attachment/:propertyId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { propertyId } = req.params;
    const { attachmentUrl } = req.body;

    if (!attachmentUrl) {
      return res.status(400).json({ error: 'URL del archivo requerida' });
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, attachments: true }
    });

    if (!property) {
      return res.status(404).json({ error: 'Propiedad no encontrada' });
    }

    // Remove attachment from array
    const updatedAttachments = (property.attachments || []).filter(att => att !== attachmentUrl);

    // Delete file from Supabase Storage
    await deleteDocument(attachmentUrl);

    // Update property
    await prisma.property.update({
      where: { id: propertyId },
      data: { attachments: updatedAttachments }
    });

    res.json({
      message: 'Archivo eliminado',
      attachments: updatedAttachments
    });
  })
);

/**
 * POST /api/upload/attachment/temp
 * Upload temporary attachments (for new properties not yet created)
 */
router.post('/attachment/temp',
  authenticate,
  uploadDocuments.array('attachments', 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se subieron archivos' });
    }

    const uploadedAttachments = [];

    for (const file of req.files) {
      try {
        const result = await uploadDocument(file);
        uploadedAttachments.push(result);
      } catch (error) {
        console.error('Error uploading document:', error);
      }
    }

    if (uploadedAttachments.length === 0) {
      return res.status(500).json({ error: 'No se pudieron subir los archivos' });
    }

    res.json({
      message: `${uploadedAttachments.length} archivo(s) subido(s)`,
      attachments: uploadedAttachments
    });
  })
);

// Error handling for multer
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'El archivo es demasiado grande. Máximo 50MB para documentos, 10MB para imágenes.'
    });
  }
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Demasiados archivos. Máximo 10 a la vez.'
    });
  }
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

module.exports = router;
