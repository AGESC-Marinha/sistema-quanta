import React, { useEffect, useState } from 'react';
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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';

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
  projetos_incendio_link: '',
  possui_elevadores: false,
  qtd_elevadores: '',
  elevadores_operacao: '',
  elevadores_manutencao: '',
  empresa_elevadores: '',
  status_manutencao: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchCondominios();
  }, []);

  async function fetchCondominios() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('condominios')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      setCondominios(data || []);
    } catch (err) {
      alert('Erro ao carregar condomínios: ' + (err.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function numericValue(value) {
    const parsed = Number(value);
    return value === '' || value === null || value === undefined ? null : parsed;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      nome: form.nome.trim(),
      endereco: form.endereco.trim(),
      cnpj: form.cnpj.trim(),
      qtd_pnr: numericValue(form.qtd_pnr),
      qtd_civis: numericValue(form.qtd_civis),
      despesa_estimada: numericValue(form.despesa_estimada),
      dados_bancarios: form.dados_bancarios.trim(),
      saldo_fundo_reserva: numericValue(form.saldo_fundo_reserva),
      projetos_incendio_link: form.projetos_incendio_link.trim(),
      possui_elevadores: !!form.possui_elevadores,
      qtd_elevadores: form.possui_elevadores ? numericValue(form.qtd_elevadores) : null,
      elevadores_operacao: form.possui_elevadores ? numericValue(form.elevadores_operacao) : null,
      elevadores_manutencao: form.possui_elevadores ? numericValue(form.elevadores_manutencao) : null,
      empresa_elevadores: form.possui_elevadores ? form.empresa_elevadores.trim() : '',
      status_manutencao: form.possui_elevadores ? form.status_manutencao.trim() : '',
    };

    try {
      let result;
      if (editingId) {
        result = await supabase
          .from('condominios')
          .update(payload)
          .eq('id', editingId)
          .select();
      } else {
        result = await supabase.from('condominios').insert(payload).select();
      }

      const { error, data } = result;

      if (error) {
        alert(
          'Erro ao salvar condomínio:\n' +
            'Código: ' + (error.code || 'N/A') + '\n' +
            'Mensagem: ' + (error.message || JSON.stringify(error)) + '\n' +
            'Detalhes: ' + (error.details || 'N/A')
        );
        return;
      }

      await fetchCondominios();
      clearForm();
      setActiveTab('dashboard');
    } catch (err) {
      alert('Erro inesperado ao salvar: ' + (err.message || JSON.stringify(err)));
    } finally {
      setSaving(false);
    }
  }

  function clearForm() {
    setForm(INITIAL_FORM);
    setEditingId(null);
  }

  function editCondominio(item) {
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
      qtd_elevadores: item.qtd_elevadores ?? '',
      elevadores_operacao: item.elevadores_operacao ?? '',
      elevadores_manutencao: item.elevadores_manutencao ?? '',
      empresa_elevadores: item.empresa_elevadores || '',
      status_manutencao: item.status_manutencao || '',
    });
    setEditingId(item.id);
    setActiveTab('cadastro');
  }

  async function deleteCondominio(id) {
    if (!window.confirm('Tem certeza que deseja excluir este condomínio?')) return;
    try {
      const { error } = await supabase.from('condominios').delete().eq('id', id);
      if (error) throw error;
      await fetchCondominios();
      if (selected && selected.id === id) setSelected(null);
    } catch (err) {
      alert('Erro ao excluir: ' + (err.message || JSON.stringify(err)));
    }
  }

  function formatCurrency(value) {
    if (value === null || value === undefined || value === '') return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value));
  }

  function openFicha(item) {
    setSelected(item);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-slate-900 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Gestão de Condomínios</h1>
              <p className="text-xs text-slate-300">Controle administrativo e técnico</p>
            </div>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => {
                clearForm();
                setActiveTab('cadastro');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'cadastro'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Cadastro
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="w-6 h-6 text-emerald-600" />
                Dashboard
              </h2>
              <button
                onClick={() => {
                  clearForm();
                  setActiveTab('cadastro');
                }}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <PlusCircle className="w-4 h-4" />
                Novo Condomínio
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mb-3" />
                <p>Carregando condomínios...</p>
              </div>
            ) : condominios.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="text-lg font-medium">Nenhum condomínio cadastrado</p>
                <p className="text-sm mt-1">Clique em "Novo Condomínio" para começar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {condominios.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => openFicha(item)}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-400 transition cursor-pointer p-5 relative group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-slate-900 text-white p-2 rounded-lg">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            editCondominio(item);
                          }}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCondominio(item.id);
                          }}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{item.nome}</h3>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{item.endereco}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Moradores</p>
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          {(item.qtd_pnr || 0) + (item.qtd_civis || 0)}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs text-slate-500 mb-1">Despesa Estimada</p>
                        <p className="font-semibold text-slate-900 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                          {formatCurrency(item.despesa_estimada)}
                        </p>
                      </div>
                    </div>
                    {item.possui_elevadores && (
                      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        {item.elevadores_operacao || 0} em operação / {item.elevadores_manutencao || 0} em manutenção
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'cadastro' && (
          <section>
            <div className="mb-6 flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? 'Editar Condomínio' : 'Cadastrar Condomínio'}
              </h2>
              {editingId && (
                <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  Edição
                </span>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Condomínio</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="nome"
                      required
                      value={form.nome}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Ex: Residencial Parque Verde"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="endereco"
                      required
                      value={form.endereco}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Dados Bancários</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="dados_bancarios"
                      value={form.dados_bancarios}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Banco, agência, conta"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. PNR</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="qtd_pnr"
                      min="0"
                      value={form.qtd_pnr}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Civis</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="qtd_civis"
                      min="0"
                      value={form.qtd_civis}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Despesa Estimada</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="despesa_estimada"
                      min="0"
                      step="0.01"
                      value={form.despesa_estimada}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Fundo Reserva</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="saldo_fundo_reserva"
                      min="0"
                      step="0.01"
                      value={form.saldo_fundo_reserva}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Link Projeto de Incêndio
                  </label>
                  <div className="relative">
                    <Flame className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="url"
                      name="projetos_incendio_link"
                      value={form.projetos_incendio_link}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <input
                      type="checkbox"
                      name="possui_elevadores"
                      checked={form.possui_elevadores}
                      onChange={handleChange}
                      className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <p className="font-medium text-slate-900">Possui elevadores</p>
                      <p className="text-sm text-slate-500">Marque para exibir os campos técnicos de elevadores</p>
                    </div>
                  </label>
                </div>

                {form.possui_elevadores && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Total de Elevadores</label>
                      <div className="relative">
                        <ArrowUpCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          name="qtd_elevadores"
                          min="0"
                          value={form.qtd_elevadores}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Em Operação</label>
                      <input
                        type="number"
                        name="elevadores_operacao"
                        min="0"
                        value={form.elevadores_operacao}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Em Manutenção</label>
                      <input
                        type="number"
                        name="elevadores_manutencao"
                        min="0"
                        value={form.elevadores_manutencao}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Empresa Responsável</label>
                      <input
                        type="text"
                        name="empresa_elevadores"
                        value={form.empresa_elevadores}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status da Manutenção</label>
                      <input
                        type="text"
                        name="status_manutencao"
                        value={form.status_manutencao}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        placeholder="Ex: Em dia, Pendente, Atrasado"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    clearForm();
                    setActiveTab('dashboard');
                  }}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  {editingId ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-slate-900 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-bold">Ficha Técnica</h3>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-1">{selected.nome}</h4>
                <p className="text-sm text-slate-500 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selected.endereco}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">CNPJ</p>
                  <p className="font-medium text-slate-900">{selected.cnpj || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Dados Bancários</p>
                  <p className="font-medium text-slate-900">{selected.dados_bancarios || '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Moradores PNR</p>
                  <p className="font-medium text-slate-900">{selected.qtd_pnr ?? '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Moradores Civis</p>
                  <p className="font-medium text-slate-900">{selected.qtd_civis ?? '—'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Despesa Estimada</p>
                  <p className="font-medium text-slate-900">{formatCurrency(selected.despesa_estimada)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Saldo Fundo Reserva</p>
                  <p className="font-medium text-slate-900">{formatCurrency(selected.saldo_fundo_reserva)}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Projeto de Incêndio
                </p>
                {selected.projetos_incendio_link ? (
                  <a
                    href={selected.projetos_incendio_link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium break-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {selected.projetos_incendio_link}
                  </a>
                ) : (
                  <p className="text-slate-400">Nenhum link cadastrado</p>
                )}
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h5 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                  Elevadores
                </h5>
                {selected.possui_elevadores ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <p className="text-xs text-emerald-700 uppercase tracking-wide">Qtd. Total</p>
                      <p className="font-bold text-emerald-900 text-lg">{selected.qtd_elevadores ?? '—'}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-100">
                      <p className="text-xs text-emerald-700 uppercase tracking-wide">Empresa Responsável</p>
                      <p className="font-bold text-emerald-900">{selected.empresa_elevadores || '—'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Em Operação</p>
                      <p className="font-bold text-slate-900 text-lg">{selected.elevadores_operacao ?? '—'}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Em Manutenção</p>
                      <p className="font-bold text-slate-900 text-lg">{selected.elevadores_manutencao ?? '—'}</p>
                    </div>
                    <div className="sm:col-span-2 bg-white rounded-lg p-4 border border-slate-200">
                      <p className="text-xs text-slate-500 uppercase tracking-wide">Status da Manutenção</p>
                      <p className="font-bold text-slate-900">{selected.status_manutencao || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Não possui elevadores cadastrados.</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition font-medium"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    editCondominio(selected);
                    setSelected(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
