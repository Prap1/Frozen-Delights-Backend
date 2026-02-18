require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const OTP = require('./models/OTP');

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const targetEmail = process.env.EMAIL_USER; // Check for the email in .env
        console.log(`Checking for user: ${targetEmail}`);

        const user = await User.findOne({ email: targetEmail });
        if (user) {
            console.log("User found:", user.username, user.email);
        } else {
            console.log("User NOT found!");
        }

        const otps = await OTP.find({ email: targetEmail });
        console.log(`Found ${otps.length} OTPs for this email.`);
        otps.forEach(otp => console.log(`- OTP: ${otp.otp}, Created: ${otp.createdAt}`));

        mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

checkUser();
