
'use client';

import { useState, FormEvent } from 'react';
import axios from 'axios';

export default function LearnPage() {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setQuizChoice(null);
    setQuizResult(null);

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please log in to continue.');
      setLoading(false);
      return;
    }

    try {
      // 1. Generate Sentence
      const sentenceResponse = await axios.post(
        'http://localhost:8000/generate_sentence',
        null,
        {
          params: { word },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { sentence } = sentenceResponse.data;

      // 2. Generate Quiz
      const quizResponse = await axios.post(
        'http://localhost:8000/generate_quiz',
        null,
        {
          params: { word, sentence },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const quiz = quizResponse.data;

      // 3. Generate Image
      const imageResponse = await axios.post(
        'http://localhost:8000/generate_image',
        null,
        {
          params: { word },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const { image_url } = imageResponse.data;

      setResult({ sentence, quiz, image_url });
    } catch (err: any) {
      if (err.response && err.response.status === 403) {
        setError('You have reached your daily limit for the free tier.');
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    if (quizChoice === result.quiz.answer) {
      setQuizResult('Correct!');
      // In a real app, you would also save this progress to the backend
    } else {
      setQuizResult('Incorrect, try again!');
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-blue-600 mb-6 text-center">VocabFun!</h1>

        <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word..."
            className="flex-grow p-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
          >
            {loading ? 'Generating...' : 'Learn!'}
          </button>
        </form>

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left side: Image and Sentence */}
            <div className="flex flex-col gap-6 items-center bg-blue-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-blue-800">{word}</h2>
              <img
                src={result.image_url}
                alt={`Cartoon of ${word}`}
                className="rounded-lg shadow-md w-full h-auto object-cover"
              />
              <p className="text-lg text-gray-700 text-center mt-2">
                {result.sentence}
              </p>
            </div>

            {/* Right side: Quiz */}
            <div className="flex flex-col justify-center bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-green-800 mb-4">Quiz Time!</h3>
              <p className="text-gray-600 mb-4 text-center">{result.quiz.question}</p>
              <div className="flex flex-col gap-3">
                {result.quiz.options.map((option: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setQuizChoice(option)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      quizChoice === option
                        ? 'bg-yellow-400 text-white'
                        : 'bg-white hover:bg-yellow-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                onClick={handleQuizSubmit}
                disabled={!quizChoice}
                className="mt-6 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
              >
                Check Answer
              </button>
              {quizResult && (
                <p
                  className={`mt-4 text-center font-bold ${
                    quizResult === 'Correct!' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {quizResult}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
