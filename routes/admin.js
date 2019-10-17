const express = require('express');
const router = express.Router();
const randomString = require('randomstring')
const mailer = require('../misc/mailer');
// const isAuthenticated = require('../config/customFunctions')
const admin = require('../models/admin')
const Interns = require('../models/internsModel');
const internRegistration = require('../models/internRegistrationModel')
const privateStudent  = require('../models/studentModel')
const passport = require('passport')

// ============Admin isAuthenticated function =================
 function isAuthenticatedAdmin (req, res, next)  {
    if (req.isAuthenticated() ) {
       return next();
    }
    else {
        req.flash('error', 'You Have To Login First')
        res.redirect('/');
    }
}


//============================ admin homepage=======================
// router.route('/dashboard', isAuthenticatedAdmin)
router.get('/dashboard',isAuthenticatedAdmin, async (req, res) => {
    await Interns.countDocuments(async (err, totalInterns) => {
      await internRegistration.countDocuments(async (err, totalInternsRegistered) => {
        await privateStudent.countDocuments(async (err, totalStudents) => {
            await admin.findOne({fullName:'meesh'},(err, admin)=>{
                res.render('admin/admin', { layout: 'admin', admin:admin, totalInterns, totalStudents, totalInternsRegistered })   
            })
                  
        })
      })
    })
  })

//====================approving interns application=======================
router.route('/approveInternApplication/:id')
    .get((req, res)=>{
        Interns.findById(req.params.id)
            .then(internsApplication =>{
                console.log('consoling found Application',internsApplication)
                if(internsApplication.isApproved == true){
                    req.flash('error', 'application already approved')
                  res.redirect('back')
                }

                const token = randomString.generate({length: 8, charset:'numeric'})
                const html = `CONGRATS!!! <strong> ${internsApplication.fullName}</strong>,
      <br/>
      <br>
      Your internship application has been appproved!!! 
      <br/>
      follow this link to complete your registeration
      <br/>
      <a href="http://${req.headers.host}/intern/registration/${token}}">CLICK HERE</a> To Visit Our Site
      <br><br>
      <strong>Welcome TO THE HUB!</strong>
      <strong>Best Regards!!!</strong>
      `
          // Sending the mail
                mailer.sendEmail('ezekielmisheal4@gmail.com', internsApplication.email, 'Internship Approved', html);
               
                internsApplication.isApproved = true;
                internsApplication.save().then(internsApplication =>{
                    req.flash('success', 'Application Approved')
                    res.redirect('back')
                }).catch(err =>{
                    console.log(err)
                })
                
            }).catch(err =>{
                console.log(err)
                req.flash('error', 'Approving unsuccessfull')
                res.redirect('back')
            })
        })
// ==================rendering the all students===============
router.route('/student')
        .get((req, res)=>{
            privateStudent.find()
            .then(privateStudent =>{
                res.render('admin/student', { layout: 'admin', privateStudent })
            }).catch(err =>{
                console.log(err)
            })
        })

// ===================rendering the all interns=======================
router.route('/interns')
    .get((req, res) => {
        internRegistration.find()
        .then(internRegistration =>{
            res.render('admin/interns', { layout: 'admin', internRegistration })
        }).catch(err =>{
            console.log(err)
        })
        
    })

//=====================internship applications======================
router.route('/internshipApplications')
    .get((req, res) => {
        Interns.find().then(internsApplication => {
            console.log(internsApplication)
            res.render('admin/internshipApplications', { layout: 'admin', internsApplication })
        }).catch(err =>{
            console.log(err)
        })
    })

// ===============deleting application from the database
router.route('/deleteInternApplication/:id')
    .delete((req, res)=>{
        Interns.findByIdAndDelete(req.params.id)
            .then(deletedintern => {
                req.flash('success', 'Intern Application Successfully Deleted ')
                res.redirect('/admin/dashboard')
            })
            .catch(err => {
                console.log(err)
            })
    })

// =================admin login login======================
router.route('/login')
    .get((req, res) => {
        res.render('admin/login', { layout: 'user' })
    })
    .post(passport.authenticate("local", {
        successRedirect: "/admin/dashboard",
        failureRedirect: "/admin/login",
        failureFlash: true
    }));

//=========================Admin profile route=====================
router.route('/profile')
    .get((req, res)=>{
        res.render('admin/profile', {layout:'admin'})
    })
//=====================Attendance routes===================
router.route('/internAttendance')
    .get((req, res) => {
        res.render('admin/internAttendance', {layout:'admin'})
    })

router.route('/studentAttendance')
    .get((req, res) => {
        res.render('admin/studentAttendance',{layout:'admin'})
    })

router.route("/logout")
    .get((req, res, next) => {
        req.logout();
        req.flash("success", "See you later!")
        res.redirect("/");
    })

module.exports = router;