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
            const allowedDomain = getAllowedDomain();

            // Layer 1: email must exist
            if (!email) {
                return done(null, false, {
                    message: "Your Google account does not expose an email address.",
                });
            }

            // Layer 2: Google Workspace hd claim (the hosted domain Google stamps on the token)
            // This is only present for Google Workspace (G Suite) accounts.
            // If the college uses Google Workspace with @iitdh.ac.in, this will be set.
            const hdClaim = profile._json?.hd;
            if (hdClaim && hdClaim.toLowerCase() !== allowedDomain) {
                return done(null, false, {
                    message: `Only @${allowedDomain} Google accounts are allowed.`,
                });
            }

            // Layer 3: email domain check — the definitive server-side gate
            if (!isAllowedCollegeEmail(email)) {
                return done(null, false, {
                    message: `Only @${allowedDomain} emails are allowed.`,
                });
            }

            // All checks passed — upsert user in MongoDB
            return User.findOneAndUpdate(
                { email },
                {
                    $set: {
                        googleId: profile.id,
                        name: profile.displayName,
                        avatar: profile.photos[0]?.value || "",
                        isVerified: true,
                        lastActive: new Date(),
                    },
                    $setOnInsert: {
                        email,
                        role: "student", // default role on first login — promote via PATCH /api/users/:id/role
                    },
                },
                { upsert: true, new: true, runValidators: true }
            )
                .then((user) => done(null, user))
                .catch((err) => done(err, null));
        }
    )
);

export default passport;
