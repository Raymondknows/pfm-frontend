'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, AlertCircle, Plus } from 'lucide-react';

type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'REVIEWING' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';

interface Report {
  id: string;
  title: string;
  description: string;
  status: ReportStatus;
  submittedAt: string | null;
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

export default function ReportList() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('pfm.accessToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
        const url = statusFilter
          ? `${apiUrl}/v1/reports?status=${statusFilter}`
          : `${apiUrl}/v1/reports`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          router.push('/login');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch reports');
        }

        const data = await response.json();
        setReports(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [statusFilter, router]);

  if (loading) return <div className="p-4">Loading reports...</div>;

  return (
    <div className="p-4 md:p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Field Reports</h1>
          <p className="text-gray-600 mt-1">Manage and track field reports from your coordinators</p>
        </div>
        <Link
          href="/reports/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Submit Report</span>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2">
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReportStatus | '')}
            className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
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

      {/* Reports Grid */}
      <div className="space-y-3">
        {reports.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No reports found</p>
          </div>
        ) : (
          reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <div className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{report.description}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-4 ${statusColors[report.status]}`}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                  {report.pollingUnit && <span>📍 {report.pollingUnit.name}</span>}
                  {report.ward && <span>📍 {report.ward.name}</span>}
                  {report.localGovernment && <span>📍 {report.localGovernment.name}</span>}
                  {report.state && <span>📍 {report.state.name}</span>}
                  {report.submittedAt && (
                    <span>📅 {new Date(report.submittedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
