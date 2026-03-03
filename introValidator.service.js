/**
 * introValidator.service
 *
 * Per spec §3:
 *   PRIMARY gate  — any message posted in the Intro Channel = "introduced"
 *   BONUS heuristic — optionally checks whether the message loosely covers
 *                     the 4 spec fields. Enabled via HEURISTIC_VALIDATION=true.
 *
 * The heuristic gives friendly suggestions but is NOT a hard block.
 */

// Spec §2 fields: who/what, location, fun fact, contribution
const FIELD_HINTS = {
  identity: {
    pattern: /\b(i[' ]?m|i am|my name|i work|i build|i design|i write|i do|developer|designer|founder|engineer|researcher)\b/i,
    suggestion: "Who are you & what do you do?",
  },
  location: {
    pattern: /\b(based|location|from|in |city|country|living|kl|kuala lumpur|malaysia|penang|johor|sabah|sarawak)\b/i,
    suggestion: "Where are you based?",
  },
  fun_fact: {
    pattern: /\b(fun fact|interesting|hobby|outside|love|enjoy|passion|actually|surprisingly|weird|random|also|besides)\b/i,
    suggestion: "One fun fact about you",
  },
  contribution: {
    pattern: /\b(contribute|contribution|help|support|build|join|superteam|community|looking to|here to|goal|plan|hoping)\b/i,
    suggestion: "How are you looking to contribute to Superteam MY?",
  },
};

/**
 * Heuristic check — returns suggestions for fields that seem missing.
 * Never used as a hard gate; only for friendly feedback.
 *
 * @param {string} text
 * @returns {{ looksLikeIntro: boolean, suggestions: string[] }}
 */
function heuristicCheck(text) {
  if (!text || text.trim().split(/\s+/).length < 15) {
    return {
      looksLikeIntro: false,
      suggestions: Object.values(FIELD_HINTS).map((f) => f.suggestion),
    };
  }

  const missingSuggestions = Object.values(FIELD_HINTS)
    .filter(({ pattern }) => !pattern.test(text))
    .map(({ suggestion }) => suggestion);

  return {
    looksLikeIntro: missingSuggestions.length <= 1, // allow 1 missing field
    suggestions: missingSuggestions,
  };
}

module.exports = { heuristicCheck };

