const mongoose = require('mongoose');

const signatureSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  page: { type: Number, required: true },
  value: { type: String }, // Add value field
  font: { type: String },  // Add font field
  status: { type: String, enum: ['pending', 'signed', 'rejected'], default: 'pending' },
  reason: { type: String },
  signedAt: { type: Date },
  signerName: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Signature', signatureSchema); 