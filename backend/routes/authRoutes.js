import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );

    return { accessToken, refreshToken };
};

const setTokenCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
    })
);

router.get(
    "/google/callback",
    (req, res, next) => {
        passport.authenticate(
            "google",
            { session: false },
            (err, user, info) => {
                if (err || !user) {
                    res.clearCookie("accessToken", {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                    });
                    res.clearCookie("refreshToken", {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === "production",
                        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
                    });
                    return res.redirect(
                        `${process.env.CLIENT_URL}/login?error=invalid_domain`
                    );
                }

                const { accessToken, refreshToken } = generateTokens(user);
                setTokenCookies(res, accessToken, refreshToken);

                return res.redirect(process.env.CLIENT_URL);
            }
        )(req, res, next);
    }
);

router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ status: "error", message: "No refresh token provided" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        
        const accessToken = jwt.sign(
            { id: decoded.id, email: decoded.email },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.json({ status: "ok", message: "Token refreshed successfully" });
    } catch (error) {
        return res.status(403).json({ status: "error", message: "Invalid refresh token" });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    });
    res.json({ status: "ok", message: "Logged out successfully" });
});

router.get("/me", protect, (req, res) => {
    res.json({ status: "ok", user: req.user });
});

export default router;
