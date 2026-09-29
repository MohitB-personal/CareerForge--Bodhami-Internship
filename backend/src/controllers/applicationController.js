const ApplicationModel = require('../models/applicationModel');
const JobModel = require('../models/jobModel');
const CandidateModel = require('../models/candidateModel');
const ResumeModel = require('../models/resumeModel');
const { calculateMatchingScore } = require('../services/matchingService');
const { calculateProfileCompletion } = require('./candidateController');

/**
 * Candidate: Submit application for a job
 * POST /api/v1/applications
 */
const applyForJob = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const { jobId, resumeId } = req.body;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: 'Job ID is required to submit an application.',
      });
    }

    // 1. Check if job exists
    const job = await JobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: `Job posting with ID '${jobId}' was not found.`,
      });
    }

    // 2. Prevent duplicate application
    const existing = await ApplicationModel.findByCandidateAndJob(candidateId, jobId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You have already applied for the '${job.title}' role at ${job.company}. Duplicate applications are not permitted.`,
      });
    }

    // 3. Fetch Candidate Profile & Saved Resume
    const candidateProfile = await CandidateModel.findProfileByCandidateId(candidateId);
    const resumes = await ResumeModel.findAllByCandidateId(candidateId);
    const hasResume = Boolean(resumes && resumes.length > 0);

    const completion = calculateProfileCompletion(candidateProfile || {}, hasResume);

    // Only candidates with 100% profile completion AND a saved/uploaded resume can apply
    if (completion < 100 || !hasResume) {
      return res.status(403).json({
        success: false,
        message: 'Please complete your profile and save your resume before applying for a job.',
        profileCompletion: completion,
        hasResume,
      });
    }

    let resume = null;
    if (resumeId) {
      resume = await ResumeModel.findById(resumeId, candidateId);
    }
    if (!resume && resumes.length > 0) {
      resume = resumes[0];
    }

    // 4. Calculate suitability matching score
    const matchScore = calculateMatchingScore(candidateProfile || {}, resume, job);

    // 5. Create Application record in MySQL
    const application = await ApplicationModel.create({
      jobId: job.id,
      candidateId,
      companyId: job.companyId,
      resumeId: resume ? resume.id : null,
      status: 'Applied',
      note: `Application submitted via CareerForge Quick Apply. Initial profile ATS match score: ${matchScore}%.`,
      matchScore,
    });

    return res.status(201).json({
      success: true,
      message: `Application for '${job.title}' submitted successfully!`,
      data: application,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Candidate: Get all my submitted applications
 * GET /api/v1/applications/me
 */
const getCandidateApplications = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const applications = await ApplicationModel.findByCandidateId(candidateId);

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: Get received applications for company jobs
 * GET /api/v1/applications/company/me
 */
const getCompanyApplications = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const { job } = req.query;

    const applications = await ApplicationModel.findByCompanyId(companyId, job);

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: View candidate full profile & resume
 * GET /api/v1/applications/candidate-profile/:candidateId
 */
const getCandidateFullProfileForCompany = async (req, res, next) => {
  try {
    const { candidateId } = req.params;

    const profile = await CandidateModel.findProfileByCandidateId(candidateId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Candidate profile not found.',
      });
    }

    // Also fetch candidate resumes
    const resumes = await ResumeModel.findAllByCandidateId(candidateId);

    return res.status(200).json({
      success: true,
      data: {
        ...profile,
        resumes: resumes || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company: Update application status (e.g. Applied -> Under Review -> Shortlisted -> Interview -> Selected / Rejected)
 * PATCH /api/v1/applications/:id/status
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const { id } = req.params;
    const { status, note, interviewDate } = req.body;

    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}.`,
      });
    }

    const updated = await ApplicationModel.updateStatus(id, companyId, {
      status,
      note: note !== undefined ? note : null,
      interviewDate: interviewDate !== undefined ? interviewDate : null,
    });

    return res.status(200).json({
      success: true,
      message: `Candidate application status updated to '${status}'.`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Candidate: Withdraw application
 * DELETE /api/v1/applications/:id
 */
const withdrawApplication = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const { id } = req.params;

    await ApplicationModel.delete(id, candidateId);

    return res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getCandidateApplications,
  getCompanyApplications,
  getCandidateFullProfileForCompany,
  updateApplicationStatus,
  withdrawApplication,
};
