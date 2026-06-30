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
} from 'lucide-react';

const SUPABASE_URL = 'https://bjeklbralayvulcuqiqe.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'SUA_CHAVE_ANON_AQUI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const initialForm = {
  nome: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  cnpj: '',
  quantidade_unidades: '',
  nome_sindico: '',
  telefone_sindico: '',
  email_sindico: '',
  valor_total: '',
  dados_bancarios: '',
  saldo_fundo_reserva: '',
  projetos_incendio: '',
  possui_elevadores: false,
  qtd_elevadores: '',
  empresa_elevadores: '',
  status_manutencao: 'Em dia',
};

const statusOptions = [
  'Em dia',
  'Pendente',
  'Atrasado',
  'Em andamento',
  'Sem contrato',
  'Outro',
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchCondominios();
  }, []);

  const fetchCondominios = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: supaError } = await supabase
        .from('condominios')
        .select('*')
        .order('created_at', { ascending: false });

      if (supaError) throw supaError;
      setCondominios(data || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar condomínios.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numeric = value.replace(/[^\d.]/g, '');
    setForm((prev) => ({ ...prev, [name]: numeric }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      quantidade_unidades: Number(form.quantidade_unidades) || 0,
      valor_total: Number(form.valor_total) || 0,
      saldo_fundo_reserva: Number(form.saldo_fundo_reserva) || 0,
      qtd_elevadores: form.possui_elevadores
        ? Number(form.qtd_elevadores) || 0
        : 0,
      empresa_elevadores: form.possui_elevadores
        ? form.empresa_elevadores
        : '',
      status_manutencao: form.possui_elevadores
        ? form.status_manutencao
        : 'Não aplicável',
    };

    try {
      if (editingId) {
        const { error: supaError } = await supabase
          .from('condominios')
          .update(payload)
          .eq('id', editingId);
        if (supaError) throw supaError;
      } else {
        const { error: supaError } = await supabase
          .from('condominios')
          .insert(payload);
        if (supaError) throw supaError;
      }

      resetForm();
      setActiveTab('dashboard');
      await fetchCondominios();
    } catch (err) {
      setError(err.message || 'Erro ao salvar condomínio.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      ...initialForm,
      ...item,
      possui_elevadores: Boolean(item.possui_elevadores),
    });
    setEditingId(item.id);
    setActiveTab('gerenciar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este condomínio?')) {
      return;
    }

    setLoading(true);
    try {
      const { error: supaError } = await supabase
        .from('condominios')
        .delete()
        .eq('id', id);
      if (supaError) throw supaError;
      await fetchCondominios();
    } catch (err) {
      setError(err.message || 'Erro ao excluir condomínio.');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const calcularTaxaUnitaria = (valorTotal, unidades) => {
    if (!valorTotal || !unidades || unidades <= 0) return 0;
    return valorTotal / 0.905 / unidades;
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '-';
    const digits = String(cnpj).replace(/\D/g, '');
    if (digits.length !== 14) return cnpj;
    return digits.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Gestão de Condomínios
              </h1>
            </div>

            <nav className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('gerenciar');
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'gerenciar'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
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
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Dashboard
                </h2>
                <p className="text-sm text-gray-500">
                  Visão geral dos condomínios cadastrados
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('gerenciar');
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Novo Condomínio
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                Carregando...
              </div>
            ) : condominios.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  Nenhum condomínio cadastrado
                </h3>
                <p className="text-gray-500 mt-1">
                  Clique em "Novo Condomínio" para começar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {condominios.map((item) => {
                  const taxaUnitaria = calcularTaxaUnitaria(
                    item.valor_total,
                    item.quantidade_unidades
                  );

                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2.5 rounded-lg">
                            <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900 line-clamp-1">
                              {item.nome || 'Sem nome'}
                            </h3>
                            <p className="text-xs text-gray-500">
                              CNPJ: {formatCNPJ(item.cnpj)}
                            </p>
                          </div>
                        </div>
                        {item.possui_elevadores && (
                          <div
                            className="bg-orange-50 p-2 rounded-lg"
                            title="Possui elevadores"
                          >
                            <ArrowUpCircle className="w-5 h-5 text-orange-500" />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs font-medium">Cidade</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.cidade || '-'}
                            {item.estado ? `/${item.estado}` : ''}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <Users className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Unidades
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {item.quantidade_unidades || 0}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Valor Total
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.valor_total)}
                          </p>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-gray-500 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Taxa Unitária
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {formatCurrency(taxaUnitaria)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {activeTab === 'gerenciar' && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingId ? 'Editar Condomínio' : 'Cadastrar Condomínio'}
              </h2>
              <p className="text-sm text-gray-500">
                Preencha os dados abaixo para{' '}
                {editingId ? 'atualizar' : 'cadastrar'} o condomínio.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8"
            >
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    Informações Básicas
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Condomínio
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={form.nome}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ
                      </label>
                      <input
                        type="text"
                        name="cnpj"
                        value={form.cnpj}
                        onChange={handleInputChange}
                        placeholder="00.000.000/0000-00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Endereço
                      </label>
                      <input
                        type="text"
                        name="endereco"
                        value={form.endereco}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade
                      </label>
                      <input
                        type="text"
                        name="cidade"
                        value={form.cidade}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <input
                        type="text"
                        name="estado"
                        value={form.estado}
                        onChange={handleInputChange}
                        maxLength={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        name="cep"
                        value={form.cep}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Síndico
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome do Síndico
                      </label>
                      <input
                        type="text"
                        name="nome_sindico"
                        value={form.nome_sindico}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Telefone do Síndico
                      </label>
                      <input
                        type="text"
                        name="telefone_sindico"
                        value={form.telefone_sindico}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        E-mail do Síndico
                      </label>
                      <input
                        type="email"
                        name="email_sindico"
                        value={form.email_sindico}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Financeiro
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantidade de Unidades
                      </label>
                      <input
                        type="text"
                        name="quantidade_unidades"
                        value={form.quantidade_unidades}
                        onChange={handleNumberChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Total (R$)
                      </label>
                      <input
                        type="text"
                        name="valor_total"
                        value={form.valor_total}
                        onChange={handleNumberChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Saldo Fundo Reserva (R$)
                      </label>
                      <input
                        type="text"
                        name="saldo_fundo_reserva"
                        value={form.saldo_fundo_reserva}
                        onChange={handleNumberChange}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dados Bancários
                      </label>
                      <input
                        type="text"
                        name="dados_bancarios"
                        value={form.dados_bancarios}
                        onChange={handleInputChange}
                        placeholder="Banco, Agência, Conta, Chave Pix"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-blue-600" />
                    Elevadores
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
                      <input
                        type="checkbox"
                        id="possui_elevadores"
                        name="possui_elevadores"
                        checked={form.possui_elevadores}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label
                        htmlFor="possui_elevadores"
                        className="text-sm font-medium text-gray-700"
                      >
                        Possui Elevadores
                      </label>
                    </div>

                    {form.possui_elevadores && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantidade de Elevadores
                          </label>
                          <input
                            type="text"
                            name="qtd_elevadores"
                            value={form.qtd_elevadores}
                            onChange={handleNumberChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Empresa de Elevadores
                          </label>
                          <input
                            type="text"
                            name="empresa_elevadores"
                            value={form.empresa_elevadores}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status de Manutenção
                          </label>
                          <select
                            name="status_manutencao"
                            value={form.status_manutencao}
                            onChange={handleInputChange}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors bg-white"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Flame className="w-5 h-5 text-blue-600" />
                    Projetos de Incêndio
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Detalhes dos Projetos de Incêndio
                    </label>
                    <textarea
                      name="projetos_incendio"
                      value={form.projetos_incendio}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Descreva os projetos de prevenção e combate a incêndio do condomínio"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab('dashboard');
                  }}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    <Pencil className="w-4 h-4" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  {saving
                    ? 'Salvando...'
                    : editingId
                    ? 'Atualizar Condomínio'
                    : 'Salvar Condomínio'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
