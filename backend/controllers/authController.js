import jwt from "jsonwebtoken";
import passport from "passport";
import { AppError } from "../utils/appError.js";
import { sendResponse } from "../utils/appResponse.js";
import { catchAsync } from "../utils/catchAsync.js";

const getAllowedDomain = () =>
	(process.env.COLLEGE_EMAIL_DOMAIN || "iitdh.ac.in").replace(/^@/, "").toLowerCase();

const isAllowedCollegeEmail = (email) => {
	if (!email || typeof email !== "string") return false;
	const normalizedEmail = email.trim().toLowerCase();
	const allowedDomain = getAllowedDomain();
	return normalizedEmail.endsWith(`@${allowedDomain}`);
};

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

// export const googleCallback = catchAsync(async (req, res, next) => {
// 	passport.authenticate("google", { session: false }, (err, user) => {
// 		if (err || !user) {
// 			clearTokenCookies(res);
// 			return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_domain`);
// 		}
// 		console.log("User email:", user?.email);
// 		if (!isAllowedCollegeEmail(user.email)) {
// 			clearTokenCookies(res);
// 			return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_domain`);
// 		}

// 		const { accessToken, refreshToken } = generateTokens(user);
// 		setTokenCookies(res, accessToken, refreshToken);

// 		return res.redirect(process.env.CLIENT_URL);
// 	})(req, res, next);
// });
export const googleCallback = catchAsync(async (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
        
        // Log everything so you can debug
        console.log("=== Google Callback Debug ===");
        console.log("err:", err);
        console.log("user:", user);
        console.log("info:", info);
        console.log("=============================");

        if (err) {
            return next(new AppError(500, err.message || "OAuth error"));
        }

        if (!user) {
            // info.message will tell you WHY it failed
            const reason = info?.message || "Authentication failed";
            console.log("Auth failed reason:", reason);
            
            
            return res.redirect(
                `${process.env.CLIENT_URL}/login?error=${encodeURIComponent(reason)}`
            );
        }

        const { accessToken, refreshToken } = generateTokens(user);
        setTokenCookies(res, accessToken, refreshToken);

        console.log("Login successful for:", user.email);
return res.status(200).json({
    status: "success",
    message: "Login successful",
    data: {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        accessToken,  // ← copy this value for all Postman requests
    },
});

    })(req, res, next);
});

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
