import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  logo:         { type: String, default: '' },
  announcement: { type: String, default: 'Welcome to Stop & Shop - E2E Test Store', maxlength: 500 },
}, { timestamps: true, versionKey: false });

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings;
