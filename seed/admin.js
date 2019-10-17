const Admin = require("../models/admin");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
//============================Database connections======================
mongoose.Promise = global.Promise;
const MONGO_URL = require("../config/db").MONGOURL;

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true })
  .then(() => console.log(`Database connected at ${MONGO_URL}`))
  .catch(err => console.log(`Database Connection failed ${err.message}`));

//======================creating the user that is to be seeded===================
const admin = new Admin({
  fullName: "meesh",
  email: "teapp.info@gmail.com",
  password: "09034093330",
  usertype: "Admin"
});
// Hash the password and seed
bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(admin.password, salt, (err, hash) => {
    if (err) throw err;
    admin.password = hash;
    admin.save().then(user => {
        console.log(user);
      })
      .catch(err => {
        console.log(err);
      });
  });
});
