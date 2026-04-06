// <<<<<<< HEAD
// import express from 'express';
// import cors from 'cors';
// import cookieParser from 'cookie-parser';
// import session from 'express-session';
// import passport from './config/passport.js';
// import authRoutes from './routes/authRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import threadRoutes from './routes/threadRoutes.js';
// import messageRoutes from './routes/messageRoutes.js';
// import globalErrorHandler from './controllers/errorController.js';
// import { AppError } from './utils/appError.js';

// =======
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import session from "express-session";
// import passport from "./config/passport.js";
// import authRoutes from "./routes/authRoutes.js";
// import userRoutes from "./routes/userRoutes.js";
// import globalErrorHandler from "./controllers/errorController.js";
// import { AppError } from "./utils/appError.js";
// import forumRoutes from "./routes/forumRoutes.js";
// import subForumRoutes from "./routes/subForumRoutes.js";
// >>>>>>> origin/feature/forums
// const app = express();

// // Middleware
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL,
//     credentials: true,
// <<<<<<< HEAD
// }));
// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// =======
//   }),
// );
// app.use(express.json());
// >>>>>>> origin/feature/forums
// app.use(cookieParser());
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//   }),
// );
// app.use(passport.initialize());
// app.use(passport.session());

// // Routes
// <<<<<<< HEAD
// app.use('/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/threads', threadRoutes);
// app.use('/api/messages', messageRoutes);
// =======
// app.use("/auth", authRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api", forumRoutes);
// app.use("/api", subForumRoutes);
// >>>>>>> origin/feature/forums

// //* Middleware which send error if none of the Routes mentioned are req and something else is req
// app.use((req, res, next) => {
//   next(new AppError(404, `Could not find ${req.originalUrl} on the server`));
// });

// // Global error handler — must be the LAST middleware
// app.use(globalErrorHandler);

// export default app;
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import threadRoutes from "./routes/threadRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import forumRoutes from "./routes/forumRoutes.js";
import subForumRoutes from "./routes/subForumRoutes.js";

import globalErrorHandler from "./controllers/errorController.js";
import { AppError } from "./utils/appError.js";

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Body parsers (keeping your extended version for flexibility)
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
app.use("/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/threads", threadRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", forumRoutes);
app.use("/api", subForumRoutes);

// 404 handler
app.use((req, res, next) => {
  next(new AppError(404, `Could not find ${req.originalUrl} on the server`));
});

// Global error handler
app.use(globalErrorHandler);

export default app;