
'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://fcmrscpicaijyejczoaa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjbXJzY3BpY2FpanllamN6b2FhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMzM4NDMsImV4cCI6MjA3NDYwOTg0M30.oobPSpnKjjeMAwpkBvQ2Ewd5GwHS6agnGsoEDl1-5e8')

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) console.log('Error signing up:', error.message)
    else console.log('Signed up:', data)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) console.log('Error logging in:', error.message)
    else console.log('Logged in:', data)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-blue-600">
          Auth
        </h1>

        <form onSubmit={handleSignUp} className="mt-8">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="px-4 py-2 border rounded-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="ml-4 px-4 py-2 border rounded-lg"
          />
          <button type="submit" className="ml-4 px-4 py-2 font-bold text-white bg-blue-500 rounded-lg">
            Sign Up
          </button>
        </form>

        <form onSubmit={handleLogin} className="mt-8">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="px-4 py-2 border rounded-lg"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="ml-4 px-4 py-2 border rounded-lg"
          />
          <button type="submit" className="ml-4 px-4 py-2 font-bold text-white bg-green-500 rounded-lg">
            Login
          </button>
        </form>
      </main>
    </div>
  )
}
