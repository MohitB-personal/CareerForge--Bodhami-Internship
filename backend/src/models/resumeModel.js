const { query } = require('../config/db');

/**
 * Parse a JSON column value coming from MySQL into a JS value.
 */
const parseJsonColumn = (val, fallback) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch (e) {
      return fallback;
    }
  }
  return val;
};

class ResumeModel {
  /**
   * Create a new saved resume for a candidate (CareerForge generated type)
   * @param {Number} candidateId
   * @param {Object} data { template, title, content, llmEnhanced }
   */
  static async create(candidateId, { template, title, content, llmEnhanced = false }) {
    const sql = `
      INSERT INTO candidate_resumes (candidate_id, resume_type, template, title, content, llm_enhanced)
      VALUES (?, 'generated', ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      candidateId,
      template,
      title || 'My Resume',
      JSON.stringify(content),
      llmEnhanced ? 1 : 0,
    ]);
    return await this.findByCandidateIdAndResumeId(candidateId, result.insertId);
  }

  /**
   * Create a new uploaded resume (PDF file) for a candidate.
   * Uploaded resumes have no template/content snapshot — the original PDF is
   * stored on the filesystem and referenced by `storagePath`.
   * @param {Number} candidateId
   * @param {Object} data { title, originalFilename, storagePath, fileSize, mimeType }
   */
  static async createUploaded(candidateId, { title, originalFilename, storagePath, fileSize, mimeType }) {
    const sql = `
      INSERT INTO candidate_resumes
        (candidate_id, resume_type, template, title, content, llm_enhanced, original_filename, storage_path, file_size, mime_type)
      VALUES (?, 'uploaded', NULL, ?, NULL, 0, ?, ?, ?, ?)
    `;
    const result = await query(sql, [
      candidateId,
      title || 'My Resume',
      originalFilename,
      storagePath,
      fileSize,
      mimeType,
    ]);
    return await this.findByCandidateIdAndResumeId(candidateId, result.insertId);
  }

  /**
   * List all saved resumes of a candidate (metadata only, no content snapshot
   * and never the server storage path).
   * @param {Number} candidateId
   */
  static async findAllByCandidateId(candidateId) {
    const sql = `
      SELECT id, candidate_id, resume_type, template, title, llm_enhanced,
             original_filename, file_size, mime_type, created_at, updated_at
      FROM candidate_resumes
      WHERE candidate_id = ?
      ORDER BY updated_at DESC
    `;
    const rows = await query(sql, [candidateId]);
    return (rows || []).map((row) => this.mapRow(row, false));
  }

  /**
   * Find a saved resume by ID (ownership enforced by candidate_id)
   * @param {Number} candidateId
   * @param {Number} resumeId
   */
  static async findByCandidateIdAndResumeId(candidateId, resumeId) {
    const sql = `
      SELECT id, candidate_id, resume_type, template, title, content, llm_enhanced,
             original_filename, file_size, mime_type, created_at, updated_at
      FROM candidate_resumes
      WHERE id = ? AND candidate_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [resumeId, candidateId]);
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0], true);
  }

  /**
   * Find an owned resume including its filesystem storage reference.
   * INTERNAL USE ONLY (file download / deletion) — the storage path must never
   * be returned to the frontend.
   * @param {Number} candidateId
   * @param {Number} resumeId
   */
  static async findOwnedResumeWithFile(candidateId, resumeId) {
    const sql = `
      SELECT id, candidate_id, resume_type, template, title, llm_enhanced,
             original_filename, storage_path, file_size, mime_type, created_at, updated_at
      FROM candidate_resumes
      WHERE id = ? AND candidate_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [resumeId, candidateId]);
    if (!rows || rows.length === 0) return null;
    return this.mapRow(rows[0], false, true);
  }

  /**
   * Replace the saved content/template/title of an existing resume.
   * Returns the updated resume or null when the resume is not owned by candidateId.
   * @param {Number} candidateId
   * @param {Number} resumeId
   * @param {Object} data { template, title, content, llmEnhanced }
   */
  static async update(candidateId, resumeId, { template, title, content, llmEnhanced = false }) {
    const sql = `
      UPDATE candidate_resumes
      SET template = ?, title = ?, content = ?, llm_enhanced = ?
      WHERE id = ? AND candidate_id = ?
    `;
    const result = await query(sql, [
      template,
      title || 'My Resume',
      JSON.stringify(content),
      llmEnhanced ? 1 : 0,
      resumeId,
      candidateId,
    ]);
    if (!result || result.affectedRows === 0) return null;
    return await this.findByCandidateIdAndResumeId(candidateId, resumeId);
  }

  /**
   * Delete a saved resume (ownership enforced by candidate_id)
   * @param {Number} candidateId
   * @param {Number} resumeId
   */
  static async delete(candidateId, resumeId) {
    const sql = `
      DELETE FROM candidate_resumes
      WHERE id = ? AND candidate_id = ?
    `;
    const result = await query(sql, [resumeId, candidateId]);
    return Boolean(result && result.affectedRows > 0);
  }

  /**
   * Map a DB row into the API shape.
   * @param {Object} row
   * @param {Boolean} includeContent
   * @param {Boolean} includeStoragePath Internal only — never exposed to the frontend
   */
  static mapRow(row, includeContent, includeStoragePath = false) {
    const mapped = {
      id: row.id,
      candidateId: row.candidate_id,
      resumeType: row.resume_type === 'uploaded' ? 'uploaded' : 'generated',
      template: row.template,
      title: row.title,
      llmEnhanced: Boolean(row.llm_enhanced),
      originalFilename: row.original_filename || null,
      fileSize: row.file_size === null || row.file_size === undefined ? null : Number(row.file_size),
      mimeType: row.mime_type || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    if (includeContent) {
      mapped.content = parseJsonColumn(row.content, null);
    }
    if (includeStoragePath) {
      mapped.storagePath = row.storage_path || null;
    }
    return mapped;
  }
}

module.exports = ResumeModel;
