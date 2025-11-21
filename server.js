const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors'); // Import the cors package
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
const port = 5000; // Changed to 5000 to match frontend

// Enable CORS for all routes
app.use(cors());

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (like your index.html and css)
app.use(express.static(__dirname));

app.post('/send-email', (req, res) => {
    const { name, email, message } = req.body;

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER, // Loaded from .env file
            pass: process.env.EMAIL_PASS, // Loaded from .env file
        },
    });

    const mailOptions = {
        from: `"${name}" <${email}>`,
        to: 'contact@osian.com', // Your receiving email address
        subject: 'New Contact Form Submission from OSIAN',
        text: `You have a new message from ${name} (${email}):\n\n${message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending message.');
        }
        console.log('Message sent: %s', info.messageId);
        res.status(200).send('Message sent successfully!');
    });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});