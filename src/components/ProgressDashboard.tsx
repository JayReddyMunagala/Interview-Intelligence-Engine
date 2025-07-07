import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Target, Calendar, Award, Trash2 } from 'lucide-react';
import { progressService, ProgressStats } from '../services/progressService';

interface ProgressDashboardProps {
  progressStats: ProgressStats;
  onClearData: () => void;
}

const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ progressStats, onClearData }) => {
  if (progressStats.totalSessions === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Start Your Journey</h3>
          <p className="text-gray-600 mb-6">
            Complete your first interview analysis to see your progress tracking dashboard with insights, trends, and improvement recommendations.
          </p>
          <div className="text-sm text-gray-500">
            Features you'll unlock:
            <ul className="mt-2 space-y-1">
              <li>• Score trend analysis over time</li>
              <li>• Strongest and weakest skill identification</li>
              <li>• Session history and comparisons</li>
              <li>• Personalized improvement recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const trendColor = progressStats.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600';
  const TrendIcon = progressStats.improvementTrend >= 0 ? TrendingUp : TrendingDown;

  // Prepare chart data from recent sessions
  const chartData = progressStats.recentSessions.reverse().map((session, index) => ({
    session: `Session ${progressStats.totalSessions - progressStats.recentSessions.length + index + 1}`,
    score: session.overallScore,
    confidence: session.metrics.confidenceScore,
    clarity: session.metrics.clarityScore,
    professionalism: session.metrics.professionalismScore,
    relevance: session.metrics.relevanceScore,
    date: new Date(session.date).toLocaleDateString()
  }));

  const skillsData = [
    { skill: 'Confidence', score: progressStats.recentSessions[0]?.metrics.confidenceScore || 0 },
    { skill: 'Clarity', score: progressStats.recentSessions[0]?.metrics.clarityScore || 0 },
    { skill: 'Professionalism', score: progressStats.recentSessions[0]?.metrics.professionalismScore || 0 },
    { skill: 'Relevance', score: progressStats.recentSessions[0]?.metrics.relevanceScore || 0 }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Progress Dashboard</h2>
          <p className="text-lg text-gray-600">Track your interview skills improvement over time</p>
        </div>
        <button
          onClick={onClearData}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Data</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{progressStats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{progressStats.averageScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              progressStats.improvementTrend >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <TrendIcon className={`w-6 h-6 ${trendColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-600">Improvement</p>
              <p className={`text-2xl font-bold ${trendColor}`}>
                {progressStats.improvementTrend >= 0 ? '+' : ''}{progressStats.improvementTrend}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Latest Score</p>
              <p className="text-2xl font-bold text-gray-900">
                {progressStats.recentSessions[0]?.overallScore || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Score Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Score Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="session" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6" 
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Current Skills Breakdown */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Current Skills Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={skillsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Strongest Areas */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-green-600 mb-4">🏆 Strongest Areas</h3>
          <div className="space-y-3">
            {progressStats.strongestAreas.map((area, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-700 capitalize">{area}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Areas for Growth */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-semibold text-orange-600 mb-4">📈 Focus Areas</h3>
          <div className="space-y-3">
            {progressStats.weakestAreas.map((area, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-gray-700 capitalize">{area}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Sessions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Score</th>
                <th className="text-left py-3 px-4">Confidence</th>
                <th className="text-left py-3 px-4">Clarity</th>
                <th className="text-left py-3 px-4">Professionalism</th>
                <th className="text-left py-3 px-4">Relevance</th>
                <th className="text-left py-3 px-4">Duration</th>
              </tr>
            </thead>
            <tbody>
              {progressStats.recentSessions.map((session) => (
                <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">{new Date(session.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-medium">{session.overallScore}%</td>
                  <td className="py-3 px-4">{session.metrics.confidenceScore}%</td>
                  <td className="py-3 px-4">{session.metrics.clarityScore}%</td>
                  <td className="py-3 px-4">{session.metrics.professionalismScore}%</td>
                  <td className="py-3 px-4">{session.metrics.relevanceScore}%</td>
                  <td className="py-3 px-4">{Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;