const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const initDb = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'careerforge_db';

  let connection;
  try {
    console.log(`📡 Connecting to MySQL server at ${host}:${port}...`);
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true,
    });

    console.log(`🔨 Ensuring database '${database}' exists...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await connection.query(`USE \`${database}\`;`);

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      console.log('📄 Executing database schema DDL...');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await connection.query(schemaSql);

      // Ensure logo_url and file_url support LONGTEXT (Base64 data URLs)
      try {
        await connection.query('ALTER TABLE company_profiles MODIFY COLUMN logo_url LONGTEXT DEFAULT NULL;');
        await connection.query('ALTER TABLE company_documents MODIFY COLUMN file_url LONGTEXT NOT NULL;');
        await connection.query('ALTER TABLE candidate_profiles MODIFY COLUMN profile_picture_url LONGTEXT DEFAULT NULL;');
        await connection.query('ALTER TABLE candidates MODIFY COLUMN password_hash VARCHAR(255) NULL;');
      } catch (colErr) {
        // Ignored if table doesn't exist yet or already altered
      }

      // Migration: add a persistent candidate profile image without affecting
      // existing candidate profile data.
      try {
        await connection.query('ALTER TABLE candidate_profiles ADD COLUMN IF NOT EXISTS profile_picture_url LONGTEXT DEFAULT NULL;');
      } catch (pictureErr) {
        const [cols] = await connection.query(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'candidate_profiles'
            AND COLUMN_NAME = 'profile_picture_url'
        `);
        if (cols.length === 0) {
          await connection.query('ALTER TABLE candidate_profiles ADD COLUMN profile_picture_url LONGTEXT DEFAULT NULL;');
        }
      }

      // Migration: add verification_note to company_documents if it doesn't exist
      try {
        await connection.query(`
          ALTER TABLE company_documents
          ADD COLUMN IF NOT EXISTS verification_note TEXT DEFAULT NULL;
        `);
      } catch (noteErr) {
        // MySQL < 8.0 doesn't support IF NOT EXISTS on ADD COLUMN; try a safe fallback
        try {
          const [cols] = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'company_documents'
              AND COLUMN_NAME = 'verification_note'
          `);
          if (cols.length === 0) {
            await connection.query('ALTER TABLE company_documents ADD COLUMN verification_note TEXT DEFAULT NULL;');
          }
        } catch (fallbackErr) {
          console.warn('⚠️ Could not add verification_note column:', fallbackErr.message);
        }
      }

      // Migration: create company_document_verification_tokens if it doesn't exist
      // (already handled by schema.sql CREATE TABLE IF NOT EXISTS above)

      // Migration: extend candidate_resumes to support uploaded PDF resumes
      // alongside generated resumes without affecting existing rows.
      try {
        await connection.query(`
          ALTER TABLE candidate_resumes
            ADD COLUMN IF NOT EXISTS resume_type ENUM('generated', 'uploaded') NOT NULL DEFAULT 'generated',
            ADD COLUMN IF NOT EXISTS original_filename VARCHAR(255) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS storage_path VARCHAR(512) DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS file_size INT DEFAULT NULL,
            ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100) DEFAULT NULL,
            MODIFY COLUMN template VARCHAR(50) DEFAULT NULL,
            MODIFY COLUMN content JSON DEFAULT NULL;
        `);
        // Backfill the type for rows created before this migration.
        await connection.query(`
          UPDATE candidate_resumes SET resume_type = 'generated' WHERE resume_type IS NULL OR resume_type = '';
        `);
      } catch (resumeMigErr) {
        // MySQL < 8.0 doesn't support IF NOT EXISTS on ADD COLUMN; try safe fallbacks
        try {
          const [resumeCols] = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'candidate_resumes'
          `);
          const existingCols = new Set((resumeCols || []).map((c) => c.COLUMN_NAME));
          const addColumn = async (ddl, name) => {
            if (!existingCols.has(name)) {
              await connection.query(`ALTER TABLE candidate_resumes ADD COLUMN ${ddl};`);
            }
          };
          await addColumn(
            "resume_type ENUM('generated', 'uploaded') NOT NULL DEFAULT 'generated'",
            'resume_type'
          );
          await addColumn('original_filename VARCHAR(255) DEFAULT NULL', 'original_filename');
          await addColumn('storage_path VARCHAR(512) DEFAULT NULL', 'storage_path');
          await addColumn('file_size INT DEFAULT NULL', 'file_size');
          await addColumn('mime_type VARCHAR(100) DEFAULT NULL', 'mime_type');
          // Uploaded resumes have no template/content — allow NULL safely.
          await connection.query('ALTER TABLE candidate_resumes MODIFY COLUMN template VARCHAR(50) DEFAULT NULL;');
          await connection.query('ALTER TABLE candidate_resumes MODIFY COLUMN content JSON DEFAULT NULL;');
          await connection.query(`
            UPDATE candidate_resumes SET resume_type = 'generated' WHERE resume_type IS NULL OR resume_type = '';
          `);
        } catch (resumeFallbackErr) {
          console.warn('⚠️ Could not migrate candidate_resumes for uploaded resumes:', resumeFallbackErr.message);
        }
      }

      console.log('✅ All CareerForge tables created/verified successfully.');

    } else {
      console.warn('⚠️ schema.sql file not found.');
    }

    return true;
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    return false;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

if (require.main === module) {
  initDb().then(() => process.exit());
}

module.exports = initDb;
