const Skill = require('../models/Skill');

// POST /api/skills
const addSkill = async (req, res) => {
  try {
    const { title, category, description, level, type, mode } = req.body;
    if (!title || !type) return res.status(400).json({ success: false, message: 'Title and type are required' });

    const skill = await Skill.create({
      user: req.user._id,
      title: title.trim(),
      category: category || 'Other',
      description: description || '',
      level: level || 'Beginner',
      type, // 'teach' or 'want'
      mode: mode || 'both',
    });
    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/skills/:id/certificate (multipart/form-data, field "certificate")
const uploadCertificate = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    if (skill.type !== 'teach') {
      return res.status(400).json({ success: false, message: 'Certificates/proof can only be attached to skills you teach' });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    // Validate magic bytes for PDF, PNG, JPG to prevent polyglot file execution
    const buffer = req.file.buffer;
    const isPdf = buffer.length > 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46; // %PDF
    const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47; // .PNG
    const isJpg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff; // JPEG

    if (!isPdf && !isPng && !isJpg) {
      return res.status(400).json({ success: false, message: 'Invalid file signature. File contents do not match permitted document types.' });
    }

    const base64 = buffer.toString('base64');
    skill.certificateFile = `data:${req.file.mimetype};base64,${base64}`;
    skill.certificateFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    skill.certificateFileType = req.file.mimetype;
    skill.hasProof = true;
    skill.isVerified = true;
    await skill.save();

    res.json(skill);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/skills/:id/certificate
const removeCertificate = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    skill.certificateFile = '';
    skill.certificateFileName = '';
    skill.certificateFileType = '';
    skill.hasProof = false;
    skill.isVerified = false;
    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills with server-side pagination, searching, and filtering
const browseSkills = async (req, res) => {
  try {
    const { category, mode, type, search, excludeSelf, page = 1, limit = 50 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (mode) query.mode = mode;
    if (type && type !== 'all') query.type = type;
    if (search && typeof search === 'string' && search.trim()) {
      // Escape regex control characters to prevent ReDoS
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    if (excludeSelf !== 'false' && req.user) query.user = { $ne: req.user._id };

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (parsedPage - 1) * parsedLimit;

    const [skills, total] = await Promise.all([
      Skill.find(query)
        .select('-certificateFile')
        .populate('user', 'name profilePicUrl isVerified trustScore rating ratingCount location completedSwapsCount qualification')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Skill.countDocuments(query),
    ]);

    // Backwards compatibility: return array directly, but attach pagination metadata via response headers
    res.set('X-Total-Count', total.toString());
    res.set('X-Page', parsedPage.toString());
    res.set('X-Per-Page', parsedLimit.toString());
    res.json(skills);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/:id/certificate
const getCertificate = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id).select(
      'certificateFile certificateFileName certificateFileType title'
    );
    if (!skill || !skill.certificateFile) {
      return res.status(404).json({ success: false, message: 'No certificate/proof attached for this skill' });
    }
    res.json({
      certificateFile: skill.certificateFile,
      certificateFileName: skill.certificateFileName,
      certificateFileType: skill.certificateFileType,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/mine
const getMySkills = async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user._id }).select('-certificateFile').sort({ createdAt: -1 });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/user/:userId
const getSkillsByUser = async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.params.userId }).select('-certificateFile').sort({ createdAt: -1 });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/skills/:id
const updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    
    // Explicit whitelist of modifiable attributes
    const { title, category, description, level, type, mode } = req.body;
    if (title !== undefined) skill.title = title.trim();
    if (category !== undefined) skill.category = category;
    if (description !== undefined) skill.description = description;
    if (level !== undefined) skill.level = level;
    if (type !== undefined) skill.type = type;
    if (mode !== undefined) skill.mode = mode;

    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/skills/:id
const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/matches (Smart Match)
const getMatches = async (req, res) => {
  try {
    const [myWantSkills, myTeachSkills] = await Promise.all([
      Skill.find({ user: req.user._id, type: 'want' }).lean(),
      Skill.find({ user: req.user._id, type: 'teach' }).lean(),
    ]);

    const wantTitles = myWantSkills.map((s) => s.title.toLowerCase().trim()).filter(Boolean);
    const teachTitles = myTeachSkills.map((s) => s.title.toLowerCase().trim()).filter(Boolean);

    if (wantTitles.length === 0 && teachTitles.length === 0) {
      return res.json([]);
    }

    let candidateTeachSkills = [];
    if (wantTitles.length > 0) {
      // Escape regex patterns for safe search
      const safeWantRegex = wantTitles.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
      candidateTeachSkills = await Skill.find({
        type: 'teach',
        user: { $ne: req.user._id },
        title: { $regex: safeWantRegex, $options: 'i' },
      })
        .select('-certificateFile')
        .populate('user', 'name profilePicUrl isVerified trustScore rating completedSwapsCount location qualification')
        .lean();
    }

    const matchesByUser = {};
    for (const skill of candidateTeachSkills) {
      if (!skill.user) continue;
      const uid = skill.user._id.toString();
      if (!matchesByUser[uid]) {
        matchesByUser[uid] = {
          user: skill.user,
          theyTeach: [],
          theyTeachSkills: [],
          mutualMatch: false,
          iTeachThem: [],
        };
      }
      matchesByUser[uid].theyTeach.push(skill.title);
      matchesByUser[uid].theyTeachSkills.push({
        _id: skill._id,
        title: skill.title,
        category: skill.category,
        level: skill.level,
        hasProof: skill.hasProof || skill.isVerified,
        isVerified: skill.isVerified,
      });
    }

    // Batch query for mutual match verification
    const candidateUserIds = Object.keys(matchesByUser);
    if (candidateUserIds.length > 0 && teachTitles.length > 0) {
      const allTheirWants = await Skill.find({
        user: { $in: candidateUserIds },
        type: 'want',
      }).lean();

      for (const wantSkill of allTheirWants) {
        const uid = wantSkill.user.toString();
        const wantTitle = wantSkill.title.toLowerCase().trim();
        const overlap = teachTitles.filter((t) => wantTitle.includes(t) || t.includes(wantTitle));
        if (overlap.length > 0 && matchesByUser[uid]) {
          matchesByUser[uid].mutualMatch = true;
          if (!matchesByUser[uid].iTeachThem.includes(overlap[0])) {
            matchesByUser[uid].iTeachThem.push(...overlap);
          }
        }
      }
    }

    res.json(Object.values(matchesByUser));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  addSkill,
  browseSkills,
  getMySkills,
  updateSkill,
  deleteSkill,
  getMatches,
  getSkillsByUser,
  uploadCertificate,
  removeCertificate,
  getCertificate,
};
