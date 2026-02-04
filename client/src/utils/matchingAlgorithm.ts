import { UserProfile, MatchProfile } from '../types';

/**
 * Calculates a compatibility score between 0 and 100 based on:
 * 1. Interest Overlap (Jaccard Similarity) - 70% weight
 * 2. University/Campus Match - 30% weight
 */
export const calculateMatchPercentage = (
  user: UserProfile,
  candidate: MatchProfile | UserProfile
): number => {
  if (!user.interests || !candidate.interests) return 0;

  // 1. Interest Similarity (Jaccard Index)
  // Convert to lowercase sets for case-insensitive comparison
  const userInterests = new Set(user.interests.map(i => i.toLowerCase()));
  const candidateInterests = new Set(candidate.interests.map(i => i.toLowerCase()));

  // Calculate Intersection (Shared Interests)
  const intersection = [...userInterests].filter(i => candidateInterests.has(i));
  
  // Calculate Union (Total Unique Interests)
  const union = new Set([...userInterests, ...candidateInterests]);

  // Jaccard Score (0 to 1)
  const jaccardIndex = union.size === 0 ? 0 : intersection.length / union.size;
  const interestScore = jaccardIndex * 100;

  // 2. University Match
  // We prioritize matches within the same campus
  const universityScore = user.university === candidate.university ? 100 : 0;

  // 3. Weighted Final Score
  // Weights: Interests (70%), University (30%)
  const totalScore = (interestScore * 0.7) + (universityScore * 0.3);

  // Return rounded integer
  return Math.round(totalScore);
};