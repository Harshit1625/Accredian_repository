const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { createTransport } = require("nodemailer");
const { google } = require("googleapis");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const https = require("https");

const prisma = new PrismaClient();

const CLIENT_ID = '1017536397936-m2l1prgci8vis988r9sb5hjgb6cpkrit.apps.googleusercontent.com'
const CLIENT_SECRET = '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'
const REDIRECT_URL = 'https://developers.google.com/oauthplayground'
const REFRESH_TOKEN = '1//04CQahaClOWeFCgYIARAAGAQSNwF-L9Irynmrz7srJbHw18gWAzYdQfH9thRDUIkLjk8mUGLmRwwISF1MohIwo5EJ77XOhYOAUjA'

const app = express();

app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

// OAuth configuration
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URL
);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// HTTPS agent to allow self-signed certificates
const agent = new https.Agent({
  rejectUnauthorized: false
});

// Function to send email
async function sendMail(referrerName, referrerEmail, refereeName, refereeEmail) {
  try {
    const accessToken = await oAuth2Client.getAccessToken();
    const transport = createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: "harshitsri1625@gmail.com",
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
      https: {
        agent: agent
      }
    });

    const mailOptions = {
      from: referrerEmail,
      to: refereeEmail,
      subject: "Referral Bonus",
      text: `Hello ${refereeName},

  You have received a referral from ${referrerName} (${referrerEmail}).

  Best regards,
  Your Company`,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  } catch (error) {
    console.log(error);
    throw new Error("Failed to send referral email.");
  }
}

// Route to handle POST request
app.post("/data", async (req, res) => {
  const data = req.body;
  console.log(data);

  try {
    const newRefer = await prisma.referral.create({
      data: {
        ReferrerName: data.referrerName,
        ReferrerEmail: data.referrerEmail,
        RefereeName: data.refereeName,
        RefereeEmail: data.refereeEmail,
      },
    });

    // <------------------- i've tried to implemement this functionality but everytime it is giving me self-signed certificate error -------------------->

    // await sendMail(
    //   data.referrerName,
    //   data.referrerEmail,
    //   data.refereeName,
    //   data.refereeEmail
    // );

    res.json(newRefer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process referral and send email." });
  }
});

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
