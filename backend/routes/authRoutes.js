import express from "express";
import passport from "passport";
import { protect } from "../middlewares/authMiddleware.js";
import {
    handleGoogleCallback,
    googleCallback,
    refreshAccessToken,
    logout,
    getMe,
} from "../controllers/authController.js";

const router = express.Router();

// Step 1 — Redirect user to Google's OAuth consent screen
router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        // hd is a UI *hint* only — real enforcement is in passport.js strategy
        hd: (process.env.COLLEGE_EMAIL_DOMAIN || "iitdh.ac.in").replace(/^@/, ""),
        prompt: "select_account",
        session: false,
    })
);

// Step 2 — Google redirects back here after user picks an account
// handleGoogleCallback (in authController) runs passport strategy first,
// then googleCallback issues JWT tokens.
router.get("/google/callback", handleGoogleCallback, googleCallback);

router.post("/refresh", refreshAccessToken);

router.post("/logout", logout);

router.get("/me", protect, getMe);

export default router;
