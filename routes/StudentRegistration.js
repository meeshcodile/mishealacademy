const express = require('express');
const router = express.Router();
const joi = require('joi');
const randomString = require('randomstring');
const mailer = require('../misc/mailer');
const async = require('async')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const nodemailer =require('nodemailer')
const Interns = require('../models/internsModel');
const Pay = require('../models/pay')
const Intern = require('../models/internRegistrationModel')
const PrivateStudent = require('../models/studentModel');
const passport = require("passport")

// USER VALIDATION SCHEMA
const privateStudentSchema = joi.object().keys({
    email: joi.string().email().required(),
    fullName: joi.string().required(),
    password: joi.string().regex(/^[a-zA-Z0-9]{5,30}$/).required(),
    password2: joi.any().valid(joi.ref("password")).required(),
    phoneNumber: joi.string().required()
});

//Register GET&POST route
router.route('/studentRegistration')
    .get((req, res) => {
        res.render('use/students/registration', {layout:'user'});
    })

    .post(async (req, res, next) => {
        try {
            const result = joi.validate(req.body, privateStudentSchema);

            //checking the database if the paid student email exist
            const paidStudent = await Pay.findOne({'email': result.value.email});
            console.log(paidStudent)

            if(!paidStudent){
                req.flash('error', 'please you need to make payment to proceed with the registration')
                res.redirect('/student/studentRegistration')
            }

            // Interns.findOne({ 'email': req.body.email }, (err, intern) => {
            //     PrivateStudent.findOne({ 'email': req.body.email }, (err, student) => {
            //         if (student) {
            //             req.flash('error', 'Email Exits In Our Database, Please Try Again With A Different Email')
            //             return res.redirect('back')
            //         }

            //     })
            //     if (intern) {
            //         req.flash('error', 'Email Exits In Our Database, Please Try Again With A Different Email')
            //         return res.redirect('back')
            //     }
            //     if (err) {
            //         console.log(err)
            //         req.flash('error', 'Something Went Wrong, Please Try Again')
            //         return res.redirect('back')
            //     }
            // })

            // Checking the database if email is taken
            const privateEmail = await PrivateStudent.findOne({ 'email': result.value.email });
            console.log(privateEmail)

            // If email is taken 
            if (privateEmail) {
                req.flash('error', 'Email is already used.');
                res.redirect('/student/studentRegistration');
                return;
            }

            // Comparison of passwords
            if (req.body.password !== req.body.password2) {
                req.flash('error', 'Passwords mismatch.');
                res.redirect('/student/studentRegistration');
                return;
            }

            // Hash the password
            const hash = await PrivateStudent.hashPassword(result.value.password);
            result.value.password = hash;
            delete result.value.password2;

            // Generation of secret token
            const secretToken = randomString.generate({length:'6', charset:'numeric'});

            // Save secret token to database
            result.value.secretToken = secretToken;

            // Setting store's acct to be inactive
            result.value.active = false;

            // Saving store to database
            const newPrivate = await new PrivateStudent(result.value);
            await newPrivate.save();
            console.log(`${newPrivate} created successfully.`);


            // Create email
            const html = `Hello ${result.value.fullName},
      <br/>
      <br>
      Please verify your email by typing the following token:
      <br/>
      <br/>
      Token: <b> ${secretToken}</b>
      <br/>
      On the following page:
    <a href="http://" + req.headers.host + "/student/verify">http://"+ req.headers.host + "/student/verify </a>
      <br><br>
      <strong>All the best!!!</strong>
      `

            // Sending the mail
            await mailer.sendEmail('ezekielmisheal4@gmail.com', result.value.email, 'Please activate your email', html);

            req.flash('success', 'Account created successfully, Please check your email to complete registration.');
            res.redirect('/student/verify')
        } catch (error) {
            next(error)
        }
    })

router.route('/verify')
    .get((req, res)=>{
        res.render('use/verify', {layout:'user'})
    })
    .post(async (req, res, next) => {
        try {
            const { secretToken } = req.body;

            // Find acct with matching secret token in the database
            const user = await PrivateStudent.findOne({ secretToken: secretToken.trim() });

            // If the secretToken is invalid
            if (!user) {
                req.flash("error", "Your Token is not valid, Please Check your Token");
                res.redirect("/student/verify");
                return;
            }

            // If the secretToken is valid
            user.active = true;
            user.secretToken = "";
            await user.save();

            req.flash("success", "Account verification successfull! You may log in");
            res.redirect("/student/login");
        } catch (error) {
            next(error);
        }
    });

router.route('/login')
    .get((req, res) => {
        res.render('use/students/login', {layout:'user'});
    })
    .post(passport.authenticate("local", {
        successRedirect: "/student/dashboard",
        failureRedirect: "/student/login",
        failureFlash: true
    }));

router.route('/dashboard')
    .get((req, res)=>{
        PrivateStudent.findById(req.user._id)
        .then(user=>{
            res.render('use/students/dashboard', { layout: 'userDashboard', user })
        })
        .catch(err =>{
            console.log(err)
        })
    })


router.route('/forgot')
    .get((req, res) => {
        res.render('use/students/forgot', { layout: 'user' })
    })
router.post("/forgot", (req, res, next) => {
    async.waterfall(
        [
            function (done) {
                crypto.randomBytes(20, function (err, buf) {
                    var token = buf.toString("hex");
                    done(err, token);
                });
            },
            function (token, done) {
                PrivateStudent.findOne({ email: req.body.email }, function (err, student) {

                    if (!student) {
                        req.flash("error", "No account with that email address exists.");
                        return res.redirect("back");
                    }

                    student.resetPasswordToken = token;
                    student.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                    student.save(function (err) {
                        done(err, token, student);
                    });
                });

            },
            function (token, student, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: "Gmail",
                    auth: {
                        user: "ezekielmisheal4@gmail.com",
                        pass: "#meeshcodile"
                    }
                });
                var mailOptions = {
                    to: student.email,
                    from: "ezekielmisheal4@gmail.com",
                    subject: "Password Reset",
                    text:
                        "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                        "http://" +
                        req.headers.host +
                        "/student/reset/" +
                        token +
                        "\n\n" +
                        "If you did not request this, please ignore this email and your password will remain unchanged.\n"
                };
                smtpTransport.sendMail(mailOptions, function (err) {
                    console.log("mail sent");
                    req.flash(
                        "success",
                        "An e-mail has been sent to " +
                        user.email +
                        " with further instructions."
                    );
                    done(err, "done");
                });
            }
        ],
        function (err) {
            if (err) return next(err);
            res.redirect("back");
        }
    );
});

router.get("/reset/:token", function (req, res) {
    PrivateStudent.findOne(
        {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        },
        function (err, student) {
            if (!student) {
                req.flash("error", "Password reset token is invalid or has expired.");
                return res.redirect("back");
            }

            res.render("use/students/reset", { layout: "user", token: req.params.token });
        }
    );
});

router.post("/reset/:token", async (req, res) => {
    try {
        await PrivateStudent.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } },
            function (err, student) {
                if (!student) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if (req.body.password === req.body.password2) {

                    student.resetPasswordToken = undefined;
                    student.resetPasswordExpires = undefined;

                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(req.body.password, salt, (err, hash) => {
                            if (err) throw err;
                            req.body.password = hash;
                            student.password = hash;
                            student.save().then((student) => {
                                console.log('updating the password', student)
                            }).catch((err) => {
                                console.log(err)
                            })
                        })

                    })

                    if (err) { console.log(err) }
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect("back");
                }
                req.flash('success', 'Your assword has been changed succssfully you can now login')
                res.redirect('/student/login')
                // Create email
                const confirmationEmail = `Hello ${student.fullName},
            <br/>
            This is a confirmation that the password for your account ${student.email}   has just been changed.
            <br/>
            <br/>
            <strong>Best Regards!</strong>`

                // Sending the mail
                mailer.sendEmail('ezekielmisheal4@gmail.com', student.email, 'Your Password Has Been Changed', confirmationEmail);

            }
        )
    }
    catch (err) {
        next(err)
    }


});

router.route("/logout")
    .get((req, res) => {
        req.logout();
        req.flash("success", "See you later!")
        res.redirect("/");
    })

module.exports = router