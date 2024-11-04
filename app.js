import dotenv from 'dotenv';
dotenv.config();

// Import essential libraries
import express from "express";
import questionRouter from "./router/questionRoute.js";
import userRouter from "./router/userRoute.js";
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';  // Make sure the import is correct
import xss from "xss-clean";
import multer from 'multer'; // Middleware for handling multipart/form-data
import cors from "cors"
// Initialize express app
const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.static('public'));


;
// 'http://localhost:3000'

// Middlewares for body parsing
app.use(express.json()); // For parsing JSON data
app.use(express.urlencoded({ extended: true })); // For parsing URL-encoded data (form data)

// Set up multer for multipart/form-data
const upload = multer();

// Apply security-related middlewares
app.use(helmet()); // Security headers
app.use(cookieParser()); // Middleware for parsing cookies

// Apply rate limiting (limits requests per IP address)
const limiter = rateLimit({
  max: 100, // Max number of requests
  windowMs: 60 * 60 * 1000, // 1 hour window
  message: "Too many requests from this IP, please try again in an hour"
});
app.use("/api", limiter);

// DATA SANITIZATION against NoSQL query injection
app.use(mongoSanitize()); // Applying MongoDB sanitization

// DATA SANITIZATION against XSS attacks
app.use(xss()); // Prevent Cross-Site Scripting

// Routes
app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.use("/api/v1/users", userRouter);
app.use("/api/v1/questions", questionRouter);

// Example route to handle both raw JSON and form-data
app.post('/api/v1/example', upload.none(), (req, res) => {
  console.log("Raw JSON data:", req.body);
  res.status(200).json({
    status: 'success',
    data: req.body
  });
});

// MongoDB connection setup
import mongoose from 'mongoose';
import { config } from 'dotenv';
config({ path: './utilites/.env' });

const DB = process.env.DATABASE || 'mongodb+srv://odeyemiibrahim49:bolaji@cluster0.22hik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(DB, {}).then(() => {
  console.log('DB is successfully connected');
}).catch((err) => {
  console.error('Error connecting to DB:', err);
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`The app is listening on port ${port}...`);
});

export default app;
