'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, AlertCircle, ChevronDown } from 'lucide-react';

type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

interface Report {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  submittedAt: string | null;
  notes: string | null;
  submittedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    user?: {
      email: string;
    };
  } | null;
  state?: { name: string } | null;
  localGovernment?: { name: string } | null;
  ward?: { name: string } | null;
  pollingUnit?: { name: string } | null;
}

const statusColors: Record<ReportStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-blue-100 text-blue-800',
  REVIEWING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-300 text-gray-700',
};

export default function ReportDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<ReportStatus | ''>('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('pfm.accessToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
        const response = await fetch(`${apiUrl}/v1/reports/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch report');
        }

        const data = await response.json();
        setReport(data);
        setNewStatus(data.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id, router]);

  const handleStatusChange = async () => {
    if (!report || !newStatus || newStatus === report.status) return;

    setUpdating(true);
    setError('');

    try {
      const token = localStorage.getItem('pfm.accessToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

      const response = await fetch(`${apiUrl}/v1/reports/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update report status');
      }

      const updatedReport = await response.json();
      setReport(updatedReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setNewStatus(report.status);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-4">Loading report...</div>;
  if (!report) return <div className="p-4">Report not found</div>;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back to Reports
      </button>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>{error}</div>
        </div>
      )}

      {/* Report Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {report.pollingUnit && <span>📍 {report.pollingUnit.name}</span>}
              {report.ward && <span>📍 {report.ward.name}</span>}
              {report.localGovernment && <span>📍 {report.localGovernment.name}</span>}
              {report.state && <span>📍 {report.state.name}</span>}
              {report.submittedAt && (
                <span>📅 {new Date(report.submittedAt).toLocaleDateString()}</span>
              )}
            </div>
          </div>
          <span className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap ${statusColors[report.status]}`}>
            {report.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{report.description}</p>
          </div>

          {report.submittedBy && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Submitted By</h3>
              <p className="text-gray-600">
                {report.submittedBy.firstName} {report.submittedBy.lastName}
                {report.submittedBy.user?.email && (
                  <span className="text-gray-500"> ({report.submittedBy.user.email})</span>
                )}
              </p>
            </div>
          )}

          {report.notes && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Admin Notes</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{report.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Update */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Status
            </label>
            <div className="relative">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as ReportStatus | '')}
                disabled={updating}
                className="w-full appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white cursor-pointer disabled:opacity-50"
              >
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="REVIEWING">Reviewing</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ARCHIVED">Archived</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>
          <button
            onClick={handleStatusChange}
            disabled={updating || newStatus === report.status || !newStatus}
            className="primary-button"
          >
            {updating ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
