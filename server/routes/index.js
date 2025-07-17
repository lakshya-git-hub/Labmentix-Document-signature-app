const express = require('express');
const authRoutes = require('./auth');
const docsRoutes = require('./docs');
const signaturesRoutes = require('./signatures');
const auditRoutes = require('./audit');
const publicRoutes = require('./public');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/docs', docsRoutes);
router.use('/signatures', signaturesRoutes);
router.use('/audit', auditRoutes);
router.use('/public', publicRoutes);

module.exports = router; 