const express = require("express");
const router = express.Router();
const sendMail = require("../misc/mail");
const crypto = require("crypto");
const async = require("async");
const interns = require("../models/internRegistrationModel");
const students = require("../models/studentModel");
const nodemailer = require("nodemailer");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.json());

router.get("/", (req, res) => {
  res.render("index.hbs");
});



//==================================newsletter post route============================
router.post("/newsletter", (req, res) => {
  addEmailToMailchimp(req.body.email);
  req.flash("success", "you have successfully subscribe to our newsletter");
  res.redirect("/");
});
function addEmailToMailchimp(email) {
  var request = require("request");

  var options = {
    method: "POST",
    url: "https://us3.api.mailchimp.com/3.0/lists/2be771009d/members",
    headers: {
      "Postman-Token": "389b80e9-4fb9-4bb3-bcba-592a99873d15",
      "cache-control": "no-cache",
      Authorization:
        "Basic YW55c3RyaW5nOmRlNmQ5NWQwZTVhN2Q1OGJlMDc5NjVlYTRkOTZiMjM3LXVzMw==",
      "Content-Type": "application/json"
    },
    body: { email_address: email, status: "subscribed" },
    json: true
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    console.log(body);
  });
}

//===========================usertype check route========================== 
router.route("/usertype")
  .get((req, res) => {
    res.render("use/usertype", { layout: "user" });
  })
  .post((req, res) => {
    console.log(req.body);
    const usertype = req.body.userType;
    if (usertype === "Intern") {
      return res.redirect("/intern/forgot");

    } else if (usertype === "Student") {
      return res.redirect("/student/forgot");

    }
    else if(usertype ==="Admin"){
      return res.redirect('/admin/forgot')
    }
     else {
      req.flash("error", "no such user exists");
      return res.redirect("back");
    }
  });

router.get("/forgot", (req, res) => {
  res.render("use/forgot", { layout: "user" });
});


module.exports = router;
