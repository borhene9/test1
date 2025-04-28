import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: AuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(
        credentials: Record<"username" | "password", string> | undefined,
        req: any
      ) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username,
          },
          include: {
            role: true,
          },
        });

        if (!user) {
          throw new Error("Invalid username or password");
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          throw new Error("Invalid username or password");
        }

        return {
          id: user.id,
          username: user.username,
          role: user.role.name,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, account, profile, trigger }: { token: any; user?: any, account: any, profile?: any, trigger?: any }) => {
      if (user) {
        token.username = user.username;
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session: async ({ session, token }: { session: any; token: any }) => {
      if (token) {
        session.user.username = token.username;
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
};
