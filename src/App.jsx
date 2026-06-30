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
  X,
} from 'lucide-react';

const SUPABASE_URL = 'https://bjeklbralayvulcuqiqe.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFIIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2NTA2NzcsImV4cCI6MjA0OTIyNjY3N30.FgP-MCl-aCf_l7Oj32qJR2sG3fqX2vhgB4o0hb1JbGg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TABLE = 'clientes';

const initialForm = {
  nome: '',
  endereco: '',
  cnpj: '',
  qtd_pnr: '',
  qtd_civis: '',
  despesa_estimada: '',
  dados_bancarios: '',
  saldo_fundo_reserva: '',
  projetos_incendio: '',
  possui_elevadores: false,
  qtd_total_elevadores: '',
  em_operacao: '',
  em_manutencao: '',
  empresa_responsavel: '',
  status_manutencao_geral: 'Em dia',
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(value);
  if (Number.isNaN(number)) return '-';
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(value);
  if (Number.isNaN(number)) return '-';
  return number.toLocaleString('pt-BR');
};

const isUrl = (value) => {
  if (!value || typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export default function App() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [error, setError] = useState(null);

  const fetchRecords = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from(TABLE)
      .select('*')
      .order('nome');
    if (fetchError) {
      setError('Erro ao carregar registros: ' + fetchError.message);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const filteredRecords = records.filter((record) =>
    (record.nome || '').toLowerCase().includes(search.toLowerCase())
  );

  const calculateUnitRate = (record) => {
    const despesa = Number(record.despesa_estimada);
    const pnr = Number(record.qtd_pnr);
    const civis = Number(record.qtd_civis);
    const total = pnr + civis;
    if (!total || !despesa) return '-';
    return formatCurrency((despesa / total) / 0.905);
  };

  const openDetails = (record) => {
    setSelectedRecord(record);
  };

  const closeDetails = () => {
    setSelectedRecord(null);
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const startEdit = (record) => {
    setForm({
      nome: record.nome || '',
      endereco: record.endereco || '',
      cnpj: record.cnpj || '',
      qtd_pnr: record.qtd_pnr ?? '',
      qtd_civis: record.qtd_civis ?? '',
      despesa_estimada: record.despesa_estimada ?? '',
      dados_bancarios: record.dados_bancarios || '',
      saldo_fundo_reserva: record.saldo_fundo_reserva ?? '',
      projetos_incendio: record.projetos_incendio || '',
      possui_elevadores: !!record.possui_elevadores,
      qtd_total_elevadores: record.qtd_total_elevadores ?? '',
      em_operacao: record.em_operacao ?? '',
      em_manutencao: record.em_manutencao ?? '',
      empresa_responsavel: record.empresa_responsavel || '',
      status_manutencao_geral: record.status_manutencao_geral || 'Em dia',
    });
    setEditingId(record.id);
    setActiveTab('manage');
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const preparePayload = () => {
    const payload = {
      nome: form.nome.trim(),
      endereco: form.endereco.trim(),
      cnpj: form.cnpj.trim(),
      qtd_pnr: form.qtd_pnr === '' ? null : Number(form.qtd_pnr),
      qtd_civis: form.qtd_civis === '' ? null : Number(form.qtd_civis),
      despesa_estimada: form.despesa_estimada === '' ? null : Number(form.despesa_estimada),
      dados_bancarios: form.dados_bancarios.trim(),
      saldo_fundo_reserva: form.saldo_fundo_reserva === '' ? null : Number(form.saldo_fundo_reserva),
      projetos_incendio: form.projetos_incendio.trim(),
      possui_elevadores: form.possui_elevadores,
      status_manutencao_geral: form.status_manutencao_geral,
    };

    if (form.possui_elevadores) {
      payload.qtd_total_elevadores = form.qtd_total_elevadores === '' ? null : Number(form.qtd_total_elevadores);
      payload.em_operacao = form.em_operacao === '' ? null : Number(form.em_operacao);
      payload.em_manutencao = form.em_manutencao === '' ? null : Number(form.em_manutencao);
      payload.empresa_responsavel = form.empresa_responsavel.trim();
    } else {
      payload.qtd_total_elevadores = null;
      payload.em_operacao = null;
      payload.em_manutencao = null;
      payload.empresa_responsavel = '';
    }

    return payload;
  };

  const saveRecord = async (e) => {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError('O campo Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = preparePayload();

    try {
      if (editingId) {
        const { error: updateError } = await supabase
          .from(TABLE)
          .update(payload)
          .eq('id', editingId);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from(TABLE).insert(payload);
        if (insertError) throw insertError;
      }
      await fetchRecords();
      resetForm();
      setActiveTab('dashboard');
    } catch (err) {
      setError('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;
    setRemovingId(id);
    setError(null);
    const { error: deleteError } = await supabase.from(TABLE).delete().eq('id', id);
    if (deleteError) {
      setError('Erro ao excluir: ' + deleteError.message);
    } else {
      await fetchRecords();
      if (selectedRecord?.id === id) closeDetails();
    }
    setRemovingId(null);
  };

  const renderStatusBadge = (status) => {
    const normalized = (status || '').toLowerCase();
    const isGood = ['em dia', 'ok', 'ativo', 'funcionando'].includes(normalized);
    const isWarning = ['atrasado', 'pendente', 'manutenção', 'em manutencao'].includes(normalized);
    const base = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium';
    if (isGood) return <span className={`${base} bg-emerald-100 text-emerald-800`}>{status}</span>;
    if (isWarning) return <span className={`${base} bg-amber-100 text-amber-800`}>{status}</span>;
    return <span className={`${base} bg-blue-100 text-blue-800`}>{status || '—'}</span>;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-blue-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white text-xl font-bold tracking-tight">CondoManager</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-emerald-500 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'bg-emerald-500 text-white'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                Gerenciar
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
                <p className="text-slate-500 text-sm mt-1">Visão geral dos condomínios cadastrados</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Buscar por nome..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm w-full sm:w-64"
                />
                <button
                  onClick={() => {
                    resetForm();
                    setActiveTab('manage');
                  }}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Novo
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-slate-200">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum registro encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecords.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => openDetails(record)}
                    className="group bg-white rounded-xl shadow-sm border border-slate-200 p-5 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-lg group-hover:bg-emerald-100 transition-colors">
                          <Building2 className="w-5 h-5 text-blue-900 group-hover:text-emerald-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900 line-clamp-1">{record.nome}</h3>
                          <p className="text-xs text-slate-500 line-clamp-1">{record.endereco || 'Sem endereço'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-slate-500 text-xs">Qtd PNR</p>
                        <p className="font-semibold text-blue-900">{formatNumber(record.qtd_pnr)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg">
                        <p className="text-slate-500 text-xs">Qtd Civis</p>
                        <p className="font-semibold text-blue-900">{formatNumber(record.qtd_civis)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg col-span-2">
                        <p className="text-slate-500 text-xs">Despesa Estimada</p>
                        <p className="font-semibold text-emerald-700">{formatCurrency(record.despesa_estimada)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      {renderStatusBadge(record.status_manutencao_geral)}
                      <span className="text-xs text-slate-400 group-hover:text-emerald-600 transition-colors">
                        Clique para detalhes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Gerenciar</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {editingId ? 'Editar registro existente' : 'Adicionar novo registro'}
                </p>
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-sm text-blue-900 hover:text-emerald-600 font-medium"
              >
                Voltar para Dashboard
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <form onSubmit={saveRecord} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-blue-900 mb-1">Nome</label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) => handleFormChange('nome', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Endereço</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={form.endereco}
                        onChange={(e) => handleFormChange('endereco', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">CNPJ</label>
                    <input
                      type="text"
                      value={form.cnpj}
                      onChange={(e) => handleFormChange('cnpj', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Qtd PNR</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        value={form.qtd_pnr}
                        onChange={(e) => handleFormChange('qtd_pnr', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Qtd Civis</label>
                    <div className="relative">
                      <Users className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        min="0"
                        value={form.qtd_civis}
                        onChange={(e) => handleFormChange('qtd_civis', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Despesa Estimada</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.despesa_estimada}
                        onChange={(e) => handleFormChange('despesa_estimada', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Dados Bancários</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={form.dados_bancarios}
                        onChange={(e) => handleFormChange('dados_bancarios', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Saldo Fundo Reserva</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={form.saldo_fundo_reserva}
                        onChange={(e) => handleFormChange('saldo_fundo_reserva', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-blue-900 mb-1">
                      Projetos de Incêndio (URL ou texto)
                    </label>
                    <div className="relative">
                      <Flame className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={form.projetos_incendio}
                        onChange={(e) => handleFormChange('projetos_incendio', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-900 mb-1">Status Manutenção Geral</label>
                    <select
                      value={form.status_manutencao_geral}
                      onChange={(e) => handleFormChange('status_manutencao_geral', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="Em dia">Em dia</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Em manutenção">Em manutenção</option>
                      <option value="Atrasado">Atrasado</option>
                    </select>
                  </div>
                  <div className="flex items-center md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.possui_elevadores}
                        onChange={(e) => handleFormChange('possui_elevadores', e.target.checked)}
                        className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium text-blue-900">Possui Elevadores</span>
                    </label>
                  </div>

                  {form.possui_elevadores && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Qtd Total de Elevadores</label>
                        <input
                          type="number"
                          min="0"
                          value={form.qtd_total_elevadores}
                          onChange={(e) => handleFormChange('qtd_total_elevadores', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Em Operação</label>
                        <input
                          type="number"
                          min="0"
                          value={form.em_operacao}
                          onChange={(e) => handleFormChange('em_operacao', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Em Manutenção</label>
                        <input
                          type="number"
                          min="0"
                          value={form.em_manutencao}
                          onChange={(e) => handleFormChange('em_manutencao', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-1">Empresa Responsável</label>
                        <input
                          type="text"
                          value={form.empresa_responsavel}
                          onChange={(e) => handleFormChange('empresa_responsavel', e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : editingId ? (
                      <Pencil className="w-4 h-4" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    {editingId ? 'Salvar Atualizações' : 'Adicionar Registro'}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex items-center gap-2 text-slate-600 hover:text-blue-900 px-4 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-blue-900 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedRecord.nome}</h2>
                  <p className="text-blue-200 text-xs">Detalhes do registro</p>
                </div>
              </div>
              <button
                onClick={closeDetails}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Nome</p>
                  <p className="text-blue-900 font-medium">{selectedRecord.nome || '—'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Endereço</p>
                  <p className="text-blue-900 font-medium flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    {selectedRecord.endereco || '—'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">CNPJ</p>
                  <p className="text-blue-900 font-medium">{selectedRecord.cnpj || '—'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Status de Manutenção Geral</p>
                  <div className="mt-1">{renderStatusBadge(selectedRecord.status_manutencao_geral)}</div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-emerald-600" />
                  Dados de Ocupação e Despesa
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Qtd PNR</p>
                    <p className="text-blue-900 font-semibold">{formatNumber(selectedRecord.qtd_pnr)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Qtd Civis</p>
                    <p className="text-blue-900 font-semibold">{formatNumber(selectedRecord.qtd_civis)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Despesa Estimada</p>
                    <p className="text-emerald-700 font-semibold">{formatCurrency(selectedRecord.despesa_estimada)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Taxa Unitária</p>
                    <p className="text-emerald-700 font-semibold">{calculateUnitRate(selectedRecord)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    Dados Bancários
                  </p>
                  <p className="text-blue-900 font-medium mt-1">{selectedRecord.dados_bancarios || '—'}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Saldo Fundo Reserva
                  </p>
                  <p className="text-emerald-700 font-semibold mt-1">
                    {formatCurrency(selectedRecord.saldo_fundo_reserva)}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-emerald-600" />
                    Projetos de Incêndio
                  </p>
                  {isUrl(selectedRecord.projetos_incendio) ? (
                    <a
                      href={selectedRecord.projetos_incendio}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-800 font-medium mt-1 break-all"
                    >
                      {selectedRecord.projetos_incendio}
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <p className="text-blue-900 font-medium mt-1">
                      {selectedRecord.projetos_incendio || '—'}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-blue-900 font-bold mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                  Detalhamento de Elevadores
                </h3>
                {selectedRecord.possui_elevadores ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Total</p>
                      <p className="text-blue-900 font-semibold">{formatNumber(selectedRecord.qtd_total_elevadores)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Em Operação</p>
                      <p className="text-emerald-700 font-semibold">{formatNumber(selectedRecord.em_operacao)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Em Manutenção</p>
                      <p className="text-amber-700 font-semibold">{formatNumber(selectedRecord.em_manutencao)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Empresa Responsável</p>
                      <p className="text-blue-900 font-semibold">{selectedRecord.empresa_responsavel || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm">Não possui elevadores cadastrados.</p>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  closeDetails();
                  startEdit(selectedRecord);
                }}
                className="flex items-center gap-2 text-blue-900 hover:text-emerald-600 font-medium text-sm transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => removeRecord(selectedRecord.id)}
                disabled={removingId === selectedRecord.id}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {removingId === selectedRecord.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
