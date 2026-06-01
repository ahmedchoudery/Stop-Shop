import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action:     { type: String, required: true, index: true },
  details:    { type: mongoose.Schema.Types.Mixed },
  adminEmail: { type: String, required: true, index: true },
  ip:         { type: String },
  timestamp:  { type: Date, default: Date.now, index: true },
}, { timestamps: true, versionKey: false });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
