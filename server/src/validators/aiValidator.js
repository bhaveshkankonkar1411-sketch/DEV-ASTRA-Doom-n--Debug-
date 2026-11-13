/**
 * DropPilot AI - AI Output & Input Validation
 * Validates structured JSON returned by Gemini against project schemas
 * and sanitizes untrusted input / output according to PRD requirements.
 */

/**
 * Basic HTML tag sanitizer to prevent XSS in AI-generated descriptions
 */
export const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
};

/**
 * Sanitize prompt input strings to prevent prompt injection or override attacks
 */
export const sanitizeInputText = (input) => {
  if (typeof input !== 'string') return '';
  // Strip control sequences and potential system prompt delimiters
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<system>[\s\S]*?<\/system>/gi, '')
    .trim();
};

/**
 * Validates AI Product Listing Output
 * Conforms to PRD Section 10.3
 */
export const validateListingOutput = (data, input = {}) => {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Output must be a valid JSON object'] };
  }

  // Required title
  const title = (data.title || data.generatedTitle || '').trim();
  if (!title) {
    errors.push('Missing or empty title');
  }

  // Required description
  let description = (data.description || data.generatedDescription || '').trim();
  if (!description) {
    errors.push('Missing or empty description');
  } else {
    description = sanitizeHtml(description);
  }

  // Required keyFeatures / featureBullets
  let keyFeatures = data.keyFeatures || data.featureBullets || data.bullets;
  if (!Array.isArray(keyFeatures) || keyFeatures.length === 0) {
    errors.push('keyFeatures must be a non-empty array of strings');
    keyFeatures = [];
  } else {
    keyFeatures = keyFeatures.map((f) => String(f).trim()).filter(Boolean);
  }

  // SEO fields
  const seoTitle = (data.seoTitle || (data.seo && data.seo.metaTitle) || title).trim();
  const seoDescription = (data.seoDescription || (data.seo && data.seo.metaDescription) || description.slice(0, 160)).trim();
  
  let keywords = data.keywords || (data.seo && data.seo.keywords) || [];
  if (!Array.isArray(keywords)) {
    keywords = typeof keywords === 'string' ? keywords.split(',').map((k) => k.trim()) : [];
  }

  const validatedData = {
    title,
    description,
    keyFeatures,
    seoTitle,
    seoDescription,
    keywords: keywords.map((k) => String(k).trim()).filter(Boolean),
    generatedBy: data.generatedBy || 'gemini',
    status: 'draft',
    isAiGenerated: true,
    generatedAt: new Date().toISOString(),
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData,
  };
};

/**
 * Validates Multi-Platform Marketing Content Output
 * Conforms to PRD Section 3.8 & 8.1
 */
export const validateMarketingContentOutput = (data) => {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Output must be a valid JSON object'] };
  }

  const tiktokHook = (data.tiktokHook || data.tiktok || '').trim();
  const instagramCaption = (data.instagramCaption || data.instagram || '').trim();
  const adScript = (data.adScript || data.script || '').trim();

  if (!tiktokHook) errors.push('Missing tiktokHook');
  if (!instagramCaption) errors.push('Missing instagramCaption');
  if (!adScript) errors.push('Missing adScript');

  const validatedData = {
    tiktokHook,
    instagramCaption,
    adScript,
    shopifySeo: data.shopifySeo || null,
    generatedBy: data.generatedBy || 'gemini',
    isAiGenerated: true,
    generatedAt: new Date().toISOString(),
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData,
  };
};

/**
 * Validates AI Product Opportunity Analysis Output
 * Conforms to PRD Section 10.2
 */
export const validateProductAnalysisOutput = (data, defaultProductId = null) => {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Output must be a valid JSON object'] };
  }

  const productId = data.productId || defaultProductId;
  const rawScore = Number(data.opportunityScore);
  const opportunityScore = !isNaN(rawScore) ? Math.max(0, Math.min(100, Math.round(rawScore))) : 70;
  const scoreLabel = data.scoreLabel || 'AI estimate';
  const recommendation = (data.recommendation || '').trim();

  const strengths = Array.isArray(data.strengths) ? data.strengths.map(String) : [];
  const risks = Array.isArray(data.risks) ? data.risks.map(String) : [];

  if (strengths.length === 0) errors.push('strengths must contain at least one point');
  if (risks.length === 0) errors.push('risks must contain at least one point');
  if (!recommendation) errors.push('recommendation is required');

  const validatedData = {
    productId,
    opportunityScore,
    scoreLabel,
    strengths,
    risks,
    recommendation,
    dataSource: data.dataSource || 'gemini_analyzed',
    isAiGenerated: true,
    analyzedAt: new Date().toISOString(),
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData,
  };
};

/**
 * Validates Goal Recovery Advisory Output
 * Conforms to PRD Section 10.9
 */
export const validateRecoveryAdviceOutput = (data) => {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Output must be a valid JSON object'] };
  }

  const answer = (data.answer || data.assessment || '').trim();
  if (!answer) {
    errors.push('Missing answer / assessment');
  }

  // possibleReasons with evidence
  let possibleReasons = Array.isArray(data.possibleReasons) ? data.possibleReasons : [];
  if (possibleReasons.length === 0 && Array.isArray(data.recommendations)) {
    // Adapter if format varies
    possibleReasons = [
      {
        reason: 'Performance pacing requires optimization',
        evidence: 'Calculated store metrics trail monthly net profit milestones',
      },
    ];
  }

  // suggestedActions with expectedImpact and confidence
  let suggestedActions = Array.isArray(data.suggestedActions) ? data.suggestedActions : [];
  if (suggestedActions.length === 0 && Array.isArray(data.recommendations)) {
    suggestedActions = data.recommendations.map((rec) => ({
      action: String(rec),
      expectedImpact: 'Pacing improvement',
      confidence: 'medium',
    }));
  }

  // Ensure limitations array exists (mandatory per PRD 8.4 & 10.9)
  const limitations = Array.isArray(data.limitations) && data.limitations.length > 0
    ? data.limitations.map(String)
    : ['Recommendations depend on the accuracy and completeness of imported sales/expense data.'];

  const validatedData = {
    answer,
    possibleReasons,
    suggestedActions,
    limitations,
    isAiGenerated: true,
    generatedAt: new Date().toISOString(),
  };

  return {
    isValid: errors.length === 0,
    errors,
    data: validatedData,
  };
};

export default {
  sanitizeHtml,
  sanitizeInputText,
  validateListingOutput,
  validateMarketingContentOutput,
  validateProductAnalysisOutput,
  validateRecoveryAdviceOutput,
};

