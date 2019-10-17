const express = require("express");
const router = express.Router();
const request = require('request');
const app = express();
const bodyParser = require('body-parser');
const _ = require('lodash');
const path = require('path');

const { Pay } = require('../models/pay')
const { initializePayment, verifyPayment } = require('../config/paystack')(request);


router.route('/iot')
    .get((req, res)=>{
        res.render('payment/iot', {layout:'user'})
    })
router.route('/arvr')
    .get((req, res)=>{
        res.render('payment/arvr')
    })
router.route('/ai')
    .get((req, res) => {
        res.render('payment/ai')
    })

router.route('/cyber')
    .get((req, res) => {
        res.render('payment/cyber')
    })

router.route('/django')
    .get((req, res) => {
        res.render('payment/django')
    })

router.route('/ethicalHacking')
    .get((req, res) => {
        res.render('payment/ethical')
    })

router.route('/frontenddevelopment')
    .get((req, res) => {
        res.render('payment/frontenddevelopment')
    })

router.route('/lampstack')
    .get((req, res) => {
        res.render('payment/lampstack')
    })

router.route('/laravel')
    .get((req, res) => {
        res.render('payment/laravel')
    })

router.route('/meanstack')
    .get((req, res) => {
        res.render('payment/meanstack')
    })

router.route('/mobiledevelopmn')
    .get((req, res) => {
        res.render('payment/cyber')
    })


//  //paystack post routes   
// router.post("/paystack/pay", (req, res) => {
//     const form = _.pick(req.body, ["amount", "email", "full_name"]);
//     form.metadata = {
//         full_name: form.full_name
//     };
//     form.amount *= 100;

//     initializePayment(form, (error, body) => {
//         if (error) {
//             //handle errors
//             console.log(error);
//             return res.redirect("/error");
//             return;
//         }
//         response = JSON.parse(body);
//         res.redirect(response.data.authorization_url);
//     });
// });
// router.get("/paystack/callback", (req, res) => {
//     const ref = req.query.reference;
//     verifyPayment(ref, (error, body) => {
//         if (error) {
//             //handle errors appropriately
//             console.log(error);
//             return res.redirect("/error");
//         }
//         response = JSON.parse(body);

//         const data = _.at(response.data, [
//             "reference",
//             "amount",
//             "customer.email",
//             "metadata.full_name"
//         ]);

//         [reference, amount, email, full_name] = data;

//         newPay = { reference, amount, email, full_name };

//         const pay = new Pay(newPay);

//         pay
//             .save()
//             .then(pay => {
//                 if (!pay) {
//                     return res.redirect("/error");
//                 }
//                 res.redirect("/receipt/" + pay._id);
//             })
//             .catch(e => {
//                 res.redirect("/error");
//             });
//         console.log(pay);
//     });
// });

// router.get("/receipt/:id", (req, res) => {
//     const id = req.params.id;
//     Pay.findById(id)
//         .then(pay => {
//             if (!pay) {
//                 //handle error when the Pay is not found
//                 res.redirect("/error");
//             }
//             let payAmount = pay.amount / 100
//             res.render("payment/success", { pay, payAmount });
//         })
//         .catch(e => {
//             res.redirect("/error");
//         });
// });


module.exports = router;


