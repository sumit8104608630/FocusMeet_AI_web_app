import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
    meetingId: {
        type: String,
        required: true,
        unique: true
    },
    host: {
        type: String,
        required: true
    },
    members_info: [{
        userId: String,
        socketId: String,
        name: String,
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    status: {
        type: String,
        enum: ['ongoing', 'ended'],
        default: 'ongoing'
    }
}, { timestamps: true });

export const Meeting = mongoose.model('Meeting', meetingSchema);
