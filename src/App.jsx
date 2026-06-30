import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2,
  MapPin,
  Users,
  DollarSign,
  Trash2,
  LayoutDashboard,
  Settings,
  Loader2,
  PlusCircle,
  Pencil,
  XCircle,
  CreditCard,
  Flame,
  ArrowUpCircle,
  ExternalLink,
  X,
} from 'lucide-react';

// =============================================================================
// CONFIGURAÇÃO FIXA DO SUPABASE (auto-contido, sem variáveis de ambiente)
// =============================================================================
const SUPABASE_URL = 'https://bjeklbralayvulcuqiqe.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';

let supabase = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { headers: { 'x-application-name': 'condo-admin' } },
  });
} catch (err) {
  console.error('Falha ao criar cliente Supabase:', err);
}

// =============================================================================
// MODELO / ESQUEMA PADRÃO
// =============================================================================
const EMPTY_FORM = {
  id: null,
  nome: '',
  endereco: '',
  cnpj: '',
  banco: '',
  agencia: '',
  conta: '',
  qtd_pnr: 0,
  qtd_civis: 0,
  despesa_estimada: 0,
  elevadores: '',
  incendio: '',
  responsavel: '',
  telefone: '',
  email: '',
};

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const calcularTaxa = (despesa, pnr, civis) => {
  const total = safeNumber(pnr) + safeNumber(civis);
  const base = safeNumber(despesa);
  if (total <= 0 || base <= 0) return 0;
  return base / total / 0.905;
};

const formatCurrency = (value) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatNumber = (value) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cnpjMask = (value) =>
  String(value || '')
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);

// =============================================================================
// COMPONENTE DE ERRO GLOBAL
// =============================================================================
function GlobalError({ error, onReset }) {
  if (!error) return null;
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border-l-8 border-red-600 p-8">
        <div className="flex items-center gap-3 text-red-700 mb-4">
          <XCircle className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Erro inesperado</h1>
        </div>
        <p className="text-slate-700 mb-4">
          O aplicativo encontrou uma falha de execução. Tente recarregar a página.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="bg-slate-100 p-4 rounded-lg text-xs text-slate-800 overflow-auto max-h-64">
            {error.stack || error.message || String(error)}
          </pre>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onReset}
            className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MODAL REUTILIZÁVEL
// =============================================================================
function Modal({ isOpen, onClose, title, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === ref.current || e.currentTarget === e.target) onClose();
      }}
      ref={ref}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <h3 className="text-lg font-bold text-blue-950">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-full hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// =============================================================================
// APP PRINCIPAL
// =============================================================================
export default function App() {
  // ---------------------------------------------------------------------------
  // ESTADOS GLOBAIS
  // ---------------------------------------------------------------------------
  const [runtimeError, setRuntimeError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [condominios, setCondominios] = useState([]);
  const [selectedCondominio, setSelectedCondominio] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [isEditing, setIsEditing] = useState(false);
  const [search, setSearch] = useState('');

  // ---------------------------------------------------------------------------
  // TOAST HELPER
  // ---------------------------------------------------------------------------
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ---------------------------------------------------------------------------
  // CARREGAMENTO INICIAL
  // ---------------------------------------------------------------------------
  const loadCondominios = async () => {
    setLoading(true);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      const { data, error } = await supabase
        .from('condominios')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      setCondominios(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao carregar condomínios:', err);
      showToast('Erro ao carregar dados. Modo offline ativado.', 'error');
      setCondominios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCondominios();
  }, []);

  // ---------------------------------------------------------------------------
  // FILTRO DE BUSCA
  // ---------------------------------------------------------------------------
  const filteredCondominios = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return condominios;
    return condominios.filter((c) =>
      String(c.nome || '').toLowerCase().includes(term)
    );
  }, [condominios, search]);

  // ---------------------------------------------------------------------------
  // FORMULÁRIO
  // ---------------------------------------------------------------------------
  const handleFormChange = (field, value) => {
    setForm((prev) => {
      let next = { ...prev, [field]: value };
      if (field === 'cnpj') next.cnpj = cnpjMask(value);
      return next;
    });
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setIsEditing(false);
  };

  const startEdit = (cond) => {
    setForm({ ...EMPTY_FORM, ...cond });
    setIsEditing(true);
    setActiveTab('gerenciar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startNew = () => {
    resetForm();
    setActiveTab('gerenciar');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      const payload = {
        ...form,
        qtd_pnr: safeNumber(form.qtd_pnr),
        qtd_civis: safeNumber(form.qtd_civis),
        despesa_estimada: safeNumber(form.despesa_estimada),
      };

      if (isEditing && form.id) {
        const { error } = await supabase
          .from('condominios')
          .update(payload)
          .eq('id', form.id);
        if (error) throw error;
        showToast('Condomínio atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('condominios').insert(payload);
        if (error) throw error;
        showToast('Condomínio cadastrado com sucesso!');
      }
      resetForm();
      await loadCondominios();
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Erro ao salvar condomínio:', err);
      showToast('Erro ao salvar: ' + (err.message || 'tente novamente'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este condomínio?')) return;
    setLoading(true);
    try {
      if (!supabase) throw new Error('Cliente Supabase não inicializado.');
      const { error } = await supabase.from('condominios').delete().eq('id', id);
      if (error) throw error;
      showToast('Condomínio removido com sucesso!');
      if (form.id === id) resetForm();
      await loadCondominios();
    } catch (err) {
      console.error('Erro ao excluir condomínio:', err);
      showToast('Erro ao excluir: ' + (err.message || 'tente novamente'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // MODAL FICHA TÉCNICA
  // ---------------------------------------------------------------------------
  const openFicha = (cond) => {
    setSelectedCondominio(cond);
    setIsModalOpen(true);
  };

  const closeFicha = () => {
    setSelectedCondominio(null);
    setIsModalOpen(false);
  };

  // ---------------------------------------------------------------------------
  // RENDERIZAÇÃO COM BOUNDARY DE ERRO
  // ---------------------------------------------------------------------------
  try {
    if (runtimeError) {
      return <GlobalError error={runtimeError} onReset={() => setRuntimeError(null)} />;
    }

    return (
      <div className="min-h-screen bg-slate-50 text-slate-800">
        {/* HEADER */}
        <header className="bg-gradient-to-r from-blue-950 to-emerald-800 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-lg">
                  <Building2 className="w-7 h-7 text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">CondoAdmin</h1>
                  <p className="text-xs text-emerald-100">Gestão de Condomínios</p>
                </div>
              </div>
              <nav className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-white/20 text-white shadow'
                      : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('gerenciar')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === 'gerenciar'
                      ? 'bg-white/20 text-white shadow'
                      : 'text-emerald-100 hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Gerenciar
                </button>
              </nav>
            </div>
          </div>
        </header>

        {/* TOAST */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-xl text-white font-medium transition-all ${
              toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* LOADER GLOBAL */}
          {loading && (
            <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="mt-3 text-slate-600 font-medium">Carregando...</p>
            </div>
          )}

          {/* ABA DASHBOARD */}
          {activeTab === 'dashboard' && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-blue-950">Dashboard</h2>
                  <p className="text-slate-500">Visão geral dos condomínios cadastrados</p>
                </div>
                <button
                  onClick={startNew}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Novo Condomínio
                </button>
              </div>

              {condominios.length === 0 ? (
                <div className="bg-white rounded-2xl shadow p-12 text-center">
                  <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700">
                    Nenhum condomínio cadastrado
                  </h3>
                  <p className="text-slate-500 mt-1">
                    Clique em "Novo Condomínio" para começar.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {condominios.map((c) => {
                    const taxa = calcularTaxa(
                      c.despesa_estimada,
                      c.qtd_pnr,
                      c.qtd_civis
                    );
                    return (
                      <div
                        key={c.id || Math.random()}
                        className="group bg-white rounded-2xl shadow hover:shadow-xl transition-all border border-slate-100 overflow-hidden"
                      >
                        <div className="h-2 bg-gradient-to-r from-blue-950 to-emerald-600" />
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 bg-blue-50 rounded-lg">
                                <Building2 className="w-6 h-6 text-blue-800" />
                              </div>
                              <div>
                                <h3 className="font-bold text-slate-800 line-clamp-1">
                                  {c.nome || 'Sem nome'}
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {c.endereco || 'Endereço não informado'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                <Users className="w-3.5 h-3.5" />
                                PNR + Civis
                              </div>
                              <p className="text-lg font-bold text-blue-950">
                                {safeNumber(c.qtd_pnr) + safeNumber(c.qtd_civis)}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                Taxa/und
                              </div>
                              <p className="text-lg font-bold text-emerald-700">
                                {formatCurrency(taxa)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openFicha(c)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-sm font-medium transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Ficha Técnica
                            </button>
                            <button
                              onClick={() => startEdit(c)}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                              aria-label="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-2 rounded-lg border border-slate-200 hover:bg-red-50 text-red-600 transition-colors"
                              aria-label="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ABA GERENCIAR */}
          {activeTab === 'gerenciar' && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* FORMULÁRIO */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow border border-slate-100 sticky top-6">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
                    <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                      {isEditing ? <Pencil className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                      {isEditing ? 'Editar Condomínio' : 'Cadastrar Condomínio'}
                    </h2>
                  </div>
                  <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Nome do Condomínio
                      </label>
                      <input
                        type="text"
                        required
                        value={form.nome}
                        onChange={(e) => handleFormChange('nome', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        placeholder="Ex: Residencial Solaris"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Endereço
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={form.endereco}
                          onChange={(e) => handleFormChange('endereco', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Rua, número, bairro, cidade"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          CNPJ
                        </label>
                        <input
                          type="text"
                          value={form.cnpj}
                          onChange={(e) => handleFormChange('cnpj', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="00.000.000/0000-00"
                          maxLength={18}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Banco
                        </label>
                        <div className="relative">
                          <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={form.banco}
                            onChange={(e) => handleFormChange('banco', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            placeholder="Nome do banco"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Agência
                        </label>
                        <input
                          type="text"
                          value={form.agencia}
                          onChange={(e) => handleFormChange('agencia', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="0000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Conta
                        </label>
                        <input
                          type="text"
                          value={form.conta}
                          onChange={(e) => handleFormChange('conta', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="00000-0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Qtd. PNR
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.qtd_pnr}
                          onChange={(e) => handleFormChange('qtd_pnr', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Qtd. Civis
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.qtd_civis}
                          onChange={(e) => handleFormChange('qtd_civis', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Total
                        </label>
                        <div className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 font-medium">
                          {safeNumber(form.qtd_pnr) + safeNumber(form.qtd_civis)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Despesa Estimada (R$)
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.despesa_estimada}
                          onChange={(e) => handleFormChange('despesa_estimada', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="0,00"
                        />
                      </div>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <p className="text-xs font-medium text-emerald-800 mb-1">
                        FÓRMULA DA TAXA
                      </p>
                      <p className="text-xs text-emerald-700 mb-2">
                        (despesa / (PNR + Civis)) / 0.905
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                          Taxa unitária estimada:
                        </span>
                        <span className="text-lg font-bold text-emerald-700">
                          {formatCurrency(
                            calcularTaxa(form.despesa_estimada, form.qtd_pnr, form.qtd_civis)
                          )}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Elevadores
                      </label>
                      <div className="relative">
                        <ArrowUpCircle className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={form.elevadores}
                          onChange={(e) => handleFormChange('elevadores', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Marcas / capacidade / manutenção"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Sistema de Incêndio
                      </label>
                      <div className="relative">
                        <Flame className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={form.incendio}
                          onChange={(e) => handleFormChange('incendio', e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="Tipo / extintores / hidrantes"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Responsável
                        </label>
                        <div className="relative">
                          <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={form.responsavel}
                            onChange={(e) => handleFormChange('responsavel', e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                            placeholder="Nome do síndico"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Telefone
                        </label>
                        <input
                          type="tel"
                          value={form.telefone}
                          onChange={(e) => handleFormChange('telefone', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                        placeholder="contato@condominio.com"
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium transition-colors"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isEditing ? (
                          <Pencil className="w-4 h-4" />
                        ) : (
                          <PlusCircle className="w-4 h-4" />
                        )}
                        {isEditing ? 'Salvar Alterações' : 'Cadastrar'}
                      </button>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>

              {/* LISTA */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow border border-slate-100">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-blue-950">Lista de Condomínios</h2>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por nome..."
                      className="w-full sm:w-64 px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                    />
                  </div>

                  {filteredCondominios.length === 0 ? (
                    <div className="p-12 text-center">
                      <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">
                        {search ? 'Nenhum resultado para a busca.' : 'Nenhum condomínio cadastrado.'}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="px-6 py-3 font-semibold">Condomínio</th>
                            <th className="px-6 py-3 font-semibold">Unidades</th>
                            <th className="px-6 py-3 font-semibold">Taxa/und</th>
                            <th className="px-6 py-3 font-semibold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredCondominios.map((c) => {
                            const taxa = calcularTaxa(
                              c.despesa_estimada,
                              c.qtd_pnr,
                              c.qtd_civis
                            );
                            return (
                              <tr key={c.id || Math.random()} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                  <div className="font-medium text-slate-800">{c.nome || '-'}</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3" />
                                    {c.endereco || '-'}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  {safeNumber(c.qtd_pnr) + safeNumber(c.qtd_civis)}
                                </td>
                                <td className="px-6 py-4 font-semibold text-emerald-700">
                                  {formatCurrency(taxa)}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => openFicha(c)}
                                      className="p-2 rounded-lg text-blue-700 hover:bg-blue-50 transition-colors"
                                      aria-label="Ficha técnica"
                                      title="Ficha técnica"
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => startEdit(c)}
                                      className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                                      aria-label="Editar"
                                      title="Editar"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(c.id)}
                                      className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                      aria-label="Excluir"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* MODAL FICHA TÉCNICA */}
        <Modal
          isOpen={isModalOpen}
          onClose={closeFicha}
          title={selectedCondominio ? `Ficha Técnica - ${selectedCondominio.nome || 'Condomínio'}` : 'Ficha Técnica'}
        >
          {selectedCondominio ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldCard
                  icon={<Building2 className="w-5 h-5 text-blue-800" />}
                  label="Nome"
                  value={selectedCondominio.nome}
                />
                <FieldCard
                  icon={<MapPin className="w-5 h-5 text-blue-800" />}
                  label="Endereço"
                  value={selectedCondominio.endereco}
                />
                <FieldCard
                  icon={<CreditCard className="w-5 h-5 text-blue-800" />}
                  label="CNPJ"
                  value={selectedCondominio.cnpj}
                />
                <FieldCard
                  icon={<CreditCard className="w-5 h-5 text-blue-800" />}
                  label="Banco"
                  value={selectedCondominio.banco}
                />
                <FieldCard
                  icon={<CreditCard className="w-5 h-5 text-blue-800" />}
                  label="Agência"
                  value={selectedCondominio.agencia}
                />
                <FieldCard
                  icon={<CreditCard className="w-5 h-5 text-blue-800" />}
                  label="Conta"
                  value={selectedCondominio.conta}
                />
                <FieldCard
                  icon={<Users className="w-5 h-5 text-blue-800" />}
                  label="Quantidade PNR"
                  value={selectedCondominio.qtd_pnr}
                />
                <FieldCard
                  icon={<Users className="w-5 h-5 text-blue-800" />}
                  label="Quantidade Civis"
                  value={selectedCondominio.qtd_civis}
                />
                <FieldCard
                  icon={<ArrowUpCircle className="w-5 h-5 text-blue-800" />}
                  label="Elevadores"
                  value={selectedCondominio.elevadores}
                />
                <FieldCard
                  icon={<Flame className="w-5 h-5 text-blue-800" />}
                  label="Sistema de Incêndio"
                  value={selectedCondominio.incendio}
                />
              </div>

              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-100">
                <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Cálculo da Taxa
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Despesa estimada</p>
                    <p className="font-semibold text-slate-800">
                      {formatCurrency(safeNumber(selectedCondominio.despesa_estimada))}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Total de unidades</p>
                    <p className="font-semibold text-slate-800">
                      {safeNumber(selectedCondominio.qtd_pnr) + safeNumber(selectedCondominio.qtd_civis)}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Taxa unitária</p>
                    <p className="font-bold text-emerald-700 text-lg">
                      {formatCurrency(
                        calcularTaxa(
                          selectedCondominio.despesa_estimada,
                          selectedCondominio.qtd_pnr,
                          selectedCondominio.qtd_civis
                        )
                      )}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-emerald-700">
                  Fórmula: ({formatNumber(safeNumber(selectedCondominio.despesa_estimada))} /{' '}
                  {safeNumber(selectedCondominio.qtd_pnr) + safeNumber(selectedCondominio.qtd_civis)}) / 0.905
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-500">Nenhum condomínio selecionado.</p>
          )}
        </Modal>
      </div>
    );
  } catch (err) {
    // Boundary simples: captura qualquer erro de renderização
    console.error('Erro de runtime capturado:', err);
    return <GlobalError error={err} onReset={() => window.location.reload()} />;
  }
}

function FieldCard({ icon, label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>
      <p className="text-slate-800 font-medium break-words">
        {value !== undefined && value !== null && value !== '' ? value : '—'}
      </p>
    </div>
  );
}
