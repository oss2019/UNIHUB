import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/userModel.js";
import { AppError } from "../utils/appError.js";


const getAllowedDomain = () =>
    (process.env.COLLEGE_EMAIL_DOMAIN || "iitdh.ac.in").replace(/^@/, "").toLowerCase();

const isAllowedCollegeEmail = (email) => {
    if (!email || typeof email !== "string") return false;
    const normalizedEmail = email.trim().toLowerCase();
    const allowedDomain = getAllowedDomain();
    return normalizedEmail.endsWith(`@${allowedDomain}`);
};


passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then((user) => done(null, user))
        .catch((err) => done(new AppError(500, err.message), null));
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            passReqToCallback: false,
        },
        (accessToken, refreshToken, profile, done) => {
            const email = profile?.emails?.[0]?.value;
            const avatarFromGoogle =
                profile?.photos?.[0]?.value ||
                profile?._json?.picture ||
                "";
            const setFields = {
                googleId: profile.id,
                name: profile.displayName,
                isVerified: true,
                lastActive: new Date(),
            };

            if (avatarFromGoogle) {
                setFields.avatar = avatarFromGoogle;
            }

            if (!email) {
                return done(new AppError(400, "Google account email is not available"), null);
            }

            // Validate email domain
            if (!isAllowedCollegeEmail(email)) {
                return done(null, false, {
                    message: `Only @${getAllowedDomain()} emails are allowed`,
                });
            }

            // Upsert user by email
            return User.findOneAndUpdate(
                { email },
                {
                    $set: setFields,
                    $setOnInsert: {
                        email,
                        role: "student",
                    },
                },
                { upsert: true, new: true, runValidators: true }
            )
                .then((user) => done(null, user))
                .catch((err) => done(new AppError(500, err.message), null));
        }
    )
);

export default passport;
