/**
 * Unit tests — introValidator.service (heuristic check)
 *
 * Per spec §3, the primary gate is "any message in intro channel".
 * These tests cover the optional heuristic that gives friendly suggestions.
 */
const { heuristicCheck } = require("../src/services/introValidator.service");

describe("heuristicCheck", () => {
  const goodIntro = `
    Hey everyone! I'm Alex, a Solana developer based in Kuala Lumpur.
    Fun fact: I accidentally deployed to mainnet during my first week of learning.
    I'm looking to contribute to Superteam MY by helping new builders get started
    and connecting people with the right opportunities in the ecosystem.
  `;

  test("accepts a complete intro covering all 4 spec fields", () => {
    const { looksLikeIntro, suggestions } = heuristicCheck(goodIntro);
    expect(looksLikeIntro).toBe(true);
    expect(suggestions).toHaveLength(0);
  });

  test("flags an intro that is too short (< 15 words)", () => {
    const { looksLikeIntro, suggestions } = heuristicCheck("Hi I am here");
    expect(looksLikeIntro).toBe(false);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  test("flags a missing fun fact field", () => {
    const noFunFact = `
      I'm a developer based in Penang.
      I want to contribute to Superteam and help build the community here.
      Looking to support builders and connect people with opportunities.
    `;
    const { suggestions } = heuristicCheck(noFunFact);
    expect(suggestions.some((s) => s.toLowerCase().includes("fun fact"))).toBe(true);
  });

  test("allows 1 missing field (looksLikeIntro still true)", () => {
    // Missing fun_fact but has the other 3
    const threeFour = `
      I'm a developer based in Kuala Lumpur.
      I want to contribute to Superteam by building tools.
      Looking to support and help the ecosystem grow.
    `;
    const { looksLikeIntro } = heuristicCheck(threeFour);
    expect(looksLikeIntro).toBe(true);
  });

  test("handles null/empty input gracefully", () => {
    expect(heuristicCheck("").looksLikeIntro).toBe(false);
    expect(heuristicCheck(null).looksLikeIntro).toBe(false);
  });
});

