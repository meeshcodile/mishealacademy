require("dotenv").config("./.env");
require("./config/passport");

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expresshandlebars = require("express-handlebars");
const flash = require("connect-flash");
const session = require("express-session");
const sendMail = require('./misc/mail')
const mailer = require('./misc/mailer')
const mongoose = require("mongoose");
const logger = require("morgan");
const nodemailer = require('nodemailer')
const studentPayment = require('./models/pay')
const path = require("path");
const Pay = require("./models/pay");
const _ = require("lodash");
const request = require("request");
const { initializePayment, verifyPayment } = require("./config/paystack")(
  request
);
const passport = require("passport");
const mongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");

//====================================== Database connections======================
mongoose.Promise = global.Promise;
const MONGO_URL = require("./config/db").MONGOURL;

mongoose
  .connect(MONGO_URL, { useCreateIndex: true, useNewUrlParser: true })
  .then(() => console.log(`Database connected at ${MONGO_URL}`))
  .catch(err => console.log(`Database Connection failed ${err.message}`));

const port = process.env.PORT || 9000;

app.use(logger("dev"));

//===================== template engine==================================
app.engine(
  ".hbs",
  expresshandlebars({ defaultLayout: "layout", extname: ".hbs" })
);
app.set("view engine", ".hbs");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "meeshcodile",
    resave: false,
    saveUninitialized: false,
    store: new mongoStore({ mongooseConnection: mongoose.connection }),
    cookie: {
      maxAge: 180 * 60 * 1000
    }
  })
);

//===============================initialize passport===========================
app.use(passport.initialize());
app.use(passport.session());

//================================methodOveride middleware===============================
app.use(methodOverride("newMethod"));

app.use(flash());
//======================== Setting up flash/ Environmental variables ========================
app.use((req, res, next) => {
  res.locals.success_messages = req.flash("success");
  res.locals.error_messages = req.flash("error");
  res.locals.user = req.user ? true : false;
  res.locals.session = req.session;
  next();
});
app.use((req, res, next) => {
  res.locals.login = req.isAuthenticated();
  next();
});

// =====================contact form post routes==========================
app.post("/contact", (req, res) => {
  const { email, subject, text } = req.body;
  // res.json({message:"message received"})
  //   req.flash("success", "message sent successfully");

  sendMail(email, subject, text, err => {
    // if (email === "" || subject === "" || text === "") {
    //   req.flash("error", "incomplete details");
    // }  
    if (err) {
      res.status(500); //.json({message: 'internal error occured'})
      req.flash("error", "message not sent please try again");
    } else {
      req.flash("success", "message sent successfully");  
      console.log('mail sent:::::::::::')

      res.redirect("/");
      return;
      // res.json({message:'message sent'})
      // req.flash("success", "message sent");
      // return (null, { message: "email sent successfully" }
    }
  });
});

//=====================================Route grouping========================
app.use("/", require("./routes/index"));
app.use("/application", require("./routes/internApplication"));
app.use("/admin", require("./routes/admin"));
app.use("/student", require("./routes/StudentRegistration"));
app.use("/intern", require("./routes/internRegistration"));
app.use("/payment", require("./routes/payapp"));

//================================paystack post routes=============================
app.post("/paystack/pay", (req, res) => {
  const form = _.pick(req.body, ["amount", "email", "full_name"]);
  form.metadata = {
    full_name: form.full_name
  };
  form.amount *= 100;

  initializePayment(form, (error, body) => {
    if (error) {
      //handle errors
      console.log(error);
      return res.redirect("/error");
      return;
    }
    response = JSON.parse(body);
    res.redirect(response.data.authorization_url);
  });
});

app.get("/paystack/callback", (req, res) => {
  const ref = req.query.reference;
  verifyPayment(ref, (error, body) => {
    if (error) {
      //handle errors appropriately
      console.log(error);
      return res.redirect("/error");
    }
    response = JSON.parse(body);

    const data = _.at(response.data, [
      "reference",
      "amount",
      "customer.email",
      "metadata.full_name"
    ]);

    [reference, amount, email, full_name] = data;

    newPay = { reference, amount, email, full_name };

    const pay = new Pay(newPay);

    pay
      .save()
      .then(pay => {
        if (!pay) {
          return res.redirect("/error");
        }
        res.redirect("/receipt/" + pay._id);
      })
      .catch(e => {
        res.redirect("/error");
      });
    console.log(pay);
  });
});

app.get("/receipt/:id", (req, res) => {
  const id = req.params.id;
  Pay.findById(id)
    .then(pay => {
      if (!pay) {
        //handle error when the Pay is not found
        res.redirect("/error");
      }
     

      let payName = pay.full_name
      let payAmount = pay.amount / 100;
      res.render("payment/success", { pay, payAmount,payName,layout: "user" });


      // ===============sending mail======================
      const html = `CONGRATS!!! <strong> ${pay.full_name}</strong>,
      <br/>
      <br>
      Congratulations Your Payment was received successfully
      <br/>
      <br/>
      <br><br>
      <strong>Best Regards!!!</strong>
      `
      // Sending the mail
      mailer.sendEmail('ezekielmisheal4@gmail.com', pay.email, 'Payment Confirmation', html);


    })
    .catch(e => {
      res.redirect("/error");
      console.log(e);
    });
});

//============================ Error Handler==============================
app.use((req, res, next) => res.render("error404", { layout: "user" }));

app.listen(port, () => console.log(`Server started at port ${port}`));
