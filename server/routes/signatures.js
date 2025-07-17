const express = require('express');
const Signature = require('../models/Signature');
const Document = require('../models/Document');
const auth = require('../middleware/auth');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib'); // Uncomment for PDF embedding
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Save signature position
router.post('/', auth, async (req, res) => {
  try {
    const { documentId, x, y, page, value, font } = req.body;
    const signature = new Signature({
      documentId,
      userId: req.user.userId,
      x,
      y,
      page,
      value, // Save value
      font,  // Save font
      status: 'pending',
    });
    await signature.save();
    res.status(201).json(signature);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get signatures for a document
router.get('/:id', auth, async (req, res) => {
  try {
    const signatures = await Signature.find({ documentId: req.params.id });
    res.json(signatures);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Finalize (embed) signature into PDF (implementation)
router.post('/finalize', auth, async (req, res) => {
  try {
    const { documentId, signatureText, x, y, page = 1, font = 'TimesRoman', fontSize = 24 } = req.body;
    const doc = await Document.findById(documentId);
    if (!doc) return res.status(404).json({ message: 'Document not found' });
    const pdfPath = doc.path;
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    let fontObj;
    if (font === 'Helvetica') fontObj = await pdfDoc.embedFont(StandardFonts.Helvetica);
    else if (font === 'Courier') fontObj = await pdfDoc.embedFont(StandardFonts.Courier);
    else fontObj = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const pages = pdfDoc.getPages();
    const targetPage = pages[(page - 1) || 0];
    const pageHeight = targetPage.getHeight();
    const pdfY = pageHeight - y - fontSize;
    targetPage.drawText(signatureText, {
      x: x || 50,
      y: pdfY,
      size: fontSize,
      font: fontObj,
      color: rgb(0.3, 0.2, 0.6),
    });
    const newPdfBytes = await pdfDoc.save();
    const signedPath = path.join('uploads', `${Date.now()}-${doc.originalname.replace(/\.pdf$/, '')}-signed.pdf`);
    fs.writeFileSync(signedPath, newPdfBytes);
    res.json({ message: 'Signature embedded', signedPath });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update signature status (accept/reject)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const signature = await Signature.findById(req.params.id);
    if (!signature) return res.status(404).json({ message: 'Signature not found' });
    signature.status = status;
    if (status === 'rejected') signature.reason = reason;
    if (status === 'signed') signature.signedAt = new Date();
    await signature.save();
    res.json(signature);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single signature by ID
router.get('/single/:id', auth, async (req, res) => {
  try {
    const signature = await Signature.findById(req.params.id);
    if (!signature) return res.status(404).json({ message: 'Signature not found' });
    res.json(signature);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 