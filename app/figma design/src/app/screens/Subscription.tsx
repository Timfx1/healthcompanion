import { ArrowLeft, Check, Crown } from 'lucide-react';
import { useNavigate } from 'react-router';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';

export default function Subscription() {
  const navigate = useNavigate();

  const benefits = [
    'Full phase-based rehab program',
    'Daily guided exercise videos',
    'Pain-based plan adjustments',
    'Progress reports for your doctor',
    'Return-to-sport tests',
    'Expert-reviewed education',
    'Unlimited symptom tracking',
    'Priority customer support',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white pb-12">
      <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/home')}>
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl text-gray-900">Premium</h1>
      </div>

      <div className="px-6 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex bg-gradient-to-br from-amber-400 to-amber-500 p-4 rounded-3xl mb-4">
            <Crown className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl mb-3 text-gray-900">Unlock your full ankle recovery plan</h1>
          <p className="text-gray-600">Get everything you need to recover safely and effectively</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-8">
          <h2 className="text-lg mb-4 text-gray-900">Premium benefits</h2>
          <div className="space-y-3">
            {benefits.map((benefit) => (
              <div key={benefit} className="flex items-start gap-3">
                <div className="bg-green-100 rounded-full p-1 flex-shrink-0">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <button className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-blue-600 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
              Best value
            </div>
            <div className="text-left">
              <h3 className="text-xl text-gray-900 mb-1">Yearly</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl text-gray-900">$49.99</span>
                <span className="text-gray-500 line-through">$99.99</span>
              </div>
              <p className="text-sm text-gray-600">$4.17 per month • Save 50%</p>
            </div>
          </button>

          <button className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-200">
            <div className="text-left">
              <h3 className="text-xl text-gray-900 mb-1">Monthly</h3>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl text-gray-900">$9.99</span>
              </div>
              <p className="text-sm text-gray-600">Billed monthly</p>
            </div>
          </button>
        </div>

        <div className="space-y-3">
          <PrimaryButton>
            Start 7-day free trial
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate('/home')}>
            Continue with free plan
          </SecondaryButton>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Free trial includes full access. Cancel anytime. After trial, you'll be charged the selected plan price unless cancelled.
        </p>
      </div>
    </div>
  );
}
