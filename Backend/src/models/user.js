const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    firstName: {
        type: String,
        minLength: 3,
        maxLength: 20,
        required: true
    },
    lastName: {
        type: String,
        minLength: 2,
        maxLength: 10
    },
    emailId: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        immutable: true,
        unique: true
    },
    passWord: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    age: {
        type: Number,
        min: 6,
        max: 80
    },
    profilePic: {
        type: String,
        default: ''
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', ''],
        default: ''
    },
    location: {
        type: String,
        default: ''
    },
    birthday: {
        type: Date,
        default: null
    },
    websites: {
        type: String,
        default: ''
    },
    education: {
        type: String,
        default: ''
    },
    skills: {
        type: [String],
        default: []
    },
    problemSolved: [{
        type: Schema.Types.ObjectId,
        ref: 'problem'
    }]
}, {
    timestamps: true
});

const User = mongoose.model("user", userSchema);
module.exports = User;