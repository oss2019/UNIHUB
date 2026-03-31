const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userModel");

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;

                // Validate email domain
                if (!email.endsWith(`@${process.env.COLLEGE_EMAIL_DOMAIN}`)) {
                    return done(null, false, {
                        message: `Only @${process.env.COLLEGE_EMAIL_DOMAIN} emails are allowed`,
                    });
                }

                // Upsert user by email
                let user = await User.findOneAndUpdate(
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
                            role: "student",
                        },
                    },
                    { upsert: true, new: true, runValidators: true }
                );

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
