import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, MapPin, Users, DollarSign, Trash2, 
  LayoutDashboard, Settings, Loader2, PlusCircle, Pencil, XCircle,
  CreditCard, Flame, ArrowUpCircle, ExternalLink, X
} from 'lucide-react';

// CONFIGURAÇÃO BLINDADA (CHAVE REAL REESTABELECIDA)
const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

const INITIAL_FORM = {
  nome: '', endereco: '', cnpj: '', dados_bancarios: '', 
  saldo_fundo_reserva: '', projetos_incendio: '', 
  possui_elevadores: false, qtd_elevadores: '', 
  elevadores_operacao: '', elevadores_manutencao: '',
  empresa_elevadores: '', status_manutencao: '',
  qtd_pnr: '', qtd_civis: '', despesa_estimada: ''
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCondo, setSelectedCondo] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => { fetchCondominios(); }, []);

  async function fetchCondominios() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('condominios').select('*').order('nome');
      if (error) throw error;
      setCondominios(data || []);
    } catch (err) {
      alert('Erro de conexão: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      qtd_pnr: Number(form.qtd_pnr) || 0,
      qtd_civis: Number(form.qtd_civis) || 0,
      despesa_estimada: Number(form.despesa_estimada) || 0,
      saldo_fundo_reserva: Number(form.saldo_fundo_reserva) || 0,
      qtd_elevadores: Number(form.qtd_elevadores) || 0,
      elevadores_operacao: Number(form.elevadores_operacao) || 0,
      elevadores_manutencao: Number(form.elevadores_manutencao) || 0
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
      setForm(INITIAL_FORM);
      fetchCondominios();
      setActiveTab('dashboard');
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({ ...c });
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
          <button onClick={() => setActiveTab('gerenciar')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'gerenciar' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Gerenciar</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-900" size={48} /></div> : (
          activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {condominios.map(c => (
                <div key={c.id} onClick={() => setSelectedCondo(c)} className="cursor-pointer bg-white rounded-3xl shadow-sm border p-6 hover:shadow-xl transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-black text-xl text-blue-900 group-hover:text-blue-600">{c.nome}</h3>
                    {c.possui_elevadores && <ArrowUpCircle className="text-orange-500" size={20} />}
                  </div>
                  <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><MapPin size={14}/> {c.endereco || 'Brasília, DF'}</p>
                  <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase">Taxa Unitária (0,905)</p>
                    <p className="text-3xl font-black text-emerald-700">R$ {calcularTaxa(c).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">Clique para ver detalhes</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-900">
                  {editingId ? <Pencil size={24}/> : <PlusCircle size={24}/>} 
                  {editingId ? 'EDITAR CONDOMÍNIO' : 'NOVO CADASTRO'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Nome</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">CNPJ</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} /></div>
                  <div className="md:col-span-3"><label className="text-xs font-black text-slate-400 uppercase ml-1">Endereço</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} /></div>
                  
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd PNR</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.qtd_pnr} onChange={e => setForm({...form, qtd_pnr: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd Civis</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.qtd_civis} onChange={e => setForm({...form, qtd_civis: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Despesa Estimada</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 font-bold text-blue-900" value={form.despesa_estimada} onChange={e => setForm({...form, despesa_estimada: e.target.value})} required /></div>
                  
                  <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Dados Bancários</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.dados_bancarios} onChange={e => setForm({...form, dados_bancarios: e.target.value})} /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Saldo Fundo Reserva</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.saldo_fundo_reserva} onChange={e => setForm({...form, saldo_fundo_reserva: e.target.value})} /></div>
                  
                  <div className="md:col-span-3"><label className="text-xs font-black text-slate-400 uppercase ml-1">Projetos de Incêndio (Link)</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.projetos_incendio} onChange={e => setForm({...form, projetos_incendio: e.target.value})} placeholder="https://..." /></div>

                  <div className="md:col-span-3 flex items-center gap-3 p-4 bg-slate-100 rounded-xl">
                    <input type="checkbox" id="elev" checked={form.possui_elevadores} onChange={e => setForm({...form, possui_elevadores: e.target.checked})} className="w-5 h-5 text-blue-600" />
                    <label htmlFor="elev" className="font-bold text-blue-900">Possui Elevadores?</label>
                  </div>

                  {form.possui_elevadores && (
                    <>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd Total</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.qtd_elevadores} onChange={e => setForm({...form, qtd_elevadores: e.target.value})} /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Em Operação</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.elevadores_operacao} onChange={e => setForm({...form, elevadores_operacao: e.target.value})} /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Em Manutenção</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.elevadores_manutencao} onChange={e => setForm({...form, elevadores_manutencao: e.target.value})} /></div>
                      <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Empresa Responsável</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.empresa_elevadores} onChange={e => setForm({...form, empresa_elevadores: e.target.value})} /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Status Manutenção</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.status_manutencao} onChange={e => setForm({...form, status_manutencao: e.target.value})} placeholder="Ex: Em dia" /></div>
                    </>
                  )}

                  <div className="md:col-span-3 flex gap-4">
                    <button disabled={saving} className="flex-1 bg-blue-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-blue-800 transition-all">
                      {saving ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? 'SALVAR ALTERAÇÕES' : 'SALVAR CONDOMÍNIO')}
                    </button>
                    {editingId && <button type="button" onClick={() => {setEditingId(null); setForm(INITIAL_FORM)}} className="bg-slate-200 text-slate-600 px-8 rounded-2xl font-black">CANCELAR</button>}
                  </div>
                </form>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-100">
                    {condominios.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-bold text-slate-700">{c.nome}</td>
                        <td className="p-6 text-right flex justify-end gap-2">
                          <button onClick={() => handleEdit(c)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all"><Pencil size={20}/></button>
                          <button onClick={async () => { if(confirm('Excluir?')) { await supabase.from('condominios').delete().eq('id', c.id); fetchCondominios(); } }} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
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

      {selectedCondo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCondo(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-black flex items-center gap-2"><Building2 /> {selectedCondo.nome}</h2>
              <button onClick={() => setSelectedCondo(null)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><p className="text-[10px] font-black text-slate-400 uppercase">CNPJ</p><p className="font-bold">{selectedCondo.cnpj || '—'}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Endereço</p><p className="font-bold">{selectedCondo.endereco || '—'}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Dados Bancários</p><p className="font-bold">{selectedCondo.dados_bancarios || '—'}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Saldo Fundo Reserva</p><p className="font-bold text-emerald-600">R$ {Number(selectedCondo.saldo_fundo_reserva || 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p></div>
              <div className="md:col-span-2 border-t pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Elevadores</p>
                <p className="font-bold">{selectedCondo.possui_elevadores ? `Sim (${selectedCondo.qtd_elevadores} total) | Operação: ${selectedCondo.elevadores_operacao} | Manutenção: ${selectedCondo.elevadores_manutencao}` : 'Não possui'}</p>
                <p className="text-xs mt-1">Empresa: <span className="font-bold text-blue-600">{selectedCondo.empresa_elevadores || '—'}</span> | Status: <span className="font-bold text-blue-600">{selectedCondo.status_manutencao || '—'}</span></p>
              </div>
              <div className="md:col-span-2 border-t pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Projetos de Incêndio / Observações</p>
                <div className="bg-slate-50 p-4 rounded-xl text-sm">
                  {selectedCondo.projetos_incendio?.startsWith('http') ? (
                    <a href={selectedCondo.projetos_incendio} target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline flex items-center gap-1">Abrir Link Externo <ExternalLink size={14}/></a>
                  ) : (
                    <p>{selectedCondo.projetos_incendio || 'Nenhuma observação cadastrada.'}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end"><button onClick={() => setSelectedCondo(null)} className="bg-blue-900 text-white px-8 py-3 rounded-xl font-black">FECHAR</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
