import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard,
  Settings,
  Building2,
  PlusCircle,
  Trash2,
  AlertCircle,
  Users,
  MapPin,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TABELA = 'gestao_condominios';
const VIEW = 'view_gestao_condominios';

const emptyForm = {
  nome: '',
  endereco: '',
  qtd_pnr: '',
  qtd_civis: '',
  despesa_estimada: '',
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCondominios = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: supaError } = await supabase
        .from(VIEW)
        .select('*')
        .order('nome');
      if (supaError) throw supaError;
      setCondominios(data || []);
    } catch (err) {
      setError(err?.message || 'Erro ao carregar condomínios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCondominios();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const payload = {
        nome: form.nome.trim(),
        endereco: form.endereco.trim(),
        qtd_pnr: Number(form.qtd_pnr) || 0,
        qtd_civis: Number(form.qtd_civis) || 0,
        despesa_estimada: Number(form.despesa_estimada) || 0,
      };

      const { error: supaError } = await supabase.from(TABELA).insert([payload]);
      if (supaError) throw supaError;

      setForm(emptyForm);
      await fetchCondominios();
      setActiveTab('dashboard');
    } catch (err) {
      setError(err?.message || 'Erro ao cadastrar condomínio.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este condomínio?')) return;
    try {
      setLoading(true);
      setError(null);
      const { error: supaError } = await supabase.from(TABELA).delete().eq('id', id);
      if (supaError) throw supaError;
      await fetchCondominios();
    } catch (err) {
      setError(err?.message || 'Erro ao excluir condomínio.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value) || 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Gestão de Condomínios</h1>
          </div>
          <button
            onClick={fetchCondominios}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('gerenciar')}
              className={`flex items-center gap-2 py-4 border-b-2 text-sm font-medium transition-colors ${
                activeTab === 'gerenciar'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Settings className="w-4 h-4" />
              Gerenciar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">Ocorreu um erro</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Dashboard</h2>
            {loading && condominios.length === 0 ? (
              <p className="text-slate-500">Carregando...</p>
            ) : condominios.length === 0 ? (
              <p className="text-slate-500">Nenhum condomínio cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {condominios.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-indigo-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="font-semibold text-slate-900 truncate">{item.nome}</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{item.endereco}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>PNR: {item.qtd_pnr} | Civis: {item.qtd_civis}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatCurrency(item.despesa_estimada)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'gerenciar' && (
          <section className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">Cadastrar Condomínio</h2>
              </div>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. PNR</label>
                  <input
                    type="number"
                    name="qtd_pnr"
                    min="0"
                    value={form.qtd_pnr}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qtd. Civis</label>
                  <input
                    type="number"
                    name="qtd_civis"
                    min="0"
                    value={form.qtd_civis}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Despesa Estimada</label>
                  <input
                    type="number"
                    name="despesa_estimada"
                    min="0"
                    step="0.01"
                    value={form.despesa_estimada}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Cadastrar
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-slate-900">Excluir Condomínios</h2>
              </div>
              {condominios.length === 0 ? (
                <p className="text-slate-500">Nenhum condomínio disponível para exclusão.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {condominios.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{item.nome}</p>
                        <p className="text-sm text-slate-500">{item.endereco}</p>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Erro global capturado no App:', error, errorInfo);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-8 text-center">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Algo deu errado</h2>
            <p className="text-slate-600 mb-6">
              O aplicativo encontrou um problema inesperado. Tente recarregar a página para continuar.
            </p>
            {this.state.error?.message && (
              <p className="text-xs text-slate-400 mb-6 break-words">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AppWithErrorBoundary() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
