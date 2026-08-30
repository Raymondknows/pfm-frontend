'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ReportForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stateId: '',
    localGovernmentId: '',
    wardId: '',
    pollingUnitId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('pfm.accessToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
      const payload = {
        title: formData.title,
        description: formData.description,
        ...(formData.stateId && { stateId: formData.stateId }),
        ...(formData.localGovernmentId && { localGovernmentId: formData.localGovernmentId }),
        ...(formData.wardId && { wardId: formData.wardId }),
        ...(formData.pollingUnitId && { pollingUnitId: formData.pollingUnitId }),
      };

      const response = await fetch(`${apiUrl}/api/v1/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/reports');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted Successfully</h2>
          <p className="text-gray-600">Redirecting to reports list...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Submit Field Report</h1>
        <p className="text-gray-600 mt-1">Share observations and updates from the field</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="e.g., Polling Unit Status Update"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            placeholder="Provide detailed observations..."
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Note about scope */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          The report will be scoped to your current geographic authority. Geographic fields below are optional.
        </div>

        {/* Geographic scope fields (optional) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              State (Optional)
            </label>
            <input
              type="text"
              name="stateId"
              value={formData.stateId}
              onChange={handleChange}
              placeholder="State ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local Government (Optional)
            </label>
            <input
              type="text"
              name="localGovernmentId"
              value={formData.localGovernmentId}
              onChange={handleChange}
              placeholder="LGA ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ward (Optional)
            </label>
            <input
              type="text"
              name="wardId"
              value={formData.wardId}
              onChange={handleChange}
              placeholder="Ward ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 text-xs"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Polling Unit (Optional)
            </label>
            <input
              type="text"
              name="pollingUnitId"
              value={formData.pollingUnitId}
              onChange={handleChange}
              placeholder="Polling Unit ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-600 text-xs"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="primary-button"
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
