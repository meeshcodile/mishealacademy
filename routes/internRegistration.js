const express = require('express');
const router = express.Router();
const joi = require('joi');
const bodyParser = require('body-parser')
const mailer = require('../misc/mailer')
const passport = require("passport")
const crypto = require('crypto')
const bcrypt =  require('bcryptjs')
const nodemailer = require('nodemailer')
const async = require('async')
const Intern = require('../models/internRegistrationModel')
const PrivateStudent = require('../models/studentModel')
const internApp = require('../models/internsModel')

// USER VALIDATION SCHEMA
const internRegistrationSchema = joi.object().keys({
    email: joi.string().email().required(),
    fullName: joi.string().required(),
    password: joi.string().regex(/^[a-zA-Z0-9]{1,30}$/).required(),
    password2: joi.any().valid(joi.ref("password")).required(),
    phoneNumber: joi.string().required(),
    userType: joi.string().required()
});
router.route('/registration/:token')
    .get((req, res)=>{
        res.render('use/intern/registration', {layout:'user'})
    })
    .post(async (req, res, next) => {
        try {
            // let {email, fullName, password,password2, phoneNumber, userType} = req.body
            // let result = new Intern({email, fullName, password, password2, phoneNumber, userType})
            // console.log(result)
            const result = joi.validate(req.body, internRegistrationSchema);

            const intern = await internApp.findOne({ 'email': result.value.email })
            console.log(intern)

            if (!intern) {
                req.flash('error', 'please make sure it your applicaion email address')
                res.redirect('back')
                return
            }


            // Checking the database if email is taken
            // const internEmail = await internRegistration.findOne({ 'email': result.value.email });
            // console.log(internEmail)

            // If email is taken 
            // if (internEmail) {
            //     req.flash('error', 'Email is already used.');
            //     res.redirect('/intern/internRegistration /: token');
            //     return;
            // }
            


        // Intern.findOne({'email': req.body.email},(err,Intern)=>{
        //     PrivateStudent.findOne({'email':req.body.email},(err,privateStudent)=>{
                
        //         if(privateStudent){
        //             req.flash('error', 'Email Exits In Our Database, Please Try Again With A Different Email')
        //             return res.redirect('back') 
        //         }  
              
        //     })
        //     if(Intern){
        //         req.flash('error','Email Exits In Our Database, Please Try Again With A Different Email')
        //         return res.redirect('back')
        //     }
        //     if (err) {
        //         console.log(err)
        //         req.flash('error', 'Something Went Wrong, Please Try Again')
        //        return res.redirect('back')
        //     }
        // })

           
            // Comparison of passwords
            if (req.body.password !== req.body.password2) {
                req.flash('error', 'Passwords mismatch.');
                res.redirect('/intern/registration/:token');
                return;
            }

            // Hash the password
            const hash = await Intern.hashPassword(result.value.password);
            result.value.password = hash;
            delete result.value.password2;

            
            // Setting interns acct to be inactive
            result.value.active = false;

            // Saving store to database
            const newIntern = await new Intern(result.value);
            await newIntern.save();
            console.log(`${newIntern} created successfully.`);

            req.flash('success', 'Account created successfully, Please you may now login');
             res.redirect('/intern/login')
        } catch (error) {
            next(error)
        }
    })


router.route('/login')
    .get((req,res)=>{
        res.render('use/intern/login', {layout:'user'})
    })
    .post(passport.authenticate("local", {
        successRedirect: "/intern/dashboard",
        failureRedirect: "/intern/login",
        failureFlash: true
    }));

router.route('/dashboard')
    .get((req, res) => {
        Intern.findById(req.user.id)
            .then(user => {
                console.log(user)
                res.render('use/intern/dashboard', { layout: 'userDashboard', user:user })
            })
            .catch(err => {
                console.log(err)
            })
    })
router.route('/forgot')
    .get((req, res)=>{
        res.render('use/intern/forgot', {layout:'user'})
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
                Intern.findOne({ email: req.body.email }, function (err, user) {
                    
                        if (!user) {
                            req.flash("error", "No account with that email address exists.");
                            return res.redirect("back");
                        }

                        user.resetPasswordToken = token;
                        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                        user.save(function (err) {
                            done(err, token, user);
                        });
                    });
                
            },
            function (token, user, done) {
                var smtpTransport = nodemailer.createTransport({
                    service: "Gmail",
                    auth: {
                        user: "ezekielmisheal4@gmail.com",
                        pass: "#meeshcodile"
                    }
                });
                var mailOptions = {
                    to: user.email,
                    from: "ezekielmisheal4@gmail.com",
                    subject: "Password Reset",
                    text:
                        "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
                        "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
                        "http://" +
                        req.headers.host +
                        "/intern/reset/" +
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
    Intern.findOne(
        {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        },
        function (err, intern) {
            if (!intern) {
                req.flash("error", "Password reset token is invalid or has expired.");
                return res.redirect("back");
            }

            res.render("use/intern/reset", { layout: "user", token: req.params.token });
        }
    );
});

router.post("/reset/:token", async(req, res)=> {
    try{
           await  Intern.findOne({resetPasswordToken: req.params.token,resetPasswordExpires: { $gt: Date.now() }},
                    function (err, intern) {
                        if (!intern) {
                            req.flash("error","Password reset token is invalid or has expired.");
                            return res.redirect("back");
                        }
                        if (req.body.password === req.body.password2) {
                            
                                intern.resetPasswordToken = undefined;
                                intern.resetPasswordExpires = undefined;

                                bcrypt.genSalt(10, (err, salt)=>{
                                    bcrypt.hash(req.body.password, salt, (err, hash)  =>{
                                        if (err) throw err;
                                        req.body.password = hash;
                                        intern.password = hash;
                                            intern.save().then((intern)=>{
                                                console.log('updating the password', intern)
                                            }).catch((err) =>{
                                                console.log(err)
                                            })
                                    })

                                })
                                
                            if(err){console.log(err)}
                        } else {
                            req.flash("error", "Passwords do not match.");
                            return res.redirect("back");
                        }
                        req.flash('success','Your assword has been changed succssfully you can now login')
                        res.redirect('/intern/login')
                        // Create email
                        const confirmationEmail = `Hello ${intern.fullName},
            <br/>
            This is a confirmation that the password for your account ${intern.email}   has just been changed.
            <br/>
            <br/>
            <strong>Best Regards!</strong>`

                        // Sending the mail
                        mailer.sendEmail('ezekielmisheal4@gmail.com', intern.email, 'Your Password Has Been Changed', confirmationEmail);
            }
              )
        }
        catch (err){
            next(err)
        }
       
    
});

router.route("/logout")
    .get((req, res) => {
        req.logout();
        req.flash("success", "See you later!")
        res.redirect("/");
    })


module.exports = router;