const { query } = require('../config/db');

const cleanDb = async () => {
  try {
    console.log("🧹 Cleaning dummy database entries...");

    // Disable foreign key checks for clean truncation/deletion
    await query("SET FOREIGN_KEY_CHECKS = 0");

    // Delete dummy applications
    await query("TRUNCATE TABLE applications");

    // Delete dummy jobs
    await query("TRUNCATE TABLE jobs");

    // Delete dummy company documents & profiles
    await query("TRUNCATE TABLE company_document_verification_tokens");
    await query("TRUNCATE TABLE company_documents");
    await query("TRUNCATE TABLE company_profiles");

    // Delete companies
    await query("TRUNCATE TABLE companies");

    // Reset AUTO_INCREMENT on companies, jobs, applications, company_profiles, company_documents
    await query("ALTER TABLE companies AUTO_INCREMENT = 1");
    await query("ALTER TABLE company_profiles AUTO_INCREMENT = 1");
    await query("ALTER TABLE jobs AUTO_INCREMENT = 1");
    await query("ALTER TABLE applications AUTO_INCREMENT = 1");
    await query("ALTER TABLE company_documents AUTO_INCREMENT = 1");
    await query("ALTER TABLE company_document_verification_tokens AUTO_INCREMENT = 1");

    // Re-enable foreign key checks
    await query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("✅ MySQL database cleaned successfully! All dummy companies and jobs removed.");
    console.log("✅ Auto-increment for companies reset to 1. Next company registration will get ID 1.");
  } catch (err) {
    console.error("❌ Error cleaning database:", err);
  }
};

if (require.main === module) {
  cleanDb().then(() => process.exit());
}

module.exports = cleanDb;
