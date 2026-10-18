const User = require('../models/User');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const cache = require('../utils/cache');

// GET /api/dashboard
const getDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `dash:${userId}`;

    // Return cached dashboard if valid
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();

    const [
      skills,
      completedSwapsCount,
      activeSwapsCount,
      pendingIncomingCount,
      upcomingSessions,
      recentSwaps,
      recentNotifications,
    ] = await Promise.all([
      Skill.find({ user: userId }),
      SwapRequest.countDocuments({
        $or: [{ fromUser: userId }, { toUser: userId }],
        status: 'completed',
      }),
      SwapRequest.countDocuments({
        $or: [{ fromUser: userId }, { toUser: userId }],
        status: { $in: ['pending', 'accepted', 'scheduled', 'in_progress'] },
      }),
      SwapRequest.countDocuments({
        $or: [{ toUser: userId }, { provider: userId }],
        status: 'pending',
      }),
      Session.find({
        participants: userId,
        status: 'scheduled',
        scheduledDateTime: { $gte: now },
      })
        .populate('participants', 'name avatar profilePicUrl isVerified rating')
        .sort({ scheduledDateTime: 1 })
        .limit(3),
      SwapRequest.find({
        $or: [{ fromUser: userId }, { toUser: userId }],
      })
        .populate('fromUser', 'name avatar profilePicUrl isVerified rating')
        .populate('toUser', 'name avatar profilePicUrl isVerified rating')
        .populate('requestedSkill', 'name category level')
        .populate('offeredSkill', 'name category level')
        .sort({ updatedAt: -1 })
        .limit(5),
      Notification.find({
        $or: [{ user: userId }, { recipient: userId }],
      })
        .populate('actor', 'name avatar profilePicUrl isVerified')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    const teachSkills = skills.filter((s) => s.type === 'teach');
    const learnSkills = skills.filter((s) => s.type === 'learn');

    // Onboarding milestones calculation (5 exact items)
    const milestonesList = [
      {
        id: 'email_verified',
        title: 'Verify Email',
        description: 'Account email confirmed and verified',
        completed: Boolean(user.isEmailVerified),
      },
      {
        id: 'bio_added',
        title: 'Add Bio',
        description: 'Write a short bio describing your background',
        completed: Boolean(user.bio && user.bio.trim().length > 0),
      },
      {
        id: 'avatar_uploaded',
        title: 'Upload Profile Picture',
        description: 'Add a clear avatar picture to your profile',
        completed: Boolean(user.avatar || user.profilePicUrl),
      },
      {
        id: 'first_teach_skill',
        title: 'Offer a Skill to Teach',
        description: 'Publish your first teaching skill in the catalog',
        completed: teachSkills.length > 0,
      },
      {
        id: 'first_learn_skill',
        title: 'Add a Skill to Learn',
        description: 'Specify at least one skill you wish to master',
        completed: learnSkills.length > 0,
      },
    ];

    const completedMilestones = milestonesList.filter((m) => m.completed).length;

    // Road to Verified Member calculation
    const VERIFICATION_THRESHOLD = 5;
    const MIN_RATING = 3.5;
    const effectiveCompleted = Math.max(user.completedSwapsCount || 0, completedSwapsCount);
    const effectiveRating = user.rating || 0;

    let roadToVerifiedPercent = 0;
    if (user.isVerified) {
      roadToVerifiedPercent = 100;
    } else {
      const swapsComponent = Math.min(1, effectiveCompleted / VERIFICATION_THRESHOLD) * 60;
      const ratingComponent = Math.min(1, effectiveRating / MIN_RATING) * 40;
      roadToVerifiedPercent = Math.min(99, Math.round(swapsComponent + ratingComponent));
    }

    const payload = {
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || user.profilePicUrl || '',
        profilePicUrl: user.profilePicUrl || user.avatar || '',
        bio: user.bio || '',
        location: user.location || '',
        isVerified: Boolean(user.isVerified),
        rating: user.rating || 0,
        trustScore: user.trustScore || user.rating || 0,
        ratingCount: user.ratingCount || 0,
        completedSwapsCount: effectiveCompleted,
        role: user.role,
      },
      stats: {
        totalTeachSkills: teachSkills.length,
        totalLearnSkills: learnSkills.length,
        totalCompletedSwaps: effectiveCompleted,
        activeSwapsCount,
        pendingIncomingRequests: pendingIncomingCount,
      },
      onboarding: {
        milestones: milestonesList,
        completedCount: completedMilestones,
        totalCount: milestonesList.length,
        allCompleted: completedMilestones === milestonesList.length,
        progressPercent: Math.round((completedMilestones / milestonesList.length) * 100),
      },
      roadToVerified: {
        isVerified: Boolean(user.isVerified),
        currentCompletedSwaps: effectiveCompleted,
        targetCompletedSwaps: VERIFICATION_THRESHOLD,
        currentRating: effectiveRating,
        targetRating: MIN_RATING,
        progressPercent: roadToVerifiedPercent,
      },
      upcomingSessions,
      recentSwaps,
      recentNotifications,
      skills: {
        teach: teachSkills,
        learn: learnSkills,
      },
    };

    // Cache response for 30 seconds
    cache.set(cacheKey, payload, 30);

    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardData,
};
