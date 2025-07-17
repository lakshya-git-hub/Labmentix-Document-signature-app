const express = require('express');
const jwt = require('jsonwebtoken');
const Document = require('../models/Document');
const Signature = require('../models/Signature');

const router = express.Router();

// Public sign page: verify token and return document info
router.get('/sign/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doc = await Document.findById(decoded.documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    res.json({ document: doc });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired link' });
  }
});

// Public sign: add a signature (no auth, but token required)
router.post('/sign/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { x, y, page, signerName } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const doc = await Document.findById(decoded.documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const signature = new Signature({
      documentId: doc._id,
      userId: null,
      x,
      y,
      page,
      status: 'signed',
      signedAt: new Date(),
      reason: '',
      signerName,
    });
    await signature.save();
    res.json({ message: 'Signature added', signature });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired link' });
  }
});

module.exports = router; 