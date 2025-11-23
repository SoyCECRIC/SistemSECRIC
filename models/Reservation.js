const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupGrade: { type: String, required: true },
  date: { type: Date, required: true },
  entryTime: { type: String, required: true },
  exitTime: { type: String, required: true },
  motive: { type: String, required: true },
  status: { type: String, enum: ['pending', 'confirmed', 'ended', 'cancelled'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('Reservation', reservationSchema);