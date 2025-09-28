
'use client'

import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [progress, setProgress] = useState({ words_learned: 0, average_score: 0 })

  useEffect(() => {
    const fetchProgress = async () => {
      // Replace with actual user ID
      const userId = 1
      const res = await fetch(`http://localhost:8000/progress/${userId}`)
      const data = await res.json()
      setProgress(data)
    }

    fetchProgress()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-blue-600">
          Parent Dashboard
        </h1>

        <div className="mt-8 flex flex-wrap justify-around w-full max-w-4xl">
          <div className="mt-6 p-6 w-96 text-left border rounded-xl">
            <h3 className="text-2xl font-bold">Words Learned</h3>
            <p className="mt-4 text-xl">
              {progress.words_learned}
            </p>
          </div>

          <div className="mt-6 p-6 w-96 text-left border rounded-xl">
            <h3 className="text-2xl font-bold">Average Score</h3>
            <p className="mt-4 text-xl">
              {progress.average_score}
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
