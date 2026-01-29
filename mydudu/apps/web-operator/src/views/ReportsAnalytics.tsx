import { Download, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useSWR from 'swr';
import { fetchWithAuth } from '../lib/api';
import { OperatorReportsResponse } from '../types/operator';

export function ReportsAnalytics() {
  const { user } = useAuth();
  const { data, isLoading } = useSWR<OperatorReportsResponse>(
    user?.id ? `/operator/reports?userId=${user.id}` : null,
    fetchWithAuth,
  );

  const reports = data?.reports || [];
  const summary = data?.summary;

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Laporan</h1>
        <p className="text-gray-600 text-[15px] mt-1">
          Laporan pemeriksaan berbasis data yang telah tervalidasi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Total Laporan</p>
          <p className="text-[28px] font-bold text-[#11998E]">{summary?.totalReports || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Bulan Ini</p>
          <p className="text-[28px] font-bold text-blue-600">{summary?.reportsThisMonth || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Anak Terlapor</p>
          <p className="text-[28px] font-bold text-green-600">{summary?.uniqueChildren || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <p className="text-[14px] text-gray-600 mb-1">Laporan Terbaru</p>
          <p className="text-[20px] font-bold text-gray-700">{formatDate(summary?.latestReportAt || null)}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-100 p-6 text-gray-500">
          Memuat laporan...
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-[20px] font-bold">Daftar Laporan</h3>
            <span className="text-[13px] text-gray-500">{reports.length} laporan</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Tanggal</th>
                  <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Anak</th>
                  <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Posyandu</th>
                  <th className="px-6 py-4 text-left text-[15px] font-bold text-gray-700">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-[14px] text-gray-600">
                      {formatDate(report.generatedAt)}
                    </td>
                    <td className="px-6 py-4 text-[15px] font-semibold">
                      {report.childName || '-'}
                    </td>
                    <td className="px-6 py-4 text-[14px] text-gray-600">
                      {report.posyanduName || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (!report.fileUrl) return;
                          window.open(report.fileUrl, '_blank');
                        }}
                        className="px-4 py-2 text-[14px] font-semibold text-[#11998E] hover:bg-[#11998E] hover:text-white border-2 border-[#11998E] rounded-lg transition-colors flex items-center gap-2"
                        disabled={!report.fileUrl}
                      >
                        <Download className="w-4 h-4" />
                        Unduh
                      </button>
                    </td>
                  </tr>
                ))}
                {!reports.length && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                      Belum ada laporan yang tersedia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
        <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
        <p className="text-[14px] text-gray-700">
          Setiap laporan dibuat berdasarkan sesi pemeriksaan yang sudah tervalidasi. Jika file belum tersedia,
          tunggu proses generate selesai.
        </p>
      </div>
    </div>
  );
}
