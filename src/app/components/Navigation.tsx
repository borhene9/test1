'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import React, { useState, useEffect, useCallback } from 'react';

const Navigation = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);

  const isActive = (path: string) => pathname === path;

  const fetchUserRole = useCallback(async () => {
    if (session?.user?.id) {
      const response = await fetch(`/api/users/${session.user.id}`);
      if (response.ok) {
        const user = await response.json();
        setUserRole(user.role?.name || null);
      } else {
        console.error('Failed to fetch user role');
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const getNavItems = () => {
    if (!session?.user) return [];

    const baseItems = [
      { href: '/dashboard', label: 'Dashboard' },
      { href: '/predictive-analysis', label: 'Predictive Analysis' },
    ];

    // Check if the user's role is admin (either by name or ID)
    const isAdmin = session?.user?.role === 'admin' || session?.user?.role === '749ba017-4ab7-47a0-928e-efcf6d1c343f';

    if (isAdmin) {
      return [
        ...baseItems,
        { href: '/users', label: 'Manage Users' },
      ];
    }

    return baseItems;
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  return (
    <nav>
      <div className="nav-content">
        <Link href="/welcome" className="nav-logo">
          <Image src="/logo.png" alt="Amen Bank Logo" width={36} height={36} />
          <span>Amen Bank Portal</span>
        </Link>
        <div className="nav-links">
          {getNavItems().map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="nav-actions">
          {session?.user ? (
            <>
              <span style={{ color: '#fff', fontWeight: 500 }}>{session.user.name}</span>
              <button onClick={handleSignOut} className="btn">Sign out</button>
            </>
          ) : (
            <Link href="/auth/signin" className="btn">Sign in</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
