// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
    username: {type: String, required: true},
    password: {type: String, required: true}
});

// Export User model
const User = mongoose.model('User', userSchema);
module.exports = User;