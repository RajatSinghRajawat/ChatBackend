const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        surname: {
            type: String,
        },
        username: {
            type: String,
            unique: true,
            sparse: true
        },
        personalPhone: {
            type: String,
        },
        workPhone: {
            type: String,
        },
        city: {
            type: String,
        },
        country: {
            type: String,
        },
        organization: {
            type: String,
        },
        bio: {
            type: String,
        },
        online: {
            type: Boolean,
            default: false
        },

        email: {
            type: String,
            required: true,
            unique: true
        },

        password: {
            type: String,
            required: true,
        },

        otp: {
            type: String,
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        avatar: {
            type: String,
        },

        createdAt: {
            type: Date,
            default: Date.now
        },

        img: {
            type: Array
        },

        role: {
            type: String,
            defult: 0
        },

        token: {
            type: String,
            default: null
        }
    }
)

const User = mongoose.model("User", userSchema)

module.exports = User