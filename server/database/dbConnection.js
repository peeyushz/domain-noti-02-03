"use strict";
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = async() => {
    try {
        const con = await mongoose.connect("mongodb+srv://nftmarketplacepolygon:M2qf6KYrgdkLWCpO@cluster0.g3op7pe.mongodb.net/ENS-Expiry-Tracker", {
           useNewUrlParser: true,
           useUnifiedTopology: true
        })
        console.log(`MongoDB connected : ${con.connection.host}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
}

module.exports = connectDB