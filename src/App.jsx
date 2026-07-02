import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2, MapPin, Users, DollarSign, Trash2, 
  LayoutDashboard, Settings, Loader2, PlusCircle, Pencil, XCircle,
  CreditCard, Flame, ArrowUpCircle, ExternalLink, X,
  FileText, Calendar, Percent, Link2, ChevronDown, ChevronRight, 
  TrendingDown, Info, CheckCircle2, AlertTriangle, ShieldCheck, Globe
} from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

const BOLETO_FEE = 3.00;
const AGESC_FEE_RATE = 0.045;
const FUNDO_RESERVA_RATE = 0.05;

const INITIAL_FORM = {
  nome: '', endereco: '', cnpj: '', dados_bancarios: '', 
  saldo_fundo_reserva: '', projetos_incendio: '', 
  possui_elevadores: false, qtd_elevadores: '', 
  elevadores_operacao: '', elevadores_manutencao: '',
  empresa_elevadores: '', status_manutencao: '',
  qtd_pnr: '', qtd_civis: '', despesa_estimada: ''
};

const INITIAL_CONTRACT_FORM = {
  numero_contrato: '',
  empresa_contratada: '',
  valor_mensal: '',
  tem_aditivo: false,
  aditivo_descricao: '',
  aditivo_valor: '',
  prazo_inicio: '',
  prazo_fim: '',
  link_pdf: '',
  allocations: []
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [rateios, setRateios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCondo, setSelectedCondo] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [contractForm, setContractForm] = useState(INITIAL_CONTRACT_FORM);
  const [editingContractId, setEditingContractId] = useState(null);
  const [savingContract, setSavingContract] = useState(false);
  const [expandedContract, setExpandedContract] = useState(null);

  useEffect(() => {
    fetchCondominios();
    fetchContratos();
    fetchRateios();
  }, []);

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

  async function fetchContratos() {
    try {
      const { data, error } = await supabase.from('contratos').select('*').order('numero_contrato');
      if (error) throw error;
      setContratos(data || []);
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
    }
  }

  async function fetchRateios() {
    try {
      const { data, error } = await supabase.from('rateios').select('*');
      if (error) throw error;
      setRateios(data || []);
    } catch (err) {
      console.error('Erro ao buscar rateios:', err);
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

  async function handleContractSubmit(e) {
    e.preventDefault();
    setSavingContract(true);
    const payload = {
      numero_contrato: contractForm.numero_contrato,
      empresa_contratada: contractForm.empresa_contratada,
      valor_mensal: Number(contractForm.valor_mensal) || 0,
      tem_aditivo: contractForm.tem_aditivo,
      aditivo_descricao: contractForm.aditivo_descricao,
      aditivo_valor: Number(contractForm.aditivo_valor) || 0,
      prazo_inicio: contractForm.prazo_inicio,
      prazo_fim: contractForm.prazo_fim,
      link_pdf: contractForm.link_pdf
    };

    try {
      let contractId = editingContractId;
      if (editingContractId) {
        const { error } = await supabase.from('contratos').update(payload).eq('id', editingContractId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('contratos').insert([payload]).select();
        if (error) throw error;
        contractId = data[0].id;
      }

      // Update Allocations (Rateios)
      await supabase.from('rateios').delete().eq('contrato_id', contractId);
      if (contractForm.allocations.length > 0) {
        const toInsert = contractForm.allocations.map(a => ({
          contrato_id: contractId,
          condominio_id: a.condominio_id || null,
          is_agesc: a.is_agesc || false,
          is_all_condos: a.is_all_condos || false,
          valor: Number(a.valor) || 0
        }));
        const { error: rateioError } = await supabase.from('rateios').insert(toInsert);
        if (rateioError) throw rateioError;
      }

      alert('Contrato e rateios salvos com sucesso!');
      setContractForm(INITIAL_CONTRACT_FORM);
      setEditingContractId(null);
      fetchContratos();
      fetchRateios();
    } catch (err) {
      alert('Erro ao salvar contrato: ' + err.message);
    } finally {
      setSavingContract(false);
    }
  }

  async function handleEditContract(c) {
    setEditingContractId(c.id);
    const { data: allocationsData } = await supabase.from('rateios').select('*').eq('contrato_id', c.id);
    
    setContractForm({
      numero_contrato: c.numero_contrato || '',
      empresa_contratada: c.empresa_contratada || '',
      valor_mensal: c.valor_mensal?.toString() || '',
      tem_aditivo: c.tem_aditivo || false,
      aditivo_descricao: c.aditivo_descricao || '',
      aditivo_valor: c.aditivo_valor?.toString() || '',
      prazo_inicio: c.prazo_inicio || '',
      prazo_fim: c.prazo_fim || '',
      link_pdf: c.link_pdf || '',
      allocations: allocationsData || []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteContract(id) {
    if (!confirm('Tem certeza que deseja excluir este contrato? Os rateios vinculados também serão removidos.')) return;
    try {
      await supabase.from('rateios').delete().eq('contrato_id', id);
      const { error } = await supabase.from('contratos').delete().eq('id', id);
      if (error) throw error;
      fetchContratos();
      fetchRateios();
      alert('Contrato excluído com sucesso!');
    } catch (err) {
      alert('Erro ao excluir contrato: ' + err.message);
    }
  }

  const toggleAllocation = (type, id = null) => {
    let newAllocations = [...contractForm.allocations];
    const index = newAllocations.findIndex(a => 
      type === 'condo' ? a.condominio_id === id : 
      type === 'agesc' ? a.is_agesc : a.is_all_condos
    );

    if (index > -1) {
      newAllocations.splice(index, 1);
    } else {
      newAllocations.push({
        condominio_id: id,
        is_agesc: type === 'agesc',
        is_all_condos: type === 'all',
        valor: ''
      });
    }
    setContractForm({ ...contractForm, allocations: newAllocations });
  };

  const updateAllocationValue = (type, val, id = null) => {
    let newAllocations = [...contractForm.allocations];
    const index = newAllocations.findIndex(a => 
      type === 'condo' ? a.condominio_id === id : 
      type === 'agesc' ? a.is_agesc : a.is_all_condos
    );
    if (index > -1) {
      newAllocations[index].valor = val;
      setContractForm({ ...contractForm, allocations: newAllocations });
    }
  };

  const isAllocated = (type, id = null) => {
    return contractForm.allocations.some(a => 
      type === 'condo' ? a.condominio_id === id : 
      type === 'agesc' ? a.is_agesc : a.is_all_condos
    );
  };

  const getAllocationValue = (type, id = null) => {
    const found = contractForm.allocations.find(a => 
      type === 'condo' ? a.condominio_id === id : 
      type === 'agesc' ? a.is_agesc : a.is_all_condos
    );
    return found ? found.valor : '';
  };

  const calcularTaxa = (c) => {
    const total = (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0);
    if (total === 0) return 0;
    return (Number(c.despesa_estimada) / total) / 0.905;
  };

  const calcularReceita = (c) => {
    const total = (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0);
    return calcularTaxa(c) * total;
  };

  const calcularDeducoesContratos = (condominioId) => {
    const direct = rateios
      .filter(r => r.condominio_id === condominioId)
      .reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
    
    const shared = rateios
      .filter(r => r.is_all_condos)
      .reduce((sum, r) => sum + ((Number(r.valor) || 0) / (condominios.length || 1)), 0);

    return direct + shared;
  };

  const calcularAGESC = (c) => calcularReceita(c) * AGESC_FEE_RATE;
  const calcularFundoReserva = (c) => calcularReceita(c) * FUNDO_RESERVA_RATE;

  const calcularValorLiquido = (c) => {
    const receita = calcularReceita(c);
    const agesc = calcularAGESC(c);
    const deducoes = calcularDeducoesContratos(c.id);
    const boleto = BOLETO_FEE;
    return receita - agesc - deducoes + boleto;
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getValorTotalContrato = (c) => {
    return (Number(c.valor_mensal) || 0) + (c.tem_aditivo ? (Number(c.aditivo_valor) || 0) : 0);
  };

  const contractTotal = (Number(contractForm.valor_mensal) || 0) + (contractForm.tem_aditivo ? (Number(contractForm.aditivo_valor) || 0) : 0);
  const totalAllocated = contractForm.allocations.reduce((acc, cur) => acc + (Number(cur.valor) || 0), 0);
  const diff = contractTotal - totalAllocated;
  const isConferenceOk = Math.abs(diff) < 0.01;

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
          <button onClick={() => setActiveTab('contratos')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'contratos' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Contratos</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-blue-900" size={48} /></div> : (
          activeTab === 'dashboard' ? (
            <div>
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-sm text-blue-800 font-bold">
                  <TrendingDown size={16} className="inline mr-1" />
                  Valor Líquido de Repasse = Receita Bruta − Taxa AGESC (4,5%) − Deduções de Contratos (Rateio) + R$ 3,00 (Restituição Boleto - Cortesia)
                </p>
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><Info size={12}/> O Fundo de Reserva (5%) está incluso no montante total enviado ao condomínio.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {condominios.map(c => {
                  const liquido = calcularValorLiquido(c);
                  const receita = calcularReceita(c);
                  const agesc = calcularAGESC(c);
                  const fundo = calcularFundoReserva(c);
                  const deducoes = calcularDeducoesContratos(c.id);
                  const boleto = BOLETO_FEE;
                  return (
                    <div key={c.id} onClick={() => setSelectedCondo(c)} className="cursor-pointer bg-white rounded-3xl shadow-sm border p-6 hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-xl text-blue-900 group-hover:text-blue-600">{c.nome}</h3>
                        {c.possui_elevadores && <ArrowUpCircle className="text-orange-500" size={20} />}
                      </div>
                      <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><MapPin size={14}/> {c.endereco || 'Brasília, DF'}</p>
                      <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase">Taxa Unitária (0,905)</p>
                        <p className="text-2xl font-black text-emerald-700">R$ {formatCurrency(calcularTaxa(c))}</p>
                      </div>
                      <div className="mt-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-600 uppercase">Receita Bruta</p>
                        <p className="text-xl font-black text-blue-700">R$ {formatCurrency(receita)}</p>
                      </div>
                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        <div className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                          <span className="font-black text-amber-700">− Taxa AGESC (4,5%)</span>
                          <span className="font-bold text-amber-700">R$ {formatCurrency(agesc)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                          <span className="font-black text-slate-600">Fundo de Reserva (5%)</span>
                          <span className="font-bold text-slate-600">R$ {formatCurrency(fundo)} <span className="text-[9px] uppercase ml-1 opacity-70">[Incluso]</span></span>
                        </div>
                        <div className="flex justify-between"><span>− Deduções Contratos</span><span className="font-bold text-red-500">R$ {formatCurrency(deducoes)}</span></div>
                        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                          <span className="font-black text-emerald-700">+ Restituição Boleto (Cortesia)</span>
                          <span className="font-bold text-emerald-700">R$ {formatCurrency(boleto)}</span>
                        </div>
                      </div>
                      <div className="mt-3 p-4 bg-slate-900 rounded-2xl">
                        <p className="text-[10px] font-black text-white uppercase">Valor Líquido de Repasse</p>
                        <p className={`text-2xl font-black ${liquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {formatCurrency(liquido)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'contratos' ? (
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-900">
                  {editingContractId ? <Pencil size={24}/> : <PlusCircle size={24}/>}
                  {editingContractId ? 'EDITAR CONTRATO' : 'NOVO CONTRATO'}
                </h2>
                <form onSubmit={handleContractSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Nº Contrato</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.numero_contrato} onChange={e => setContractForm({...contractForm, numero_contrato: e.target.value})} required /></div>
                  <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Empresa Contratada</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.empresa_contratada} onChange={e => setContractForm({...contractForm, empresa_contratada: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Valor Mensal (R$)</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 font-bold text-blue-900" value={contractForm.valor_mensal} onChange={e => setContractForm({...contractForm, valor_mensal: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Prazo Início</label><input type="date" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.prazo_inicio} onChange={e => setContractForm({...contractForm, prazo_inicio: e.target.value})} /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Prazo Fim</label><input type="date" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.prazo_fim} onChange={e => setContractForm({...contractForm, prazo_fim: e.target.value})} /></div>
                  <div className="md:col-span-3"><label className="text-xs font-black text-slate-400 uppercase ml-1">Link PDF do Contrato</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.link_pdf} onChange={e => setContractForm({...contractForm, link_pdf: e.target.value})} placeholder="https://..." /></div>

                  <div className="md:col-span-3 flex items-center gap-3 p-4 bg-slate-100 rounded-xl">
                    <input type="checkbox" id="adit" checked={contractForm.tem_aditivo} onChange={e => setContractForm({...contractForm, tem_aditivo: e.target.checked})} className="w-5 h-5 text-blue-600" />
                    <label htmlFor="adit" className="font-bold text-blue-900">Possui Aditivo?</label>
                  </div>

                  {contractForm.tem_aditivo && (
                    <>
                      <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Descrição do Aditivo</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.aditivo_descricao} onChange={e => setContractForm({...contractForm, aditivo_descricao: e.target.value})} placeholder="Ex: Prorrogação de 12 meses" /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Valor Aditivo (R$)</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 font-bold text-blue-900" value={contractForm.aditivo_valor} onChange={e => setContractForm({...contractForm, aditivo_valor: e.target.value})} /></div>
                    </>
                  )}

                  <div className="md:col-span-3 border-t pt-6">
                    <h3 className="text-sm font-black text-slate-700 uppercase mb-4 flex items-center gap-2"><Percent size={18}/> Alocação de Rateio</h3>
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                      <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isAllocated('agesc') ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={isAllocated('agesc')} onChange={() => toggleAllocation('agesc')} className="w-5 h-5 text-blue-600" />
                          <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-blue-600" />
                            <span className="font-bold text-slate-700">AGESC (Associação)</span>
                          </div>
                        </div>
                        {isAllocated('agesc') && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Valor:</span>
                            <input type="number" step="0.01" className="w-32 bg-white border-none rounded-lg p-2 font-bold text-blue-900 shadow-sm" value={getAllocationValue('agesc')} onChange={e => updateAllocationValue('agesc', e.target.value)} placeholder="0,00" />
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isAllocated('all') ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={isAllocated('all')} onChange={() => toggleAllocation('all')} className="w-5 h-5 text-blue-600" />
                          <div className="flex items-center gap-2">
                            <Globe size={18} className="text-blue-600" />
                            <span className="font-bold text-slate-700">Todos os Condomínios</span>
                          </div>
                        </div>
                        {isAllocated('all') && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Valor:</span>
                            <input type="number" step="0.01" className="w-32 bg-white border-none rounded-lg p-2 font-bold text-blue-900 shadow-sm" value={getAllocationValue('all')} onChange={e => updateAllocationValue('all', e.target.value)} placeholder="0,00" />
                          </div>
                        )}
                      </div>

                      {condominios.map(cd => (
                        <div key={cd.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isAllocated('condo', cd.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100'}`}>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={isAllocated('condo', cd.id)} onChange={() => toggleAllocation('condo', cd.id)} className="w-5 h-5 text-blue-600" />
                            <div className="flex items-center gap-2">
                              <Building2 size={18} className="text-slate-400" />
                              <span className="font-bold text-slate-700">{cd.nome}</span>
                            </div>
                          </div>
                          {isAllocated('condo', cd.id) && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase">Valor:</span>
                              <input type="number" step="0.01" className="w-32 bg-white border-none rounded-lg p-2 font-bold text-blue-900 shadow-sm" value={getAllocationValue('condo', cd.id)} onChange={e => updateAllocationValue('condo', e.target.value, cd.id)} placeholder="0,00" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <div className={`p-6 rounded-3xl border-2 flex flex-col md:flex-row justify-between items-center gap-6 ${isConferenceOk ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${isConferenceOk ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                          {isConferenceOk ? <CheckCircle2 size={32}/> : <AlertTriangle size={32}/>}
                        </div>
                        <div>
                          <h4 className={`font-black text-lg ${isConferenceOk ? 'text-emerald-800' : 'text-red-800'}`}>Dashboard de Conferência</h4>
                          <p className={`text-sm font-bold ${isConferenceOk ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isConferenceOk ? 'Valores alocados perfeitamente!' : `Divergência de R$ ${formatCurrency(Math.abs(diff))}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-8">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Total Contrato</p>
                          <p className="text-xl font-black text-slate-700">R$ {formatCurrency(contractTotal)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Total Alocado</p>
                          <p className={`text-xl font-black ${isConferenceOk ? 'text-emerald-600' : 'text-red-600'}`}>R$ {formatCurrency(totalAllocated)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex gap-4">
                    <button disabled={savingContract} className="flex-1 bg-blue-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-blue-800 transition-all">
                      {savingContract ? <Loader2 className="animate-spin mx-auto" /> : (editingContractId ? 'SALVAR ALTERAÇÕES' : 'SALVAR CONTRATO')}
                    </button>
                    {editingContractId && <button type="button" onClick={() => {setEditingContractId(null); setContractForm(INITIAL_CONTRACT_FORM)}} className="bg-slate-200 text-slate-600 px-8 rounded-2xl font-black">CANCELAR</button>}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {contratos.map(ct => {
                  const isExpanded = expandedContract === ct.id;
                  const contractRateios = rateios.filter(r => r.contrato_id === ct.id);
                  return (
                    <div key={ct.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={20} className="text-blue-900" />
                              <h3 className="font-black text-lg text-blue-900">Contrato {ct.numero_contrato}</h3>
                              {ct.tem_aditivo && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-black uppercase">Aditivo</span>}
                            </div>
                            <p className="text-slate-600 font-bold text-sm">{ct.empresa_contratada}</p>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500">
                              <span className="flex items-center gap-1"><DollarSign size={14}/> Valor: <strong className="text-blue-900">R$ {formatCurrency(getValorTotalContrato(ct))}</strong></span>
                              {ct.prazo_inicio && <span className="flex items-center gap-1"><Calendar size={14}/> {ct.prazo_inicio} → {ct.prazo_fim || '—'}</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleEditContract(ct)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl transition-all"><Pencil size={20}/></button>
                            <button onClick={() => handleDeleteContract(ct.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                            <button onClick={() => setExpandedContract(isExpanded ? null : ct.id)} className="text-slate-400 p-2 hover:bg-slate-100 rounded-xl transition-all">
                              {isExpanded ? <ChevronDown size={20}/> : <ChevronRight size={20}/>}
                            </button>
                          </div>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50 p-6">
                          <h4 className="text-sm font-black text-slate-700 uppercase mb-4">Detalhamento de Rateio</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {contractRateios.map(r => (
                              <div key={r.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  {r.is_agesc ? <ShieldCheck size={16} className="text-blue-600"/> : r.is_all_condos ? <Globe size={16} className="text-blue-600"/> : <Building2 size={16} className="text-slate-400"/>}
                                  <span className="text-sm font-bold text-slate-700">
                                    {r.is_agesc ? 'AGESC' : r.is_all_condos ? 'Todos os Condomínios' : condominios.find(c => c.id === r.condominio_id)?.nome || 'Desconhecido'}
                                  </span>
                                </div>
                                <span className="font-black text-blue-900">R$ {formatCurrency(r.valor)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><Building2 /> {selectedCondo.nome}</h2>
              <button onClick={() => setSelectedCondo(null)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
            </div>
            <div className="p-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto custom-scrollbar">
              <div className="md:col-span-2 border-t pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Ficha Técnica Financeira</p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Receita Bruta</span><span className="font-bold text-blue-700">R$ {formatCurrency(calcularReceita(selectedCondo))}</span></div>
                  <div className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                    <span className="font-black text-amber-700">− Taxa AGESC (4,5%)</span>
                    <span className="font-bold text-amber-700">R$ {formatCurrency(calcularAGESC(selectedCondo))}</span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">− Deduções de Contratos</span><span className="font-bold text-red-500">R$ {formatCurrency(calcularDeducoesContratos(selectedCondo.id))}</span></div>
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                    <span className="font-black text-emerald-700">+ Restituição Boleto (Cortesia)</span>
                    <span className="font-bold text-emerald-700">R$ {formatCurrency(BOLETO_FEE)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2"><span className="font-black text-slate-700">Valor Líquido de Repasse</span><span className={`font-black ${calcularValorLiquido(selectedCondo) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>R$ {formatCurrency(calcularValorLiquido(selectedCondo))}</span></div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end shrink-0"><button onClick={() => setSelectedCondo(null)} className="bg-blue-900 text-white px-8 py-3 rounded-xl font-black">FECHAR</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
