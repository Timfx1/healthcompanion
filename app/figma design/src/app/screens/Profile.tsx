import { ChevronRight, Activity, Bell, BookMarked, FileText, Crown, Shield, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router';
import BottomNav from '../components/BottomNav';

export default function Profile() {
  const navigate = useNavigate();

  const sections = [
    {
      title: 'Recovery Status',
      items: [
        { icon: Activity, label: 'Recovery goal', value: 'Return to running', path: null },
        { icon: Activity, label: 'Injury type', value: 'Recent ankle sprain', path: null },
        { icon: Activity, label: 'Current phase', value: 'Phase 2: Early Mobility', path: '/timeline' },
      ],
    },
    {
      title: 'Content',
      items: [
        { icon: BookMarked, label: 'Saved articles', value: '3 articles', path: null },
        { icon: FileText, label: 'Reports', value: '2 reports', path: '/doctor-report' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: Bell, label: 'Notifications', value: 'Enabled', path: null },
        { icon: Crown, label: 'Premium Features', value: 'Coming soon', path: '/premium-preview' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
          <div>
            <h1 className="text-2xl mb-1">My Profile</h1>
            <p className="text-blue-100">Day 12 of recovery</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="text-sm text-gray-500 mb-3 px-2">{section.title}</h2>
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
              {section.items.map((item, index) => (
                <button
                  key={item.label}
                  onClick={() => item.path && navigate(item.path)}
                  disabled={!item.path}
                  className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all ${
                    item.path ? 'hover:bg-gray-50' : ''
                  } ${index !== section.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-gray-900">{item.label}</p>
                    {item.value && <p className="text-sm text-gray-500">{item.value}</p>}
                  </div>
                  {item.path && <ChevronRight className="w-5 h-5 text-gray-400" />}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex gap-3 mb-3">
            <Shield className="w-6 h-6 text-blue-600 flex-shrink-0" />
            <div>
              <h3 className="text-blue-900 mb-2">Medical Disclaimer</h3>
              <p className="text-sm text-blue-800">
                AnklePath is designed to support your recovery but does not replace professional medical advice. Always consult with a qualified healthcare provider for diagnosis and treatment.
              </p>
            </div>
          </div>
        </div>

        <button className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-200 flex items-center gap-4 hover:bg-gray-50 transition-all">
          <LogOut className="w-5 h-5 text-red-600" />
          <span className="text-red-600">Sign out</span>
        </button>

        <div className="text-center text-sm text-gray-400 pt-4">
          <p>AnklePath v1.0.0</p>
          <p className="mt-1">© 2026 AnklePath. All rights reserved.</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
