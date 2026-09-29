const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateCompanyProfileCompletion } = require('../src/controllers/companyController');

test('calculateCompanyProfileCompletion returns 100% when at least one document is verified even if another is rejected', () => {
  const profile = {
    companyName: 'TechCorp Solutions',
    companyType: 'Information Technology',
    email: 'contact@techcorp.com',
    phone: '+91 9876543210',
    website: 'https://techcorp.com',
    headquarters: 'Bengaluru, Karnataka',
    address: 'Plot 45, Electronic City Phase 1',
    pincode: '560100',
    gstin: '29ABCDE1234F1Z5',
    companySize: '51-200',
    foundedYear: 2018,
    socialLinks: {
      linkedinUrl: 'https://linkedin.com/company/techcorp',
    },
    verificationStatus: 'rejected', // previously marked rejected by document A
    documents: [
      {
        id: 1,
        docName: 'incorporation_cert.pdf',
        docType: 'Incorporation Certificate',
        verificationStatus: 'rejected',
      },
      {
        id: 2,
        docName: 'gst_certificate.pdf',
        docType: 'GST Certificate',
        verificationStatus: 'verified',
      },
    ],
  };

  const completion = calculateCompanyProfileCompletion(profile);
  assert.equal(completion, 100, 'Profile completion should be 100% when at least one document is verified');
});

test('calculateCompanyProfileCompletion is reduced (85%) when only 1 document is submitted and it is rejected', () => {
  const profile = {
    companyName: 'TechCorp Solutions',
    companyType: 'Information Technology',
    email: 'contact@techcorp.com',
    phone: '+91 9876543210',
    website: 'https://techcorp.com',
    headquarters: 'Bengaluru, Karnataka',
    address: 'Plot 45, Electronic City Phase 1',
    pincode: '560100',
    gstin: '29ABCDE1234F1Z5',
    companySize: '51-200',
    foundedYear: 2018,
    socialLinks: {
      linkedinUrl: 'https://linkedin.com/company/techcorp',
    },
    verificationStatus: 'rejected',
    documents: [
      {
        id: 1,
        docName: 'incorporation_cert.pdf',
        docType: 'Incorporation Certificate',
        verificationStatus: 'rejected',
      },
    ],
  };

  const completion = calculateCompanyProfileCompletion(profile);
  assert.equal(completion, 85, 'Profile completion should be 85% when the submitted document is rejected');
});

test('calculateCompanyProfileCompletion is reduced (85%) when document is pending verification', () => {
  const profile = {
    companyName: 'TechCorp Solutions',
    companyType: 'Information Technology',
    email: 'contact@techcorp.com',
    phone: '+91 9876543210',
    website: 'https://techcorp.com',
    headquarters: 'Bengaluru, Karnataka',
    address: 'Plot 45, Electronic City Phase 1',
    pincode: '560100',
    gstin: '29ABCDE1234F1Z5',
    companySize: '51-200',
    foundedYear: 2018,
    socialLinks: {
      linkedinUrl: 'https://linkedin.com/company/techcorp',
    },
    verificationStatus: 'pending',
    documents: [
      {
        id: 1,
        docName: 'incorporation_cert.pdf',
        docType: 'Incorporation Certificate',
        verificationStatus: 'pending',
      },
    ],
  };

  const completion = calculateCompanyProfileCompletion(profile);
  assert.equal(completion, 85, 'Profile completion should be 85% when verification is pending');
});

test('calculateCompanyProfileCompletion is 70% when no document is uploaded', () => {
  const profile = {
    companyName: 'TechCorp Solutions',
    companyType: 'Information Technology',
    email: 'contact@techcorp.com',
    phone: '+91 9876543210',
    website: 'https://techcorp.com',
    headquarters: 'Bengaluru, Karnataka',
    address: 'Plot 45, Electronic City Phase 1',
    pincode: '560100',
    gstin: '29ABCDE1234F1Z5',
    companySize: '51-200',
    foundedYear: 2018,
    socialLinks: {
      linkedinUrl: 'https://linkedin.com/company/techcorp',
    },
    verificationStatus: 'pending',
    documents: [],
  };

  const completion = calculateCompanyProfileCompletion(profile);
  assert.equal(completion, 70, 'Profile completion should be 70% without any uploaded documents');
});
