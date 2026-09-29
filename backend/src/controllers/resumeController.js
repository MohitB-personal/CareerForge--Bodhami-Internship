const fs = require('fs');
const path = require('path');
const ResumeModel = require('../models/resumeModel');
const CandidateModel = require('../models/candidateModel');
const resumeService = require('../services/resumeService');
const resumeStorageService = require('../services/resumeStorageService');
const llmService = require('../services/llmService');
const { renderResumePdf } = require('../services/pdfService');
const { RESUME_MAX_FILE_SIZE_BYTES } = require('../middleware/uploadMiddleware');
const { calculateProfileCompletion } = require('./candidateController');

const VALID_TEMPLATES = ['modern', 'classic', 'minimal'];

/**
 * Validate the template input coming from the request body.
 */
const parseTemplateInput = (templateId) => {
  const template = typeof templateId === 'string' ? templateId.trim().toLowerCase() : '';
  if (!VALID_TEMPLATES.includes(template)) {
    return null;
  }
  return template;
};

/**
 * Validate the resume content snapshot sent for saving.
 * The snapshot must match the generated shape and only strings, booleans and
 * plain arrays of plain objects are accepted (length-capped, no nesting).
 */
const parseResumeContentInput = (content) => {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return null;
  }

  const cleanText = (value) =>
    typeof value === 'string' ? value.slice(0, 2000) : '';

  const contact = content.contact && typeof content.contact === 'object' ? content.contact : {};
  const arrayInput = (value, mapItem) => {
    if (!Array.isArray(value)) return [];
    return value
      .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
      .slice(0, 50)
      .map(mapItem);
  };

  return {
    contact: {
      fullName: cleanText(contact.fullName),
      email: cleanText(contact.email),
      phone: cleanText(contact.phone),
      location: cleanText(contact.location),
      headline: cleanText(contact.headline),
      linkedin: cleanText(contact.linkedin),
      github: cleanText(contact.github),
      portfolio: cleanText(contact.portfolio),
    },
    summary: cleanText(content.summary),
    education: arrayInput(content.education, (edu) => ({
      degree: cleanText(edu.degree),
      field: cleanText(edu.field),
      school: cleanText(edu.school),
      startYear: cleanText(edu.startYear),
      endYear: cleanText(edu.endYear),
      grade: cleanText(edu.grade),
    })),
    skills: arrayInput(content.skills, (skill) => ({
      name: cleanText(skill.name),
      level: cleanText(skill.level),
      category: cleanText(skill.category),
    })),
    experience: arrayInput(content.experience, (exp) => ({
      title: cleanText(exp.title),
      company: cleanText(exp.company),
      location: cleanText(exp.location),
      startDate: cleanText(exp.startDate),
      endDate: cleanText(exp.endDate),
      current: Boolean(exp.current),
      description: cleanText(exp.description),
    })),
    projects: arrayInput(content.projects, (proj) => ({
      title: cleanText(proj.title),
      description: cleanText(proj.description),
      techStack: cleanText(proj.techStack),
      projectUrl: cleanText(proj.projectUrl),
      repoUrl: cleanText(proj.repoUrl),
    })),
    certifications: arrayInput(content.certifications, (cert) => ({
      name: cleanText(cert.name),
      organization: cleanText(cert.organization),
      issueDate: cleanText(cert.issueDate),
      expiryDate: cleanText(cert.expiryDate),
      credentialUrl: cleanText(cert.credentialUrl),
    })),
    achievements: arrayInput(content.achievements, (ach) => ({
      title: cleanText(ach.title),
      description: cleanText(ach.description),
      year: cleanText(ach.year),
    })),
    isFresher: Boolean(content.isFresher),
  };
};

/**
 * Check resume readiness for the authenticated candidate.
 * GET /api/v1/candidates/resume/profile-check
 */
const checkResumeProfileReadiness = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const profile = await CandidateModel.findProfileByCandidateId(candidateId);

    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          complete: false,
          missingSections: [
            {
              key: 'profile',
              label: 'Candidate Profile',
              hint: 'Your profile has not been created yet. Complete your profile to get started.',
            },
          ],
        },
      });
    }

    const readiness = resumeService.checkResumeReadiness(profile);

    return res.status(200).json({
      success: true,
      data: {
        complete: readiness.complete,
        missingSections: readiness.missingSections,
        profileCompletion: profile.profileCompletion || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List available resume templates.
 * GET /api/v1/candidates/resume/templates
 */
const getResumeTemplates = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        templates: resumeService.RESUME_TEMPLATES,
        llmConfigured: llmService.isLLMConfigured(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate (but do not persist) a personalized resume for the authenticated
 * candidate using their actual profile data.
 * POST /api/v1/candidates/resume/generate   body: { template }
 */
const generateResume = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const templateId = parseTemplateInput((req.sanitizedBody || req.body)?.template);

    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'A valid resume template is required (modern, classic or minimal).',
      });
    }

    const result = await resumeService.generateResume(candidateId, templateId);

    return res.status(200).json({
      success: true,
      message: 'Resume generated successfully.',
      data: result,
    });
  } catch (error) {
    if (error.missingSections) {
      return res.status(error.statusCode || 422).json({
        success: false,
        message: error.message,
        data: { missingSections: error.missingSections },
      });
    }
    next(error);
  }
};

/**
 * Save a generated resume to the authenticated candidate's account.
 * POST /api/v1/candidates/resume   body: { template, title, content, llmEnhanced, resumeId? }
 */
const saveResume = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const body = req.sanitizedBody || req.body;

    const templateId = parseTemplateInput(body?.template);
    if (!templateId) {
      return res.status(400).json({
        success: false,
        message: 'A valid resume template is required (modern, classic or minimal).',
      });
    }

    const content = parseResumeContentInput(body?.content);
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Resume content is required to save a resume.',
      });
    }

    const title =
      typeof body?.title === 'string' && body.title.trim()
        ? body.title.trim().slice(0, 255)
        : 'My Resume';

    // Update an existing resume when a resumeId owned by this candidate is
    // supplied; otherwise create a new one.
    let saved = null;
    if (body?.resumeId !== undefined && body?.resumeId !== null) {
      const resumeId = Number(body.resumeId);
      if (Number.isInteger(resumeId) && resumeId > 0) {
        saved = await ResumeModel.update(candidateId, resumeId, {
          template: templateId,
          title,
          content,
          llmEnhanced: Boolean(body?.llmEnhanced),
        });
      }
    }

    if (!saved) {
      saved = await ResumeModel.create(candidateId, {
        template: templateId,
        title,
        content,
        llmEnhanced: Boolean(body?.llmEnhanced),
      });
    }

    try {
      const profile = await CandidateModel.findProfileByCandidateId(candidateId);
      if (profile) {
        const score = calculateProfileCompletion(profile, true);
        await CandidateModel.updateProfileCompletion(candidateId, score);
      }
    } catch (profileErr) {
      console.warn('Failed to update candidate profile completion on saveResume:', profileErr.message);
    }

    return res.status(201).json({
      success: true,
      message: body?.resumeId && saved ? 'Resume updated successfully.' : 'Resume saved successfully.',
      data: { resume: saved },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sanitize an uploaded file's original name for safe storage/display.
 * Keeps the basename only, strips control characters and quotes.
 */
const sanitizeOriginalFilename = (raw) => {
  const base = path.basename(String(raw || 'resume.pdf')).slice(0, 200);
  const cleaned = base.replace(/[\x00-\x1f\x7f]/g, '').replace(/["\\]/g, '').trim();
  return cleaned.length > 0 ? cleaned : 'resume.pdf';
};

/**
 * Upload an existing PDF resume for the authenticated candidate.
 * The file is validated on the backend (extension + MIME via multer, PDF
 * signature via magic bytes, size via multer limits) and stored on the
 * filesystem — only metadata goes into the database.
 * POST /api/v1/candidates/resume/upload   (multipart: file field 'resume')
 */
const uploadResume = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const file = req.file;

    if (!file || !file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a PDF file to upload.',
      });
    }

    // Defense in depth: re-check the size even though multer already enforces it.
    if (file.size > RESUME_MAX_FILE_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the maximum allowed size.',
      });
    }

    // Never trust the client: re-validate the actual PDF content signature.
    if (!resumeStorageService.isPdfBuffer(file.buffer)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid PDF file.',
      });
    }

    const originalFilename = sanitizeOriginalFilename(file.originalname);
    const title =
      originalFilename.replace(/\.pdf$/i, '').slice(0, 255) || 'My Resume';

    // 1. Store the PDF on the filesystem (outside the public /uploads root).
    const stored = await resumeStorageService.saveResumePdf(candidateId, file.buffer);

    // 2. Persist the metadata record; clean up the file if the insert fails.
    try {
      const resume = await ResumeModel.createUploaded(candidateId, {
        title,
        originalFilename,
        storagePath: stored.storagePath,
        fileSize: stored.size,
        mimeType: 'application/pdf',
      });

      try {
        const profile = await CandidateModel.findProfileByCandidateId(candidateId);
        if (profile) {
          const score = calculateProfileCompletion(profile, true);
          await CandidateModel.updateProfileCompletion(candidateId, score);
        }
      } catch (profileErr) {
        console.warn('Failed to update candidate profile completion on uploadResume:', profileErr.message);
      }

      return res.status(201).json({
        success: true,
        message: 'Resume uploaded successfully.',
        data: { resume },
      });
    } catch (dbError) {
      await resumeStorageService.removeStoredResume(stored.storagePath).catch(() => {});
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
};

/**
 * List all saved resumes of the authenticated candidate (metadata only).
 * GET /api/v1/candidates/resume
 */
const getSavedResumes = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const resumes = await ResumeModel.findAllByCandidateId(candidateId);

    return res.status(200).json({
      success: true,
      data: { resumes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve one saved resume (content included). Ownership is enforced by the
 * model query (id + candidate_id), so another candidate's resume is 404.
 * GET /api/v1/candidates/resume/:id
 */
const getSavedResume = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const resumeId = Number(req.params?.id);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume id.',
      });
    }

    const resume = await ResumeModel.findByCandidateIdAndResumeId(candidateId, resumeId);
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: { resume },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a saved resume owned by the authenticated candidate.
 * For uploaded resumes the stored PDF file is removed from the filesystem as
 * well. Ownership is enforced by the model queries (id + candidate_id).
 * DELETE /api/v1/candidates/resume/:id
 */
const deleteSavedResume = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const resumeId = Number(req.params?.id);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume id.',
      });
    }

    // Internal lookup that includes the storage reference (never returned to
    // the client) so the stored PDF of an uploaded resume can be removed too.
    const resume = await ResumeModel.findOwnedResumeWithFile(candidateId, resumeId);

    const deleted = await ResumeModel.delete(candidateId, resumeId);
    if (!deleted || !resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    // Remove the stored PDF file for uploaded resumes. The DB record is already
    // gone, so the file could never be accessed again — failures are logged but
    // do not block the deletion response.
    if (resume.resumeType === 'uploaded' && resume.storagePath) {
      try {
        await resumeStorageService.removeStoredResume(resume.storagePath);
      } catch (fileError) {
        console.error('Could not remove stored resume file:', fileError.message);
      }
    }

    try {
      const remaining = await ResumeModel.findAllByCandidateId(candidateId);
      const hasResume = remaining && remaining.length > 0;
      const profile = await CandidateModel.findProfileByCandidateId(candidateId);
      if (profile) {
        const score = calculateProfileCompletion(profile, hasResume);
        await CandidateModel.updateProfileCompletion(candidateId, score);
      }
    } catch (profileErr) {
      console.warn('Failed to update candidate profile completion on deleteSavedResume:', profileErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Resume deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a saved resume as a real A4 PDF rendered with the saved template.
 * Ownership is enforced (another candidate's resume is 404).
 * GET /api/v1/candidates/resume/:id/pdf
 */
const downloadResumePdf = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const resumeId = Number(req.params?.id);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume id.',
      });
    }

    const resume = await ResumeModel.findByCandidateIdAndResumeId(candidateId, resumeId);
    if (!resume || !resume.content) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    const pdfBuffer = await renderResumePdf(resume.content, resume.template);
    const fileName = `${(resume.content.contact?.fullName || 'resume')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase()}_resume_${resume.template}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * Stream the original uploaded PDF of an owned resume.
 * Ownership + resume type are enforced (another candidate's resume, generated
 * resumes and unknown ids all resolve to 404). The stored file is served
 * unmodified — `?disposition=inline` enables browser PDF preview, the default
 * is a download attachment.
 * GET /api/v1/candidates/resume/:id/file
 */
const getUploadedResumeFile = async (req, res, next) => {
  try {
    const candidateId = req.user.id;
    const resumeId = Number(req.params?.id);

    if (!Number.isInteger(resumeId) || resumeId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid resume id.',
      });
    }

    // Ownership enforced by candidate_id — another candidate's resume is 404.
    const resume = await ResumeModel.findOwnedResumeWithFile(candidateId, resumeId);
    if (!resume || resume.resumeType !== 'uploaded' || !resume.storagePath) {
      return res.status(404).json({
        success: false,
        message: 'Resume not found.',
      });
    }

    // Guard against path traversal; resolve returns null for unsafe refs.
    const absolutePath = resumeStorageService.resolveStoredResumePath(resume.storagePath);
    if (!absolutePath) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found.',
      });
    }

    let stat;
    try {
      stat = await fs.promises.stat(absolutePath);
    } catch (statError) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found.',
      });
    }
    if (!stat.isFile()) {
      return res.status(404).json({
        success: false,
        message: 'Resume file not found.',
      });
    }

    const disposition = req.query?.disposition === 'inline' ? 'inline' : 'attachment';
    const downloadName = resume.originalFilename || `${(resume.title || 'resume').replace(/\.pdf$/i, '')}.pdf`;
    const asciiName = downloadName.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stat.size);
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');

    const stream = fs.createReadStream(absolutePath);
    stream.on('error', (streamError) => {
      console.error('Failed to stream resume file:', streamError.message);
      res.destroy();
    });
    return stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkResumeProfileReadiness,
  getResumeTemplates,
  generateResume,
  saveResume,
  uploadResume,
  getSavedResumes,
  getSavedResume,
  deleteSavedResume,
  downloadResumePdf,
  getUploadedResumeFile,
};

