const express = require('express');
const { body, validationResult } = require('express-validator');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');

const router = express.Router();

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('Contraseña requerida')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    res.json({
      message: 'Login exitoso',
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  })
);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token requerido')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);

    if (result.error) {
      return res.status(401).json({ error: result.error });
    }

    res.json({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  })
);

/**
 * POST /api/auth/logout
 * Logout and revoke refresh token
 */
router.post('/logout',
  authenticate,
  [
    body('refreshToken').notEmpty().withMessage('Refresh token requerido')
  ],
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({ message: 'Sesión cerrada correctamente' });
  })
);

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: req.user });
  })
);

/**
 * POST /api/auth/change-password
 * Change user password
 */
router.post('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword')
      .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
      .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
      .matches(/[a-z]/).withMessage('La contraseña debe contener al menos una minúscula')
      .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const prisma = require('../config/database');
    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const validPassword = await authService.comparePassword(currentPassword, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    // Update password
    const newPasswordHash = await authService.hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { passwordHash: newPasswordHash }
    });

    // Revoke all refresh tokens (force re-login on other devices)
    await authService.revokeAllUserTokens(req.user.id);

    res.json({ message: 'Contraseña actualizada correctamente' });
  })
);

module.exports = router;
