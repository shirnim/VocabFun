
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if a token exists in local storage to determine login status
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/auth'); // Redirect to login page after logout
  };

  return (
    <html lang="en">
      <body>
        <nav className="bg-white shadow-md p-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">
            <Link href="/learn">VocabFun</Link>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/learn" className="text-gray-600 hover:text-blue-500 font-medium">
              Learn
            </Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-500 font-medium">
              Dashboard
            </Link>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link href="/auth" className="text-gray-600 hover:text-blue-500 font-medium">
                Login
              </Link>
            )}
          </div>
        </nav>
        <main>{children}</main>
      </body>
    </html>
  );
}
