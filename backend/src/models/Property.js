const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    owner_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    area: {
        type: Number,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    property_type: {
        type: String,
        required: true
    },
    video_url: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'BANNED', 'PENDING', 'SOLD', 'RENTED'],
        default: 'ACTIVE'
    },
    images: [{
        type: String
    }],
    features: [{
        type: String
    }]
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

module.exports = mongoose.model('Property', propertySchema);
