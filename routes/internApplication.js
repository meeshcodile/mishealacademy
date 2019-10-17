const express = require('express');
const router = express.Router();
const joi = require('joi');
const mailer = require('../misc/mailer');
const Interns = require('../models/internsModel');
const multer = require('multer')
const cloudinary = require('cloudinary')
const path = require('path')
const Intern = require('../models/internRegistrationModel')
const Student = require('../models/studentModel')
const internApp = require('../models/internsModel')
// const upload = multer({ dest: 'uploads/' })




// USER VALIDATION SCHEMA
const internsSchema = joi.object().keys({
    email: joi.string().email().required(),
    fullName: joi.string().required(),
    phoneNumber: joi.string().required(),
    university: joi.string().required(),
    level: joi.string().required(),
    startDate: joi.string().required(),
    endDate: joi.string().required(),
    applicationLetter: joi.string().required()

}); 

//setting the storage engine
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now() + 
        path.extname(file.originalname));
    }
})

//initialize the file uplaod
const upload = multer({ storage: storage,

    //limits file size
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
 })


// Check File Type
function checkFileType(file, cb) {
    // Allowed extension format
    const filetypes = /jpeg|jpg|png|pdf/;
    // Check the extension format
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        // req.flash('error','Invalid File')
        // return res.redirect('back')
        cb('ERROR: kindly please upload a valid filetype');
    }
}

//======================cloudinary configuration=================== 
cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret

});
//======================Application  GET&POST route====================
router.route('/')
    .get((req, res) => {
        res.render('use/internsapplication', {layout:'user'});
    })

    .post(upload.single('applicationLetter'), function (req, res, next) {
        console.log('consoling req.body::', req.body)
        cloudinary.v2.uploader.upload(req.file.path, async (err, result) => {
            console.log('consoling cloud result::', result)
            let { university, startDate,phoneNumber, endDate, email, fullName , level} = req.body;
            var applicationLetter = result.secure_url;
            let newInternshipApplication = new Interns({university, startDate, endDate,phoneNumber, email,level, fullName,  applicationLetter })
            console.log(newInternshipApplication)

            // const internsApplication = await Interns.findOne({'email': req.body.email})
            
            // if(internsApplication){
            //     req.flash('error', 'email is already used')
            //     res.redirect('/application')
            // }


            internApp.findOne({ 'email': req.body.email }, (err, Intern) => {
                Student.findOne({ 'email': req.body.email }, (err, student) => {
                    
                    if (student) {
                        req.flash('error', 'Email Exits In Our Database, Please Try Again With A Different Email')
                        return res.redirect('back')
                    }

                })
                if (Intern) {
                    req.flash('error', 'Email Exits In Our Database, Please Try Again With A Different Email')
                    return res.redirect('back')
                }
                if (err) {
                    console.log(err)
                    req.flash('error', 'Something Went Wrong, Please Try Again')
                    return res.redirect('back')
                }
            })



            await newInternshipApplication.save().then(newApplication => {
                console.log('consoling promise return::', newApplication)
                req.flash('success', 'Your Application has been Submitted, Check You mail for More information')
                res.redirect('/')
                // Create email
                const html = `Hello ${newInternshipApplication.fullName},
      <br/>
      <br>
      Thank you applying for your internship at nHubAcademy, Your Application has been submitted and has been put up for review.
      <br/>
      You will be contacted through this mail for further Instructions
      <br/><br/>
      <strong>All the best!!!</strong>
      `

                // Sending the mail
                mailer.sendEmail('ezekielmisheal4@gmail.com', newInternshipApplication.email, 'Internship Application Confirmation', html);
            }).catch(err => console.log(`${err.message}`))

            if (err) { console.log(err) }
        })
    });

module.exports = router;