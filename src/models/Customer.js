import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true, maxlength: 100 },
  email:    { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  password: { type: String, required: true, minlength: 6 },
  phone:    { type: String, default: '', trim: true },
  address:  { type: String, default: '' },
  city:     { type: String, default: '' },
  zip:      { type: String, default: '' },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default Customer;
