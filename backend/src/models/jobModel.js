const { query } = require('../config/db');

class JobModel {
  /**
   * Helper to parse JSON skills array
   */
  static parseSkills(val) {
    if (!val) return [];
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        // Fallback if comma separated
        return val.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }
    return Array.isArray(val) ? val : [];
  }

  /**
   * Format job row for frontend consumption
   */
  static formatJob(row) {
    if (!row) return null;
    const skills = this.parseSkills(row.skills);
    
    // Calculate posted ago string
    const diffMs = Date.now() - new Date(row.created_at).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    let postedAgo = 'Just now';
    if (diffDays > 0) {
      postedAgo = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      postedAgo = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    }

    return {
      id: row.id,
      companyId: row.company_id,
      company: row.company_name || 'Verified Employer',
      companyLogo: row.logo_url || null,
      companyIndustry: row.company_industry || null,
      companySize: row.company_size || null,
      companyTagline: row.company_tagline || null,
      companyInfo: {
        name: row.company_name || 'Verified Employer',
        tagline: row.company_tagline || 'Verified Employer',
        industry: row.company_industry || row.category || 'Technology',
        size: row.company_size || '50-250 Employees',
        founded: row.founded_year ? String(row.founded_year) : '2020',
        website: row.company_website || '',
        headquarters: row.headquarters || row.location,
      },
      title: row.title,
      category: row.category,
      location: row.location,
      type: row.employment_type,
      workplace: row.workplace || 'On-site',
      experience: row.experience_required,
      salary: row.salary_range || 'Competitive',
      openings: row.openings || 1,
      summary: row.description,
      responsibilities: [
        'Perform core duties as outlined by the technical and functional project requirements',
        'Collaborate with cross-functional engineering and management teams',
        'Maintain high code quality, documentation, and operational excellence',
      ],
      requirements: [
        `Experience level: ${row.experience_required}`,
        `Required qualification: ${row.education || 'Bachelor degree or equivalent experience'}`,
        `Core skillsets: ${skills.join(', ')}`,
      ],
      benefits: [
        'Competitive base compensation & performance incentives',
        'Comprehensive healthcare insurance & annual learning stipend',
        'Flexible work arrangement and modern team environment',
      ],
      skills,
      education: row.education,
      deadline: row.deadline,
      status: row.status,
      postedDate: row.created_at,
      postedAgo,
      matchScore: row.matchScore || 85,
    };
  }

  /**
   * Create new job posting
   */
  static async create({
    companyId,
    title,
    category,
    location,
    employmentType,
    workplace = 'On-site',
    experienceRequired,
    salaryRange = null,
    openings = 1,
    description,
    skills = [],
    education = null,
    deadline = null,
    status = 'published',
  }) {
    const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : this.parseSkills(skills));
    
    const sql = `
      INSERT INTO jobs (
        company_id, title, category, location, employment_type, workplace,
        experience_required, salary_range, openings, description, skills,
        education, deadline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const res = await query(sql, [
      companyId,
      title,
      category,
      location,
      employmentType,
      workplace,
      experienceRequired,
      salaryRange || null,
      parseInt(openings, 10) || 1,
      description,
      skillsJson,
      education || null,
      deadline || null,
      status,
    ]);

    return await this.findById(res.insertId);
  }

  /**
   * Find job by ID
   */
  static async findById(id) {
    const sql = `
      SELECT j.*, c.company_name, c.email AS company_email, c.website AS company_website,
             cp.logo_url, cp.industry AS company_industry, cp.company_size,
             cp.headquarters, cp.founded_year
      FROM jobs j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN company_profiles cp ON cp.company_id = c.id
      WHERE j.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    if (!rows || rows.length === 0) return null;
    return this.formatJob(rows[0]);
  }

  /**
   * Find all jobs created by a specific company
   */
  static async findByCompanyId(companyId) {
    const sql = `
      SELECT j.*, c.company_name, cp.logo_url,
             (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
      FROM jobs j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN company_profiles cp ON cp.company_id = c.id
      WHERE j.company_id = ?
      ORDER BY j.created_at DESC
    `;
    const rows = await query(sql, [companyId]);
    return rows.map((row) => ({
      ...this.formatJob(row),
      applicationCount: row.application_count || 0,
    }));
  }

  /**
   * Find all published jobs with optional search and type filtering
   */
  static async findAllPublished(options = {}) {
    const search = options.search || '';
    const typeVal = (options.type || 'all').toLowerCase();
    const workplaceVal = (options.workplace || 'all').toLowerCase();
    const sort = options.sort || 'newest';

    let sql = `
      SELECT j.*, c.company_name, c.website AS company_website,
             cp.logo_url, cp.industry AS company_industry, cp.company_size,
             cp.headquarters, cp.founded_year
      FROM jobs j
      JOIN companies c ON c.id = j.company_id
      LEFT JOIN company_profiles cp ON cp.company_id = c.id
      WHERE j.status = 'published'
    `;
    const params = [];

    if (typeVal !== 'all') {
      if (typeVal === 'remote') {
        sql += ` AND (LOWER(j.workplace) = 'remote' OR LOWER(j.employment_type) LIKE '%remote%')`;
      } else {
        sql += ` AND (LOWER(j.employment_type) LIKE ? OR LOWER(j.workplace) LIKE ?)`;
        params.push(`%${typeVal}%`, `%${typeVal}%`);
      }
    }

    if (workplaceVal !== 'all') {
      sql += ` AND LOWER(j.workplace) = ?`;
      params.push(workplaceVal);
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(j.title) LIKE ? OR LOWER(c.company_name) LIKE ? OR LOWER(j.location) LIKE ? OR LOWER(j.category) LIKE ? OR LOWER(j.skills) LIKE ?)`;
      params.push(q, q, q, q, q);
    }

    if (sort === 'oldest') {
      sql += ` ORDER BY j.created_at ASC`;
    } else {
      sql += ` ORDER BY j.created_at DESC`;
    }

    const rows = await query(sql, params);
    return rows.map((row) => this.formatJob(row));
  }

  /**
   * Update job posting
   */
  static async update(id, companyId, data) {
    const {
      title,
      category,
      location,
      employmentType,
      workplace,
      experienceRequired,
      salaryRange,
      openings,
      description,
      skills,
      education,
      deadline,
      status,
    } = data;

    const skillsJson = JSON.stringify(Array.isArray(skills) ? skills : this.parseSkills(skills));

    const sql = `
      UPDATE jobs
      SET title = COALESCE(?, title),
          category = COALESCE(?, category),
          location = COALESCE(?, location),
          employment_type = COALESCE(?, employment_type),
          workplace = COALESCE(?, workplace),
          experience_required = COALESCE(?, experience_required),
          salary_range = COALESCE(?, salary_range),
          openings = COALESCE(?, openings),
          description = COALESCE(?, description),
          skills = COALESCE(?, skills),
          education = COALESCE(?, education),
          deadline = COALESCE(?, deadline),
          status = COALESCE(?, status)
      WHERE id = ? AND company_id = ?
    `;

    await query(sql, [
      title || null,
      category || null,
      location || null,
      employmentType || null,
      workplace || null,
      experienceRequired || null,
      salaryRange || null,
      openings ? parseInt(openings, 10) : null,
      description || null,
      skillsJson,
      education || null,
      deadline || null,
      status || null,
      id,
      companyId,
    ]);

    return await this.findById(id);
  }

  /**
   * Update job status (published/closed/draft)
   */
  static async updateStatus(id, companyId, status) {
    const sql = `UPDATE jobs SET status = ? WHERE id = ? AND company_id = ?`;
    await query(sql, [status, id, companyId]);
    return await this.findById(id);
  }

  /**
   * Delete job posting
   */
  static async delete(id, companyId) {
    const sql = `DELETE FROM jobs WHERE id = ? AND company_id = ?`;
    await query(sql, [id, companyId]);
    return true;
  }
}

module.exports = JobModel;
