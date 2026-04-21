import jwt from "jsonwebtoken";
import passport from "passport";
import { sendResponse } from "../utils/appResponse.js";
import { catchAsync } from "../utils/catchAsync.js";
import { AppError } from "../utils/appError.js";


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

const getCookieOptions = (maxAge) => ({
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
	path: "/",
	...(maxAge ? { maxAge } : {}),
});

const setTokenCookies = (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
	res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));
};

const clearTokenCookies = (res) => {
	res.clearCookie("accessToken", getCookieOptions());
	res.clearCookie("refreshToken", getCookieOptions());
};

// Step 1 of callback — runs passport strategy (domain check + DB upsert).
// On success, attaches user to req.user and calls next().
// On failure, redirects to frontend with error reason.
export const handleGoogleCallback = (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
        if (err) {
            return next(err); // unexpected server error → global error handler
        }
        if (!user) {
            const reason = info?.message || "Authentication failed";
            console.warn("[Auth] Login rejected:", reason);
            return res.redirect(
                `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(reason)}`
            );
        }
        req.user = user;
        return next();
    })(req, res, next);
};

// Step 2 of callback — passport has already verified the user.
// This function only issues JWT cookies and responds.
export const googleCallback = (req, res) => {
    const { accessToken, refreshToken } = generateTokens(req.user);
    setTokenCookies(res, accessToken, refreshToken);

    console.log("[Auth] Login successful:", req.user.email, "| role:", req.user.role);

    return res.status(200).json({
        status: "success",
        message: "Login successful",
        data: {
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                role: req.user.role,
            },
            accessToken,
        },
    });
};

export const refreshAccessToken = catchAsync(async (req, res, next) => {
	const refreshToken = req.cookies?.refreshToken;

	if (!refreshToken) {
		return next(new AppError(401, "No refresh token provided"));
	}

	const decoded = await Promise.resolve().then(() =>
		jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)
	);

	const accessToken = jwt.sign(
		{ id: decoded.id, email: decoded.email },
		process.env.JWT_SECRET,
		{ expiresIn: "15m" }
	);

	res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));

	return sendResponse(
		res,
		200,
		"success",
		null,
		null,
		undefined,
		"Token refreshed successfully"
	);
});

export const logout = catchAsync(async (req, res) => {
	clearTokenCookies(res);
	return sendResponse(res, 200, "success", null, null, undefined, "Logged out successfully");
});

export const getMe = catchAsync(async (req, res) => {
	return sendResponse(res, 200, "success", "user", req.user);
});
