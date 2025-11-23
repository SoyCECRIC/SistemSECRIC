const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'teacher', 'superadmin'],
        default: 'teacher'
    },
    profileImage: {
        type: String,  // Almacenará base64 o URL data:image
        default: null
    }
});

module.exports = mongoose.model('User', userSchema);