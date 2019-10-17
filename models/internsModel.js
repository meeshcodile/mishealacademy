const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const { Schema } = mongoose;

const internsSchema = new Schema({
  fullName: {
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
  university: {
    type: String,
    required: true
  },
  level: {
    type: String,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  applicationLetter: {
    type: String,
    required: true
  },
  isApproved:{
    type: Boolean,
    default:false
  },
  date:{
    type: Date,
    default: Date.now
  }
});

internsSchema.plugin(passportLocalMongoose);
const Interns = mongoose.model("internsApplication", internsSchema);

module.exports = Interns;
