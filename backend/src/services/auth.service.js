const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare a password with a hash
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = async (userId) => {
  const token = jwt.sign(
    { id: userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Save to database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });

  return token;
};

/**
 * Verify access token
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Check if token exists in database and is not expired
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return null;
    }

    return storedToken.user;
  } catch (error) {
    return null;
  }
};

/**
 * Revoke refresh token
 */
const revokeRefreshToken = async (token) => {
  try {
    await prisma.refreshToken.delete({
      where: { token }
    });
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
};

/**
 * Login user
 */
const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || user.deletedAt) {
    return { error: 'Credenciales inválidas' };
  }

  if (!user.isActive) {
    return { error: 'Usuario desactivado. Contacta al administrador.' };
  }

  const validPassword = await comparePassword(password, user.passwordHash);
  if (!validPassword) {
    return { error: 'Credenciales inválidas' };
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  // Remove sensitive data
  const { passwordHash, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    accessToken,
    refreshToken
  };
};

/**
 * Register new user (internal use - called by user service)
 */
const register = async (userData, creatorId = null) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email.toLowerCase() }
  });

  if (existingUser) {
    return { error: 'El email ya está registrado' };
  }

  const passwordHash = await hashPassword(userData.password);

  const user = await prisma.user.create({
    data: {
      email: userData.email.toLowerCase(),
      passwordHash,
      name: userData.name,
      phone: userData.phone || null,
      role: userData.role || 'VENDEDOR',
      createdById: creatorId
    }
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return { user: userWithoutPassword };
};

/**
 * Refresh access token using refresh token
 * Implements refresh token rotation for security
 */
const refreshAccessToken = async (oldRefreshToken) => {
  const user = await verifyRefreshToken(oldRefreshToken);

  if (!user) {
    return { error: 'Refresh token inválido o expirado' };
  }

  if (!user.isActive || user.deletedAt) {
    return { error: 'Usuario desactivado' };
  }

  // Revoke old refresh token (rotation)
  await revokeRefreshToken(oldRefreshToken);

  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await generateRefreshToken(user.id);

  return { accessToken, refreshToken };
};

/**
 * Logout user (revoke refresh token)
 */
const logout = async (refreshToken) => {
  await revokeRefreshToken(refreshToken);
  return { success: true };
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  login,
  register,
  refreshAccessToken,
  logout
};
