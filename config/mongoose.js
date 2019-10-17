const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/payment',{useNewUrlParser:true});

module.exports = {mongoose}