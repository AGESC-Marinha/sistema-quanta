import React, { useEffect, useMemo, useState } from 'react';
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
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bjeklbralayvulcuqiqe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const FIELD_DEFS = [
  { key: 'nome', label: 'Nome', icon: Building2, type: 'text', required: true },
  { key: 'endereco', label: 'Endereço', icon: MapPin, type: 'text', required: true },
  { key: 'cnpj', label: 'CNPJ', icon: CreditCard, type: 'text', required: true },
  { key: 'qtd_pnr', label: 'Qtd. PNR', icon: Users, type: 'number', required: true },
  { key: 'qtd_civis', label: 'Qtd. Civis', icon: Users, type: 'number', required: true },
  { key: 'despesa_estimada', label: 'Despesa Estimada (R$)', icon: DollarSign, type: 'number', required: true },
  { key: 'dados_bancarios', label: 'Dados Bancários', icon: CreditCard, type: 'text', required: true },
  { key: 'saldo_fundo_reserva', label: 'Saldo Fundo Reserva (R$)', icon: DollarSign, type: 'number', required: true },
  { key: 'projetos_incendio', label: 'Projetos de Incêndio', icon: Flame, type: 'text', required: true },
  { key: 'possui_elevadores', label: 'Possui Elevadores?', icon: ArrowUpCircle, type: 'select', required: true },
  { key: 'qtd_elevadores', label: 'Qtd. Elevadores', icon: ArrowUpCircle, type: 'number', required: false },
  { key: 'empresa_elevadores', label: 'Empresa de Elevadores', icon: Building2, type: 'text', required: false },
  { key: 'status_manutencao', label: 'Status de Manutenção', icon: Settings, type: 'text', required: true },
];

const INITIAL_FORM = {
  nome: '',
  endereco: '',
  cnpj: '',
  qtd_pnr: 0,
  qtd_civis: 0,
  despesa_estimada: 0,
  dados_bancarios: '',
  saldo_fundo_reserva: 0,
  projetos_incendio: '',
  possui_elevadores: 'Não',
  qtd_elevadores: 0,
  empresa_elevadores: '',
  status_manutencao: '',
};

function formatCurrency(value) {
  const num = Number(value || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcularTaxaUnitaria(record) {
  const despesa = Number(record.despesa_estimada || 0);
  const unidades = (Number(record.qtd_pnr || 0) + Number(record.qtd_civis || 0)) || 1;
  const taxa = (despesa / unidades) / 0.905;
  return isFinite(taxa) ? taxa : 0;
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...INITIAL_FORM });
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('condominios')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      showToast(`Erro ao carregar: ${error.message}`, 'error');
      setRecords([]);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const totalCondominios = records.length;
  const totalUnidades = useMemo(
    () => records.reduce((acc, r) => acc + Number(r.qtd_pnr || 0) + Number(r.qtd_civis || 0), 0),
    [records]
  );
  const totalDespesa = useMemo(
    () => records.reduce((acc, r) => acc + Number(r.despesa_estimada || 0), 0),
    [records]
  );

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setForm((prev) => ({ ...prev, [name]: value === '' ? '' : Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      qtd_pnr: Number(form.qtd_pnr || 0),
      qtd_civis: Number(form.qtd_civis || 0),
      despesa_estimada: Number(form.despesa_estimada || 0),
      saldo_fundo_reserva: Number(form.saldo_fundo_reserva || 0),
      qtd_elevadores: Number(form.qtd_elevadores || 0),
    };

    if (!payload.nome || !payload.endereco || !payload.cnpj) {
      showToast('Preencha Nome, Endereço e CNPJ.', 'error');
      return;
    }

    let error;
    if (editingId) {
      const { error: updateError } = await supabase
        .from('condominios')
        .update(payload)
        .eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('condominios')
        .insert(payload);
      error = insertError;
    }

    if (error) {
      showToast(`Erro ao salvar: ${error.message}`, 'error');
      return;
    }

    setForm({ ...INITIAL_FORM });
    setEditingId(null);
    showToast(editingId ? 'Atualizado com sucesso!' : 'Cadastrado com sucesso!');
    await fetchRecords();
  };

  const handleEdit = (record) => {
    setForm({ ...INITIAL_FORM, ...record });
    setEditingId(record.id);
    setTab('gerenciar');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este condomínio?')) return;
    const { error } = await supabase.from('condominios').delete().eq('id', id);
    if (error) {
      showToast(`Erro ao excluir: ${error.message}`, 'error');
      return;
    }
    showToast('Excluído com sucesso!');
    await fetchRecords();
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setEditingId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-blue-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CondoGest</h1>
              <p className="text-xs text-blue-200">Gestão de Condomínios</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                tab === 'dashboard'
                  ? 'bg-green-500 text-white'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setTab('gerenciar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                tab === 'gerenciar'
                  ? 'bg-green-500 text-white'
                  : 'text-blue-100 hover:bg-blue-800'
              }`}
            >
              <Settings className="w-4 h-4" />
              Gerenciar
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'dashboard' && (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 shadow border-l-4 border-blue-900">
                <div className="text-sm text-slate-500 mb-1">Condomínios</div>
                <div className="text-2xl font-bold text-blue-900">{totalCondominios}</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow border-l-4 border-green-500">
                <div className="text-sm text-slate-500 mb-1">Unidades (PNR + Civis)</div>
                <div className="text-2xl font-bold text-blue-900">{totalUnidades}</div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow border-l-4 border-blue-900">
                <div className="text-sm text-slate-500 mb-1">Despesa Estimada Total</div>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totalDespesa)}</div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 gap-2 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                Carregando...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {records.map((record) => {
                  const taxa = calcularTaxaUnitaria(record);
                  return (
                    <button
                      key={record.id}
                      onClick={() => setSelected(record)}
                      className="text-left bg-white rounded-2xl p-6 shadow hover:shadow-lg transition-all border border-slate-100 group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-900/10 p-3 rounded-xl group-hover:bg-blue-900 group-hover:text-white transition-colors">
                          <Building2 className="w-6 h-6 text-blue-900 group-hover:text-white" />
                        </div>
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                          <ExternalLink className="w-3 h-3" />
                          Ficha técnica
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-blue-900 mb-2 line-clamp-1">{record.nome}</h3>
                      <div className="flex items-start gap-2 text-sm text-slate-600 mb-3">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-green-600" />
                        <span className="line-clamp-2">{record.endereco}</span>
                      </div>
                      <div className="border-t border-slate-100 pt-3">
                        <div className="text-xs text-slate-500 mb-1">Taxa Unitária</div>
                        <div className="text-xl font-bold text-green-600">{formatCurrency(taxa)}</div>
                        <div className="text-xs text-slate-400 mt-1">(despesa / unidades) / 0.905</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && records.length === 0 && (
              <div className="text-center py-20 text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>Nenhum condomínio cadastrado.</p>
                <button
                  onClick={() => setTab('gerenciar')}
                  className="mt-4 text-green-600 font-medium hover:underline"
                >
                  Cadastrar agora
                </button>
              </div>
            )}
          </section>
        )}

        {tab === 'gerenciar' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow p-6 sticky top-6">
                <div className="flex items-center gap-2 mb-4">
                  {editingId ? (
                    <Pencil className="w-5 h-5 text-green-600" />
                  ) : (
                    <PlusCircle className="w-5 h-5 text-green-600" />
                  )}
                  <h2 className="text-lg font-bold text-blue-900">
                    {editingId ? 'Editar Condomínio' : 'Novo Condomínio'}
                  </h2>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {FIELD_DEFS.map((field) => {
                    const Icon = field.icon;
                    return (
                      <div key={field.key}>
                        <label className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-1">
                          <Icon className="w-4 h-4 text-green-600" />
                          {field.label}
                          {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            name={field.key}
                            value={form[field.key]}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                          >
                            <option value="Sim">Sim</option>
                            <option value="Não">Não</option>
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            name={field.key}
                            value={form[field.key]}
                            onChange={handleInputChange}
                            required={field.required}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder={field.label}
                          />
                        )}
                      </div>
                    );
                  })}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                      {editingId ? 'Atualizar' : 'Cadastrar'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5 text-green-600" />
                Lista de Condomínios
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Carregando...
                </div>
              ) : (
                <div className="space-y-4">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white rounded-xl shadow p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-100"
                    >
                      <div>
                        <h3 className="text-base font-bold text-blue-900">{record.nome}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-green-600" />
                          {record.endereco}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-600">
                          <span className="bg-slate-100 px-2 py-1 rounded">CNPJ: {record.cnpj}</span>
                          <span className="bg-slate-100 px-2 py-1 rounded">Unidades: {Number(record.qtd_pnr || 0) + Number(record.qtd_civis || 0)}</span>
                          <span className="bg-slate-100 px-2 py-1 rounded">Despesa: {formatCurrency(record.despesa_estimada)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                  {records.length === 0 && (
                    <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                      <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      Nenhum registro encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-900 px-6 py-4 flex items-center justify-between sticky top-0">
              <div className="flex items-center gap-2 text-white">
                <Building2 className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold">Ficha Técnica</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-white hover:text-green-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Nome</div>
                  <div className="font-semibold text-blue-900">{selected.nome}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Endereço</div>
                  <div className="font-semibold text-blue-900">{selected.endereco}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">CNPJ</div>
                  <div className="font-semibold text-blue-900">{selected.cnpj}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Taxa Unitária</div>
                  <div className="font-bold text-green-600 text-lg">{formatCurrency(calcularTaxaUnitaria(selected))}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Qtd. PNR</div>
                  <div className="font-semibold text-blue-900">{selected.qtd_pnr}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Qtd. Civis</div>
                  <div className="font-semibold text-blue-900">{selected.qtd_civis}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Despesa Estimada</div>
                  <div className="font-semibold text-blue-900">{formatCurrency(selected.despesa_estimada)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Saldo Fundo Reserva</div>
                  <div className="font-semibold text-blue-900">{formatCurrency(selected.saldo_fundo_reserva)}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Dados Bancários</div>
                  <div className="font-semibold text-blue-900">{selected.dados_bancarios}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Projetos de Incêndio</div>
                  <div className="font-semibold text-blue-900">{selected.projetos_incendio}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Possui Elevadores?</div>
                  <div className="font-semibold text-blue-900">{selected.possui_elevadores}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Qtd. Elevadores</div>
                  <div className="font-semibold text-blue-900">{selected.qtd_elevadores}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Empresa de Elevadores</div>
                  <div className="font-semibold text-blue-900">{selected.empresa_elevadores || '-'}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Status de Manutenção</div>
                  <div className="font-semibold text-blue-900">{selected.status_manutencao}</div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-medium transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium flex items-center gap-2 transition-all ${
            toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'
          }`}
        >
          {toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
