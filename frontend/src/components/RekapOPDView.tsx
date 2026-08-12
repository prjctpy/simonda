import React, { useState } from 'react';
import { RekapOPD, InovasiRingkas } from '../types';
import { Search, ChevronRight } from 'lucide-react';

interface RekapOPDViewProps {
  rekapList: RekapOPD[];
  inovasiList: InovasiRingkas[];
  onSelectInovasi: (id: number) => void;
}

export const RekapOPDView: React.FC<RekapOPDViewProps> = ({ rekapList, inovasiList, onSelectInovasi }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOpd, setSelectedOpd] = useState<RekapOPD | null>(null);

  const opdInovasiList = selectedOpd
    ? inovasiList.filter((i) => i.opd.id === selectedOpd.opd.id)
    : [];

  const filteredList = rekapList.filter(
    (item) =>
      item.opd.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.opd.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.opd.singkatan && item.opd.singkatan.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Rekapitulasi Inovasi Per OPD</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluasi keikutsertaan dan tingkat pemenuhan indikator kematangan inovasi tiap Perangkat Daerah Rote Ndao.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari OPD..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* OPD Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Nama Perangkat Daerah (OPD)</th>
                <th className="py-3.5 px-4 text-center">Total Inovasi</th>
                <th className="py-3.5 px-4 text-center">Terverifikasi</th>
                <th className="py-3.5 px-4 text-center">Layak IGA</th>
                <th className="py-3.5 px-4 text-right">Rata Kematangan (SID)</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.map((row) => (
                <tr key={row.opd.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{row.opd.nama}</div>
                    <div className="text-[11px] text-slate-400">Kode: {row.opd.kode}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                    {row.jumlah}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                      {row.terverifikasi}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-800">
                      {row.layak}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 text-sm">
                    {row.rata_skor_terverifikasi.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => setSelectedOpd(row)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs"
                    >
                      Rincian Inovasi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPD Innovation List Modal Drawer */}
      {selectedOpd && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selectedOpd.opd.nama}</h3>
                <p className="text-xs text-slate-500">
                  Daftar {opdInovasiList.length} inovasi yang dilaporkan OPD ini.
                </p>
              </div>
              <button
                onClick={() => setSelectedOpd(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {opdInovasiList.length === 0 ? (
                <div className="p-8 text-center text-slate-400">Belum ada inovasi yang dilaporkan.</div>
              ) : (
                opdInovasiList.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => {
                      setSelectedOpd(null);
                      onSelectInovasi(inv.id);
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 cursor-pointer transition flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{inv.nama}</div>
                      <div className="text-[11px] text-slate-500 flex items-center space-x-2 mt-1">
                        <span>{inv.urusan}</span> &bull; 
                        <span className="capitalize">{inv.tahapan.replace('_', ' ')}</span> &bull; 
                        <span>Skor Verifikasi: <b>{inv.skor_terverifikasi}</b></span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t">
              <button
                onClick={() => setSelectedOpd(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
