/**
 * Resume storage service — filesystem storage for candidate-uploaded PDF resumes.
 *
 * Files are stored OUTSIDE the public `/uploads` static root (which is served
 * without authentication) so uploaded resumes can only ever be accessed through
 * the JWT-protected controller endpoints that verify candidate ownership.
 * Only a relative storage reference (e.g. `12/ab12....pdf`) is persisted in the
 * database — server paths are never sent to the frontend.
 */

const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

// backend/src/services -> backend/storage/resumes
const STORAGE_ROOT = path.resolve(__dirname, '..', '..', 'storage', 'resumes');

/**
 * Validate that a buffer actually contains PDF content by checking for the
 * `%PDF-` file signature (magic bytes). Some generators prepend a small junk
 * header, so the signature is searched within the first kilobyte.
 * @param {Buffer} buffer
 * @returns {Boolean}
 */
const isPdfBuffer = (buffer) => {
  if (!buffer || buffer.length < 5) return false;
  const head = buffer.subarray(0, 1024).toString('latin1');
  return head.includes('%PDF-');
};

/**
 * Persist an uploaded PDF for a candidate.
 * @param {Number} candidateId
 * @param {Buffer} buffer Validated PDF buffer
 * @returns {Promise<{ storagePath: String, size: Number }>} relative storage ref
 */
const saveResumePdf = async (candidateId, buffer) => {
  const candidateDir = path.join(STORAGE_ROOT, String(candidateId));
  await fs.mkdir(candidateDir, { recursive: true });

  const fileName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.pdf`;
  await fs.writeFile(path.join(candidateDir, fileName), buffer);

  // Store the relative reference (candidate dir + file), never an absolute path.
  return { storagePath: path.posix.join(String(candidateId), fileName), size: buffer.length };
};

/**
 * Resolve a stored reference to an absolute path, guarding against path
 * traversal (the reference must resolve inside the storage root).
 * @param {String} storagePath Relative reference from the database
 * @returns {String|null} absolute path, or null when the reference is unsafe
 */
const resolveStoredResumePath = (storagePath) => {
  if (typeof storagePath !== 'string' || storagePath.trim() === '') return null;
  const normalized = path.normalize(storagePath).replace(/^([/\\])+/, '');
  const absolutePath = path.resolve(STORAGE_ROOT, normalized);
  if (!absolutePath.startsWith(STORAGE_ROOT + path.sep)) return null;
  return absolutePath;
};

/**
 * Remove a stored resume file. Missing files are ignored so a resume record can
 * always be deleted even if the file was already removed manually.
 * @param {String} storagePath Relative reference from the database
 */
const removeStoredResume = async (storagePath) => {
  const absolutePath = resolveStoredResumePath(storagePath);
  if (!absolutePath) return;
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

module.exports = {
  STORAGE_ROOT,
  isPdfBuffer,
  saveResumePdf,
  resolveStoredResumePath,
  removeStoredResume,
};
