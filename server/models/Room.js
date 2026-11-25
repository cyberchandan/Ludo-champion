const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  socketId: { type: String, default: null },
  isHost: { type: Boolean, default: false },
  isConnected: { type: Boolean, default: true },
  avatar: { type: String, default: 'account' },
  joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    minlength: 6,
    maxlength: 6,
    index: true,
  },
  hostId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['WAITING', 'PLAYING', 'FINISHED'],
    default: 'WAITING',
  },
  players: [PlayerSchema],
  maxPlayers: {
    type: Number,
    default: 4,
  },
  gameState: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Automatically expire documents after 24 hours
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

RoomSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (next) next();
});

module.exports = mongoose.models.Room || mongoose.model('Room', RoomSchema);
