// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
    // Email
    email: { type: String, required: true },

    // Username
    username: { type: String, required: false },

    // Password
    password: { type: String, required: true },

    // Created reviews
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

    // Profile picture
    profileImage: { type: String, required: false },

    // Admin
    admin: { type: Boolean, default: false },

    // Email verified status
    verified: { type: Boolean, default: false },

    // Email verification token
    verificationToken: { type: String, required: false }
});

// Middleware to set default username as authcate from email
userSchema.pre('save', function (next) {
    if (!this.username && this.email) {
        this.username = this.email.slice(0, 8);
    }

    next();
});

// Export User model
const User = mongoose.model('User', userSchema);
module.exports = User;