import express from "express";
import passport from "passport";
import { protect } from "../middlewares/authMiddleware.js";
import {
    googleCallback,
    refreshAccessToken,
    logout,
    getMe,
} from "../controllers/authController.js";

const router = express.Router();

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        hd: (process.env.COLLEGE_EMAIL_DOMAIN || "iitdh.ac.in").replace(/^@/, ""),
        prompt: "select_account",
    })
);

router.get(
    "/google/callback",
    googleCallback
);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

router.get("/me", protect, getMe);

export default router;
