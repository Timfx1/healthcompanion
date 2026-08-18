import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Search, Clock, Shield } from 'lucide-react';
import BottomNav from '../components/BottomNav';

export default function LearnHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    'First 48 hours',
    'Grade 1, 2, and 3 sprains',
    'Swelling and bruising',
    'Braces and supports',
    'Walking and crutches',
    'Exercises',
    'Return to sport',
    'When to see a doctor',
  ];

  const articles = [
    {
      id: 'grade-3-sprain',
      title: 'What does a Grade 3 ankle sprain mean?',
      readTime: '5 min read',
      category: 'Grade 1, 2, and 3 sprains',
    },
    {
      id: 'when-walk',
      title: 'When can I walk again?',
      readTime: '4 min read',
      category: 'Walking and crutches',
    },
    {
      id: 'ice-or-heat',
      title: 'Should I use ice or heat?',
      readTime: '3 min read',
      category: 'First 48 hours',
    },
    {
      id: 'swelling-duration',
      title: 'How long does swelling last?',
      readTime: '4 min read',
      category: 'Swelling and bruising',
    },
    {
      id: 'return-sport',
      title: 'When can I return to football?',
      readTime: '6 min read',
      category: 'Return to sport',
    },
    {
      id: 'swelling-normal',
      title: 'Is swelling normal after 2 weeks?',
      readTime: '3 min read',
      category: 'Swelling and bruising',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <h1 className="text-2xl mb-4 text-gray-900">Learn</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        <div>
          <h2 className="text-lg mb-3 text-gray-900">Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
              >
                <span className="text-sm text-gray-900">{category}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-lg mb-3 text-gray-900">Popular articles</h2>
          <div className="space-y-3">
            {articles.map((article) => (
              <button
                key={article.id}
                onClick={() => navigate(`/article/${article.id}`)}
                className="w-full bg-white rounded-xl p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all text-left"
              >
                <h3 className="text-gray-900 mb-2">{article.title}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    {article.readTime}
                  </div>
                  <div className="flex items-center gap-1 text-blue-600">
                    <Shield className="w-4 h-4" />
                    Medically reviewed
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
