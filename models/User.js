const mongoose = require('mongoose')

const User = new mongoose.Schema({
    email:{
        type: String,
        required: false
    },
    password:{
        type: String,
        required: true
    },
    class:{
        type: Number,
        require: false
    },
    profilePictureURL:{
        type: String,
        required: true,
        default: "https://storage.cloud.google.com/hse-key-bucket/default.png"
    },
    dateRegistered:{
        type: Date,
        default: Date.now()
    },
    verified:{
        type:Boolean,
        default: false
    },
    phone:{
        type: String
    },
    name:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['teacher', 'student']
    }
})

module.exports = mongoose.model('User', User)