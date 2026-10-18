const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getDashboardData } = require('../controllers/dashboardController');

router.get('/', protect, getDashboardData);

module.exports = router;
