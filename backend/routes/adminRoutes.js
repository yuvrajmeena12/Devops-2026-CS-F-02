const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getStats, getAllUsers, toggleBanUser, removeListing } = require('../controllers/adminController');

router.get('/stats', protect, adminOnly, getStats);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/users/:id/ban', protect, adminOnly, toggleBanUser);
router.delete('/skills/:id', protect, adminOnly, removeListing);

module.exports = router;
