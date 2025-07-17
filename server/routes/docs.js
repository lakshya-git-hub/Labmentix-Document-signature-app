const express = require('express');
const multer = require('multer');
const path = require('path');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// Upload PDF
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    // Validate PDF structure using pdf-lib
    const fileBuffer = fs.readFileSync(req.file.path);
    try {
      await PDFDocument.load(fileBuffer);
    } catch (e) {
      // Invalid PDF, delete file and return error
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Uploaded file is not a valid PDF.' });
    }
    const doc = new Document({
      user: req.user.userId,
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// List user PDFs
router.get('/', auth, async (req, res) => {
  try {
    const docs = await Document.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// View specific doc
router.get('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.user.toString() !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });
    // Get PDF size
    let pdfWidth = 595, pdfHeight = 842;
    try {
      const fileBuffer = fs.readFileSync(doc.path);
      const pdfDoc = await PDFDocument.load(fileBuffer);
      const page = pdfDoc.getPages()[0];
      pdfWidth = page.getWidth();
      pdfHeight = page.getHeight();
    } catch (e) {
      // fallback to default A4
    }
    res.json({ ...doc.toObject(), pdfWidth, pdfHeight });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Generate public signature link
router.post('/share/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.user.toString() !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });
    const token = jwt.sign({ documentId: doc._id }, process.env.JWT_SECRET, { expiresIn: '2d' });
    const publicUrl = `${req.protocol}://${req.get('host')}/public/sign/${token}`;
    res.json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a document
router.delete('/:id', auth, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    if (doc.user.toString() !== req.user.userId) return res.status(403).json({ message: 'Unauthorized' });
    // Delete file from disk
    if (doc.path && require('fs').existsSync(doc.path)) {
      require('fs').unlinkSync(doc.path);
    }
    await doc.deleteOne();
    res.json({ message: 'Document deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 