const { query } = require('../config/db');

class CandidateModel {
  /**
   * Find candidate by email
   * @param {String} email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT c.id, c.full_name, c.email, c.phone, c.password_hash, c.email_verified, c.created_at,
             cp.profile_picture_url
      FROM candidates c
      LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
      WHERE c.email = ?
      LIMIT 1
    `;
    const rows = await query(sql, [email]);
    return rows[0] || null;
  }

  /**
   * Find candidate by ID
   * @param {Number} id
   */
  static async findById(id) {
    const sql = `
      SELECT c.id, c.full_name, c.email, c.phone, c.email_verified, c.created_at,
             cp.profile_picture_url
      FROM candidates c
      LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
      WHERE c.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    if (!rows[0]) return null;
    const candidate = rows[0];
    if (candidate.phone === '0000000000') {
      candidate.phone = '';
    }
    return candidate;
  }

  /**
   * Create new candidate
   * @param {Object} candidateData { full_name, email, phone, password_hash }
   */
  static async create({ full_name, email, phone, password_hash = null, email_verified = false }) {
    const sql = `
      INSERT INTO candidates (
        full_name,
        email,
        phone,
        password_hash,
        email_verified
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    const result = await query(sql, [
      full_name,
      email,
      phone,
      password_hash,
      email_verified ? 1 : 0,
    ]);

    return {
      id: result.insertId,
      full_name,
      email,
      phone,
      email_verified: Boolean(email_verified),
    };
  }

  /**
   * Mark candidate email as verified
   * @param {Number} id
   */
  static async verifyEmail(id) {
    const sql = `
      UPDATE candidates
      SET email_verified = TRUE
      WHERE id = ?
    `;

    const result = await query(sql, [id]);

    if (result.affectedRows === 0) {
      return null;
    }

    return await this.findById(id);
  }

  /**
   * List all candidates with pagination
   * @param {Number} limit
   * @param {Number} offset
   */
  static async findAll(limit = 20, offset = 0) {
    const sql = `
      SELECT id, full_name, email, phone, email_verified, created_at
      FROM candidates
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [limit, offset]);
  }

  /**
   * Update candidate registration basic info
   * @param {Number} candidateId
   * @param {Object} info { fullName, phone }
   */
  static async updateBasicInfo(candidateId, { fullName, phone }) {
    const sql = `
      UPDATE candidates
      SET full_name = ?, phone = ?
      WHERE id = ?
    `;
    await query(sql, [fullName, phone, candidateId]);
  }

  /**
   * Find candidate profile combined with candidate registration details
   * @param {Number} candidateId
   */
  static async findProfileByCandidateId(candidateId) {
    const sql = `
      SELECT c.id AS candidate_id, c.full_name, c.email, c.phone,
             cp.profile_picture_url, cp.headline, cp.location, cp.bio, cp.open_to_work, cp.is_fresher, cp.no_certifications,
             cp.linkedin_url, cp.github_url, cp.portfolio_url,
             cp.education, cp.skills, cp.experience, cp.projects, cp.certifications,
             cp.achievements, cp.preferences, cp.profile_completion, cp.updated_at,
             (SELECT COUNT(*) FROM candidate_resumes cr WHERE cr.candidate_id = c.id) AS resume_count
      FROM candidates c
      LEFT JOIN candidate_profiles cp ON c.id = cp.candidate_id
      WHERE c.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [candidateId]);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];

    const parseJson = (val) => {
      if (!val) return [];
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return []; }
      }
      return val;
    };

    const parseJsonObject = (val) => {
      if (!val) return {};
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return {}; }
      }
      return val;
    };

    const resumeCount = Number(row.resume_count || 0);

    return {
      candidateId: row.candidate_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone === '0000000000' ? '' : (row.phone || ''),
      profilePictureUrl: row.profile_picture_url || '',
      headline: row.headline || '',
      location: row.location || '',
      bio: row.bio || '',
      openToWork: row.open_to_work !== null && row.open_to_work !== undefined ? Boolean(row.open_to_work) : true,
      isFresher: Boolean(row.is_fresher),
      noCertifications: Boolean(row.no_certifications),
      linkedinUrl: row.linkedin_url || '',
      githubUrl: row.github_url || '',
      portfolioUrl: row.portfolio_url || '',
      education: parseJson(row.education),
      skills: parseJson(row.skills),
      experience: parseJson(row.experience),
      projects: parseJson(row.projects),
      certifications: parseJson(row.certifications),
      achievements: parseJson(row.achievements),
      preferences: parseJsonObject(row.preferences),
      profileCompletion: row.profile_completion || 0,
      resumeCount,
      hasResume: resumeCount > 0,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Upsert candidate profile
   * Preserves all existing fields when partial updates are provided.
   * @param {Number} candidateId
   * @param {Object} data
   */
  static async upsertProfile(candidateId, data) {
    const existing = await this.findProfileByCandidateId(candidateId);

    const profilePictureUrl = data.profilePictureUrl !== undefined ? data.profilePictureUrl : (existing?.profilePictureUrl || null);
    const headline = data.headline !== undefined ? data.headline : (existing?.headline || '');
    const location = data.location !== undefined ? data.location : (existing?.location || '');
    const bio = data.bio !== undefined ? data.bio : (existing?.bio || '');
    const openToWork = data.openToWork !== undefined ? Boolean(data.openToWork) : (existing?.openToWork ?? true);
    const isFresher = data.isFresher !== undefined ? Boolean(data.isFresher) : Boolean(existing?.isFresher);
    const noCertifications = data.noCertifications !== undefined ? Boolean(data.noCertifications) : Boolean(existing?.noCertifications);
    const linkedinUrl = data.linkedinUrl !== undefined ? data.linkedinUrl : (existing?.linkedinUrl || '');
    const githubUrl = data.githubUrl !== undefined ? data.githubUrl : (existing?.githubUrl || '');
    const portfolioUrl = data.portfolioUrl !== undefined ? data.portfolioUrl : (existing?.portfolioUrl || '');
    const education = data.education !== undefined ? data.education : (existing?.education || []);
    const skills = data.skills !== undefined ? data.skills : (existing?.skills || []);
    const experience = data.experience !== undefined ? data.experience : (existing?.experience || []);
    const projects = data.projects !== undefined ? data.projects : (existing?.projects || []);
    const certifications = data.certifications !== undefined ? data.certifications : (existing?.certifications || []);
    const achievements = data.achievements !== undefined ? data.achievements : (existing?.achievements || []);
    const preferences = data.preferences !== undefined ? data.preferences : (existing?.preferences || {});
    const profileCompletion = data.profileCompletion !== undefined ? data.profileCompletion : (existing?.profileCompletion || 0);

    const stringify = (val) => JSON.stringify(val || []);
    const stringifyObj = (val) => JSON.stringify(val || {});

    const existingRows = await query('SELECT id FROM candidate_profiles WHERE candidate_id = ? LIMIT 1', [candidateId]);

    if (existingRows && existingRows.length > 0) {
      const sql = `
        UPDATE candidate_profiles SET
          profile_picture_url = ?, headline = ?, location = ?, bio = ?, open_to_work = ?, is_fresher = ?, no_certifications = ?,
          linkedin_url = ?, github_url = ?, portfolio_url = ?, education = ?, skills = ?, experience = ?,
          projects = ?, certifications = ?, achievements = ?, preferences = ?, profile_completion = ?
        WHERE candidate_id = ?
      `;
      await query(sql, [
        profilePictureUrl,
        headline,
        location,
        bio,
        openToWork ? 1 : 0,
        isFresher ? 1 : 0,
        noCertifications ? 1 : 0,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        stringify(education),
        stringify(skills),
        stringify(experience),
        stringify(projects),
        stringify(certifications),
        stringify(achievements),
        stringifyObj(preferences),
        profileCompletion,
        candidateId,
      ]);
    } else {
      const sql = `
        INSERT INTO candidate_profiles (
          candidate_id, profile_picture_url, headline, location, bio, open_to_work, is_fresher, no_certifications,
          linkedin_url, github_url, portfolio_url, education, skills, experience,
          projects, certifications, achievements, preferences, profile_completion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await query(sql, [
        candidateId,
        profilePictureUrl,
        headline,
        location,
        bio,
        openToWork ? 1 : 0,
        isFresher ? 1 : 0,
        noCertifications ? 1 : 0,
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        stringify(education),
        stringify(skills),
        stringify(experience),
        stringify(projects),
        stringify(certifications),
        stringify(achievements),
        stringifyObj(preferences),
        profileCompletion,
      ]);
    }

    return await this.findProfileByCandidateId(candidateId);
  }

  /**
   * Update ONLY profile completion percentage without touching any other fields
   * @param {Number} candidateId
   * @param {Number} profileCompletion
   */
  static async updateProfileCompletion(candidateId, profileCompletion) {
    const rows = await query('SELECT id FROM candidate_profiles WHERE candidate_id = ? LIMIT 1', [candidateId]);
    if (rows && rows.length > 0) {
      await query('UPDATE candidate_profiles SET profile_completion = ? WHERE candidate_id = ?', [profileCompletion, candidateId]);
    } else {
      await query('INSERT INTO candidate_profiles (candidate_id, profile_completion) VALUES (?, ?)', [candidateId, profileCompletion]);
    }
    return this.findProfileByCandidateId(candidateId);
  }

  /** Store or replace the authenticated candidate's profile image. */
  static async updateProfilePicture(candidateId, profilePictureUrl) {
    const rows = await query('SELECT id FROM candidate_profiles WHERE candidate_id = ? LIMIT 1', [candidateId]);
    if (rows && rows.length > 0) {
      await query('UPDATE candidate_profiles SET profile_picture_url = ? WHERE candidate_id = ?', [profilePictureUrl, candidateId]);
    } else {
      await query('INSERT INTO candidate_profiles (candidate_id, profile_picture_url) VALUES (?, ?)', [candidateId, profilePictureUrl]);
    }
    return this.findProfileByCandidateId(candidateId);
  }

  /**
   * Update candidate password hash
   * @param {Number} id
   * @param {String} passwordHash
   */
  static async updatePassword(id, passwordHash) {
    const sql = `UPDATE candidates SET password_hash = ? WHERE id = ?`;
    await query(sql, [passwordHash, id]);
    return true;
  }
}

module.exports = CandidateModel;
