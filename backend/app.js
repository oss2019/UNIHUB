import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import threadRoutes from "./routes/threadRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import subForumRoutes from "./routes/subForumRoutes.js";
import commentRoutes from "./routes/commentRoutes.js"; // 🔥 IMPORTANT
import notificationRoutes from "./routes/notificationRoutes.js";
import workRequestRoutes from "./routes/workRequestRoutes.js";
import './config/scheduler.js'; // Start cron jobs on app boot

import globalErrorHandler from "./controllers/errorController.js";
import { AppError } from "./utils/appError.js";

const app = express();

// Test route
app.get("/test", (req, res) => {
  res.status(200).json({ message: "TEST WORKING" });
});

// Middleware
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:6442",
      "http://localhost:6443",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/threads", threadRoutes);
//app.use("/api/messages", messageRoutes);
app.use("/api", forumRoutes);
app.use("/api", subForumRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api", workRequestRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(404, `Could not find ${req.originalUrl} on the server`));
});

// Global error handler
app.use(globalErrorHandler);

export default app;