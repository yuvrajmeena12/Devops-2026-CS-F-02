const Skill = require('../models/Skill');
const User = require('../models/User');
const cache = require('../utils/cache');

/**
 * Deterministic Smart Match Engine
 * Formula:
 * Score = (isReciprocal ? 100 : 40)
 *       + min(theyTeachCount, 3) * 8
 *       + min(youTeachCount, 3) * 8
 *       + (isVerified ? 6 : 0)
 *       + min(ratingAvg, 5)
 */
async function computeMatches(userId, { limitCandidates = 300 } = {}) {
  const cacheKey = `matches:${String(userId)}`;
  return cache.remember(cacheKey, 30_000, async () => {
    const mySkills = await Skill.find({ user: userId }).select('type nameLower title name level category hasProof certificateFile isVerified').lean();
    const iTeach = mySkills.filter((s) => s.type === 'teach');
    const iLearn = mySkills.filter((s) => s.type === 'learn' || s.type === 'want');

    const teachNames = iTeach.map((s) => s.nameLower).filter(Boolean);
    const learnNames = iLearn.map((s) => s.nameLower).filter(Boolean);

    if (!teachNames.length && !learnNames.length) {
      return { matches: [], hasSkills: false, hasTeach: false, hasLearn: false };
    }

    const [theyTeach, theyLearn] = await Promise.all([
      learnNames.length
        ? Skill.find({
            type: 'teach',
            nameLower: { $in: learnNames },
            user: { $ne: userId },
          })
            .select('user title name nameLower level category hasProof certificateFile isVerified')
            .limit(limitCandidates)
            .lean()
        : [],
      teachNames.length
        ? Skill.find({
            type: { $in: ['learn', 'want'] },
            nameLower: { $in: teachNames },
            user: { $ne: userId },
          })
            .select('user title name nameLower')
            .limit(limitCandidates)
            .lean()
        : [],
    ]);

    const byUser = new Map();
    const getSlot = (id) => {
      const k = String(id);
      if (!byUser.has(k)) {
        byUser.set(k, { userId: id, theyTeachMe: [], iTeachThem: [] });
      }
      return byUser.get(k);
    };

    theyTeach.forEach((s) => getSlot(s.user).theyTeachMe.push(s));
    theyLearn.forEach((s) => getSlot(s.user).iTeachThem.push(s));

    const candidateIds = [...byUser.values()].map((m) => m.userId);
    const users = await User.find({ _id: { $in: candidateIds }, isBanned: false })
      .select('name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwaps completedSwapsCount location qualification bio')
      .lean();

    const userMap = new Map(users.map((u) => [String(u._id), u]));

    const matches = [...byUser.values()]
      .filter((m) => userMap.has(String(m.userId)))
      .map((m) => {
        const u = userMap.get(String(m.userId));
        const reciprocal = m.theyTeachMe.length > 0 && m.iTeachThem.length > 0;
        const theyTeachCount = m.theyTeachMe.length;
        const youTeachCount = m.iTeachThem.length;
        const isVerified = Boolean(u.isVerified || u.verified);
        const ratingAvg = u.ratingAvg || u.rating || 0;

        const score =
          (reciprocal ? 100 : 40) +
          Math.min(theyTeachCount, 3) * 8 +
          Math.min(youTeachCount, 3) * 8 +
          (isVerified ? 6 : 0) +
          Math.min(ratingAvg, 5);

        const theyTeachTitles = m.theyTeachMe.map((s) => s.title || s.name);
        const youTeachTitles = m.iTeachThem.map((s) => s.title || s.name);

        return {
          user: {
            _id: u._id,
            id: u._id,
            name: u.name,
            profilePicUrl: u.profilePicUrl,
            location: u.location,
            qualification: u.qualification,
            isVerified,
            verified: isVerified,
            trustScore: ratingAvg,
            rating: ratingAvg,
            ratingAvg,
            ratingCount: u.ratingCount || 0,
            completedSwapsCount: u.completedSwapsCount || 0,
            bio: u.bio,
          },
          type: reciprocal ? 'reciprocal' : theyTeachCount ? 'they_teach_you' : 'you_teach_them',
          score: Math.round(score),
          mutualMatch: reciprocal,
          theyTeach: theyTeachTitles,
          theyTeachSkills: m.theyTeachMe.map((s) => ({
            _id: s._id,
            id: s._id,
            title: s.title || s.name,
            category: s.category,
            level: s.level,
            hasProof: Boolean(s.hasProof || s.certificateFile),
            isVerified: Boolean(s.isVerified),
          })),
          theyTeachYou: m.theyTeachMe.map((s) => ({
            id: s._id,
            _id: s._id,
            name: s.title || s.name,
            level: s.level,
            category: s.category,
          })),
          iTeachThem: youTeachTitles,
          youTeachThem: m.iTeachThem.map((s) => ({
            id: s._id,
            _id: s._id,
            name: s.title || s.name,
          })),
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      matches,
      hasSkills: true,
      hasTeach: iTeach.length > 0,
      hasLearn: iLearn.length > 0,
    };
  });
}

// GET /api/matches (Paginated Smart Match Directory)
const listMatches = async (req, res) => {
  try {
    const { type, page = 1, limit = 9 } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(24, Math.max(1, parseInt(limit, 10) || 9));
    const skip = (parsedPage - 1) * parsedLimit;

    const { matches, hasSkills, hasTeach, hasLearn } = await computeMatches(req.user._id);

    let filtered = matches;
    if (type === 'reciprocal') {
      filtered = matches.filter((m) => m.type === 'reciprocal');
    } else if (type === 'one_way') {
      filtered = matches.filter((m) => m.type !== 'reciprocal');
    }

    const items = filtered.slice(skip, skip + parsedLimit);
    const hasMore = skip + parsedLimit < filtered.length;

    // Both array behavior and object properties for dual client compatibility
    const response = items;
    response.items = items;
    response.page = parsedPage;
    response.limit = parsedLimit;
    response.total = filtered.length;
    response.hasMore = hasMore;
    response.hasSkills = hasSkills;
    response.hasTeach = hasTeach;
    response.hasLearn = hasLearn;

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  computeMatches,
  listMatches,
};
