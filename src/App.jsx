import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, MapPin, Users, Trash2, LayoutDashboard, Settings, Loader2, AlertCircle } from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ nome: '', endereco: '', qtd_pnr: '', qtd_civis: '', despesa_estimada: '' });

  useEffect(() => { fetchCondominios(); }, []);

  async function fetchCondominios() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: supaError } = await supabase.from('view_gestao_condominios').select('*').order('nome');
      if (supaError) throw supaError;
      setCondominios(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const { error: supaError } = await supabase.from('condominios').insert([{
        nome: form.nome,
        endereco: form.endereco,
        qtd_pnr: Number(form.qtd_pnr),
        qtd_civis: Number(form.qtd_civis),
        despesa_estimada: Number(form.despesa_estimada)
      }]);
      if (supaError) throw supaError;
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
      const { error: supaError } = await supabase.from('condominios').delete().eq('id', id);
      if (supaError) throw supaError;
      fetchCondominios();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  if (error) return (
    <div className="p-10 text-center">
      <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
      <h1 className="text-xl font-bold">Erro de Conexão</h1>
      <p className="text-gray-600">{error}</p>
      <button onClick={() => window.location.reload()} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Tentar Novamente</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-indigo-800 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold flex items-center gap-2"><Building2 size={24}/> Sistema Quanta</h1>
          <nav className="flex gap-2">
            <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-md flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-white text-indigo-800' : 'hover:bg-indigo-700'}`}><LayoutDashboard size={18}/> Dashboard</button>
            <button onClick={() => setActiveTab('gerenciar')} className={`px-4 py-2 rounded-md flex items-center gap-2 ${activeTab === 'gerenciar' ? 'bg-white text-indigo-800' : 'hover:bg-indigo-700'}`}><Settings size={18}/> Gerenciar</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center p-20"><Loader2 className="animate-spin text-indigo-600 mb-4" size={48} /><p>Carregando dados...</p></div>
        ) : activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {condominios.map(c => (
              <div key={c.id} className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-indigo-500">
                <h3 className="font-bold text-lg mb-2">{c.nome}</h3>
                <p className="text-sm text-slate-500 mb-4 flex items-center gap-1"><MapPin size={14}/> {c.endereco || 'Brasília, DF'}</p>
                <div className="flex justify-between text-sm bg-slate-50 p-3 rounded-lg">
                  <span>PNR: <strong>{c.qtd_pnr}</strong></span>
                  <span>Civis: <strong>{c.qtd_civis}</strong></span>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Taxa Unitária</span>
                  <span className="text-xl font-black text-emerald-600">R$ {Number(c.taxa_unitaria || 0).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Nome" className="border p-2 rounded" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
              <input placeholder="Endereço" className="border p-2 rounded" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
              <input type="number" placeholder="Qtd PNR" className="border p-2 rounded" value={form.qtd_pnr} onChange={e => setForm({...form, qtd_pnr: e.target.value})} required />
              <input type="number" placeholder="Qtd Civis" className="border p-2 rounded" value={form.qtd_civis} onChange={e => setForm({...form, qtd_civis: e.target.value})} required />
              <input type="number" step="0.01" placeholder="Despesa Estimada" className="border p-2 rounded md:col-span-2" value={form.despesa_estimada} onChange={e => setForm({...form, despesa_estimada: e.target.value})} required />
              <button className="bg-indigo-600 text-white p-2 rounded font-bold hover:bg-indigo-700 md:col-span-2">Cadastrar Condomínio</button>
            </form>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-sm uppercase"><tr><th className="p-4">Nome</th><th className="p-4 text-right">Ação</th></tr></thead>
                <tbody className="divide-y">
                  {condominios.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50"><td className="p-4 font-medium">{c.nome}</td><td className="p-4 text-right"><button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={18}/></button></td></tr>
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
