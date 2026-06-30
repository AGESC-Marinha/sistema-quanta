import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, MapPin, Users, DollarSign, Trash2, 
  LayoutDashboard, Settings, Loader2, PlusCircle, Pencil, XCircle 
} from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
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
    const payload = {
      nome: form.nome,
      endereco: form.endereco,
      qtd_pnr: Number(form.qtd_pnr),
      qtd_civis: Number(form.qtd_civis),
      despesa_estimada: Number(form.despesa_estimada)
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('condominios').update(payload).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
        alert('Atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('condominios').insert([payload]);
        if (error) throw error;
        alert('Cadastrado com sucesso!');
      }
      setForm({ nome: '', endereco: '', qtd_pnr: '', qtd_civis: '', despesa_estimada: '' });
      await fetchCondominios();
    } catch (err) {
      alert('Erro: ' + err.message);
    }
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({ nome: c.nome, endereco: c.endereco || '', qtd_pnr: c.qtd_pnr, qtd_civis: c.qtd_civis, despesa_estimada: c.despesa_estimada });
    setActiveTab('gerenciar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const calcularTaxa = (c) => {
    const total = (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0);
    if (total === 0) return 0;
    return (Number(c.despesa_estimada) / total) / 0.905;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-900 text-white p-6 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Building2 size={32} />
          <h1 className="text-2xl font-black">SISTEMA QUANTA</h1>
        </div>
        <nav className="flex gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('gerenciar')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'gerenciar' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-white/10'}`}>Gerenciar</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto" size={48} /></div> : (
          activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {condominios.map(c => (
                <div key={c.id} className="bg-white rounded-3xl shadow-sm border p-6 hover:shadow-xl transition-all">
                  <h3 className="font-black text-xl text-blue-900">{c.nome}</h3>
                  <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><MapPin size={14}/> {c.endereco || 'Brasília, DF'}</p>
                  <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase">Taxa Unitária (0,905)</p>
                    <p className="text-3xl font-black text-emerald-700">R$ {calcularTaxa(c).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-900">
                  {editingId ? <Pencil size={24}/> : <PlusCircle size={24}/>} 
                  {editingId ? 'EDITAR CONDOMÍNIO' : 'NOVO CADASTRO'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Nome do Condomínio</label>
                    <input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Endereço Completo</label>
                    <input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd PNR</label>
                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.qtd_pnr} onChange={e => setForm({...form, qtd_pnr: e.target.value})} required />
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd Civis</label>
                    <input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500" value={form.qtd_civis} onChange={e => setForm({...form, qtd_civis: e.target.value})} required />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Despesa Estimada (Valor Base)</label>
                    <input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 focus:ring-2 focus:ring-blue-500 text-2xl font-black text-blue-900" value={form.despesa_estimada} onChange={e => setForm({...form, despesa_estimada: e.target.value})} required />
                  </div>
                  <div className="md:col-span-2 flex gap-4">
                    <button className="flex-1 bg-blue-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-blue-800 shadow-xl shadow-blue-100 transition-all active:scale-95">
                      {editingId ? 'SALVAR ALTERAÇÕES' : 'SALVAR CONDOMÍNIO'}
                    </button>
                    {editingId && (
                      <button type="button" onClick={() => {setEditingId(null); setForm({nome:'',endereco:'',qtd_pnr:'',qtd_civis:'',despesa_estimada:''})}} className="bg-slate-200 text-slate-600 px-8 rounded-2xl font-black hover:bg-slate-300 transition-all">CANCELAR</button>
                    )}
                  </div>
                </form>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center"><h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">Condomínios Ativos</h2><span className="bg-blue-900 text-white px-3 py-1 rounded-full text-xs font-black">{condominios.length}</span></div>
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-100">
                    {condominios.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-bold text-slate-700">{c.nome}</td>
                        <td className="p-6 text-right flex justify-end gap-2">
                          <button onClick={() => handleEdit(c)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all" title="Editar"><Pencil size={20}/></button>
                          <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('condominios').delete().eq('id', c.id); fetchCondominios(); } }} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-all" title="Excluir"><Trash2 size={20}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>
    </div>
  );
}
