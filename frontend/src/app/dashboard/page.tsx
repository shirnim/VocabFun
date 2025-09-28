
'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function DashboardPage() {
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to view the dashboard.');
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch current user
        const userResponse = await axios.get('http://localhost:8000/users/me/', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const currentUser = userResponse.data;
        setUser(currentUser);

        // 2. Check if the user is on the paid tier
        if (currentUser.tier !== 'paid') {
          setError('This dashboard is only available for paid users.');
          setLoading(false);
          return;
        }

        // 3. Fetch progress data
        const progressResponse = await axios.get(
          `http://localhost:8000/progress/${currentUser.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setProgress(progressResponse.data);
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getSummary = () => {
    const totalWords = progress.reduce((sum, item) => sum + item.words_learned, 0);
    const averageScore = progress.length > 0
      ? progress.reduce((sum, item) => sum + item.quiz_score, 0) / progress.length
      : 0;
    return { totalWords, averageScore };
  };

  const { totalWords, averageScore } = getSummary();

  return (
    <div className="min-h-screen bg-purple-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-purple-600 mb-6 text-center">Parent Dashboard</h1>

        {loading && <p className="text-center">Loading...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && user && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-center mb-8">
              <div className="bg-purple-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-purple-800">Total Words Learned</h3>
                <p className="text-5xl font-bold text-purple-500 mt-2">{totalWords}</p>
              </div>
              <div className="bg-green-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-green-800">Average Quiz Score</h3>
                <p className="text-5xl font-bold text-green-500 mt-2">
                  {averageScore.toFixed(1)}%
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Daily Progress</h2>
            <div className="space-y-4">
              {progress.length > 0 ? (
                progress.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                    <span className="font-medium">{new Date(item.date).toLocaleDateString()}</span>
                    <div>
                      <span className="mr-6">Words: <strong>{item.words_learned}</strong></span>
                      <span>Score: <strong>{item.quiz_score.toFixed(1)}%</strong></span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No progress recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
