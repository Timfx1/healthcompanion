import { useNavigate } from 'react-router';
import { Bell, Calendar, Award, CheckCircle } from 'lucide-react';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function NotificationPermission() {
  const navigate = useNavigate();

  const reminders = [
    { icon: Calendar, label: 'Daily recovery reminders', desc: 'Never miss your exercises' },
    { icon: CheckCircle, label: 'Exercise check-ins', desc: 'Track your progress' },
    { icon: Award, label: 'Recovery milestones', desc: 'Celebrate your wins' },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-12">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-12">
          <div className="inline-flex bg-blue-100 p-6 rounded-3xl mb-6">
            <Bell className="w-16 h-16 text-blue-600" />
          </div>
          <h1 className="text-3xl mb-3 text-gray-900">
            Stay on track with reminders
          </h1>
          <p className="text-gray-600 max-w-sm mx-auto">
            Get gentle nudges to help you stay consistent with your recovery
          </p>
        </div>

        <div className="space-y-4 mb-12 max-w-sm mx-auto w-full">
          {reminders.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="bg-blue-50 rounded-xl p-3 flex-shrink-0">
                <Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-gray-900 mb-1">{label}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 max-w-sm mx-auto w-full">
        <PrimaryButton onClick={() => navigate('/plan-loading')}>
          Enable Notifications
        </PrimaryButton>
        <SecondaryButton onClick={() => navigate('/plan-loading')}>
          Maybe Later
        </SecondaryButton>
      </div>
    </div>
  );
}
