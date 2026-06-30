import { useEffect, useMemo, useState } from 'react';
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

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

const initialForm = {
  nome: '',
  endereco: '',
  cnpj: '',
  qtd_pnr: '',
  qtd_civis: '',
  despesa_estimada: '',
  dados_bancarios: '',
  saldo_fundo_reserva: '',
  projetos_incendio_link: '',
  possui_elevadores: false,
  qtd_total_elevadores: '',
  em_operacao: '',
  em_manutencao: '',
  empresa_responsavel: '',
  status_manutencao: '',
};

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'R$ 0,00';
  const num = Number(value);
  if (Number.isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export default function App() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchCondominios = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('condominios')
      .select('*')
      .order('nome');

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setCondominios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCondominios();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const buildPayload = () => ({
    nome: form.nome,
    endereco: form.endereco,
    cnpj: form.cnpj,
    qtd_pnr: Number(form.qtd_pnr) || 0,
    qtd_civis: Number(form.qtd_civis) || 0,
    despesa_estimada: Number(form.despesa_estimada) || 0,
    dados_bancarios: form.dados_bancarios,
    saldo_fundo_reserva: Number(form.saldo_fundo_reserva) || 0,
    projetos_incendio_link: form.projetos_incendio_link,
    possui_elevadores: !!form.possui_elevadores,
    qtd_total_elevadores: Number(form.qtd_total_elevadores) || 0,
    em_operacao: Number(form.em_operacao) || 0,
    em_manutencao: Number(form.em_manutencao) || 0,
    empresa_responsavel: form.empresa_responsavel,
    status_manutencao: form.status_manutencao,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = buildPayload();
    let result;

    if (editingId) {
      result = await supabase
        .from('condominios')
        .update(payload)
        .eq('id', editingId);
    } else {
      result = await supabase.from('condominios').insert([payload]);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      closeForm();
      await fetchCondominios();
    }

    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este condomínio?')) return;
    setError(null);
    const { error: deleteError } = await supabase
      .from('condominios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      setError(deleteError.message);
    } else {
      await fetchCondominios();
    }
  };

  const openNew = () => {
    setEditingId(null);
    setForm(initialForm);
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setForm({
      nome: item.nome || '',
      endereco: item.endereco || '',
      cnpj: item.cnpj || '',
      qtd_pnr: item.qtd_pnr ?? '',
      qtd_civis: item.qtd_civis ?? '',
      despesa_estimada: item.despesa_estimada ?? '',
      dados_bancarios: item.dados_bancarios || '',
      saldo_fundo_reserva: item.saldo_fundo_reserva ?? '',
      projetos_incendio_link: item.projetos_incendio_link || '',
      possui_elevadores: !!item.possui_elevadores,
      qtd_total_elevadores: item.qtd_total_elevadores ?? '',
      em_operacao: item.em_operacao ?? '',
      em_manutencao: item.em_manutencao ?? '',
      empresa_responsavel: item.empresa_responsavel || '',
      status_manutencao: item.status_manutencao || '',
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const calculatedTaxa = useMemo(() => {
    if (!selected) return formatCurrency(0);
    const totalPessoas = Number(selected.qtd_pnr || 0) + Number(selected.qtd_civis || 0);
    const despesa = Number(selected.despesa_estimada || 0);
    if (totalPessoas <= 0) return formatCurrency(0);
    return formatCurrency(despesa / totalPessoas);
  }, [selected]);

  const Field = ({ label, value, icon: Icon }) => (
    <div className="bg-white/70 rounded-lg p-4 shadow-sm border border-blue-100">
      <div className="flex items-center gap-2 text-blue-900 mb-1">
        {Icon && <Icon className="w-4 h-4 text-green-600" />}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-blue-950 font-medium break-words">{value}</div>
    </div>
  );

  const renderDashboard = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {condominios.map((item) => (
        <button
          key={item.id}
          onClick={() => setSelected(item)}
          className="text-left bg-white rounded-2xl shadow-md hover:shadow-xl transition border border-blue-100 p-6 flex flex-col gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-900 text-white p-3 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-blue-900 leading-tight">{item.nome}</h3>
          </div>
          <p className="text-sm text-slate-600 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-green-600" />
            {item.endereco || 'Sem endereço'}
          </p>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="flex items-center gap-1 text-slate-700">
              <Users className="w-4 h-4 text-blue-900" />
              {(Number(item.qtd_pnr) || 0) + (Number(item.qtd_civis) || 0)} pessoas
            </span>
            <span className="text-green-600 font-semibold group-hover:underline">
              Ver detalhes
            </span>
          </div>
        </button>
      ))}
    </div>
  );

  const renderManage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-blue-900">Gerenciar Condomínios</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
        >
          <PlusCircle className="w-4 h-4" />
          Novo Condomínio
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow border border-blue-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="p-4 font-semibold">Nome</th>
              <th className="p-4 font-semibold">Endereço</th>
              <th className="p-4 font-semibold">CNPJ</th>
              <th className="p-4 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {condominios.map((item) => (
              <tr key={item.id} className="border-b border-blue-50 hover:bg-blue-50/50">
                <td className="p-4 font-medium text-blue-900">{item.nome}</td>
                <td className="p-4 text-slate-600">{item.endereco || '-'}</td>
                <td className="p-4 text-slate-600">{item.cnpj || '-'}</td>
                <td className="p-4 flex justify-end gap-2">
                  <button
                    onClick={() => openEdit(item)}
                    className="flex items-center gap-1 bg-blue-900 hover:bg-blue-800 text-white px-3 py-1.5 rounded-md text-sm transition"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-sm transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {condominios.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500">
                  Nenhum condomínio cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">CondoGest</h1>
              <p className="text-blue-200 text-sm">Gestão de Condomínios</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 py-4 border-b-2 font-semibold transition ${
                activeTab === 'dashboard'
                  ? 'border-green-600 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-blue-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 py-4 border-b-2 font-semibold transition ${
                activeTab === 'manage'
                  ? 'border-green-600 text-blue-900'
                  : 'border-transparent text-slate-500 hover:text-blue-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Gerenciar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-blue-900">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p className="font-medium">Carregando condomínios...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'manage' && renderManage()}
          </>
        )}
      </main>

      {/* Modal Detalhes */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
          <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-blue-100">
            <div className="sticky top-0 bg-blue-900 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold">{selected.nome}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="hover:bg-blue-800 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Nome" value={selected.nome} icon={Building2} />
              <Field label="Endereço" value={selected.endereco || '-'} icon={MapPin} />
              <Field label="CNPJ" value={selected.cnpj || '-'} icon={CreditCard} />
              <Field label="Qtd PNR" value={selected.qtd_pnr ?? 0} icon={Users} />
              <Field label="Qtd Civis" value={selected.qtd_civis ?? 0} icon={Users} />
              <Field label="Despesa Estimada" value={formatCurrency(selected.despesa_estimada)} icon={DollarSign} />
              <Field label="Taxa Unitária (Calculada)" value={calculatedTaxa} icon={DollarSign} />
              <Field label="Dados Bancários" value={selected.dados_bancarios || '-'} icon={CreditCard} />
              <Field label="Saldo Fundo Reserva" value={formatCurrency(selected.saldo_fundo_reserva)} icon={DollarSign} />
              <div className="bg-white/70 rounded-lg p-4 shadow-sm border border-blue-100">
                <div className="flex items-center gap-2 text-blue-900 mb-1">
                  <Flame className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold uppercase tracking-wide">Projetos Incêndio</span>
                </div>
                {selected.projetos_incendio_link ? (
                  <a
                    href={selected.projetos_incendio_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-green-600 font-semibold hover:underline"
                  >
                    Acessar link <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <span className="text-blue-950 font-medium">-</span>
                )}
              </div>
              <Field label="Qtd Total Elevadores" value={selected.qtd_total_elevadores ?? 0} icon={ArrowUpCircle} />
              <Field label="Em Operação" value={selected.em_operacao ?? 0} icon={ArrowUpCircle} />
              <Field label="Em Manutenção" value={selected.em_manutencao ?? 0} icon={ArrowUpCircle} />
              <Field label="Empresa Responsável" value={selected.empresa_responsavel || '-'} icon={Building2} />
              <Field label="Status Manutenção" value={selected.status_manutencao || '-'} icon={Settings} />
            </div>

            <div className="p-6 pt-0 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-5 py-2 rounded-lg font-semibold transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Formulário */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-blue-100">
            <div className="sticky top-0 bg-blue-900 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-bold">
                {editingId ? 'Editar Condomínio' : 'Novo Condomínio'}
              </h2>
              <button
                onClick={closeForm}
                className="hover:bg-blue-800 p-2 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Nome</label>
                  <input
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Endereço</label>
                  <input
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">CNPJ</label>
                  <input
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Qtd PNR</label>
                  <input
                    type="number"
                    name="qtd_pnr"
                    value={form.qtd_pnr}
                    onChange={handleChange}
                    min={0}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Qtd Civis</label>
                  <input
                    type="number"
                    name="qtd_civis"
                    value={form.qtd_civis}
                    onChange={handleChange}
                    min={0}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Despesa Estimada</label>
                  <input
                    type="number"
                    step="0.01"
                    name="despesa_estimada"
                    value={form.despesa_estimada}
                    onChange={handleChange}
                    min={0}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Dados Bancários</label>
                  <input
                    name="dados_bancarios"
                    value={form.dados_bancarios}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Saldo Fundo Reserva</label>
                  <input
                    type="number"
                    step="0.01"
                    name="saldo_fundo_reserva"
                    value={form.saldo_fundo_reserva}
                    onChange={handleChange}
                    min={0}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Projetos Incêndio (Link)</label>
                  <input
                    type="url"
                    name="projetos_incendio_link"
                    value={form.projetos_incendio_link}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-blue-900 mb-1">Status Manutenção</label>
                  <input
                    name="status_manutencao"
                    value={form.status_manutencao}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 mt-2">
                  <input
                    type="checkbox"
                    id="possui_elevadores"
                    name="possui_elevadores"
                    checked={form.possui_elevadores}
                    onChange={handleChange}
                    className="w-5 h-5 text-green-600 border-blue-200 rounded focus:ring-green-600"
                  />
                  <label htmlFor="possui_elevadores" className="text-blue-900 font-semibold">
                    Possui Elevadores
                  </label>
                </div>

                {form.possui_elevadores && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-1">Qtd Total Elevadores</label>
                      <input
                        type="number"
                        name="qtd_total_elevadores"
                        value={form.qtd_total_elevadores}
                        onChange={handleChange}
                        min={0}
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-1">Em Operação</label>
                      <input
                        type="number"
                        name="em_operacao"
                        value={form.em_operacao}
                        onChange={handleChange}
                        min={0}
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-1">Em Manutenção</label>
                      <input
                        type="number"
                        name="em_manutencao"
                        value={form.em_manutencao}
                        onChange={handleChange}
                        min={0}
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-900 mb-1">Empresa Responsável</label>
                      <input
                        name="empresa_responsavel"
                        value={form.empresa_responsavel}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-blue-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2 rounded-lg font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 transition"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Salvar Atualizações' : 'Salvar Condomínio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
