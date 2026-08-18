import { ArrowLeft, MapPin, Phone, ExternalLink, Navigation } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function LocalHelp() {
  const navigate = useNavigate();

  const providers = [
    {
      name: 'City Sports Physiotherapy',
      type: 'Physiotherapy',
      distance: '0.8 miles',
      rating: '4.8',
      address: '123 Main Street',
      phone: '(555) 123-4567',
    },
    {
      name: 'Downtown Orthopedic Clinic',
      type: 'Orthopedic',
      distance: '1.2 miles',
      rating: '4.9',
      address: '456 Oak Avenue',
      phone: '(555) 234-5678',
    },
    {
      name: 'QuickCare Imaging Center',
      type: 'Imaging / X-ray',
      distance: '1.5 miles',
      rating: '4.7',
      address: '789 Pine Road',
      phone: '(555) 345-6789',
    },
    {
      name: 'MedSupply Plus',
      type: 'Braces & Supports',
      distance: '2.1 miles',
      rating: '4.6',
      address: '321 Elm Street',
      phone: '(555) 456-7890',
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-12">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/red-flags')}>
          <ArrowLeft className="w-6 h-6 text-gray-900" />
        </button>
        <h1 className="text-xl text-gray-900">Local Help</h1>
      </div>

      <div className="px-6 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">
            Find healthcare providers and services near you. Location services are currently disabled.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg mb-3 text-gray-900">Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Physiotherapists', 'Orthopedic clinics', 'Imaging centers', 'Medical supplies'].map((category) => (
              <button
                key={category}
                className="p-4 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all text-left"
              >
                <span className="text-sm text-gray-900">{category}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-lg mb-3 text-gray-900">Nearby providers</h2>
        </div>

        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.name} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-gray-900 mb-1">{provider.name}</h3>
                  <p className="text-sm text-gray-600">{provider.type}</p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-amber-500">★</span>
                  <span className="text-gray-700">{provider.rating}</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>{provider.address}</p>
                    <p className="text-blue-600">{provider.distance} away</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <p>{provider.phone}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm transition-all hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Directions
                </button>
                <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg text-sm transition-all hover:bg-gray-50 flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Website
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-5">
          <h3 className="text-red-900 mb-2">Emergency guidance</h3>
          <p className="text-sm text-red-800 mb-3">
            If you have severe pain, deformity, numbness, or signs of a blood clot, seek immediate medical attention or call emergency services.
          </p>
          <button className="w-full bg-red-600 text-white py-3 rounded-xl transition-all hover:bg-red-700">
            Call Emergency Services
          </button>
        </div>
      </div>
    </div>
  );
}
