import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
