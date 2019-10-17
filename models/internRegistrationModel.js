const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const bcrypt = require("bcryptjs");
const { Schema } = mongoose;

const internRegistrationSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  userType: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  active: Boolean,
  password: String,
  secretToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

internRegistrationSchema.plugin(passportLocalMongoose);
const internRegistration = mongoose.model(
  "internRegistration",
  internRegistrationSchema
);

module.exports = internRegistration;

module.exports.hashPassword = async password => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error("Hashing failed", error);
    // console.log(error)
  }
};
module.exports.comparePasswords = async (password, hashPassword) => {
  try {
    await bcrypt.compare(password, hashPassword);
    return console.log("comparing successful");
  } catch (error) {
    throw new Error("comparing failed", error);
  }
};
