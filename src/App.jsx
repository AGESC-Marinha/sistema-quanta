import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, MapPin, Users, DollarSign, Trash2, LayoutDashboard, Settings, Loader2, AlertCircle, PlusCircle } from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nome: '', endereco: '', qtd_pnr: '', qtd_civis: '', despesa_estimada: '' });

  useEffect(() => { fetchCondominios(); }, []);

  async function fetchCondominios() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('condominios').select('*').order('nome');
      if (error) throw error;
      setCondominios(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { error } = await supabase.from('condominios').insert([{
        nome: form.nome,
        endereco: form.endereco,
        qtd_pnr: Number(form.qtd_pnr),
        qtd_civis: Number(form.qtd_civis),
        despesa_estimada: Number(form.despesa_estimada)
      }]);
      if (error) throw error;
      setForm({ nome: '', endereco: '', qtd_pnr: '', qtd_civis: '', despesa_estimada: '' });
      fetchCondominios();
      alert('Cadastrado com sucesso!');
    } catch (err) {
      alert('Erro ao cadastrar: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Excluir este condomínio?')) return;
    try {
      const { error } = await supabase.from('condominios').delete().eq('id', id);
      if (error) throw error;
      fetchCondominios();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  const calcularTaxa = (item) => {
    const totalMoradores = (item.qtd_pnr || 0) + (item.qtd_civis || 0);
    if (totalMoradores === 0) return 0;
    return (item.despesa_estimada / totalMoradores) / 0.905;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-900 text-white p-6 shadow-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg"><Building2 size={32} /></div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">SISTEMA QUANTA</h1>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-widest">Gestão AGESC - Módulo 1</p>
            </div>
          </div>
          <nav className="flex gap-2 bg-blue-800/50 p-1 rounded-xl border border-white/10">
            <button onClick={() => setActiveTab('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-white/10'}`}><LayoutDashboard size={18}/> Dashboard</button>
            <button onClick={() => setActiveTab('gerenciar')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition ${activeTab === 'gerenciar' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-white/10'}`}><Settings size={18}/> Gerenciar</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-900"><Loader2 className="animate-spin mb-4" size={64} /><p className="font-bold">Sincronizando com AGESC...</p></div>
        ) : activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {condominios.map(c => (
              <div key={c.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-300 group">
                <div className="bg-blue-900 p-6 text-white group-hover:bg-blue-800 transition-colors">
                  <h3 className="font-black text-xl leading-tight mb-1">{c.nome}</h3>
                  <p className="text-blue-200 text-sm flex items-center gap-1 opacity-80"><MapPin size={14}/> {c.endereco || 'Brasília, DF'}</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Permissionários (PNR)</p>
                      <p className="text-2xl font-black text-slate-700">{c.qtd_pnr}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Civis</p>
                      <p className="text-2xl font-black text-slate-700">{c.qtd_civis}</p>
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Taxa Unitária (Divisor 0,905)</p>
                      <p className="text-3xl font-black text-emerald-700">R$ {calcularTaxa(c).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-200"><DollarSign size={24} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-900"><PlusCircle size={24}/> NOVO CADASTRO</h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Nome do Condomínio</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required /></div>
                <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Endereço Completo</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} /></div>
                <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd PNR</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.qtd_pnr} onChange={e => setForm({...form, qtd_pnr: e.target.value})} required /></div>
                <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd Civis</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.qtd_civis} onChange={e => setForm({...form, qtd_civis: e.target.value})} required /></div>
                <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Despesa Estimada (Valor Base)</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500 text-2xl font-black text-blue-900" value={form.despesa_estimada} onChange={e => setForm({...form, despesa_estimada: e.target.value})} required /></div>
                <button className="md:col-span-2 bg-blue-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-blue-800 shadow-xl shadow-blue-100 transition-all active:scale-95">SALVAR CONDOMÍNIO</button>
              </form>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Condomínios Ativos</h2><span className="bg-blue-900 text-white px-3 py-1 rounded-full text-xs font-black">{condominios.length}</span></div>
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-100">
                  {condominios.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors"><td className="p-6 font-bold text-slate-700">{c.nome}</td><td className="p-6 text-right"><button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
