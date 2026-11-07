/**
 * Gemini-Powered Personalized Cold Outreach Generation Service
 * Generates tailored, high-converting B2B cold email templates grounded in
 * verified lead profile data (observable problem, sales opportunity, and contact details).
 */

import { getGeminiClient } from './geminiClient';
import { Lead } from '../types';

export interface OutreachTemplateOption {
  id: string;
  styleName: string;
  subjectLine: string;
  previewText: string;
  body: string;
  callToAction: string;
  followUpSnippet: string;
  keyPersonalizationPoints: string[];
}

export interface GenerateOutreachOptions {
  lead: Lead;
  senderName?: string;
  senderAgency?: string;
  tone?: 'Professional & Direct' | 'Consultative & Friendly' | 'Executive & Concise';
}

const OUTREACH_MODEL = 'gemini-3.8-flash';

export async function generateColdOutreachTemplates(
  options: GenerateOutreachOptions
): Promise<OutreachTemplateOption[]> {
  const { lead, senderName, senderAgency, tone = 'Consultative & Friendly' } = options;
  const ai = getGeminiClient();

  const recipientName =
    lead.contactFullName && lead.contactFullName !== 'Not Found'
      ? lead.contactFullName
      : `${lead.companyName} Team`;

  const contactRole =
    lead.jobTitle && lead.jobTitle !== 'Not Found' ? ` (${lead.jobTitle})` : '';

  const senderSignoff = senderName ? `${senderName}${senderAgency ? `\n${senderAgency}` : ''}` : '[Your Name]\n[Your Agency / Company]';

  const systemInstruction = `You are a world-class B2B agency sales copywriter specializing in high-reply cold outreach.
Your task is to write 3 distinct, highly personalized, and non-spammy cold email templates for an agency pitching digital solutions to a local or national business.

Strict Rules:
1. Every template MUST reference the company's real observable situation:
   - Business Problem: "${lead.businessProblem || 'Digital Presence Gap'}"
   - Opportunity / Proposed Solution: "${lead.salesOpportunity || 'Digital Optimization'}"
   - Observable Evidence: "${lead.needEvidence || 'Website technical observation'}"
   - Location: "${lead.city || ''}${lead.country ? `, ${lead.country}` : ''}"
2. Personalization must feel authentic, respectful, and observational—never accusatory or pushy.
3. Keep the email concise: 75 to 140 words maximum in the body.
4. Call to Action must be low friction (e.g. asking if they're open to seeing a 2-minute video mockup, or a brief 10-minute non-binding chat next week).
5. Provide a punchy subject line (< 40 characters) that looks like a 1-to-1 human email, avoiding marketing hype words.
6. Provide a concise 2-sentence follow-up message to send 3-4 days later if no reply.
7. Tone should be: ${tone}.
8. Respond ONLY with a valid JSON array matching the exact schema specified. No markdown fences around the JSON if possible, or clean standard JSON.`;

  const prompt = `Generate 4 distinct outreach variations (Variation 1: "Technical Audit & Solution [Email]", Variation 2: "Direct Value Pitch [Email]", Variation 3: "WhatsApp Direct Pitch [English]", Variation 4: "WhatsApp Pitch [Roman Urdu]") for:

Lead Details:
- Company Name: ${lead.companyName}
- Decision Maker: ${recipientName}${contactRole}
- Industry: ${lead.industry}
- Location: ${lead.city}, ${lead.country}
- Website: ${lead.website}
- Website Status: ${lead.websiteStatus}
- Specific Business Problem Observed: ${lead.businessProblem}
- Specific Sales Opportunity: ${lead.salesOpportunity}
- Evidence Found: ${lead.needEvidence}
- Sender Sign-off: ${senderSignoff}

Rules for WhatsApp variations:
- Variation 3 (WhatsApp Direct Pitch): Short (40-70 words), conversational, formatted with WhatsApp bolding (*text*), starts with a friendly greeting, mentions the specific problem observed on their website/business, offers a quick solution.
- Variation 4 (WhatsApp Pitch Roman Urdu): Conversational, respectful Roman Urdu ("Assalam-o-Alaikum ${recipientName}! Humne aapka business ${lead.companyName} dekha..."), points out the digital opportunity ("Aapki website me ${lead.businessProblem}..."), and suggests a 2-minute chat.

Output JSON format:
[
  {
    "id": "template_1",
    "styleName": "Technical Audit & Solution",
    "subjectLine": "Quick question regarding [Company Name]'s [topic]",
    "previewText": "Brief 1-sentence hook",
    "body": "Hi [Name],\\n\\n[Observation and specific value proposal]...\\n\\nBest regards,\\n[Signoff]",
    "callToAction": "Are you open to a 5-minute look at how we fixed this for a similar company?",
    "followUpSnippet": "Hi [Name], following up quickly on my note about [topic]. Would 10 minutes Thursday work to review?",
    "keyPersonalizationPoints": ["Referenced ${lead.companyName}", "Cited ${lead.businessProblem}", "Targeted ${lead.salesOpportunity}"]
  },
  ...
]`;

  try {
    const response = await ai.models.generateContent({
      model: OUTREACH_MODEL,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text?.trim() || '';
    if (responseText) {
      // Clean possible markdown code fence
      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => ({
          id: item.id || `template_${idx + 1}`,
          styleName: item.styleName || `Variation ${idx + 1}`,
          subjectLine: item.subjectLine || `Quick note regarding ${lead.companyName}`,
          previewText: item.previewText || '',
          body: item.body || '',
          callToAction: item.callToAction || 'Would you be open to a brief chat next week?',
          followUpSnippet: item.followUpSnippet || 'Just checking in on this—let me know if you would like me to share our findings.',
          keyPersonalizationPoints: Array.isArray(item.keyPersonalizationPoints)
            ? item.keyPersonalizationPoints
            : [lead.companyName, lead.businessProblem, lead.salesOpportunity].filter(Boolean),
        }));
      }
    }
  } catch (err) {
    console.warn('[OutreachService] Gemini generation error or fallback:', err);
  }

  // Graceful high-quality deterministic fallback if Gemini quota is exhausted or unreachable
  return createFallbackOutreachTemplates(lead, recipientName, senderSignoff);
}

function createFallbackOutreachTemplates(
  lead: Lead,
  recipientName: string,
  senderSignoff: string
): OutreachTemplateOption[] {
  const problem = lead.businessProblem || 'online visibility and conversion';
  const opp = lead.salesOpportunity || 'Web Experience & Optimization';
  const location = lead.city ? ` in ${lead.city}` : '';

  return [
    {
      id: 'template_audit',
      styleName: 'Evidence & Audit Focus',
      subjectLine: `${lead.companyName} web audit - quick observation`,
      previewText: `Noticed a small technical gap on ${lead.companyName}'s digital presence`,
      body: `Hi ${recipientName},\n\nI was doing some research on leading ${lead.industry} businesses${location} and came across ${lead.companyName}.\n\nWhile reviewing your website (${lead.website !== 'No Website Found' ? lead.website : 'current web presence'}), I noticed ${problem.toLowerCase()}.\n\nWe recently helped a similar team address this through ${opp.toLowerCase()}, which directly increased their qualified inquiries.\n\nWould you be open to a 5-minute review of what we found and how to fix it?\n\nBest,\n${senderSignoff}`,
      callToAction: 'Would you be open to a 5-minute review of what we found?',
      followUpSnippet: `Hi ${recipientName}, just following up on my note earlier this week regarding ${lead.companyName}'s website. Would Thursday afternoon work for a brief 5-minute call?`,
      keyPersonalizationPoints: [
        `Targeted to ${recipientName}`,
        `Referenced ${lead.companyName} (${lead.industry})`,
        `Cited observed problem: "${problem}"`,
        `Tailored solution: "${opp}"`,
      ],
    },
    {
      id: 'template_direct',
      styleName: 'Direct Opportunity Pitch',
      subjectLine: `Idea for ${lead.companyName}: ${opp}`,
      previewText: `Actionable strategy to address ${problem} for ${lead.companyName}`,
      body: `Hi ${recipientName},\n\nHope your week is going well.\n\nI wanted to reach out because our team specializes in ${opp.toLowerCase()} for businesses in the ${lead.industry} space.\n\nWe specifically observed that ${lead.companyName} has an opportunity around: "${problem}". By optimizing this, you can significantly enhance your customer acquisition and search presence.\n\nDo you have 10 minutes next Tuesday or Wednesday for a quick brainstorm?\n\nKind regards,\n${senderSignoff}`,
      callToAction: 'Do you have 10 minutes next Tuesday or Wednesday for a quick brainstorm?',
      followUpSnippet: `Hi ${recipientName}, floating this to the top of your inbox in case it got buried. Happy to send over a 2-page brief if that is easier!`,
      keyPersonalizationPoints: [
        `Direct focus on ${lead.companyName}`,
        `Highlights sales opportunity: "${opp}"`,
        `Clear call to action for ${recipientName}`,
      ],
    },
    {
      id: 'template_whatsapp_en',
      styleName: 'WhatsApp Pitch (English)',
      subjectLine: `WhatsApp: ${lead.companyName}`,
      previewText: `Direct WhatsApp message regarding ${lead.companyName}`,
      body: `Hi *${recipientName}*,\n\nI came across *${lead.companyName}* while researching top ${lead.industry} providers${location}.\n\nI noticed an immediate growth opportunity on your website: *${problem}*.\n\nWe specialize in *${opp}* to help businesses like yours double their inbound customer leads.\n\nAre you open to seeing a quick 2-minute breakdown of how to solve this?`,
      callToAction: 'Reply YES to receive the quick 2-minute breakdown.',
      followUpSnippet: `Hi ${recipientName}, just wanted to check if you had a moment to see this? Happy to share our findings whenever convenient.`,
      keyPersonalizationPoints: [
        `Formatted with WhatsApp bolding`,
        `Direct mobile-friendly pitch`,
        `Identifies "${problem}"`,
      ],
    },
    {
      id: 'template_whatsapp_ur',
      styleName: 'WhatsApp Pitch (Roman Urdu)',
      subjectLine: `WhatsApp: ${lead.companyName} (Roman Urdu)`,
      previewText: `Direct WhatsApp message in conversational Roman Urdu`,
      body: `Assalam-o-Alaikum *${recipientName}*!\n\nUmeed hai aap theek honge. Humne aapka business *${lead.companyName}* dekha${location}.\n\nAapki digital presence aur website ko audit karte hue hume ek issue mila: *${problem}*, jis ki wajah se customers inquiry kiye baghair bounce ho rahe hain.\n\nHumne similar ${lead.industry} businesses ke liye *${opp}* implement kiya hai jis se direct inquiries aur bookings me 40-60% izafa hua.\n\nAger aap interested hain to kya hum 2-3 minute WhatsApp par discuss kar sakte hain?\n\nShukriya,\n${senderSignoff}`,
      callToAction: 'Kya hum 2-3 minute WhatsApp par discuss kar sakte hain?',
      followUpSnippet: `Assalam-o-Alaikum ${recipientName}, umeed hai aap khairiyat se honge. Just checking in agar aapne message dekha ho?`,
      keyPersonalizationPoints: [
        `Conversational Roman Urdu for Pakistani business owners`,
        `Respectful professional tone`,
        `Highlights "${problem}" and "${opp}"`,
      ],
    },
  ];
}
