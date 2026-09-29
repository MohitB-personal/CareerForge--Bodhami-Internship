const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const CompanyModel = require('../models/companyModel');
const { generateToken } = require('../utils/tokenUtils');
const { generateOTP, saveOTP } = require('../utils/otpService');
const { sendOTPEmail, sendDocumentVerificationEmail } = require('../utils/emailService');
const { verifyPincode } = require('../utils/pincodeService');
const { validatePhoneInput } = require('../utils/validators');
const { getFrontendUrl, getBackendUrl } = require('../utils/urlHelper');

const documentTypes = new Set([
  'GST Certificate',
  'Incorporation Certificate',
  'Registration Certificate',
  'Company PAN Card',
  'Address Proof',
  'Other',
]);

/**
 * Register Company
 * POST /api/v1/companies/register
 */
const registerCompany = async (req, res, next) => {
  try {
    const {
      companyName,
      companyType,
      companyEmail,
      phone,
      website,
      gstin,
      pincode,
      password,
    } = req.sanitizedBody || req.body;

    // Normalize GSTIN
    const normalizedGSTIN = gstin.trim().toUpperCase();

    // Check duplicate company email
    const existingEmail = await CompanyModel.findByEmail(companyEmail);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'A company account with this email address already exists.',
        errors: {
          companyEmail: 'Company email is already registered.',
        },
      });
    }

    // Check duplicate GSTIN
    const existingGstin = await CompanyModel.findByGstin(normalizedGSTIN);
    if (existingGstin) {
      return res.status(409).json({
        success: false,
        message: 'A company with this GSTIN number is already registered.',
        errors: {
          gstin: 'GSTIN number is already in use.',
        },
      });
    }

    // Verify Pincode before creating the company
    const normalizedPincode = String(pincode || '').trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Company registration requires a valid Pincode.',
        errors: {
          pincode: 'Please enter a valid 6-digit Pincode.',
        },
        data: {
          valid: false,
          pincode: normalizedPincode,
        },
      });
    }

    const pincodeData = await verifyPincode(normalizedPincode);

    if (!pincodeData.valid) {
      return res.status(400).json({
        success: false,
        message: 'Company registration requires a valid Pincode.',
        errors: {
          pincode: 'Please enter a valid Pincode.',
        },
        data: {
          valid: false,
          pincode: normalizedPincode,
        },
      });
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create company as email-unverified
    const newCompany = await CompanyModel.create({
      company_name: companyName,
      company_type: companyType,
      email: companyEmail,
      phone,
      website,
      gstin: normalizedGSTIN,
      pincode: normalizedPincode,
      password_hash,
    });

    // Generate a 6-digit OTP
    const otp = generateOTP();

    // Store OTP temporarily in server memory
    // OTP is NOT stored in MySQL
    saveOTP(companyEmail, otp, {
      role: 'company',
      userId: newCompany.id,
    });

    // Send OTP to company's email
    await sendOTPEmail(companyEmail, otp, 'company');

    return res.status(201).json({
      success: true,
      message:
        'Company registration successful. Please verify your email using the OTP sent to your email address.',
      data: {
        verificationRequired: true,
        email: newCompany.email,
        role: 'company',
        company: {
          id: newCompany.id,
          companyName: newCompany.company_name,
          companyType: newCompany.company_type,
          email: newCompany.email,
          phone: newCompany.phone,
          website: newCompany.website,
          gstin: newCompany.gstin,
          verificationStatus: newCompany.verification_status,
          role: 'company',
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Company Login
 * POST /api/v1/companies/login
 */
const loginCompany = async (req, res, next) => {
  try {
    const { email, password } = req.sanitizedBody || req.body;

    // Find company by email
    const company = await CompanyModel.findByEmail(email);

    if (!company) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
        errors: { email: 'No company account found with this email.' },
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      password,
      company.password_hash
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email address or password.',
        errors: { password: 'Incorrect password entered.' },
      });
    }

    // Check email verification
    if (!company.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in.',
        data: {
          verificationRequired: true,
          email: company.email,
          role: 'company',
        },
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: company.id,
      email: company.email,
      role: 'company',
      name: company.company_name,
      verification_status: company.verification_status,
    });

    return res.status(200).json({
      success: true,
      message: 'Company login successful.',
      data: {
        company: {
          id: company.id,
          companyName: company.company_name,
          companyType: company.company_type,
          email: company.email,
          phone: company.phone,
          website: company.website,
          gstin: company.gstin,
          verificationStatus: company.verification_status,
          logoUrl: company.logo_url || '',
          profilePictureUrl: company.logo_url || '',
          role: 'company',
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to calculate company profile completion percentage dynamically.
 * 100% complete ONLY when all required company fields are filled AND the verification
 * document is uploaded AND the company is verified.
 */
const calculateCompanyProfileCompletion = (profile) => {
  if (!profile) return 0;
  let score = 0;

  const companyName = profile.companyName || profile.company_name;
  const companyType = profile.companyType || profile.company_type || profile.industry;
  const email = profile.email;
  const phone = profile.phone;
  const website = profile.website;

  // 1. Basic Company Information (20%)
  if (
    companyName?.trim() &&
    companyType?.trim() &&
    email?.trim() &&
    phone?.trim() &&
    website?.trim()
  ) {
    score += 20;
  } else if (companyName?.trim() && email?.trim()) {
    score += 10;
  }

  // 2. Headquarters & Address Details (20%)
  const headquarters = profile.headquarters || profile.location;
  const address = profile.address || profile.location;
  const pincode = profile.pincode;
  if (headquarters?.trim() && (address?.trim() || pincode?.trim())) {
    score += 20;
  } else if (headquarters?.trim() || address?.trim() || pincode?.trim()) {
    score += 10;
  }

  // 3. Corporate & Registration Details (20%)
  const gstin = profile.gstin || profile.cin;
  const companySize = profile.companySize || profile.company_size;
  const foundedYear = profile.foundedYear || profile.founded_year;
  if (gstin && companySize?.trim() && foundedYear) {
    score += 20;
  } else if (gstin || companySize?.trim()) {
    score += 10;
  }

  // 4. Social Links (10%)
  const links = profile.socialLinks || {};
  const linkedinUrl = links.linkedinUrl || profile.linkedin_url;
  const twitterUrl = links.twitterUrl || profile.twitter_url;
  const facebookUrl = links.facebookUrl || profile.facebook_url;
  if (
    linkedinUrl?.trim() ||
    twitterUrl?.trim() ||
    facebookUrl?.trim()
  ) {
    score += 10;
  }

  // 5. Verification Document Uploaded (15%)
  const hasDocuments = Array.isArray(profile.documents) && profile.documents.length > 0;
  if (hasDocuments) {
    score += 15;
  }

  // 6. Company Verification Status (15%)
  const hasVerifiedDoc = Array.isArray(profile.documents) && profile.documents.some(
    d => (d.verificationStatus || d.verification_status || '').toString().toLowerCase() === 'verified'
  );
  const isVerified = hasVerifiedDoc || (profile.verificationStatus || profile.verification_status || '')
    .toString()
    .toLowerCase() === 'verified';
  if (isVerified && hasDocuments) {
    score += 15;
  }

  return Math.min(100, Math.max(0, score));
};

/**
 * Get Current Company Profile
 * GET /api/v1/companies/profile or GET /api/v1/companies/me
 */
const getCompanyProfile = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    let profile = await CompanyModel.findFullProfile(companyId);

    if (!profile) {
      const company = await CompanyModel.findById(companyId);
      if (!company) {
        return res.status(404).json({
          success: false,
          message: 'Company profile not found.',
        });
      }
      profile = {
        companyId: company.id,
        companyName: company.company_name,
        companyType: company.company_type,
        email: company.email,
        phone: company.phone,
        website: company.website || '',
        gstin: company.gstin,
        pincode: company.pincode,
        verificationStatus: company.verification_status,
        emailVerified: company.email_verified,
        logoUrl: '',
        industry: company.company_type || '',
        companySize: '',
        foundedYear: null,
        headquarters: '',
        address: '',
        cin: '',
        socialLinks: { linkedinUrl: '', twitterUrl: '', facebookUrl: '' },
        profileCompletion: 0,
        documents: [],
        createdAt: company.created_at,
        role: 'company',
      };
    }

    const computedCompletion = calculateCompanyProfileCompletion(profile);
    if (profile.profileCompletion !== computedCompletion) {
      profile.profileCompletion = computedCompletion;
      await CompanyModel.updateProfileCompletion(companyId, computedCompletion);
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Company Profile
 * PUT /api/v1/companies/profile
 */
const updateCompanyProfile = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const body = req.sanitizedBody || req.body;

    const existing = (await CompanyModel.findFullProfile(companyId)) || {};

    const updatedBasic = {
      companyName: body.companyName !== undefined ? body.companyName : existing.companyName,
      companyType: body.companyType !== undefined ? body.companyType : existing.companyType,
      phone: body.phone !== undefined ? body.phone : existing.phone,
      website: body.website !== undefined ? body.website : existing.website,
      pincode: body.pincode !== undefined ? body.pincode : existing.pincode,
    };

    if (body.phone !== undefined && body.phone !== null && String(body.phone).trim() !== '') {
      const phoneErr = validatePhoneInput(body.phone);
      if (phoneErr) {
        return res.status(400).json({ success: false, message: phoneErr, errors: { phone: phoneErr } });
      }
    }

    await CompanyModel.updateBasicInfo(companyId, updatedBasic);

    const mergedData = {
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : (existing.logoUrl || ''),
      industry: body.industry !== undefined ? body.industry : (existing.industry || updatedBasic.companyType || ''),
      companySize: body.companySize !== undefined ? body.companySize : (existing.companySize || ''),
      foundedYear: body.foundedYear !== undefined ? body.foundedYear : existing.foundedYear,
      headquarters: body.headquarters !== undefined ? body.headquarters : (existing.headquarters || ''),
      address: body.address !== undefined ? body.address : (existing.address || ''),
      cin: body.cin !== undefined ? body.cin : (existing.cin || ''),
      socialLinks: body.socialLinks !== undefined ? body.socialLinks : (existing.socialLinks || {}),
    };

    const fullObjForCompletion = {
      ...existing,
      ...updatedBasic,
      ...mergedData,
    };
    mergedData.profileCompletion = calculateCompanyProfileCompletion(fullObjForCompletion);

    const savedProfile = await CompanyModel.upsertProfile(companyId, mergedData);

    return res.status(200).json({
      success: true,
      message: 'Company profile updated successfully.',
      data: savedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Company Logo
 * POST /api/v1/companies/profile/logo
 */
const uploadCompanyLogo = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided.',
      });
    }

    const base64Str = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'image/png';
    const logoUrl = `data:${mimeType};base64,${base64Str}`;

    await CompanyModel.updateLogo(companyId, logoUrl);

    const updatedProfile = await CompanyModel.findFullProfile(companyId);
    if (updatedProfile) {
      updatedProfile.profileCompletion = calculateCompanyProfileCompletion(updatedProfile);
      await CompanyModel.upsertProfile(companyId, { profileCompletion: updatedProfile.profileCompletion });
    }

    return res.status(200).json({
      success: true,
      message: 'Company logo saved to database successfully.',
      data: {
        logoUrl,
        profile: updatedProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Company Verification Document
 * POST /api/v1/companies/profile/documents
 */
const uploadVerificationDocument = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No document file provided.',
      });
    }

    const { docName, docType } = req.body || {};
    const documentName = (docName && docName.trim()) || req.file.originalname;
    const documentType = docType && docType.trim();
    if (!documentTypes.has(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Select a valid document type before submitting.',
      });
    }

    const base64Str = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'application/pdf';
    const fileUrl = `data:${mimeType};base64,${base64Str}`;

    const newDoc = await CompanyModel.addDocument(companyId, {
      docName: documentName,
      docType: documentType,
      fileUrl,
    });

    // A token is deliberately generated after the document exists, so it can be
    // permanently bound to this exact document. Only its hash is persisted.
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await CompanyModel.createVerificationToken(newDoc.id, tokenHash, expiresAt);

    const company = await CompanyModel.findById(companyId);
    const backendUrl = getBackendUrl(req);
    const verificationBaseUrl = `${backendUrl}/api/v1/doc-verification/${rawVerificationToken}`;
    const verificationRecipient = process.env.DOCUMENT_VERIFICATION_EMAIL || 'careerforge.verify@gmail.com';

    // Email delivery must not undo a successful document upload. The token stays
    // valid so the notification can be retried or inspected by an operator.
    try {
      await sendDocumentVerificationEmail(verificationRecipient, {
        companyName: company?.company_name || 'Unknown company',
        docName: newDoc.docName,
        docType: newDoc.docType,
        uploadDate: newDoc.uploadDate,
        viewUrl: `${verificationBaseUrl}/view`,
        verifyUrl: `${verificationBaseUrl}/verify`,
        rejectUrl: `${verificationBaseUrl}/reject`,
      });
    } catch (emailError) {
      console.error(`Document verification email could not be sent for document ${newDoc.id}:`, emailError.message);
    }

    // Automatically set verification status to pending if not already verified
    const existingDocs = await CompanyModel.getDocuments(companyId);
    const hasAnyVerifiedDoc = Array.isArray(existingDocs) && existingDocs.some(
      (d) => (d.verificationStatus || '').toString().toLowerCase() === 'verified'
    );
    if (!hasAnyVerifiedDoc && company && company.verification_status !== 'verified') {
      await CompanyModel.updateVerificationStatus(companyId, 'pending');
    }

    const fullProfile = await CompanyModel.findFullProfile(companyId);
    if (fullProfile) {
      fullProfile.profileCompletion = calculateCompanyProfileCompletion(fullProfile);
      await CompanyModel.upsertProfile(companyId, { profileCompletion: fullProfile.profileCompletion });
    }

    return res.status(201).json({
      success: true,
      message: 'Verification document saved to database successfully.',
      data: {
        document: newDoc,
        profile: fullProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

const buildCompanyVerificationUrl = (target = '/company/profile') => {
  const frontendUrl = getFrontendUrl();
  if (typeof target === 'string' && target.includes('@')) {
    return `${frontendUrl}/verify-email?email=${encodeURIComponent(target)}&role=company`;
  }
  const safePath = typeof target === 'string' && target.startsWith('/') ? target : `/${target || 'company/profile'}`;
  return `${frontendUrl}${safePath}`;
};

const verificationPage = (title, message) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | CareerForge</title>
<script>
  try {
    localStorage.setItem('careerforge_doc_verified_at', Date.now().toString());
    if (window.BroadcastChannel) {
      var channel = new BroadcastChannel('careerforge_verification');
      channel.postMessage({ type: 'DOCUMENT_VERIFIED', timestamp: Date.now() });
      channel.close();
    }
  } catch(e) {}
</script>
</head>
<body style="font-family:Arial,sans-serif;max-width:620px;margin:48px auto;padding:0 20px;color:#1f2937"><h1>${title}</h1><p>${message}</p>
</body></html>`;

const getVerificationToken = async (rawToken) => {
  if (!/^[a-f0-9]{64}$/i.test(rawToken || '')) return { error: 'Invalid verification link.', status: 404 };
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const token = await CompanyModel.findToken(tokenHash);
  if (!token) return { error: 'Invalid verification link.', status: 404 };
  if (token.used_at) return { error: 'This verification link has already been used.', status: 410 };
  if (new Date(token.expires_at).getTime() <= Date.now()) return { error: 'This verification link has expired.', status: 410 };
  return { token };
};

/**
 * Serve the stored Base64 document through a normal HTTP response. The token
 * authenticates the reviewer without exposing predictable document-id URLs.
 * GET /api/v1/doc-verification/:token/view
 */
const handleViewVerificationDocument = async (req, res, next) => {
  try {
    const result = await getVerificationToken(req.params.token);
    if (result.error) return res.status(result.status).send(verificationPage('Document unavailable', result.error));

    const document = await CompanyModel.getDocumentById(result.token.document_id);
    if (!document) return res.status(404).send(verificationPage('Document unavailable', 'The document no longer exists.'));

    const dataUrlMatch = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(document.fileUrl || '');
    if (!dataUrlMatch) return res.status(422).send(verificationPage('Document unavailable', 'The stored document is not in a supported format.'));

    const mimeType = dataUrlMatch[1];
    const fileBuffer = Buffer.from(dataUrlMatch[2], 'base64');
    const safeFilename = encodeURIComponent(document.docName || 'verification-document');

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename*=UTF-8''${safeFilename}`,
      'Content-Length': fileBuffer.length,
      'X-Content-Type-Options': 'nosniff',
    });
    return res.send(fileBuffer);
  } catch (error) { next(error); }
};

/**
 * Serve stored document directly for authenticated company
 * GET /api/v1/companies/profile/documents/:docId/view
 */
const getCompanyDocumentFile = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const docId = Number(req.params.docId);
    if (!Number.isInteger(docId) || docId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid document ID.' });
    }

    const document = await CompanyModel.getDocumentById(docId);
    if (!document || document.companyId !== companyId) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const dataUrlMatch = /^data:([^;,]+);base64,([\s\S]+)$/i.exec(document.fileUrl || '');
    if (!dataUrlMatch) {
      return res.status(422).json({ success: false, message: 'The stored document format is invalid.' });
    }

    const mimeType = dataUrlMatch[1];
    const fileBuffer = Buffer.from(dataUrlMatch[2], 'base64');
    const safeFilename = encodeURIComponent(document.docName || 'verification-document');

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `inline; filename*=UTF-8''${safeFilename}`,
      'Content-Length': fileBuffer.length,
      'X-Content-Type-Options': 'nosniff',
    });
    return res.send(fileBuffer);
  } catch (error) { next(error); }
};

const handleVerifyDocument = async (req, res, next) => {
  try {
    const result = await getVerificationToken(req.params.token);
    if (result.error) return res.status(result.status).send(verificationPage('Verification unavailable', result.error));
    if (!await CompanyModel.markTokenUsed(result.token.id)) {
      return res.status(410).send(verificationPage('Verification unavailable', 'This verification link has already been used or has expired.'));
    }
    await CompanyModel.updateDocumentStatus(result.token.document_id, 'verified', null);

    const doc = await CompanyModel.getDocumentById(result.token.document_id);
    if (doc?.companyId) {
      await CompanyModel.updateVerificationStatus(doc.companyId, 'verified');
      const updatedProfile = await CompanyModel.findFullProfile(doc.companyId);
      if (updatedProfile) {
        updatedProfile.profileCompletion = calculateCompanyProfileCompletion(updatedProfile);
        await CompanyModel.updateProfileCompletion(doc.companyId, updatedProfile.profileCompletion);
      }
    }

    return res.send(verificationPage('Document verified', 'The document and company have been marked as verified. This link can no longer be used.'));
  } catch (error) { next(error); }
};

const handleRejectDocumentPage = async (req, res, next) => {
  try {
    const result = await getVerificationToken(req.params.token);
    if (result.error) return res.status(result.status).send(verificationPage('Verification unavailable', result.error));
    const token = encodeURIComponent(req.params.token);
    return res.send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Reject document | CareerForge</title></head>
      <body style="font-family:Arial,sans-serif;max-width:620px;margin:48px auto;padding:0 20px;color:#1f2937"><h1>Reject document</h1><p>Provide a reason for the company. This action cannot be undone.</p>
      <form method="post" action="/api/v1/doc-verification/${token}/reject"><label for="reason" style="display:block;font-weight:bold;margin-bottom:8px">Rejection reason</label><textarea id="reason" name="reason" required maxlength="2000" rows="6" style="width:100%;box-sizing:border-box;padding:10px"></textarea><button type="submit" style="margin-top:16px;padding:10px 16px;background:#dc2626;color:#fff;border:0;border-radius:4px">Reject document</button></form></body></html>`);
  } catch (error) { next(error); }
};

const handleRejectDocumentSubmit = async (req, res, next) => {
  try {
    const result = await getVerificationToken(req.params.token);
    if (result.error) return res.status(result.status).send(verificationPage('Verification unavailable', result.error));
    const note = String(req.body?.reason || '').trim();
    if (!note) return res.status(400).send(verificationPage('Rejection reason required', 'Enter a reason before rejecting the document.'));
    if (note.length > 2000) return res.status(400).send(verificationPage('Rejection reason is too long', 'Use 2,000 characters or fewer.'));
    if (!await CompanyModel.markTokenUsed(result.token.id)) {
      return res.status(410).send(verificationPage('Verification unavailable', 'This verification link has already been used or has expired.'));
    }
    await CompanyModel.updateDocumentStatus(result.token.document_id, 'rejected', note);

    const doc = await CompanyModel.getDocumentById(result.token.document_id);
    if (doc?.companyId) {
      const docs = await CompanyModel.getDocuments(doc.companyId);
      const hasVerifiedDoc = docs.some(d => d.verificationStatus === 'verified' && d.id !== result.token.document_id);
      if (!hasVerifiedDoc) {
        await CompanyModel.updateVerificationStatus(doc.companyId, 'rejected');
      }
      const updatedProfile = await CompanyModel.findFullProfile(doc.companyId);
      if (updatedProfile) {
        updatedProfile.profileCompletion = calculateCompanyProfileCompletion(updatedProfile);
        await CompanyModel.updateProfileCompletion(doc.companyId, updatedProfile.profileCompletion);
      }
    }

    return res.send(verificationPage('Document rejected', 'The document has been rejected and the company has been notified.'));
  } catch (error) { next(error); }
};

/**
 * Delete Company Verification Document
 * DELETE /api/v1/companies/profile/documents/:docId
 */
const deleteVerificationDocument = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const { docId } = req.params;

    await CompanyModel.deleteDocument(docId, companyId);

    const remainingDocs = await CompanyModel.getDocuments(companyId);
    if (!remainingDocs || remainingDocs.length === 0) {
      await CompanyModel.updateVerificationStatus(companyId, 'pending');
    }

    const fullProfile = await CompanyModel.findFullProfile(companyId);

    if (fullProfile) {
      fullProfile.profileCompletion = calculateCompanyProfileCompletion(fullProfile);
      await CompanyModel.updateProfileCompletion(companyId, fullProfile.profileCompletion);
    }

    return res.status(200).json({
      success: true,
      message: 'Verification document deleted successfully.',
      data: fullProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Profile for Verification
 * POST /api/v1/companies/profile/submit-verification
 */
const submitForVerification = async (req, res, next) => {
  try {
    const companyId = req.user.id;
    const company = await CompanyModel.findById(companyId);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company account not found.',
      });
    }

    const docs = await CompanyModel.getDocuments(companyId);
    const hasAnyVerifiedDoc = Array.isArray(docs) && docs.some(
      (d) => (d.verificationStatus || '').toString().toLowerCase() === 'verified'
    );
    if (!hasAnyVerifiedDoc) {
      await CompanyModel.updateVerificationStatus(companyId, 'pending');
    }
    const updatedProfile = await CompanyModel.findFullProfile(companyId);

    return res.status(200).json({
      success: true,
      message: 'Company profile submitted for verification successfully.',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Verification Status (Admin or Internal Management)
 * PATCH /api/v1/companies/:id/verify
 */
const updateVerificationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'verified', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid verification status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const updatedCompany = await CompanyModel.updateVerificationStatus(id, status);
    if (!updatedCompany) {
      return res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
    }

    const fullProfile = await CompanyModel.findFullProfile(id);
    if (fullProfile) {
      fullProfile.profileCompletion = calculateCompanyProfileCompletion(fullProfile);
      await CompanyModel.updateProfileCompletion(id, fullProfile.profileCompletion);
    }

    return res.status(200).json({
      success: true,
      message: `Company verification status updated to '${status}'.`,
      data: updatedCompany,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Pincode
 * POST /api/v1/companies/verify-pincode
 */
const verifyCompanyPincode = async (req, res, next) => {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: 'Pincode is required.',
      });
    }

    const normalizedPincode = String(pincode).trim();

    if (!/^\d{6}$/.test(normalizedPincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Pincode format.',
        data: {
          valid: false,
        },
      });
    }

    const pincodeData = await verifyPincode(normalizedPincode);

    if (!pincodeData.valid) {
      return res.status(200).json({
        success: true,
        message: 'Pincode is not valid.',
        data: {
          valid: false,
          pincode: normalizedPincode,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pincode verified successfully.',
      data: {
        valid: true,
        pincode: pincodeData.pincode,
        postOffice: pincodeData.postOffice,
        district: pincodeData.district,
        state: pincodeData.state,
        region: pincodeData.region,
      },
    });
  } catch (error) {
    console.error(
      'Pincode verification error:',
      error.response?.data || error.message
    );

    return res.status(502).json({
      success: false,
      message: 'Unable to verify Pincode at the moment. Please try again.',
    });
  }
};

module.exports = {
  registerCompany,
  loginCompany,
  getCompanyProfile,
  updateCompanyProfile,
  uploadCompanyLogo,
  uploadVerificationDocument,
  getCompanyDocumentFile,
  handleViewVerificationDocument,
  handleVerifyDocument,
  handleRejectDocumentPage,
  handleRejectDocumentSubmit,
  deleteVerificationDocument,
  submitForVerification,
  updateVerificationStatus,
  verifyCompanyPincode,
  calculateCompanyProfileCompletion,
  buildCompanyVerificationUrl,
  getFrontendUrl,
  getBackendUrl,
};

