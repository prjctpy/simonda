import React, { useState } from 'react';
import { AkunOPD, OPD } from '../types';
import { Search, Plus, X, KeyRound, UserCheck, UserX } from 'lucide-react';

interface KelolaAkunViewProps {
  akunList: AkunOPD[];
  opdList: OPD[];
  onCreate: (data: {
    username: string;
    password: string;
    nama_depan?: string;
    opd_id: number;
    nip?: string;
    telepon?: string;
  }) => Promise<void>;
  onNonaktifkan: (id: number) => Promise<void>;
  onAktifkan: (id: number) => Promise<void>;
  onResetSandi: (id: number, password: string) => Promise<void>;
}

export const KelolaAkunView: React.FC<KelolaAkunViewProps> = ({
  akunList,
  opdList,
  onCreate,
  onNonaktifkan,
  onAktifkan,
  onResetSandi,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<AkunOPD | null>(null);

  // Create form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [namaDepan, setNamaDepan] = useState('');
  const [opdId, setOpdId] = useState<number>(opdList[0]?.id || 0);
  const [nip, setNip] = useState('');
  const [telepon, setTelepon] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset password form state
  const [resetPassword, setResetPassword] = useState('');
  const [resetSaving, setResetSaving] = useState(false);

  const filteredList = akunList.filter(
    (a) =>
      a.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.opd.nama.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetCreateForm = () => {
    setUsername('');
    setPassword('');
    setNamaDepan('');
    setOpdId(opdList[0]?.id || 0);
    setNip('');
    setTelepon('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !opdId) {
      alert('Username, sandi, dan OPD wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      await onCreate({
        username: username.trim(),
        password,
        nama_depan: namaDepan,
        opd_id: opdId,
        nip,
        telepon,
      });
      resetCreateForm();
      setShowCreateModal(false);
    } catch (e: any) {
      alert(e.message || 'Gagal membuat akun OPD.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAktif = async (akun: AkunOPD) => {
    if (akun.is_active) {
      if (!confirm(`Nonaktifkan akun "${akun.username}"? Akun ini tidak akan bisa masuk lagi sampai diaktifkan ulang.`)) {
        return;
      }
      try {
        await onNonaktifkan(akun.id);
      } catch (e: any) {
        alert(e.message || 'Gagal menonaktifkan akun.');
      }
    } else {
      try {
        await onAktifkan(akun.id);
      } catch (e: any) {
        alert(e.message || 'Gagal mengaktifkan akun.');
      }
    }
  };

  const handleResetSandi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetSaving(true);
    try {
      await onResetSandi(resetTarget.id, resetPassword);
      setResetPassword('');
      setResetTarget(null);
      alert(`Sandi akun "${resetTarget.username}" berhasil diperbarui.`);
    } catch (e: any) {
      alert(e.message || 'Gagal mereset sandi akun.');
    } finally {
      setResetSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Header & New Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Kelola Akun OPD</h1>
          <p className="text-sm text-slate-500">
            {akunList.length} akun operator terdaftar. Verifikator membuatkan akun untuk tiap perangkat daerah.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Buat Akun Baru</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Cari username / nama / OPD..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Username</th>
                <th className="py-3.5 px-4">Nama</th>
                <th className="py-3.5 px-4">OPD</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredList.map((akun) => (
                <tr key={akun.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{akun.username}</td>
                  <td className="py-3 px-4 text-slate-700">{akun.nama}</td>
                  <td className="py-3 px-4 text-slate-700">{akun.opd.singkatan || akun.opd.kode}</td>
                  <td className="py-3 px-4 text-center">
                    {akun.is_active ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        Aktif
                      </span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-full font-bold bg-slate-200 text-slate-600">
                        Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setResetPassword('');
                          setResetTarget(akun);
                        }}
                        title="Reset Sandi"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleAktif(akun)}
                        title={akun.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        className={`p-1.5 rounded-lg ${
                          akun.is_active
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {akun.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    Tidak ada akun yang cocok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3 mb-5">
              <h2 className="text-lg font-bold text-slate-900">Buat Akun OPD Baru</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">OPD *</label>
                <select
                  value={opdId}
                  onChange={(e) => setOpdId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {opdList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.singkatan || o.kode} - {o.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sandi Awal *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-400">Minimal 10 karakter.</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={namaDepan}
                  onChange={(e) => setNamaDepan(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIP</label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. Telepon</label>
                  <input
                    type="text"
                    value={telepon}
                    onChange={(e) => setTelepon(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  {saving ? 'Menyimpan...' : 'Buat Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900">Reset Sandi: {resetTarget.username}</h2>
              <button onClick={() => setResetTarget(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetSandi} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sandi Baru</label>
                <input
                  type="password"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  required
                />
                <span className="text-[10px] text-slate-400">Minimal 10 karakter.</span>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetSaving}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow"
                >
                  {resetSaving ? 'Menyimpan...' : 'Simpan Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
