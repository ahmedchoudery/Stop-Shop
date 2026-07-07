import mongoose from 'mongoose';

const userRoleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'customer'],
    required: true,
    index: true
  },
  assignedBy: {
    type: String,
    default: 'system'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false, versionKey: false });

const UserRole = mongoose.models.UserRole || mongoose.model('UserRole', userRoleSchema);

export default UserRole;
