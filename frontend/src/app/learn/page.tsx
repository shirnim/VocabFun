
'use client'

import { useState } from 'react'

export default function Learn() {
  const [word, setWord] = useState('')
  const [sentence, setSentence] = useState('')
  const [quiz, setQuiz] = useState({ options: [], answer: '' })
  const [image, setImage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const sentenceRes = await fetch('http://localhost:8000/generate_sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    })
    const sentenceData = await sentenceRes.json()
    setSentence(sentenceData.sentence)

    const quizRes = await fetch('http://localhost:8000/generate_quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    })
    const quizData = await quizRes.json()
    setQuiz(quizData)

    const imageRes = await fetch('http://localhost:8000/generate_image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word }),
    })
    const imageData = await imageRes.json()
    setImage(imageData.image_url)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-gray-100">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-blue-600">
          VocabFun
        </h1>

        <form onSubmit={handleSubmit} className="mt-8">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word"
            className="px-4 py-2 border rounded-lg"
          />
          <button type="submit" className="ml-4 px-4 py-2 font-bold text-white bg-blue-500 rounded-lg">
            Learn!
          </button>
        </form>

        {sentence && (
          <div className="mt-8 p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md flex items-center space-x-4">
            <div>
              <div className="text-xl font-medium text-black">Sentence</div>
              <p className="text-gray-500">{sentence}</p>
            </div>
          </div>
        )}

        {quiz.options.length > 0 && (
          <div className="mt-8 p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
            <div className="text-xl font-medium text-black">Quiz</div>
            <div className="mt-4">
              {quiz.options.map((option, index) => (
                <button key={index} className="block w-full mt-2 px-4 py-2 text-left font-semibold text-white bg-green-500 rounded-lg">
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {image && (
          <div className="mt-8 p-6 max-w-sm mx-auto bg-white rounded-xl shadow-md">
            <img src={image} alt={word} className="w-full" />
          </div>
        )}
      </main>
    </div>
  )
}
