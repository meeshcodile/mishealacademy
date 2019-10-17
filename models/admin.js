const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const { Schema } = mongoose;


const adminSchema = new Schema({
    fullName:{
        type: String,
        required: true
    },
    email:{
        type:String,
        required: true
    },
    usertype:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required: true
    }
})


adminSchema.plugin(passportLocalMongoose)
const admin = mongoose.model('admin', adminSchema)

module.exports = admin;