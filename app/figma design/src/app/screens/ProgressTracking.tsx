import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import BottomNav from '../components/BottomNav';

export default function ProgressTracking() {
  const navigate = useNavigate();

  const painData = [
    { id: 1, day: 'Day 1', pain: 8 },
    { id: 2, day: 'Day 3', pain: 7 },
    { id: 3, day: 'Day 5', pain: 6 },
    { id: 4, day: 'Day 7', pain: 5 },
    { id: 5, day: 'Day 9', pain: 4 },
    { id: 6, day: 'Day 12', pain: 3 },
  ];

  const metrics = [
    { label: 'Pain trend', value: '3/10', change: '-5 points', changeColor: 'text-green-600' },
    { label: 'Swelling', value: 'Mild', change: 'Improving', changeColor: 'text-green-600' },
    { label: 'Walking ability', value: 'Limping', change: 'Better than last week', changeColor: 'text-green-600' },
    { label: 'Range of motion', value: '65%', change: '+15%', changeColor: 'text-green-600' },
    { label: 'Balance test', value: '18 sec', change: '+6 sec', changeColor: 'text-green-600' },
    { label: 'Exercises this week', value: '18/21', change: '86% completion', changeColor: 'text-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl text-gray-900">Progress Tracking</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg mb-4 text-gray-900">Pain over time</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={painData} id="progress-chart">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Line
                key="progress-pain-line"
                type="monotone"
                dataKey="pain"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ fill: '#2563eb', r: 4 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{metric.label}</p>
                  <p className="text-xl text-gray-900">{metric.value}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm ${metric.changeColor}`}>{metric.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
