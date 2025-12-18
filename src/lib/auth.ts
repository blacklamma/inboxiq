import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { encryptToken } from "@/lib/crypto";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/gmail.readonly",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (!account || account.provider !== "google") return;
      const scopes = (account.scope ?? "").trim();
      const encryptedRefreshToken = account.refresh_token
        ? encryptToken(account.refresh_token)
        : undefined;

      await prisma.connectedAccount.upsert({
        where: {
          userId_provider: {
            userId: user.id as string,
            provider: account.provider,
          },
        },
        update: {
          scopes,
          ...(encryptedRefreshToken ? { encryptedRefreshToken } : undefined),
        },
        create: {
          userId: user.id as string,
          provider: account.provider,
          scopes,
          encryptedRefreshToken: encryptedRefreshToken ?? null,
        },
      });
    },
  },
};

export function getServerAuthSession() {
  return getServerSession(authOptions);
}
