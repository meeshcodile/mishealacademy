const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const PrivateStudent = require("../models/studentModel");
const Intern = require('../models/internRegistrationModel')
const Admin = require('../models/admin')
const bcrypt = require("bcryptjs");

//======================defining the strategy to be used by the user=================
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: "password",
  passReqToCallback: true
}, (req, email, password, done) => {
  Intern.findOne({ email: email }).then(user => {
    if (!user) {
      PrivateStudent.findOne({ email: email }).then(user => {
        if (!user) {
          Admin.findOne({ email: email }).then(user => {

            if (!user) {
              return done(null, false, req.flash('error', 'user not found with this email.'));
            }
            // const internEmail = await Intern.findOne({ 'email': result.value.email })
            // console.log(internEmail)
            // if (!internEmail) {
            //   req.flash('error', 'please input a valid email')
            //   res.redirect('/')
            // }
            // if (!user.isActive) {
            //     return done(null, false, req.flash('error', 'Please go to your mail and active account first'));
            // }
            bcrypt.compare(password, user.password, (err, passwordMatched) => {
              if (err) {
                return err;
              }

              if (!passwordMatched) {
                return done(null, false, req.flash('error', 'Invalid Password, Please try again'));
              }

              return done(null, user, req.flash('success', 'Login Successful'));
            });

          })

        }
        

        bcrypt.compare(password, user.password, (err, passwordMatched) => {
          if (err) {
            return err;
          }

          if (!passwordMatched) {
            return done(null, false, req.flash('error', 'Invalid Password, Please try again'));
          }

          return done(null, user, req.flash('success', 'Login Successful'));
        });
      });
    }
    
    bcrypt.compare(password, user.password, (err, passwordMatched) => {
      if (err) {
        return err;
      }

      if (!passwordMatched) {
        return done(null, false, req.flash('error', 'Invalid Password, Please try again'));
      }

      return done(null, user, req.flash('success', 'Login Successful'));
    });
  });
}));



//determines which data of the user object should be stored in the session
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  PrivateStudent.findById(id, function (err, user) {
    if (!user) {
      Intern.findById(id, function (err, user) {
        if (!user) {
          Admin.findById(id, function (err, user) {
            done(err, user);
          })
        } else {
          done(err, user);
        }
      });
    } else {
      done(err, user);
    }
  });

});

