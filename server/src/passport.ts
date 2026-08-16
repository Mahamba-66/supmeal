import "dotenv/config";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./db.js";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || "http://localhost:3000/auth/google/callback";

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const existingOAuth = await prisma.oAuthAccount.findUnique({
          where: { provider_providerId: { provider: "google", providerId: profile.id } },
          include: { user: true },
        });

        if (existingOAuth) {
          return done(null, existingOAuth.user);
        }

        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email found in Google profile"));
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              firstName: profile.name?.givenName || "Utilisateur",
              lastName: profile.name?.familyName || "Google",
              dateOfBirth: new Date("2000-01-01"),
              avatarUrl: profile.photos?.[0]?.value || null,
            },
          });
        }

        await prisma.oAuthAccount.create({
          data: { provider: "google", providerId: profile.id, userId: user.id },
        });

        return done(null, user);
      } catch (err) {
        return done(err as Error);
      }
    }
  )
);

export default passport;
