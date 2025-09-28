
'use client';

import { useState, FormEvent } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url = isLogin
      ? 'http://localhost:8000/token'
      : 'http://localhost:8000/users/';

    try {
      let response;
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        response = await axios.post(url, formData);
        localStorage.setItem('token', response.data.access_token);

      } else {
        response = await axios.post(url, { email, password });
        // Automatically log in the user after successful sign-up
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);
        const loginResponse = await axios.post('http://localhost:8000/token', formData);
        localStorage.setItem('token', loginResponse.data.access_token);
      }
      
      router.push('/learn'); // Redirect to the main app page after auth
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError(`An error occurred. Please try again.`);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {isLogin ? 'Welcome Back!' : 'Create an Account'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-6">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-medium text-blue-500 hover:underline"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}
