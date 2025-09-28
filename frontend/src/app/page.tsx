
'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-5xl font-bold text-purple-600 mb-6">Welcome to VocabFun!</h1>
        <p className="text-lg text-gray-600 mb-8">Your fun and interactive way to learn new vocabulary.</p>
        <div className="flex justify-center gap-4">
          <Link href="/auth" className="bg-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-600 transition duration-300">
            Get Started
          </Link>
          <Link href="/learn" className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition duration-300">
            Start Learning
          </Link>
        </div>
      </div>
    </div>
  );
}
