const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    summary: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    mediaUrl: {
        type: String,
        default: null
    },
    mediaType: {
        type: String,
        enum: ['image', 'video', null],
        default: null
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('News', newsSchema);