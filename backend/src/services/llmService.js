const axios = require('axios');

/**
 * Modular LLM integration for CareerForge.
 *
 * Provider is selected through environment variables so the implementation
 * stays provider-agnostic and API keys are never hardcoded:
 *
 *   LLM_PROVIDER = none | openai | gemini   (default: none)
 *   LLM_API_KEY  = <provider API key>       (never exposed to the frontend)
 *   LLM_MODEL    = model identifier         (optional, sensible default per provider)
 *
 * When LLM_PROVIDER is "none" or the key is missing, or the provider call
 * fails/times out, `enhanceResumeContent` returns its fallback flag and the
 * caller gracefully continues with deterministic profile-derived content.
 * The LLM is NEVER allowed to fabricate facts — it only receives structured
 * candidate data and is instructed to reword/organize what already exists.
 */

const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT_MS || '25000', 10);

const getProvider = () => {
  const provider = (process.env.LLM_PROVIDER || 'none').trim().toLowerCase();
  const apiKey = (process.env.LLM_API_KEY || '').trim();
  if (provider === 'none' || !apiKey) {
    return { provider: 'none', apiKey: null };
  }
  return { provider, apiKey };
};

const isLLMConfigured = () => getProvider().provider !== 'none';

const getDefaultModel = (provider) => {
  const explicit = (process.env.LLM_MODEL || '').trim();
  if (explicit) return explicit;
  if (provider === 'openai') return 'gpt-4o-mini';
  if (provider === 'gemini') return 'gemini-2.0-flash';
  return '';
};

/**
 * Build the strict prompt sent to the LLM. Only real candidate facts are
 * included — the model is explicitly forbidden from inventing anything.
 */
const buildPrompt = (resumeData, templateName) => {
  const systemInstruction = [
    'You are a professional resume writer for the CareerForge job platform.',
    'You receive structured candidate data extracted from their profile and a selected resume template style.',
    'ABSOLUTE RULES — violations are unacceptable:',
    '1. NEVER invent, assume, or add any fact that is not present in the provided data. No companies, job titles, degrees, certifications, skills, dates, achievements, projects, contact details, or experience.',
    '2. ONLY reword, polish, condense, and organize the provided information.',
    '3. If a provided description is empty, leave it empty (or output "") instead of writing something new.',
    '4. Keep every fact verbatim-accurate: company names, job titles, dates, organizations, URLs, and years must appear exactly as provided.',
    '5. Respond with valid minified JSON only. No markdown fences, no commentary.',
    'Required JSON response shape:',
    '{"summary": string, "experience": [{"description": string}], "projects": [{"description": string}]}',
    '- "summary": 2-3 sentence professional summary written ONLY from the provided facts (skills, experience/fresher status, education, achievements).',
    '- "experience[].description" and "projects[].description": resume-appropriate rewording of the provided descriptions, in the same order as provided. Reuse bullet points separated by newlines if the input uses them. Keep empty descriptions empty.',
    `- Adapt tone slightly to the "${templateName}" resume style, but keep wording factual and professional.`,
  ].join('\n');

  const candidatePayload = {
    headline: resumeData.contact.headline || '',
    location: resumeData.contact.location || '',
    isFresher: resumeData.isFresher,
    education: resumeData.education.map((edu) => ({
      degree: edu.degree,
      field: edu.field,
      school: edu.school,
      startYear: edu.startYear,
      endYear: edu.endYear,
      grade: edu.grade,
    })),
    skills: resumeData.skills.map((s) => s.name),
    experience: resumeData.experience.map((exp) => ({
      title: exp.title,
      company: exp.company,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      current: exp.current,
      description: exp.description || '',
    })),
    projects: resumeData.projects.map((proj) => ({
      title: proj.title,
      techStack: proj.techStack,
      description: proj.description || '',
    })),
    certifications: resumeData.certifications.map((cert) => ({
      name: cert.name,
      organization: cert.organization,
    })),
    achievements: resumeData.achievements.map((ach) => ({
      title: ach.title,
      description: ach.description || '',
      year: ach.year || '',
    })),
  };

  return `${systemInstruction}\n\nCANDIDATE DATA (JSON):\n${JSON.stringify(candidatePayload)}`;
};


/**
 * Extract the JSON object from an LLM response string.
 */
const parseLLMJson = (text) => {
  if (!text) return null;
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch (e) {
    return null;
  }
};

/**
 * Provider-specific chat call.
 */
const callProvider = async (provider, apiKey, model, prompt) => {
  if (provider === 'openai') {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model,
        temperature: 0.4,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: 'Rewrite the candidate data as instructed and respond with JSON only.' },
        ],
      },
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: LLM_TIMEOUT_MS,
      }
    );
    return response.data?.choices?.[0]?.message?.content || '';
  }

  if (provider === 'gemini') {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, responseMimeType: 'application/json' },
      },
      {
        headers: { 'x-goog-api-key': apiKey },
        timeout: LLM_TIMEOUT_MS,
      }
    );
    return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  return '';
};

/**
 * Apply the LLM response onto the resume data without letting it add facts.
 * Only summary/experience/project descriptions are accepted, and experience /
 * project arrays must match the input lengths to be applied.
 */
const applyLLMResponse = (resumeData, llmJson) => {
  const sanitized = { ...resumeData, llmEnhanced: false };

  if (llmJson && typeof llmJson === 'object') {
    if (typeof llmJson.summary === 'string' && llmJson.summary.trim()) {
      sanitized.summary = llmJson.summary.trim();
      sanitized.llmEnhanced = true;
    }

    if (
      Array.isArray(llmJson.experience) &&
      llmJson.experience.length === sanitized.experience.length
    ) {
      sanitized.experience = sanitized.experience.map((exp, index) => {
        const polished = llmJson.experience[index];
        if (polished && typeof polished.description === 'string' && polished.description.trim()) {
          return { ...exp, description: polished.description.trim() };
        }
        return exp;
      });
      sanitized.llmEnhanced = true;
    }

    if (
      Array.isArray(llmJson.projects) &&
      llmJson.projects.length === sanitized.projects.length
    ) {
      sanitized.projects = sanitized.projects.map((proj, index) => {
        const polished = llmJson.projects[index];
        if (polished && typeof polished.description === 'string' && polished.description.trim()) {
          return { ...proj, description: polished.description.trim() };
        }
        return proj;
      });
      sanitized.llmEnhanced = true;
    }
  }

  return sanitized;
};

/**
 * Personalize resume content through the configured LLM provider.
 * NEVER throws — on any failure it returns the deterministic fallback content
 * with `llmEnhanced: false` and a reason so the feature degrades gracefully.
 *
 * @param {Object} resumeData Deterministic resume content built from the profile
 * @param {String} templateName Selected template display name
 * @returns {Promise<{content: Object, llmEnhanced: Boolean, llmError: String|null}>}
 */
const enhanceResumeContent = async (resumeData, templateName) => {
  const { provider, apiKey } = getProvider();

  if (provider === 'none') {
    return { content: resumeData, llmEnhanced: false, llmError: null };
  }

  try {
    const model = getDefaultModel(provider);
    const prompt = buildPrompt(resumeData, templateName);
    const raw = await callProvider(provider, apiKey, model, prompt);
    const llmJson = parseLLMJson(raw);

    if (!llmJson) {
      console.warn(`⚠️ LLM (${provider}) returned unparseable output. Using fallback content.`);
      return {
        content: resumeData,
        llmEnhanced: false,
        llmError: 'AI wording enhancement is temporarily unavailable — your resume uses your profile data as-is.',
      };
    }

    return {
      content: applyLLMResponse(resumeData, llmJson),
      llmEnhanced: true,
      llmError: null,
    };
  } catch (error) {
    console.warn(`⚠️ LLM (${provider}) call failed: ${error.message}. Using fallback content.`);
    return {
      content: resumeData,
      llmEnhanced: false,
      llmError: 'AI wording enhancement is temporarily unavailable — your resume uses your profile data as-is.',
    };
  }
};

module.exports = {
  isLLMConfigured,
  enhanceResumeContent,
};
