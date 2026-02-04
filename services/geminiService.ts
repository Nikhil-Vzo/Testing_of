import { GoogleGenAI } from "@google/genai";
import { MatchProfile } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set. Gemini features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateIceBreaker = async (
  myInterests: string[],
  theirProfile: MatchProfile
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Hey! Looks like we have some common interests.";

  try {
    const prompt = `
      I am an anonymous student (Interests: ${myInterests.join(', ')}).
      I just matched with another student (ID: ${theirProfile.anonymousId}, Branch: ${theirProfile.branch}, Interests: ${theirProfile.interests.join(', ')}).
      
      Generate a short, fun, and flirty (but safe) ice breaker message I could send to start the conversation.
      Keep it under 30 words. No hashtags.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Hey! What's your favorite thing about your major?";
  }
};

export const checkCompatibility = async (
  myInterests: string[],
  theirProfile: MatchProfile
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Compatibility analysis unavailable.";

  try {
    const prompt = `
      Analyze the compatibility between two students based on interests.
      Student A: ${myInterests.join(', ')}
      Student B (${theirProfile.branch}): ${theirProfile.interests.join(', ')}
      
      Give a 1-sentence summary of why they might get along.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    return "You both seem to have unique tastes!";
  }
};
