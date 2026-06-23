import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
  data: { type: Object, required: true },
  navigateTo: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  isRead: { type: Boolean, default: false },
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
