const { query } = require('../config/db');

class CompanyModel {
  /**
   * Find company by email
   * @param {String} email
   */
  static async findByEmail(email) {
    const sql = `
      SELECT c.id, c.company_name, c.company_type, c.email, c.phone, c.website, c.gstin,
             c.pincode, c.password_hash, c.verification_status, c.email_verified, c.created_at,
             cp.logo_url
      FROM companies c
      LEFT JOIN company_profiles cp ON c.id = cp.company_id
      WHERE c.email = ?
      LIMIT 1
    `;
    const rows = await query(sql, [email]);
    return rows[0] || null;
  }

  /**
   * Find company by GSTIN
   * @param {String} gstin
   */
  static async findByGstin(gstin) {
    const sql = `
      SELECT id, company_name, gstin
      FROM companies
      WHERE gstin = ?
      LIMIT 1
    `;
    const rows = await query(sql, [gstin.toUpperCase()]);
    return rows[0] || null;
  }

  /**
   * Find company by ID
   * @param {Number} id
   */
  static async findById(id) {
    const sql = `
      SELECT c.id, c.company_name, c.company_type, c.email, c.phone, c.website, c.gstin,
             c.pincode, c.verification_status, c.email_verified, c.created_at,
             cp.logo_url
      FROM companies c
      LEFT JOIN company_profiles cp ON c.id = cp.company_id
      WHERE c.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Create new company
   * @param {Object} companyData { company_name, company_type, email, phone, website, gstin, pincode, password_hash }
   */
  static async create({
    company_name,
    company_type,
    email,
    phone,
    website,
    gstin,
    pincode,
    password_hash,
  }) {
    const sql = `
      INSERT INTO companies (
        company_name,
        company_type,
        email,
        phone,
        website,
        gstin,
        pincode,
        password_hash,
        verification_status,
        email_verified
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', FALSE)
    `;

    const result = await query(sql, [
      company_name,
      company_type,
      email,
      phone,
      website || null,
      gstin.toUpperCase(),
      pincode,
      password_hash,
    ]);

    return {
      id: result.insertId,
      company_name,
      company_type,
      email,
      phone,
      website: website || null,
      gstin: gstin.toUpperCase(),
      pincode,
      verification_status: 'pending',
      email_verified: false,
    };
  }

  /**
   * Verify company email
   * @param {Number} id
   */
  static async verifyEmail(id) {
    const sql = `
      UPDATE companies
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
   * Update company verification status
   * @param {Number} id
   * @param {String} status 'pending' | 'verified' | 'rejected'
   */
  static async updateVerificationStatus(id, status) {
    const sql = `
      UPDATE companies
      SET verification_status = ?
      WHERE id = ?
    `;

    await query(sql, [status, id]);
    return this.findById(id);
  }

  /**
   * List all companies
   * @param {Number} limit
   * @param {Number} offset
   */
  static async findAll(limit = 20, offset = 0) {
    const sql = `
      SELECT id, company_name, company_type, email, phone, website, gstin,
       pincode, verification_status, email_verified, created_at
      FROM companies
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;

    return await query(sql, [limit, offset]);
  }

  /**
   * Find full profile details for a company
   * @param {Number} companyId
   */
  static async findFullProfile(companyId) {
    const sql = `
      SELECT 
        c.id as company_id, c.company_name, c.company_type, c.email, c.phone, c.website,
        c.gstin, c.pincode, c.verification_status, c.email_verified, c.created_at,
        cp.logo_url, cp.industry, cp.company_size, cp.founded_year,
        cp.headquarters, cp.address, cp.cin, cp.social_links, cp.profile_completion
      FROM companies c
      LEFT JOIN company_profiles cp ON c.id = cp.company_id
      WHERE c.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [companyId]);
    if (!rows[0]) return null;

    const row = rows[0];
    const documents = await this.getDocuments(companyId);

    const parseJson = (val, fallback) => {
      if (!val) return fallback;
      if (typeof val === 'object') return val;
      try { return JSON.parse(val); } catch (e) { return fallback; }
    };

    const hasVerifiedDoc = Array.isArray(documents) && documents.some(
      (d) => (d.verificationStatus || '').toString().toLowerCase() === 'verified'
    );
    const hasPendingDoc = Array.isArray(documents) && documents.some(
      (d) => (d.verificationStatus || '').toString().toLowerCase() === 'pending'
    );
    const hasRejectedDoc = Array.isArray(documents) && documents.some(
      (d) => (d.verificationStatus || '').toString().toLowerCase() === 'rejected'
    );

    let effectiveVerificationStatus = (row.verification_status || 'pending').toString().toLowerCase();
    if (hasVerifiedDoc) {
      effectiveVerificationStatus = 'verified';
      if (row.verification_status !== 'verified') {
        await this.updateVerificationStatus(companyId, 'verified');
      }
    } else if (documents && documents.length > 0 && !hasPendingDoc && hasRejectedDoc) {
      effectiveVerificationStatus = 'rejected';
      if (row.verification_status !== 'rejected') {
        await this.updateVerificationStatus(companyId, 'rejected');
      }
    }

    return {
      companyId: row.company_id,
      companyName: row.company_name,
      companyType: row.company_type,
      email: row.email,
      phone: row.phone,
      website: row.website || '',
      gstin: row.gstin,
      pincode: row.pincode,
      verificationStatus: effectiveVerificationStatus,
      emailVerified: row.email_verified,
      logoUrl: row.logo_url || '',
      industry: row.industry || row.company_type || '',
      companySize: row.company_size || '',
      foundedYear: row.founded_year || null,
      headquarters: row.headquarters || '',
      address: row.address || '',
      cin: row.cin || '',
      socialLinks: parseJson(row.social_links, { linkedinUrl: '', twitterUrl: '', facebookUrl: '' }),
      profileCompletion: row.profile_completion || 0,
      documents: documents || [],
      createdAt: row.created_at,
    };
  }

  /**
   * Update basic company information in companies table
   */
  static async updateBasicInfo(companyId, { companyName, companyType, phone, website, pincode }) {
    const sql = `
      UPDATE companies
      SET company_name = COALESCE(?, company_name),
          company_type = COALESCE(?, company_type),
          phone = COALESCE(?, phone),
          website = COALESCE(?, website),
          pincode = COALESCE(?, pincode)
      WHERE id = ?
    `;
    await query(sql, [companyName || null, companyType || null, phone || null, website || null, pincode || null, companyId]);
  }

  /**
   * Upsert company profile information in company_profiles table
   * Preserves all existing fields when partial updates are provided.
   */
  static async upsertProfile(companyId, data) {
    const checkSql = `SELECT * FROM company_profiles WHERE company_id = ? LIMIT 1`;
    const rows = await query(checkSql, [companyId]);
    const existing = rows[0] || null;

    const socialLinks = data.socialLinks !== undefined ? JSON.stringify(data.socialLinks) : (existing?.social_links || JSON.stringify({}));
    const profileCompletion = data.profileCompletion !== undefined ? data.profileCompletion : (existing?.profile_completion || 0);

    if (existing) {
      const updateSql = `
        UPDATE company_profiles
        SET logo_url = COALESCE(?, logo_url),
            industry = COALESCE(?, industry),
            company_size = COALESCE(?, company_size),
            founded_year = COALESCE(?, founded_year),
            headquarters = COALESCE(?, headquarters),
            address = COALESCE(?, address),
            cin = COALESCE(?, cin),
            social_links = ?,
            profile_completion = ?
        WHERE company_id = ?
      `;
      await query(updateSql, [
        data.logoUrl !== undefined ? data.logoUrl : null,
        data.industry !== undefined ? data.industry : null,
        data.companySize !== undefined ? data.companySize : null,
        data.foundedYear !== undefined ? parseInt(data.foundedYear, 10) : null,
        data.headquarters !== undefined ? data.headquarters : null,
        data.address !== undefined ? data.address : null,
        data.cin !== undefined ? data.cin : null,
        socialLinks,
        profileCompletion,
        companyId,
      ]);
    } else {
      const insertSql = `
        INSERT INTO company_profiles (
          company_id, logo_url, industry, company_size, founded_year,
          headquarters, address, cin, social_links, profile_completion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await query(insertSql, [
        companyId,
        data.logoUrl || null,
        data.industry || null,
        data.companySize || null,
        data.foundedYear ? parseInt(data.foundedYear, 10) : null,
        data.headquarters || null,
        data.address || null,
        data.cin || null,
        socialLinks,
        profileCompletion,
      ]);
    }

    return await this.findFullProfile(companyId);
  }

  /**
   * Update ONLY company profile completion percentage without touching any other fields
   * @param {Number} companyId
   * @param {Number} profileCompletion
   */
  static async updateProfileCompletion(companyId, profileCompletion) {
    const checkSql = `SELECT id FROM company_profiles WHERE company_id = ? LIMIT 1`;
    const rows = await query(checkSql, [companyId]);
    if (rows.length > 0) {
      await query(`UPDATE company_profiles SET profile_completion = ? WHERE company_id = ?`, [profileCompletion, companyId]);
    } else {
      await query(`INSERT INTO company_profiles (company_id, profile_completion) VALUES (?, ?)`, [companyId, profileCompletion]);
    }
    return this.findFullProfile(companyId);
  }

  /**
   * Update company logo URL
   */
  static async updateLogo(companyId, logoUrl) {
    const checkSql = `SELECT id FROM company_profiles WHERE company_id = ? LIMIT 1`;
    const rows = await query(checkSql, [companyId]);
    if (rows.length > 0) {
      await query(`UPDATE company_profiles SET logo_url = ? WHERE company_id = ?`, [logoUrl, companyId]);
    } else {
      await query(`INSERT INTO company_profiles (company_id, logo_url) VALUES (?, ?)`, [companyId, logoUrl]);
    }
  }

  /**
   * Add a company verification document
   */
  static async addDocument(companyId, { docName, docType, fileUrl }) {
    const sql = `
      INSERT INTO company_documents (company_id, doc_name, doc_type, file_url, verification_status)
      VALUES (?, ?, ?, ?, 'pending')
    `;
    const res = await query(sql, [companyId, docName, docType, fileUrl]);
    return {
      id: res.insertId,
      companyId,
      docName,
      docType,
      fileUrl,
      uploadDate: new Date(),
      verificationStatus: 'pending',
    };
  }

  /**
   * Get all company verification documents
   */
  static async getDocuments(companyId) {
    const sql = `
      SELECT id, company_id, doc_name, doc_type, file_url, upload_date,
             verification_status, verification_note
      FROM company_documents
      WHERE company_id = ?
      ORDER BY upload_date DESC, id DESC
    `;
    const rows = await query(sql, [companyId]);
    return rows.map((r) => ({
      id: r.id,
      companyId: r.company_id,
      docName: r.doc_name,
      docType: r.doc_type,
      fileUrl: r.file_url,
      uploadDate: r.upload_date,
      verificationStatus: r.verification_status,
      verificationNote: r.verification_note || null,
    }));
  }

  /**
   * Get a single company document by ID
   */
  static async getDocumentById(docId) {
    const sql = `
      SELECT cd.id, cd.company_id, cd.doc_name, cd.doc_type, cd.file_url,
             cd.upload_date, cd.verification_status, cd.verification_note,
             c.company_name, c.email AS company_email
      FROM company_documents cd
      JOIN companies c ON c.id = cd.company_id
      WHERE cd.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [docId]);
    if (!rows[0]) return null;
    const r = rows[0];
    return {
      id: r.id,
      companyId: r.company_id,
      companyName: r.company_name,
      companyEmail: r.company_email,
      docName: r.doc_name,
      docType: r.doc_type,
      fileUrl: r.file_url,
      uploadDate: r.upload_date,
      verificationStatus: r.verification_status,
      verificationNote: r.verification_note || null,
    };
  }

  /**
   * Update verification status (and optional note) on a document
   * @param {Number} docId
   * @param {'pending'|'verified'|'rejected'} status
   * @param {String|null} note  — rejection reason or null to clear
   */
  static async updateDocumentStatus(docId, status, note = null) {
    const sql = `
      UPDATE company_documents
      SET verification_status = ?,
          verification_note = ?
      WHERE id = ?
    `;
    await query(sql, [status, note, docId]);
  }

  /**
   * Delete a company document
   */
  static async deleteDocument(docId, companyId) {
    const sql = `DELETE FROM company_documents WHERE id = ? AND company_id = ?`;
    await query(sql, [docId, companyId]);
  }

  // ─── Verification Token Methods ────────────────────────────────────────────

  /**
   * Store a hashed verification token for a document
   * @param {Number} documentId
   * @param {String} tokenHash  SHA-256 hex of the raw token
   * @param {Date}   expiresAt
   */
  static async createVerificationToken(documentId, tokenHash, expiresAt) {
    const sql = `
      INSERT INTO company_document_verification_tokens
        (document_id, token_hash, expires_at)
      VALUES (?, ?, ?)
    `;
    const result = await query(sql, [documentId, tokenHash, expiresAt]);
    return { id: result.insertId, documentId, tokenHash, expiresAt };
  }

  /**
   * Find an active (unused, unexpired) token record by its hash
   * @param {String} tokenHash
   * @returns {Object|null}
   */
  static async findActiveToken(tokenHash) {
    const sql = `
      SELECT id, document_id, token_hash, expires_at, used_at, created_at
      FROM company_document_verification_tokens
      WHERE token_hash = ?
        AND used_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
    `;
    const rows = await query(sql, [tokenHash]);
    return rows[0] || null;
  }

  /**
   * Find ANY token record by its hash (including used/expired, for informative errors)
   * @param {String} tokenHash
   * @returns {Object|null}
   */
  static async findToken(tokenHash) {
    const sql = `
      SELECT id, document_id, token_hash, expires_at, used_at, created_at
      FROM company_document_verification_tokens
      WHERE token_hash = ?
      LIMIT 1
    `;
    const rows = await query(sql, [tokenHash]);
    return rows[0] || null;
  }

  /**
   * Mark a token as used
   * @param {Number} tokenId
   */
  static async markTokenUsed(tokenId) {
    const sql = `
      UPDATE company_document_verification_tokens
      SET used_at = NOW()
      WHERE id = ?
        AND used_at IS NULL
        AND expires_at > NOW()
    `;
    const result = await query(sql, [tokenId]);
    return result.affectedRows === 1;
  }

  /**
   * Update company password hash
   * @param {Number} id
   * @param {String} passwordHash
   */
  static async updatePassword(id, passwordHash) {
    const sql = `UPDATE companies SET password_hash = ? WHERE id = ?`;
    await query(sql, [passwordHash, id]);
    return true;
  }
}

module.exports = CompanyModel;
