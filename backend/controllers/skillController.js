const path = require('path');
const fs = require('fs');
const Skill = require('../models/Skill');
const SwapRequest = require('../models/SwapRequest');
const User = require('../models/User');
const cache = require('../utils/cache');
const { sniff, saveUpload, resolveUpload, removeUpload } = require('../utils/upload');
const { CATEGORIES, LEVELS, MAX_SKILLS_PER_TYPE } = require('../utils/constants');

// GET /api/public/overview (Cached for 60s)
const overview = async (req, res) => {
  try {
    const data = await cache.remember('public:overview', 60_000, async () => {
      const [members, skills, completedSwaps, recentSkills] = await Promise.all([
        User.countDocuments(),
        Skill.countDocuments({ type: 'teach' }),
        SwapRequest.countDocuments({ status: 'completed' }),
        Skill.find({ type: 'teach' })
          .select('title name category level createdAt')
          .sort({ createdAt: -1 })
          .limit(6)
          .lean(),
      ]);

      const recent = recentSkills.map((s) => ({
        name: s.title || s.name,
        category: s.category,
        level: s.level,
      }));

      return {
        members,
        skills,
        completedSwaps,
        recent,
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/categories (Cached for 60s)
const getCategories = async (req, res) => {
  try {
    const data = await cache.remember('skills:categories', 60_000, async () => {
      const counts = await Skill.aggregate([
        { $match: { type: 'teach' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);

      const countMap = new Map(counts.map((c) => [c._id, c.count]));
      const categories = CATEGORIES.map((cat) => ({
        name: cat,
        count: countMap.get(cat) || 0,
      }));

      return {
        categories,
        levels: LEVELS,
      };
    });

    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/explore and GET /api/skills (Filtered, searchable, paginated catalog)
const browseSkills = async (req, res) => {
  try {
    const {
      type = 'teach',
      search,
      category,
      level,
      mode,
      sort = 'newest',
      page = 1,
      limit = 30,
      excludeSelf,
    } = req.query;

    const query = {};

    // Normalize type filter
    if (type && type !== 'all') {
      const normalizedType = type === 'want' ? 'learn' : type;
      query.type = normalizedType;
    }

    if (category && category !== 'All' && CATEGORIES.includes(category)) {
      query.category = category;
    }

    if (level) {
      query.level = level.toLowerCase();
    }

    if (mode && mode !== 'both') {
      query.mode = { $in: [mode, 'both'] };
    }

    if (search && typeof search === 'string' && search.trim()) {
      const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { name: { $regex: safeSearch, $options: 'i' } },
        { description: { $regex: safeSearch, $options: 'i' } },
        { category: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    if (excludeSelf !== 'false' && req.user) {
      query.user = { $ne: req.user._id };
    }

    const sortOrder = {};
    if (sort === 'oldest') sortOrder.createdAt = 1;
    else if (sort === 'title' || sort === 'name') sortOrder.nameLower = 1;
    else sortOrder.createdAt = -1;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(60, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (parsedPage - 1) * parsedLimit;

    const [skills, total] = await Promise.all([
      Skill.find(query)
        .populate('user', 'name profilePicUrl isVerified verified trustScore rating ratingAvg ratingCount completedSwapsCount location qualification')
        .sort(sortOrder)
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      Skill.countDocuments(query),
    ]);

    const formattedItems = skills.map((s) => ({
      _id: s._id,
      id: s._id,
      title: s.title || s.name,
      name: s.name || s.title,
      category: s.category,
      level: s.level,
      type: s.type,
      mode: s.mode,
      description: s.description,
      hasProof: Boolean(s.hasProof || s.certificateFile || (s.proof && s.proof.file)),
      isVerified: Boolean(s.isVerified),
      createdAt: s.createdAt,
      user: s.user,
      owner: s.user,
    }));

    res.set('X-Total-Count', total.toString());
    res.set('X-Page', parsedPage.toString());
    res.set('X-Per-Page', parsedLimit.toString());

    // Backwards-compatible: if query.format === 'object' or route is /explore, return object, else send array with properties attached
    const hasMore = total > skip + parsedLimit;
    const responsePayload = formattedItems;
    responsePayload.items = formattedItems;
    responsePayload.page = parsedPage;
    responsePayload.limit = parsedLimit;
    responsePayload.total = total;
    responsePayload.hasMore = hasMore;

    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/mine
const getMySkills = async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();

    const teach = [];
    const learn = [];

    skills.forEach((s) => {
      const item = {
        _id: s._id,
        id: s._id,
        title: s.title || s.name,
        name: s.name || s.title,
        category: s.category,
        level: s.level,
        type: s.type,
        mode: s.mode,
        description: s.description,
        hasProof: Boolean(s.hasProof || s.certificateFile || (s.proof && s.proof.file)),
        isVerified: Boolean(s.isVerified),
        createdAt: s.createdAt,
      };

      if (s.type === 'teach') teach.push(item);
      else learn.push(item);
    });

    // Provide both partitioned object and flat array for frontend compatibility
    const response = skills.map((s) => ({ ...s, id: s._id }));
    response.teach = teach;
    response.learn = learn;

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/user/:userId
const getSkillsByUser = async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.params.userId }).sort({ createdAt: -1 }).lean();
    const teach = skills.filter((s) => s.type === 'teach').map((s) => ({ ...s, id: s._id }));
    const learn = skills.filter((s) => s.type !== 'teach').map((s) => ({ ...s, id: s._id }));
    res.json({ teach, learn, all: skills });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/:id
const getSkillById = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('user', 'name profilePicUrl isVerified verified rating ratingAvg ratingCount completedSwapsCount location')
      .lean();
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    res.json({ skill: { ...skill, id: skill._id }, ...skill });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/skills (Create skill with duplicate prevention, limit, and proof validation)
const addSkill = async (req, res) => {
  try {
    const rawTitle = req.body.title || req.body.name;
    let rawType = req.body.type || 'teach';
    if (rawType === 'want') rawType = 'learn';

    if (!rawTitle || !rawTitle.trim()) {
      return res.status(400).json({ success: false, message: 'Skill title is required' });
    }

    const trimmedTitle = rawTitle.trim();
    const normalizedName = trimmedTitle.toLowerCase();

    // 1. Check max skills limit (50 per type)
    const currentCount = await Skill.countDocuments({ user: req.user._id, type: rawType });
    if (currentCount >= MAX_SKILLS_PER_TYPE) {
      return res.status(400).json({
        success: false,
        message: `You have reached the maximum limit of ${MAX_SKILLS_PER_TYPE} ${rawType} skills`,
      });
    }

    // 2. Duplicate prevention invariant
    const existing = await Skill.findOne({
      user: req.user._id,
      nameLower: normalizedName,
      type: rawType,
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You have already listed "${trimmedTitle}" under your ${rawType} skills`,
      });
    }

    // 3. Validate category & level
    let category = req.body.category || 'Other';
    if (!CATEGORIES.includes(category)) category = 'Other';

    let level = req.body.level ? String(req.body.level).toLowerCase() : 'intermediate';
    if (!LEVELS.includes(level)) level = 'intermediate';

    let mode = req.body.mode || 'both';
    let description = req.body.description ? String(req.body.description).trim() : '';

    // 4. Handle file proof upload if attached
    let certificateFile = '';
    let certificateFileName = '';
    let certificateFileType = '';
    let proofData = { file: null, mime: null, originalName: null, size: 0, uploadedAt: null };
    let hasProof = false;

    if (req.file) {
      if (rawType !== 'teach') {
        return res.status(400).json({
          success: false,
          message: 'Certificates and proof documents can only be attached to skills you teach',
        });
      }

      const detected = sniff(req.file.buffer);
      if (!detected || !['pdf', 'png', 'jpg', 'webp'].includes(detected.ext)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format. Proof documents must be PDF, PNG, JPG, or WEBP up to 5MB.',
        });
      }

      const base64 = req.file.buffer.toString('base64');
      certificateFile = `data:${detected.mime};base64,${base64}`;
      certificateFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      certificateFileType = detected.mime;
      hasProof = true;

      // Save upload to disk storage
      try {
        const saved = await saveUpload(req.file, 'proofs', ['pdf', 'png', 'jpg', 'webp']);
        proofData = {
          file: saved.filename,
          mime: saved.mimeType,
          originalName: saved.originalName,
          size: saved.size,
          uploadedAt: new Date(),
        };
      } catch (_) {
        // Fallback to data URI if disk write unavailable
      }
    }

    const skill = await Skill.create({
      user: req.user._id,
      owner: req.user._id,
      title: trimmedTitle,
      name: trimmedTitle,
      nameLower: normalizedName,
      category,
      level,
      type: rawType,
      mode,
      description,
      certificateFile,
      certificateFileName,
      certificateFileType,
      proof: proofData,
      hasProof,
      isVerified: hasProof,
    });

    // Invalidate caches
    cache.invalidate('public:');
    cache.invalidate('skills:');
    cache.invalidate(`matches:${String(req.user._id)}`);
    cache.invalidate(`dash:${String(req.user._id)}`);

    res.status(201).json({
      success: true,
      message: 'Skill listed successfully',
      skill,
      ...skill.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/skills/:id (Guarded against skills participating in active swaps)
const updateSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

    // Active swap guard
    const activeSwap = await SwapRequest.findOne({
      $or: [{ requestedSkill: skill._id }, { offeredSkill: skill._id }],
      status: { $in: ['pending', 'accepted', 'scheduled', 'in_progress'] },
    });
    if (activeSwap) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify a skill participating in an ongoing swap proposal or session',
      });
    }

    const { title, name, category, description, level, mode } = req.body;
    if (title || name) {
      const newTitle = (title || name).trim();
      skill.title = newTitle;
      skill.name = newTitle;
      skill.nameLower = newTitle.toLowerCase();
    }
    if (category && CATEGORIES.includes(category)) skill.category = category;
    if (description !== undefined) skill.description = description.trim();
    if (level && LEVELS.includes(level.toLowerCase())) skill.level = level.toLowerCase();
    if (mode) skill.mode = mode;

    // Handle proof replacement if a new file is uploaded
    if (req.file) {
      if (skill.type !== 'teach') {
        return res.status(400).json({
          success: false,
          message: 'Certificates and proof documents can only be attached to skills you teach',
        });
      }
      const detected = sniff(req.file.buffer);
      if (!detected || !['pdf', 'png', 'jpg', 'webp'].includes(detected.ext)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid file format. Proof documents must be PDF, PNG, JPG, or WEBP up to 5MB.',
        });
      }
      const base64 = req.file.buffer.toString('base64');
      skill.certificateFile = `data:${detected.mime};base64,${base64}`;
      skill.certificateFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      skill.certificateFileType = detected.mime;
      skill.hasProof = true;
      skill.isVerified = true;
    }

    await skill.save();

    cache.invalidate('public:');
    cache.invalidate('skills:');
    cache.invalidate(`matches:${String(req.user._id)}`);
    cache.invalidate(`dash:${String(req.user._id)}`);

    res.json({
      success: true,
      message: 'Skill updated successfully',
      skill,
      ...skill.toObject(),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/skills/:id (Guarded against active swaps)
const deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

    // Active swap guard
    const activeSwap = await SwapRequest.findOne({
      $or: [{ requestedSkill: skill._id }, { offeredSkill: skill._id }],
      status: { $in: ['pending', 'accepted', 'scheduled', 'in_progress'] },
    });
    if (activeSwap) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a skill participating in an ongoing swap proposal or session',
      });
    }

    if (skill.proof && skill.proof.file) {
      await removeUpload('proofs', skill.proof.file);
    }

    await Skill.findByIdAndDelete(skill._id);

    cache.invalidate('public:');
    cache.invalidate('skills:');
    cache.invalidate(`matches:${String(req.user._id)}`);
    cache.invalidate(`dash:${String(req.user._id)}`);

    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/skills/:id/certificate (Upload or replace proof)
const uploadCertificate = async (req, res) => {
  try {
    const skill = await Skill.findOne({ _id: req.params.id, user: req.user._id });
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    if (skill.type !== 'teach') {
      return res.status(400).json({
        success: false,
        message: 'Certificates/proof can only be attached to skills you teach',
      });
    }
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const detected = sniff(req.file.buffer);
    if (!detected || !['pdf', 'png', 'jpg', 'webp'].includes(detected.ext)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file signature. File must be PDF, PNG, JPG, or WEBP.',
      });
    }

    const base64 = req.file.buffer.toString('base64');
    skill.certificateFile = `data:${detected.mime};base64,${base64}`;
    skill.certificateFileName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    skill.certificateFileType = detected.mime;
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
    skill.proof = { file: null, mime: null, originalName: null, size: 0, uploadedAt: null };
    await skill.save();
    res.json(skill);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/skills/:id/proof & GET /api/skills/:id/certificate (Streams document with CSP Sandbox)
const getCertificate = async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill || (!skill.certificateFile && (!skill.proof || !skill.proof.file))) {
      return res.status(404).json({ success: false, message: 'No proof document attached for this skill' });
    }

    // Set mandatory sandboxed security headers
    res.set({
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline; filename="proof"',
    });

    if (skill.certificateFile && skill.certificateFile.startsWith('data:')) {
      const match = skill.certificateFile.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        res.contentType(mime);
        return res.send(buffer);
      }
    }

    if (skill.proof && skill.proof.file) {
      const filePath = resolveUpload('proofs', skill.proof.file);
      if (filePath && fs.existsSync(filePath)) {
        res.contentType(skill.proof.mime || 'application/pdf');
        return fs.createReadStream(filePath).pipe(res);
      }
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

module.exports = {
  overview,
  getCategories,
  browseSkills,
  getMySkills,
  getSkillsByUser,
  getSkillById,
  addSkill,
  updateSkill,
  deleteSkill,
  uploadCertificate,
  removeCertificate,
  getCertificate,
};
