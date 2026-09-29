const JobModel = require('../models/jobModel');
const CandidateModel = require('../models/candidateModel');
const CompanyModel = require('../models/companyModel');
const { calculateMatchingScore } = require('../services/matchingService');
const { calculateCompanyProfileCompletion } = require('./companyController');

/**
 * Get all published jobs for candidate search / public listing
 * GET /api/v1/jobs
 */
const getAllJobs = async (req, res, next) => {
  try {
    const { search = "", type = "all", workplace = "all", sort = "newest" } = req.query;

    let jobs = await JobModel.findAllPublished({ search, type, workplace, sort });

    // Fetch candidate profile to compute personalized profile-based match score if logged in
    let candidateProfile = null;
    if (req.user && req.user.role === 'candidate') {
      try {
        candidateProfile = await CandidateModel.findProfileByCandidateId(req.user.id);
      } catch (e) {
        // Ignored
      }
    }

    // Enrich jobs with calculated suitability score
    jobs = jobs.map((job) => {
      const matchScore = calculateMatchingScore(candidateProfile || {}, null, job);
      return {
        ...job,
        matchScore,
      };
    });

    // Sort by match score if requested
    if (sort === 'match') {
      jobs.sort((a, b) => b.matchScore - a.matchScore);
    }

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Single job details view
 * GET /api/v1/jobs/:id
 */
const getJobById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const job = await JobModel.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found.',
      });
    }

    // Fetch candidate profile to compute personalized match score if logged in
    let candidateProfile = null;
    if (req.user && req.user.role === 'candidate') {
      try {
        candidateProfile = await CandidateModel.findProfileByCandidateId(req.user.id);
      } catch (e) {
        // Ignored
      }
    }

    const matchScore = calculateMatchingScore(candidateProfile || {}, null, job);

    return res.status(200).json({
      success: true,
      data: {
        ...job,
        matchScore,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: Create new job posting
 * POST /api/v1/jobs
 */
const createJob = async (req, res, next) => {
  try {
    const companyId = req.user.id;

    // Verify Company Profile Completion and Verification Status
    const companyProfile = await CompanyModel.findFullProfile(companyId);
    const completion = calculateCompanyProfileCompletion(companyProfile || {});
    const isVerified = (companyProfile?.verificationStatus || '').toString().toLowerCase() === 'verified';

    if (completion < 100 || !isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please complete your company profile and get your company verified before posting a job.',
        profileCompletion: completion,
        verificationStatus: companyProfile?.verificationStatus || 'pending',
      });
    }

    const {
      title,
      category,
      location,
      employmentType,
      workplace = 'On-site',
      experienceRequired,
      salaryRange,
      openings = 1,
      description,
      skills,
      education,
      deadline,
      status = 'published',
    } = req.body;

    if (!title || !category || !location || !employmentType || !experienceRequired || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (title, category, location, employmentType, experienceRequired, description).',
      });
    }

    const newJob = await JobModel.create({
      companyId,
      title,
      category,
      location,
      employmentType,
      workplace,
      experienceRequired,
      salaryRange,
      openings,
      description,
      skills: Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s=>s.trim()) : []),
      education,
      deadline,
      status,
    });

    return res.status(201).json({
      success: true,
      message: `Job posting '${newJob.title}' created successfully!`,
      data: newJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: Get jobs posted by authenticated company
 * GET /api/v1/jobs/company/me
 */
const getCompanyJobs = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const jobs = await JobModel.findByCompanyId(companyId);

    return res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: Update job posting
 * PUT /api/v1/jobs/:id
 */
const updateJob = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;

    const existing = await JobModel.findById(id);
    if (!existing || existing.companyId !== companyId) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found or unauthorized to modify.',
      });
    }

    const updatedJob = await JobModel.update(id, companyId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Job posting updated successfully.',
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: Toggle job status (published / closed / draft)
 * PATCH /api/v1/jobs/:id/status
 */
const toggleJobStatus = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['draft', 'published', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Must be 'draft', 'published', or 'closed'.",
      });
    }

    const updatedJob = await JobModel.updateStatus(id, companyId, status);

    return res.status(200).json({
      success: true,
      message: `Job status updated to '${status}'.`,
      data: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: Delete job posting
 * DELETE /api/v1/jobs/:id
 */
const deleteJob = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;

    await JobModel.delete(id, companyId);

    return res.status(200).json({
      success: true,
      message: 'Job posting deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  getCompanyJobs,
  updateJob,
  toggleJobStatus,
  deleteJob,
};
