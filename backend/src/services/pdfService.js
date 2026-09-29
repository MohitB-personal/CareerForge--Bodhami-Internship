/**
 * PDF service — renders generated resume content into a real A4 PDF using
 * pdfkit (server-side, no browser required). Produces selectable text with
 * professional typography and section-aware page breaks (a section header is
 * never orphaned at the bottom of a page when its content won't fit).
 *
 * Three templates are supported and match the frontend resume templates:
 *   modern  — bold indigo header band, accent section headings
 *   classic — serif typography, centered header, ruled headings
 *   minimal — airy Helvetica layout, thin divider lines, teal accents
 */

const PDFDocument = require('pdfkit');

// A4 dimensions in points (72 dpi)
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const TEMPLATES = {
  modern: {
    font: 'Helvetica',
    boldFont: 'Helvetica-Bold',
    accent: [79, 70, 229],
    headingSize: 11,
    bodySize: 9.5,
    nameSize: 26,
    muted: [100, 116, 139],
  },
  classic: {
    font: 'Times-Roman',
    boldFont: 'Times-Bold',
    accent: [31, 41, 55],
    headingSize: 11.5,
    bodySize: 10,
    nameSize: 24,
    muted: [85, 85, 85],
  },
  minimal: {
    font: 'Helvetica',
    boldFont: 'Helvetica-Bold',
    accent: [15, 118, 110],
    headingSize: 10.5,
    bodySize: 9.5,
    nameSize: 24,
    muted: [120, 130, 140],
  },
};

const sanitizeText = (value) =>
  String(value || '')
    .replace(/[\r\t]/g, ' ')
    .trim();

/**
 * Flatten a possibly multi-line description into a list of bullet lines.
 */
const toBulletLines = (description) =>
  sanitizeText(description)
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*\u2022]\s*/, '').trim())
    .filter(Boolean);

class ResumePDFBuilder {
  constructor(resumeData, templateId) {
    this.data = resumeData;
    this.style = TEMPLATES[templateId] || TEMPLATES.modern;
    this.templateId = templateId in TEMPLATES ? templateId : 'modern';
    this.doc = new PDFDocument({
      size: 'A4',
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: {
        Title: `${resumeData.contact.fullName || 'Resume'} - Resume`,
        Author: resumeData.contact.fullName || 'CareerForge',
        Creator: 'CareerForge',
      },
    });
    this.y = MARGIN;
  }

  /**
   * Move to a new page when the requested vertical space is not available.
   */
  ensureSpace(needed) {
    if (this.y + needed > PAGE_HEIGHT - MARGIN) {
      this.doc.addPage();
      this.y = MARGIN;
    }
  }

  contactLines() {
    const contact = this.data.contact || {};
    const lines = [];
    const line1 = [contact.email, contact.phone].filter(Boolean).join('  |  ');
    const line2 = [contact.location].filter(Boolean).join('  ');
    const line3 = [contact.linkedin, contact.github, contact.portfolio]
      .filter(Boolean)
      .join('  |  ');
    if (line1) lines.push(line1);
    if (line2) lines.push(line2);
    if (line3) lines.push(line3);
    return lines;
  }

  linkLine(entry) {
    return [entry.projectUrl, entry.repoUrl].filter(Boolean).join('  |  ');
  }

  sectionHeadingModern(title) {
    this.ensureSpace(40);
    this.y += 10;
    this.doc
      .font(this.style.boldFont)
      .fontSize(this.style.headingSize)
      .fillColor(this.style.accent.map((c) => c / 255))
      .text(title.toUpperCase(), MARGIN, this.y, {
        characterSpacing: 1.6,
        lineGap: 0,
      });
    this.y = this.doc.y + 4;
    this.doc
      .moveTo(MARGIN, this.y)
      .lineTo(PAGE_WIDTH - MARGIN, this.y)
      .lineWidth(1.2)
      .strokeColor(this.style.accent.map((c) => c / 255))
      .stroke();
    this.y += 8;
  }

  sectionHeadingClassic(title) {
    this.ensureSpace(44);
    this.y += 12;
    this.doc
      .font(this.style.boldFont)
      .fontSize(this.style.headingSize)
      .fillColor(this.style.accent.map((c) => c / 255))
      .text(title.toUpperCase(), MARGIN, this.y, {
        characterSpacing: 1.8,
        lineGap: 0,
      });
    this.y = this.doc.y + 4;
    this.doc
      .moveTo(MARGIN, this.y)
      .lineTo(PAGE_WIDTH - MARGIN, this.y)
      .lineWidth(0.7)
      .strokeColor([0, 0, 0])
      .stroke();
    this.y += 7;
  }

  sectionHeadingMinimal(title) {
    this.ensureSpace(38);
    this.y += 12;
    this.doc
      .font(this.style.boldFont)
      .fontSize(this.style.headingSize)
      .fillColor(this.style.accent.map((c) => c / 255))
      .text(title.toUpperCase(), MARGIN, this.y, {
        characterSpacing: 1.4,
        lineGap: 0,
      });
    this.y = this.doc.y + 3;
    this.doc
      .moveTo(MARGIN, this.y)
      .lineTo(PAGE_WIDTH - MARGIN, this.y)
      .lineWidth(0.5)
      .strokeColor([226, 232, 240])
      .stroke();
    this.y += 8;
  }

  /* ------------------------------ Headers ------------------------------ */

  renderModernHeader() {
    const contact = this.data.contact || {};
    const accent = this.style.accent;
    const headerHeight = 118;
    this.doc
      .rect(0, 0, PAGE_WIDTH, headerHeight)
      .fill(accent.map((c) => c / 255));
    this.y = 30;
    this.doc
      .font(this.style.boldFont)
      .fontSize(this.style.nameSize)
      .fillColor([255, 255, 255])
      .text(sanitizeText(contact.fullName) || 'Resume', MARGIN, this.y, { lineGap: 0 });
    this.y = this.doc.y + 2;
    if (sanitizeText(contact.headline)) {
      this.doc
        .font(this.style.font)
        .fontSize(11)
        .fillColor([224, 231, 255])
        .text(sanitizeText(contact.headline), MARGIN, this.y, { lineGap: 0 });
      this.y = this.doc.y + 5;
    }
    this.y += 2;
    this.doc
      .font(this.style.font)
      .fontSize(8.5)
      .fillColor([219, 226, 253]);
    for (const line of this.contactLines()) {
      this.doc.text(line, MARGIN, this.y, { lineGap: 1 });
      this.y = this.doc.y + 2;
    }
    this.y = headerHeight + 18;
  }

  renderClassicHeader() {
    const contact = this.data.contact || {};
    this.y = MARGIN + 4;
    this.doc
      .font(this.style.boldFont)
      .fontSize(this.style.nameSize)
      .fillColor([17, 24, 39])
      .text(sanitizeText(contact.fullName) || 'Resume', MARGIN, this.y, {
        width: CONTENT_WIDTH,
        align: 'center',
        lineGap: 0,
      });
    this.y = this.doc.y + 3;
    if (sanitizeText(contact.headline)) {
      this.doc
        .font(this.style.font)
        .fontSize(11)
        .fillColor([55, 65, 81])
        .text(sanitizeText(contact.headline), MARGIN, this.y, {
          width: CONTENT_WIDTH,
          align: 'center',
          lineGap: 0,
        });
      this.y = this.doc.y + 4;
    }
    this.y += 2;
    this.doc.font(this.style.font).fontSize(8.5).fillColor([85, 85, 85]);
    for (const line of this.contactLines()) {
      this.doc.text(line, MARGIN, this.y, {
        width: CONTENT_WIDTH,
        align: 'center',
        lineGap: 1,
      });
      this.y = this.doc.y + 2;
    }
    this.y += 4;
    this.doc
      .moveTo(MARGIN, this.y)
      .lineTo(PAGE_WIDTH - MARGIN, this.y)
      .lineWidth(1)
      .strokeColor([17, 24, 39])
      .stroke();
    this.y += 6;
  }

  renderMinimalHeader() {
    const contact = this.data.contact || {};
    this.y = MARGIN;
    this.doc
      .font(this.style.boldFont)
      .fontSize(this.style.nameSize)
      .fillColor([15, 23, 42])
      .text(sanitizeText(contact.fullName) || 'Resume', MARGIN, this.y, { lineGap: 0 });
    this.y = this.doc.y + 2;
    if (sanitizeText(contact.headline)) {
      this.doc
        .font(this.style.font)
        .fontSize(10.5)
        .fillColor(this.style.accent.map((c) => c / 255))
        .text(sanitizeText(contact.headline), MARGIN, this.y, { lineGap: 0 });
      this.y = this.doc.y + 4;
    }
    this.y += 1;
    this.doc.font(this.style.font).fontSize(8.5).fillColor([100, 116, 139]);
    for (const line of this.contactLines()) {
      this.doc.text(line, MARGIN, this.y, { lineGap: 1 });
      this.y = this.doc.y + 2;
    }
    this.y += 4;
    this.doc
      .moveTo(MARGIN, this.y)
      .lineTo(PAGE_WIDTH - MARGIN, this.y)
      .lineWidth(0.8)
      .strokeColor([203, 213, 225])
      .stroke();
    this.y += 10;
  }

  renderHeader() {
    if (this.templateId === 'classic') return this.renderClassicHeader();
    if (this.templateId === 'minimal') return this.renderMinimalHeader();
    return this.renderModernHeader();
  }

  /* ----------------------------- Sections ------------------------------ */

  writeBodyText(text, options = {}) {
    this.doc
      .font(this.style.font)
      .fontSize(this.style.bodySize)
      .fillColor([35, 42, 55])
      .text(text, MARGIN, this.y, {
        width: CONTENT_WIDTH,
        lineGap: 1.4,
        ...options,
      });
    this.y = this.doc.y;
  }

  writeBullets(lines) {
    const bulletIndent = 14;
    for (const line of lines) {
      this.ensureSpace(this.doc.heightOfString(line, {
        width: CONTENT_WIDTH - bulletIndent,
        fontSize: this.style.bodySize,
      }) + 4);
      this.doc
        .font(this.style.font)
        .fontSize(this.style.bodySize)
        .fillColor([35, 42, 55]);
      this.doc
        .text('\u2022', MARGIN, this.y, { lineGap: 1.4 })
        .text(line, MARGIN + bulletIndent, this.y, {
          width: CONTENT_WIDTH - bulletIndent,
          lineGap: 1.4,
        });
      this.y = this.doc.y + 2;
    }
  }

  writeEntryTitle(left, right) {
    this.doc.font(this.style.boldFont).fontSize(this.style.bodySize + 0.7).fillColor([17, 24, 39]);
    const titleHeight = this.doc.heightOfString(left, {
      width: CONTENT_WIDTH * 0.72,
    });
    this.ensureSpace(titleHeight + 12);
    this.doc.text(left, MARGIN, this.y, {
      width: CONTENT_WIDTH * 0.72,
      lineGap: 0,
    });
    if (right) {
      this.doc
        .font(this.style.font)
        .fontSize(this.style.bodySize - 0.4)
        .fillColor(this.style.muted.map((c) => c / 255));
      const rightHeight = this.doc.heightOfString(right, {
        width: CONTENT_WIDTH * 0.28,
      });
      this.doc.text(right, PAGE_WIDTH - MARGIN - CONTENT_WIDTH * 0.28, this.y + 1, {
        width: CONTENT_WIDTH * 0.28,
        align: 'right',
        lineGap: 0,
      });
      this.y = Math.max(this.doc.y, this.y + titleHeight, this.y + rightHeight);
    } else {
      this.y = Math.max(this.doc.y, this.y + titleHeight);
    }
    this.y += 1;
  }

  writeEntrySub(sub) {
    if (!sanitizeText(sub)) return;
    this.doc
      .font(this.style.font)
      .fontSize(this.style.bodySize - 0.5)
      .fillColor(this.style.muted.map((c) => c / 255))
      .text(sub, MARGIN, this.y, { width: CONTENT_WIDTH, lineGap: 0.8 });
    this.y = this.doc.y + 1;
  }

  renderSummary() {
    const summary = sanitizeText(this.data.summary);
    if (!summary) return;
    this.ensureSpace(30);
    this.sectionHeading('Professional Summary');
    this.writeBodyText(summary);
    this.y += 2;
  }

  renderSkills() {
    const skills = (this.data.skills || []).map((s) => s.name).filter(Boolean);
    if (skills.length === 0) return;
    this.ensureSpace(30);
    this.sectionHeading('Skills');
    if (this.templateId === 'minimal') {
      this.writeBodyText(skills.map((s) => sanitizeText(s)).join('  \u00B7  '));
    } else {
      this.writeBodyText(skills.map((s) => sanitizeText(s)).join(', '));
    }
    this.y += 2;
  }

  renderExperience() {
    const experience = this.data.experience || [];
    if (experience.length === 0) return;
    this.ensureSpace(50);
    this.sectionHeading(experience.length === 1 ? 'Experience' : 'Work Experience');
    for (const exp of experience) {
      const title = sanitizeText(exp.title);
      const right = [sanitizeText(exp.startDate), sanitizeText(exp.endDate)]
        .filter(Boolean)
        .join(' \u2013 ');
      this.writeEntryTitle(title, right);
      this.writeEntrySub(
        [sanitizeText(exp.company), sanitizeText(exp.location)].filter(Boolean).join(', ')
      );
      const bullets = toBulletLines(exp.description);
      if (bullets.length > 0) this.writeBullets(bullets);
      this.y += 5;
    }
    this.y += 2;
  }

  renderProjects() {
    const projects = this.data.projects || [];
    if (projects.length === 0) return;
    this.ensureSpace(50);
    this.sectionHeading('Projects');
    for (const proj of projects) {
      this.writeEntryTitle(sanitizeText(proj.title), sanitizeText(proj.techStack));
      this.writeEntrySub(this.linkLine(proj));
      const bullets = toBulletLines(proj.description);
      if (bullets.length > 0) this.writeBullets(bullets);
      this.y += 4;
    }
    this.y += 2;
  }

  renderEducation() {
    const education = this.data.education || [];
    if (education.length === 0) return;
    this.ensureSpace(50);
    this.sectionHeading('Education');
    for (const edu of education) {
      const degreeText = [sanitizeText(edu.degree), sanitizeText(edu.field)]
        .filter(Boolean)
        .join(' in ');
      const right = [sanitizeText(edu.startYear), sanitizeText(edu.endYear)]
        .filter(Boolean)
        .join(' \u2013 ');
      this.writeEntryTitle(degreeText || sanitizeText(edu.school), right);
      this.writeEntrySub(
        [sanitizeText(edu.school), sanitizeText(edu.grade) ? `Grade: ${sanitizeText(edu.grade)}` : '']
          .filter(Boolean)
          .join(', ')
      );
      this.y += 4;
    }
    this.y += 2;
  }

  renderCertifications() {
    const certifications = this.data.certifications || [];
    if (certifications.length === 0) return;
    this.ensureSpace(44);
    this.sectionHeading('Certifications');
    for (const cert of certifications) {
      const right = [sanitizeText(cert.issueDate), sanitizeText(cert.expiryDate)]
        .filter(Boolean)
        .join(' \u2013 ');
      this.writeEntryTitle(sanitizeText(cert.name), right);
      this.writeEntrySub(sanitizeText(cert.organization));
      this.y += 3;
    }
    this.y += 2;
  }

  renderAchievements() {
    const achievements = this.data.achievements || [];
    if (achievements.length === 0) return;
    this.ensureSpace(44);
    this.sectionHeading('Achievements');
    for (const ach of achievements) {
      this.writeEntryTitle(sanitizeText(ach.title), sanitizeText(ach.year));
      const bullets = toBulletLines(ach.description);
      if (bullets.length > 0) this.writeBullets(bullets);
      this.y += 3;
    }
    this.y += 2;
  }

  sectionHeading(title) {
    if (this.templateId === 'classic') return this.sectionHeadingClassic(title);
    if (this.templateId === 'minimal') return this.sectionHeadingMinimal(title);
    return this.sectionHeadingModern(title);
  }

  build() {
    this.renderHeader();
    this.renderSummary();
    this.renderSkills();
    this.renderExperience();
    this.renderProjects();
    this.renderEducation();
    this.renderCertifications();
    this.renderAchievements();
    return this.doc;
  }
}

/**
 * Render resume content into an A4 PDF buffer.
 * @param {Object} resumeData Generated resume content
 * @param {String} templateId Selected template id
 * @returns {Promise<Buffer>}
 */
const renderResumePdf = (resumeData, templateId) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new ResumePDFBuilder(resumeData, templateId).build();
      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  renderResumePdf,
};

