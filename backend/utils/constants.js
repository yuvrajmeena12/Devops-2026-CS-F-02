// 15 predefined industry categories and 4 proficiency tiers as required by the reference specification
const CATEGORIES = [
  'Programming',
  'Web Development',
  'Data & AI',
  'Design',
  'Video & Photography',
  'Music',
  'Languages',
  'Business',
  'Marketing',
  'Writing',
  'Science & Math',
  'Cooking',
  'Fitness & Wellness',
  'Public Speaking',
  'Other',
];

const LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

module.exports = {
  CATEGORIES,
  SKILL_CATEGORIES: CATEGORIES,
  LEVELS,
  PROFICIENCY_LEVELS: LEVELS,
  MAX_SKILLS_PER_TYPE: 50,
  PROOF_TYPES: ['pdf', 'png', 'jpg', 'webp'],
  AVATAR_TYPES: ['png', 'jpg', 'webp'],
  VERIFICATION_THRESHOLD: 5,
  VERIFICATION_MIN_RATING: 3.5,
  MIN_VERIFIED_RATING: 3.5,
  MIN_SESSION_LEAD_MS: 5 * 60 * 1000,
  MIN_SESSION_DURATION: 15,
  MAX_SESSION_DURATION: 480,
};
