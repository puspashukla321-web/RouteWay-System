'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function FeedbackPage() {
  const router = useRouter();
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    userName: '',
    userEmail: '',
    userContact: '',
    fromStop: '',
    toStop: '',
    routeId: '',
    message: '',
  });

  useEffect(() => {
    const fetchStops = async () => {
      try {
        const data = await api.getStops();
        setStops(data.stops || []);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch stops:', err);
        setError('Failed to load stops');
        setLoading(false);
      }
    };

    fetchStops();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.userName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!formData.userEmail.trim()) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.userEmail.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.message.trim()) {
      setError('Please enter your feedback message');
      return;
    }

    setSubmitting(true);

    try {
      await api.sendFeedback({
        userName: formData.userName.trim(),
        userEmail: formData.userEmail.trim(),
        userContact: formData.userContact.trim() || null,
        routeId: formData.routeId || null,
        fromStop: formData.fromStop || null,
        toStop: formData.toStop || null,
        message: formData.message.trim(),
      });

      setSubmitted(true);
      setFormData({
        userName: '',
        userEmail: '',
        userContact: '',
        fromStop: '',
        toStop: '',
        routeId: '',
        message: '',
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📝 Send us your feedback</h1>
          <p className="text-gray-600">
            Help us improve RouteWay. Share your thoughts, report issues, or suggest new features. 
            We'd love to hear from you!
          </p>
        </div>

        {/* Feedback Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {submitted && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-xl">✓</span>
                <div>
                  <strong>Thank you!</strong>
                  <p className="text-sm">Your feedback has been received. We'll contact you if we need more details.</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <span className="text-xl">⚠</span>
                <p>{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Information Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Your Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    id="userName"
                    name="userName"
                    type="text"
                    value={formData.userName}
                    onChange={handleChange}
                    placeholder="e.g., John Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">So we know who to contact if needed</p>
                </div>

                <div>
                  <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    id="userEmail"
                    name="userEmail"
                    type="email"
                    value={formData.userEmail}
                    onChange={handleChange}
                    placeholder="e.g., john@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">We'll only contact you about your feedback</p>
                </div>

                <div>
                  <label htmlFor="userContact" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (Optional)
                  </label>
                  <input
                    id="userContact"
                    name="userContact"
                    type="tel"
                    value={formData.userContact}
                    onChange={handleChange}
                    placeholder="e.g., +977-9841234567"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optional - helps us reach you faster</p>
                </div>
              </div>
            </div>

            {/* Route Context Section */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🚌 Route Information (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                This helps us understand your feedback better
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="fromStop" className="block text-sm font-medium text-gray-700 mb-2">
                    From Stop
                  </label>
                  <select
                    id="fromStop"
                    name="fromStop"
                    value={formData.fromStop}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a stop (optional)</option>
                    {stops.map((stop) => (
                      <option key={stop.id} value={stop.name}>
                        {stop.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="toStop" className="block text-sm font-medium text-gray-700 mb-2">
                    To Stop
                  </label>
                  <select
                    id="toStop"
                    name="toStop"
                    value={formData.toStop}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a stop (optional)</option>
                    {stops.map((stop) => (
                      <option key={stop.id} value={stop.name}>
                        {stop.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="routeId" className="block text-sm font-medium text-gray-700 mb-2">
                  Route Number (If you know it)
                </label>
                <input
                  id="routeId"
                  name="routeId"
                  type="number"
                  value={formData.routeId}
                  onChange={handleChange}
                  placeholder="e.g., 1, 2, 3..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Feedback Message Section */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💭 Your Feedback</h3>

              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Tell us what's on your mind *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Share your feedback here. Examples:
• The fare for Route 1 is incorrect - I paid ₹35 but the app shows ₹30
• Bus timing information is inaccurate
• There should be a route from Kalanki to Pashupati
• The GPS tracking is not updating
• I love the app! Please add booking feature
• The dark mode makes it hard to read"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-vertical min-h-[180px]"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                Be specific and detailed so we can help you better
              </p>
            </div>

            {/* Feedback Categories Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">📌 Types of feedback we review:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-purple-800">
                <div>✓ Incorrect fares</div>
                <div>✓ Wrong timings</div>
                <div>✓ Missing routes</div>
                <div>✓ GPS issues</div>
                <div>✓ Feature requests</div>
                <div>✓ General praise</div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={!formData.userName.trim() || !formData.userEmail.trim() || !formData.message.trim() || submitted || submitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : submitted ? 'Submitted ✓' : 'Submit Feedback'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Privacy Notice */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">🔒 Privacy Notice</h4>
            <p className="text-sm text-gray-600">
              Your name, email, and phone will only be used to contact you about your feedback. 
              We never share your information with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
