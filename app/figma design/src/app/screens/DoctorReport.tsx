import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function DoctorReport() {
  const navigate = useNavigate();

  const painData = [
    { id: 1, day: 'Day 1', pain: 8 },
    { id: 2, day: 'Day 3', pain: 7 },
    { id: 3, day: 'Day 5', pain: 6 },
    { id: 4, day: 'Day 7', pain: 5 },
    { id: 5, day: 'Day 9', pain: 4 },
    { id: 6, day: 'Day 12', pain: 3 },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/red-flags')}>
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl text-gray-900">Doctor Report</h1>
      </div>

      <div className="px-6 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">
            This report summarizes your injury, symptoms, and progress to share with your healthcare provider.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-gray-900 mb-3">Injury Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Injury type:</span>
                <span className="text-gray-900">Recent ankle sprain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Injury date:</span>
                <span className="text-gray-900">April 21, 2026</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Days since injury:</span>
                <span className="text-gray-900">12 days</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-gray-900 mb-3">Pain Trend</h3>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={painData} id="doctor-report-chart">
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#6b7280" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="#6b7280" />
                <Line
                  key="report-pain-line"
                  type="monotone"
                  dataKey="pain"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: '#2563eb', r: 3 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-2 text-sm text-gray-600">
              Current pain level: <span className="text-gray-900">3/10</span> (decreased from 8/10)
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-gray-900 mb-3">Symptoms</h3>
            <div className="flex flex-wrap gap-2">
              {['Swelling', 'Pain when walking', 'Stiffness'].map((symptom) => (
                <span key={symptom} className="bg-white border border-gray-300 px-3 py-1 rounded-lg text-sm">
                  {symptom}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-gray-900 mb-3">Walking Ability</h3>
            <p className="text-sm text-gray-700">Currently walking with a limp, improving from unable to walk</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-gray-900 mb-3">Exercise Completion</h3>
            <div className="mb-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '86%' }} />
              </div>
            </div>
            <p className="text-sm text-gray-700">18 of 21 exercises completed this week (86%)</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-gray-900 mb-3">Notes</h3>
            <p className="text-sm text-gray-700">
              Swelling has reduced significantly. Still experiencing some stiffness in the morning. Able to walk short distances without crutches.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-gray-900 mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                + Add
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <PrimaryButton>
            <div className="flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              Export PDF
            </div>
          </PrimaryButton>
          <SecondaryButton>
            <div className="flex items-center justify-center gap-2">
              <Share2 className="w-5 h-5" />
              Share with physiotherapist
            </div>
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
