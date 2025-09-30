
'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Quiz {
  question: string;
  options: string[];
  answer: string;
}

interface Result {
  sentence: string;
  quiz: Quiz;
  image_url: string;
}

interface User {
  id: number;
  email: string;
  tier: 'free' | 'paid';
  // Add any other user properties you need
}

export default function LearnPage() {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizChoice, setQuizChoice] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<User>('/users/me/');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user', err);
        router.push('/auth'); // Redirect to login if not authenticated
      }
    };
    fetchUser();
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setQuizChoice(null);
    setQuizResult(null);

    try {
      const sentenceResponse = await api.post('/generate_sentence', null, { params: { word } });
      const { sentence } = sentenceResponse.data;

      const quizResponse = await api.post('/generate_quiz', { word, sentence });
      const quiz = quizResponse.data;

      const imageResponse = await api.post('/generate_image', null, { params: { word } });
      const { image_url } = imageResponse.data;

      setResult({ sentence, quiz, image_url });
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizSubmit = () => {
    if (quizChoice === result?.quiz.answer) {
      setQuizResult('Correct!');
    } else {
      setQuizResult('Incorrect, try again!');
    }
  };

  useEffect(() => {
    const saveProgress = async () => {
      if (quizResult === 'Correct!' && user && result) {
        try {
          await api.post('/progress/', {
            date: new Date().toISOString(),
            words_learned: 1,
            quiz_score: 100,
          });
        } catch (err) {
          console.error('Failed to save progress', err);
        }
      }
    };
    saveProgress();
  }, [quizResult, user, result]);

  const handleNextWord = () => {
    setWord('');
    setResult(null);
    setQuizChoice(null);
    setQuizResult(null);
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/auth');
  };

  // Construct the full image URL
  const getImageUrl = (path: string) => {
    if (path.startsWith('http')) {
        return path
    }
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${path}`;
  };

  return (
    <div className="min-h-screen bg-purple-100 flex flex-col items-center p-4">
       <div className="w-full max-w-4xl mx-auto">
        <header className="flex justify-between items-center py-4">
          <h1 className="text-2xl font-bold text-purple-700">Kid-Friendly Word Learner</h1>
          <div>
            {user && <span className="text-gray-600 mr-4">Welcome, {user.email}! ({user.tier})</span>}
            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </header>
      </div>

      <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-4">
        {!result ? (
          <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="Enter a word..."
              className="flex-grow p-3 border-2 border-purple-300 rounded-lg focus:outline-none focus:border-purple-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-600 disabled:bg-purple-300 transition-colors"
            >
              {loading ? 'Generating...' : 'Learn!'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <button
              onClick={handleNextWord}
              className="mb-8 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600"
            >
              Try Another Word
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {result && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6 items-center bg-purple-50 p-6 rounded-xl">
              <h2 className="text-2xl font-semibold text-purple-800 capitalize">{word}</h2>
              <img
                src={getImageUrl(result.image_url)}
                alt={`Cartoon of ${word}`}
                className="rounded-lg shadow-md w-full h-auto object-cover"
              />
              <p className="text-lg text-gray-700 text-center mt-2">
                {result.sentence}
              </p>
            </div>

            <div className="flex flex-col justify-center bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-green-800 mb-4">Quiz Time!</h3>
              <p className="text-gray-600 mb-4 text-center">{result.quiz.question}</p>
              <div className="flex flex-col gap-3">
                {result.quiz.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => setQuizChoice(option)}
                    disabled={!!quizResult}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      quizChoice === option ? 'bg-yellow-400 text-white' : 'bg-white hover:bg-yellow-100'
                    } ${
                      quizResult && option === result.quiz.answer ? 'border-2 border-green-500' : ''
                    } ${
                      quizResult && option !== result.quiz.answer ? 'border-2 border-red-500' : ''
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {!quizResult ? (
                <button
                  onClick={handleQuizSubmit}
                  disabled={!quizChoice}
                  className="mt-6 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                >
                  Check Answer
                </button>
              ) : (
                <p className={`mt-4 text-center font-bold text-2xl ${quizResult === 'Correct!' ? 'text-green-600' : 'text-red-500'}`}>
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
