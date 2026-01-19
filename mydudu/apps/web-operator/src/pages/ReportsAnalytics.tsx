import { Download, FileSpreadsheet, FileText, TrendingUp } from 'lucide-react';
import { ReportChart } from '../components/ReportChart';
import { monthlyTrends, caseDistribution } from '../data/mockData';

export function ReportsAnalytics() {
  const handleExportExcel = () => {
    alert('Data akan diekspor ke format Excel (.xlsx)');
  };

  const handleExportPDF = () => {
    alert('Laporan akan diekspor ke format PDF');
  };

  const handleDownloadMonthly = () => {
    alert('Laporan bulanan lengkap akan diunduh');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Laporan & Analisis</h1>
          <p className="text-gray-600 text-[15px] mt-1">
            Visualisasi tren kesehatan dan statistik komunitas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportExcel}
            className="bg-green-600 text-white px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span className="font-semibold">Ekspor ke Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="gradient-primary text-white px-5 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <FileText className="w-5 h-5" />
            <span className="font-semibold">Ekspor ke PDF</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[14px] text-gray-600">Pertumbuhan Normal</p>
              <p className="text-[24px] font-bold text-green-600">84.5%</p>
              <p className="text-[12px] text-green-600">↑ 2.3% dari bulan lalu</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-[14px] text-gray-600">Kasus Stunting</p>
              <p className="text-[24px] font-bold text-red-600">5.2%</p>
              <p className="text-[12px] text-green-600">↓ 1.1% dari bulan lalu</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-[14px] text-gray-600">Gizi Kurang</p>
              <p className="text-[24px] font-bold text-orange-600">6.9%</p>
              <p className="text-[12px] text-green-600">↓ 0.8% dari bulan lalu</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportChart
          type="bar"
          data={monthlyTrends}
          title="Tren Status Gizi 7 Bulan Terakhir"
        />
        <ReportChart
          type="pie"
          data={caseDistribution}
          title="Distribusi Kasus Bulan Ini"
        />
      </div>

      {/* Weight & Height Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-[18px] font-bold mb-6">Rata-rata Berat Badan per Kelompok Usia</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">0-12 bulan</span>
              <span className="text-[15px] font-bold text-[#11998E]">8.2 kg</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full gradient-primary rounded-full" style={{ width: '65%' }} />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[15px] text-gray-700">13-24 bulan</span>
              <span className="text-[15px] font-bold text-[#11998E]">11.5 kg</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full gradient-primary rounded-full" style={{ width: '75%' }} />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[15px] text-gray-700">25-36 bulan</span>
              <span className="text-[15px] font-bold text-[#11998E]">13.8 kg</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full gradient-primary rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-[18px] font-bold mb-6">Rata-rata Tinggi Badan per Kelompok Usia</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-700">0-12 bulan</span>
              <span className="text-[15px] font-bold text-[#11998E]">72 cm</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full gradient-primary rounded-full" style={{ width: '70%' }} />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[15px] text-gray-700">13-24 bulan</span>
              <span className="text-[15px] font-bold text-[#11998E]">84 cm</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full gradient-primary rounded-full" style={{ width: '80%' }} />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[15px] text-gray-700">25-36 bulan</span>
              <span className="text-[15px] font-bold text-[#11998E]">92 cm</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="h-full gradient-primary rounded-full" style={{ width: '90%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Report Download */}
      <div className="bg-gradient-to-r from-[#11998E] to-[#38EF7D] rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[20px] font-bold mb-2">Laporan Bulanan Lengkap</h3>
            <p className="text-[15px] opacity-90">
              Unduh laporan komprehensif untuk diserahkan ke Puskesmas atau Dinas Kesehatan
            </p>
          </div>
          <button
            onClick={handleDownloadMonthly}
            className="bg-white text-[#11998E] px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-gray-100 transition-colors font-semibold"
          >
            <Download className="w-5 h-5" />
            Unduh Laporan
          </button>
        </div>
      </div>

      {/* Interactive Map Placeholder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-[18px] font-bold mb-4">Peta Sebaran Pemeriksaan</h3>
        <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-[15px] mb-2">
              Peta interaktif akan menampilkan lokasi pemeriksaan
            </p>
            <p className="text-gray-400 text-[13px]">
              Integrasi dengan Google Maps API diperlukan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
