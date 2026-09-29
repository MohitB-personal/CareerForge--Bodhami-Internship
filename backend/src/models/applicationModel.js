const { query } = require('../config/db');

class ApplicationModel {
  /**
   * Helper to format step number from application status
   */
  static getStepFromStatus(status) {
    switch (status) {
      case 'Applied':
        return 1;
      case 'Under Review':
        return 2;
      case 'Shortlisted':
      case 'Interview':
        return 3;
      case 'Selected':
      case 'Rejected':
        return 4;
      default:
        return 1;
    }
  }

  /**
   * Helper to format date string
   */
  static formatDate(dateVal) {
    if (!dateVal) return 'Recently';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  /**
   * Create application
   */
  static async create({
    jobId,
    candidateId,
    companyId,
    resumeId = null,
    status = 'Applied',
    note = 'Application submitted via CareerForge.',
    matchScore = 0,
  }) {
    const sql = `
      INSERT INTO applications (
        job_id, candidate_id, company_id, resume_id, status, note, match_score
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const res = await query(sql, [
      jobId,
      candidateId,
      companyId,
      resumeId || null,
      status,
      note,
      matchScore,
    ]);

    return await this.findById(res.insertId);
  }

  /**
   * Find application by Candidate ID and Job ID (Check for existing application)
   */
  static async findByCandidateAndJob(candidateId, jobId) {
    const sql = `
      SELECT * FROM applications
      WHERE candidate_id = ? AND job_id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [candidateId, jobId]);
    return rows[0] || null;
  }

  /**
   * Find application by ID
   */
  static async findById(id) {
    const sql = `
      SELECT a.*,
             j.title AS job_title, j.category AS job_category, j.location AS job_location,
             j.employment_type AS job_type, j.salary_range AS job_salary, j.experience_required,
             j.skills AS job_skills,
             c.company_name, cp.logo_url AS company_logo,
             cand.full_name AS candidate_name, cand.email AS candidate_email, cand.phone AS candidate_phone
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = a.company_id
      JOIN candidates cand ON cand.id = a.candidate_id
      LEFT JOIN company_profiles cp ON cp.company_id = c.id
      WHERE a.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      jobId: r.job_id,
      candidateId: r.candidate_id,
      companyId: r.company_id,
      resumeId: r.resume_id,
      title: r.job_title,
      company: r.company_name,
      companyLogo: r.company_logo || null,
      location: r.job_location,
      type: r.job_type,
      salary: r.job_salary || 'Competitive',
      candidateName: r.candidate_name,
      candidateEmail: r.candidate_email,
      candidatePhone: r.candidate_phone,
      status: r.status === 'Interview' ? 'Interview Scheduled' : r.status,
      rawStatus: r.status,
      step: this.getStepFromStatus(r.status),
      appliedDate: this.formatDate(r.created_at),
      interviewDate: r.interview_date || null,
      note: r.note || 'Application under evaluation.',
      matchScore: r.match_score || 85,
    };
  }

  /**
   * Find all applications submitted by candidate
   */
  static async findByCandidateId(candidateId) {
    const sql = `
      SELECT a.*,
             j.title AS job_title, j.category AS job_category, j.location AS job_location,
             j.employment_type AS job_type, j.salary_range AS job_salary,
             c.company_name, cp.logo_url AS company_logo
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = a.company_id
      LEFT JOIN company_profiles cp ON cp.company_id = c.id
      WHERE a.candidate_id = ?
      ORDER BY a.created_at DESC
    `;
    const rows = await query(sql, [candidateId]);
    return rows.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      candidateId: r.candidate_id,
      companyId: r.company_id,
      resumeId: r.resume_id,
      title: r.job_title,
      company: r.company_name,
      companyLogo: r.company_logo || null,
      location: r.job_location,
      type: r.job_type,
      salary: r.job_salary || 'Competitive',
      status: r.status === 'Interview' ? 'Interview Scheduled' : r.status,
      rawStatus: r.status,
      step: this.getStepFromStatus(r.status),
      appliedDate: this.formatDate(r.created_at),
      interviewDate: r.interview_date || null,
      note: r.note || 'Application under evaluation by recruitment team.',
      matchScore: r.match_score || 85,
    }));
  }

  /**
   * Find all applications received by company
   */
  static async findByCompanyId(companyId, jobId = null) {
    let sql = `
      SELECT a.*,
             j.title AS job_title, j.category AS job_category, j.skills AS job_skills,
             cand.full_name AS candidate_name, cand.email AS candidate_email, cand.phone AS candidate_phone,
             cp.profile_picture_url, cp.location AS candidate_location, cp.experience AS candidate_experience,
             cp.skills AS candidate_skills, cp.headline AS candidate_headline
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      JOIN candidates cand ON cand.id = a.candidate_id
      LEFT JOIN candidate_profiles cp ON cp.candidate_id = cand.id
      WHERE a.company_id = ?
    `;
    const params = [companyId];

    if (jobId && jobId !== 'All' && !isNaN(jobId)) {
      sql += ` AND a.job_id = ?`;
      params.push(parseInt(jobId, 10));
    }

    sql += ` ORDER BY a.match_score DESC, a.created_at DESC`;

    const rows = await query(sql, params);

    const parseJson = (val) => {
      if (!val) return [];
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch (e) { return []; }
      }
      return Array.isArray(val) ? val : [];
    };

    return rows.map((r) => {
      const skills = parseJson(r.candidate_skills);
      let expLabel = 'Fresher / Entry';
      const expArr = parseJson(r.candidate_experience);
      if (expArr && expArr.length > 0) {
        expLabel = `${expArr.length * 1.5} yrs exp`;
      }

      let matchLabel = 'Strong Match';
      if (r.match_score < 60) matchLabel = 'Low Match';
      else if (r.match_score < 75) matchLabel = 'Consider';
      else if (r.match_score < 85) matchLabel = 'Good Match';

      return {
        id: r.id,
        jobId: r.job_id,
        candidateId: r.candidate_id,
        companyId: r.company_id,
        resumeId: r.resume_id,
        name: r.candidate_name,
        email: r.candidate_email,
        phone: r.candidate_phone,
        location: r.candidate_location || 'India',
        appliedJob: r.job_title,
        appliedDate: this.formatDate(r.created_at),
        status: r.status,
        matchScore: r.match_score || 85,
        matchLabel,
        experience: expLabel,
        skills,
        headline: r.candidate_headline || '',
        note: r.note || '',
        interviewDate: r.interview_date || null,
      };
    });
  }

  /**
   * Update application status (company operation)
   */
  static async updateStatus(id, companyId, { status, note = null, interviewDate = null }) {
    let sql = `UPDATE applications SET status = ?`;
    const params = [status];

    if (note !== null && note !== undefined) {
      sql += `, note = ?`;
      params.push(note);
    }
    if (interviewDate !== null && interviewDate !== undefined) {
      sql += `, interview_date = ?`;
      params.push(interviewDate);
    }

    sql += ` WHERE id = ? AND company_id = ?`;
    params.push(id, companyId);

    await query(sql, params);
    return await this.findById(id);
  }

  /**
   * Delete / withdraw application (candidate operation)
   */
  static async delete(id, candidateId) {
    const sql = `DELETE FROM applications WHERE id = ? AND candidate_id = ?`;
    await query(sql, [id, candidateId]);
    return true;
  }
}

module.exports = ApplicationModel;
