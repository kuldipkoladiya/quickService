// models/CountryCode.js

const mongoose = require('mongoose');

const countryCodeSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
  },
  code: {
    type: Number,
    required: true,
  },
});

const CountryCode = mongoose.model('CountryCode', countryCodeSchema);

module.exports = CountryCode;
