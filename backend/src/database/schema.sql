-- =============================================================================
-- CareerForge Simple Registration & Login Database Schema
-- Engine: InnoDB | Character Set: utf8mb4
-- =============================================================================

CREATE DATABASE IF NOT EXISTS careerforge_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE careerforge_db;

-- -----------------------------------------------------------------------------
-- 1. Candidates Table
-- Stores job seeker registration data & password hashes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_candidate_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 2. Companies Table
-- Stores company employer registration data, GSTIN, & verification status
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  company_type VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  website VARCHAR(255) DEFAULT NULL,
  gstin VARCHAR(15) NOT NULL UNIQUE,
  pincode VARCHAR(6) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_company_email (email),
  INDEX idx_company_gstin (gstin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 3. Candidate Profiles Table
-- Stores detailed structured profile information for job seekers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL UNIQUE,
  profile_picture_url LONGTEXT DEFAULT NULL,
  headline VARCHAR(255) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  open_to_work BOOLEAN DEFAULT TRUE,
  is_fresher BOOLEAN DEFAULT FALSE,
  no_certifications BOOLEAN DEFAULT FALSE,
  linkedin_url VARCHAR(255) DEFAULT NULL,
  github_url VARCHAR(255) DEFAULT NULL,
  portfolio_url VARCHAR(255) DEFAULT NULL,
  education JSON DEFAULT NULL,
  skills JSON DEFAULT NULL,
  experience JSON DEFAULT NULL,
  projects JSON DEFAULT NULL,
  certifications JSON DEFAULT NULL,
  achievements JSON DEFAULT NULL,
  preferences JSON DEFAULT NULL,
  profile_completion INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 4. Company Profiles Table
-- Stores detailed company profile information, branding & location metadata
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL UNIQUE,
  logo_url LONGTEXT DEFAULT NULL,
  industry VARCHAR(255) DEFAULT NULL,
  company_size VARCHAR(100) DEFAULT NULL,
  founded_year INT DEFAULT NULL,
  headquarters VARCHAR(255) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  cin VARCHAR(100) DEFAULT NULL,
  social_links JSON DEFAULT NULL,
  profile_completion INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 5. Company Verification Documents Table
-- Stores uploaded verification documents and individual verification statuses
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  doc_name VARCHAR(255) NOT NULL,
  doc_type VARCHAR(100) NOT NULL,
  file_url LONGTEXT NOT NULL,
  upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verification_note TEXT DEFAULT NULL,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 6. Company Document Verification Tokens Table
-- Stores secure single-use tokens for email-based document verification.
-- Only SHA-256 hashes are stored, never raw tokens.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS company_document_verification_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  document_id INT NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_token_hash (token_hash),
  FOREIGN KEY (document_id) REFERENCES company_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- -----------------------------------------------------------------------------
-- 7. Candidate Resumes Table
-- Stores resume documents for authenticated candidates. Two resume types:
--   - 'generated': CareerForge-generated resumes. `content` holds a snapshot of
--     the generated resume document (LLM-personalized wording at generation
--     time). Live profile data is NOT duplicated here — the snapshot exists
--     because the generated document is an artifact whose personalized wording
--     would be lost if it were regenerated from the profile.
--   - 'uploaded': candidate-uploaded PDF resumes. The original PDF is stored on
--     the filesystem (outside the public /uploads root) and referenced by
--     `storage_path`; `template`/`content` stay NULL for this type.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_resumes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  candidate_id INT NOT NULL,
  resume_type ENUM('generated', 'uploaded') NOT NULL DEFAULT 'generated',
  template VARCHAR(50) DEFAULT NULL,
  title VARCHAR(255) NOT NULL DEFAULT 'My Resume',
  content JSON DEFAULT NULL,
  llm_enhanced BOOLEAN NOT NULL DEFAULT FALSE,
  original_filename VARCHAR(255) DEFAULT NULL,
  storage_path VARCHAR(512) DEFAULT NULL,
  file_size INT DEFAULT NULL,
  mime_type VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_resume_candidate (candidate_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 8. Jobs Table
-- Stores job postings created by employers/companies
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  employment_type VARCHAR(100) NOT NULL,
  workplace VARCHAR(100) DEFAULT 'On-site',
  experience_required VARCHAR(100) NOT NULL,
  salary_range VARCHAR(100) DEFAULT NULL,
  openings INT DEFAULT 1,
  description TEXT NOT NULL,
  skills JSON DEFAULT NULL,
  education VARCHAR(255) DEFAULT NULL,
  deadline DATE DEFAULT NULL,
  status ENUM('draft', 'published', 'closed') NOT NULL DEFAULT 'published',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_company (company_id),
  INDEX idx_job_status (status),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- 9. Applications Table
-- Stores job applications linking candidate + job + company
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_id INT NOT NULL,
  candidate_id INT NOT NULL,
  company_id INT NOT NULL,
  resume_id INT DEFAULT NULL,
  status ENUM('Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected') NOT NULL DEFAULT 'Applied',
  note TEXT DEFAULT NULL,
  interview_date VARCHAR(255) DEFAULT NULL,
  match_score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_candidate_job (candidate_id, job_id),
  INDEX idx_app_job (job_id),
  INDEX idx_app_candidate (candidate_id),
  INDEX idx_app_company (company_id),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (resume_id) REFERENCES candidate_resumes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


