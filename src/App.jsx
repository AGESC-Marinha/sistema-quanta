import { useState, useEffect } from 'react';
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
  X
} from 'lucide-react';

const SUPABASE_URL = 'https://bjeklbralayvulcuqiqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const INITIAL_FORM = {
  nome: '',
  endereco: '',
  cnpj: '',
  qtd_pnr: '',
  qtd_civis: '',
  despesa_estimada: '',
  dados_bancarios: '',
  saldo_fundo_reserva: '',
  projetos_incendio: '',
  possui_elevadores: 'Não',
  qtd_elevadores: '',
  empresa_elevadores: '',
  status_manutencao: ''
};

export default function App() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCondominio, setSelectedCondominio] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCondominios();
  }, []);

  async function fetchCondominios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('condominios')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar condomínios:', error);
      alert('Erro ao carregar condomínios. Verifique o console.');
    } else {
      setCondominios(data || []);
    }
    setLoading(false);
  }

  const calculateTaxa = (c) => {
    const despesa = Number(c.despesa_estimada) || 0;
    const total = (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0);
    if (total === 0 || despesa === 0) return 0;
    return (despesa / total) / 0.905;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value) || 0);
  };

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      possui_elevadores: form.possui_elevadores === 'Sim',
      qtd_pnr: form.qtd_pnr === '' ? null : Number(form.qtd_pnr),
      qtd_civis: form.qtd_civis === '' ? null : Number(form.qtd_civis),
      despesa_estimada: form.despesa_estimada === '' ? null : Number(form.despesa_estimada),
      saldo_fundo_reserva: form.saldo_fundo_reserva === '' ? null : Number(form.saldo_fundo_reserva),
      qtd_elevadores: form.qtd_elevadores === '' ? null : Number(form.qtd_elevadores)
    };

    try {
      if (editingId) {
        const { error } = await supabase
          .from('condominios')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase.from('condominios').insert(payload);
        if (error) throw error;
      }
      setForm(INITIAL_FORM);
      await fetchCondominios();
      setActiveTab('dashboard');
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (c) => {
    setForm({
      nome: c.nome || '',
      endereco: c.endereco || '',
      cnpj: c.cnpj || '',
      qtd_pnr: c.qtd_pnr ?? '',
      qtd_civis: c.qtd_civis ?? '',
      despesa_estimada: c.despesa_estimada ?? '',
      dados_bancarios: c.dados_bancarios || '',
      saldo_fundo_reserva: c.saldo_fundo_reserva ?? '',
      projetos_incendio: c.projetos_incendio || '',
      possui_elevadores: c.possui_elevadores ? 'Sim' : 'Não',
      qtd_elevadores: c.qtd_elevadores ?? '',
      empresa_elevadores: c.empresa_elevadores || '',
      status_manutencao: c.status_manutencao || ''
    });
    setEditingId(c.id);
    setActiveTab('gerenciar');
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este condomínio?')) return;
    const { error } = await supabase.from('condominios').delete().eq('id', id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      await fetchCondominios();
    }
  };

  const openModal = (c) => {
    setSelectedCondominio(c);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCondominio(null);
  };

  const isLink = (value) => {
    return value && typeof value === 'string' && value.trim().startsWith('http');
  };

  const renderField = (label, value, icon = null) => (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
      <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide flex items-center gap-2">
        {icon && <span className="text-emerald-600">{icon}</span>}
        {label}
      </span>
      <p className="mt-1 text-sm text-slate-800 font-medium break-words">
        {value !== null && value !== undefined && value !== '' ? value : '—'}
      </p>
    </div>
  );

  const FormField = ({ label, name, type = 'text', placeholder = '', required = false }) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-semibold text-blue-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
      />
    </div>
  );

  const TextAreaField = ({ label, name, placeholder = '', required = false }) => (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-semibold text-blue-900">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        rows={3}
        className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm resize-none"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Gestão de Condomínios</h1>
                <p className="text-blue-100 text-sm">Painel administrativo completo</p>
              </div>
            </div>
            <nav className="flex bg-blue-800/50 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('gerenciar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === 'gerenciar'
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-700/50'
                }`}
              >
                <Settings className="w-4 h-4" />
                Gerenciar
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-900">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-emerald-500" />
            <p className="text-lg font-medium">Carregando condomínios...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                    <LayoutDashboard className="w-6 h-6 text-emerald-600" />
                    Dashboard
                  </h2>
                  <p className="text-slate-500 mt-1">
                    Visualize os condomínios cadastrados e clique em um card para ver a ficha técnica completa.
                  </p>
                </div>

                {condominios.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                    <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-blue-900">Nenhum condomínio cadastrado</h3>
                    <p className="text-slate-500 mt-2">Acesse a aba Gerenciar para adicionar o primeiro registro.</p>
                    <button
                      onClick={() => setActiveTab('gerenciar')}
                      className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Novo Condomínio
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {condominios.map((c) => {
                      const taxa = calculateTaxa(c);
                      const totalPessoas = (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0);
                      return (
                        <button
                          key={c.id}
                          onClick={() => openModal(c)}
                          className="group text-left bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-lg hover:border-emerald-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-xl">
                              <Building2 className="w-6 h-6 text-blue-900" />
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                              Taxa: {formatCurrency(taxa)}
                            </div>
                          </div>

                          <h3 className="text-lg font-bold text-blue-900 mb-2 group-hover:text-emerald-700 transition-colors">
                            {c.nome || 'Sem nome'}
                          </h3>

                          <div className="space-y-2 text-sm text-slate-600">
                            <p className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">{c.endereco || 'Endereço não informado'}</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-500" />
                              <span>{totalPessoas} pessoa(s) (PNR: {c.qtd_pnr || 0}, Civis: {c.qtd_civis || 0})</span>
                            </p>
                            <p className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-emerald-500" />
                              <span>Despesa estimada: {formatCurrency(c.despesa_estimada)}</span>
                            </p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                              Ver ficha técnica
                            </span>
                            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {activeTab === 'gerenciar' && (
              <section>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-emerald-600" />
                    Gerenciar Condomínios
                  </h2>
                  <p className="text-slate-500 mt-1">
                    Cadastre, edite ou remova condomínios. Preencha todos os campos obrigatórios.
                  </p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                  <div className="xl:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                          {editingId ? (
                            <Pencil className="w-5 h-5 text-emerald-700" />
                          ) : (
                            <PlusCircle className="w-5 h-5 text-emerald-700" />
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-blue-900">
                          {editingId ? 'Editar Condomínio' : 'Novo Condomínio'}
                        </h3>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <FormField label="Nome" name="nome" required />
                        <FormField label="Endereço" name="endereco" required />
                        <FormField label="CNPJ" name="cnpj" />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField label="Qtd. PNR" name="qtd_pnr" type="number" />
                          <FormField label="Qtd. Civis" name="qtd_civis" type="number" />
                        </div>

                        <FormField label="Despesa Estimada (R$)" name="despesa_estimada" type="number" step="0.01" />
                        <TextAreaField label="Dados Bancários" name="dados_bancarios" />
                        <FormField label="Saldo Fundo de Reserva (R$)" name="saldo_fundo_reserva" type="number" step="0.01" />
                        <FormField label="Projetos de Incêndio (URL)" name="projetos_incendio" placeholder="https://..." />

                        <div className="flex flex-col gap-1">
                          <label htmlFor="possui_elevadores" className="text-sm font-semibold text-blue-900">
                            Possui Elevadores?
                          </label>
                          <select
                            id="possui_elevadores"
                            name="possui_elevadores"
                            value={form.possui_elevadores}
                            onChange={handleChange}
                            className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm bg-white"
                          >
                            <option value="Não">Não</option>
                            <option value="Sim">Sim</option>
                          </select>
                        </div>

                        <FormField label="Qtd. Elevadores" name="qtd_elevadores" type="number" />
                        <FormField label="Empresa de Elevadores" name="empresa_elevadores" />
                        <FormField label="Status de Manutenção" name="status_manutencao" />

                        <div className="pt-4 flex flex-col gap-3">
                          <button
                            type="submit"
                            disabled={saving}
                            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white rounded-lg font-semibold transition-colors"
                          >
                            {saving ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : editingId ? (
                              <Pencil className="w-4 h-4" />
                            ) : (
                              <PlusCircle className="w-4 h-4" />
                            )}
                            {saving ? 'Salvando...' : editingId ? 'Atualizar Condomínio' : 'Cadastrar Condomínio'}
                          </button>
                          {editingId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setForm(INITIAL_FORM);
                              }}
                              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-colors"
                            >
                              <XCircle className="w-4 h-4" />
                              Cancelar Edição
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-emerald-600" />
                          Condomínios Cadastrados
                        </h3>
                      </div>

                      {condominios.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                          Nenhum condomínio encontrado.
                        </div>
                      ) : (
                        <ul className="divide-y divide-slate-100">
                          {condominios.map((c) => {
                            const taxa = calculateTaxa(c);
                            return (
                              <li
                                key={c.id}
                                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-base font-bold text-blue-900 truncate">{c.nome}</p>
                                  <p className="text-sm text-slate-500 flex items-center gap-1 truncate">
                                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                                    {c.endereco || 'Endereço não informado'}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded-md font-medium">
                                      Taxa: {formatCurrency(taxa)}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                                      PNR: {c.qtd_pnr || 0}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                                      Civis: {c.qtd_civis || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={() => handleEdit(c)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDelete(c.id)}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Excluir
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {modalOpen && selectedCondominio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Ficha Técnica</h2>
                  <p className="text-blue-100 text-sm">{selectedCondominio.nome}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderField('Nome', selectedCondominio.nome, <Building2 className="w-3.5 h-3.5" />)}
                  {renderField('Endereço', selectedCondominio.endereco, <MapPin className="w-3.5 h-3.5" />)}
                  {renderField('CNPJ', selectedCondominio.cnpj)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Quantidades e Cálculo
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {renderField('Qtd. PNR', selectedCondominio.qtd_pnr)}
                  {renderField('Qtd. Civis', selectedCondominio.qtd_civis)}
                  {renderField('Total Pessoas', (Number(selectedCondominio.qtd_pnr) || 0) + (Number(selectedCondominio.qtd_civis) || 0))}
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      Taxa Unitária
                    </span>
                    <p className="mt-1 text-lg font-bold text-emerald-800">
                      {formatCurrency(calculateTaxa(selectedCondominio))}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financeiro
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {renderField('Despesa Estimada', formatCurrency(selectedCondominio.despesa_estimada), <DollarSign className="w-3.5 h-3.5" />)}
                  {renderField('Saldo Fundo de Reserva', formatCurrency(selectedCondominio.saldo_fundo_reserva), <CreditCard className="w-3.5 h-3.5" />)}
                  {renderField('Dados Bancários', selectedCondominio.dados_bancarios, <CreditCard className="w-3.5 h-3.5" />)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  Projetos de Incêndio
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {renderField('Link / Informação', selectedCondominio.projetos_incendio, <Flame className="w-3.5 h-3.5" />)}
                  {isLink(selectedCondominio.projetos_incendio) && (
                    <a
                      href={selectedCondominio.projetos_incendio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 w-fit px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Abrir Projeto
                    </a>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4" />
                  Elevadores
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {renderField('Possui Elevadores', selectedCondominio.possui_elevadores ? 'Sim' : 'Não')}
                  {renderField('Qtd. Elevadores', selectedCondominio.qtd_elevadores)}
                  {renderField('Empresa de Elevadores', selectedCondominio.empresa_elevadores)}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Manutenção
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {renderField('Status de Manutenção', selectedCondominio.status_manutencao, <Settings className="w-3.5 h-3.5" />)}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={closeModal}
                className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
