import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

const authOptions: AuthOptions = {
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
        console.log('JWT token:', token);
      }
      return token;
    },
    session: async ({ session, token }: { session: any; token: any }) => {
      if (token) {
        session.user.username = token.username;
        session.user.id = token.id;
        session.user.role = token.role;
        console.log('Session:', session);
      }
      return session;
    },
  },
};

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2.5rem 2rem', minWidth: 350 }}>
        <Image src="/logo.png" alt="Amen Bank Logo" width={120} height={120} />
        <h1 style={{ textAlign: 'center', marginBottom: 0 }}>Welcome{session?.user?.username ? `, ${session.user.username}` : ''}!</h1>
        <p style={{ marginTop: 0, marginBottom: 16, color: '#009846', fontWeight: 600, fontSize: '1.2rem' }}>You are now signed in.</p>
        <Link href="/dashboard" className="btn" style={{ marginTop: 16, textAlign: 'center' }}>Go to Dashboard</Link>
      </div>
    </div>
  );
}
