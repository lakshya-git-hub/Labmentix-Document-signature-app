const express = require('express');
const Audit = require('../models/Audit');
const auth = require('../middleware/auth');

const router = express.Router();

// Get audit logs for a document
router.get('/:docId', auth, async (req, res) => {
  try {
    const logs = await Audit.find({ documentId: req.params.docId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 