const express = require("express");
const app = express();
require("dotenv").config();
const cookieParser = require("cookie-parser");
const cors = require('cors');

// CORS configuration - MUST BE BEFORE ROUTES
// Allowed frontend URLs: local dev plus any listed in CLIENT_URL (comma-separated)
const allowedOrigins = ['http://localhost:5173',
    ...(process.env.CLIENT_URL || '').split(',').map(u => u.trim().replace(/\/$/, '')).filter(Boolean)];

app.set('trust proxy', 1); // Render sits behind a proxy

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
const main = require("./config/db");
const authRouter = require("./routes/userAuth");
app.use("/user", authRouter);

const redisClient = require("./config/redis");
const problemRouter = require("./routes/problemRouter");
app.use("/problem", problemRouter);

const submissionRouter = require("./routes/submit");
app.use("/submission", submissionRouter);

const chatbotRouter = require("./routes/chatbotRouter");
app.use("/chatbot", chatbotRouter);

// ✅ Add Contest Router
const contestRouter = require("./routes/contestRouter");
app.use("/contest", contestRouter);

// Test endpoint
app.get('/test', (req, res) => {
    res.json({ message: 'Backend is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const InitializeConnection = async () => {
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("Connected To DB");
        app.listen(process.env.PORT || 3000, () => {
            console.log(`The App is listening to port number ${process.env.PORT}`)
        })
    }
    catch (err) {
        console.log("Error: " + err);
        process.exit(1);
    }
}

InitializeConnection();