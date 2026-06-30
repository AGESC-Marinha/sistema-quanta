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
  saldo_reserva: '',
  projetos_incendio_link: '',
  possui_elevadores: false,
  empresa_elevadores: '',
  status_manutencao: '',
};

function App() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCondo, setSelectedCondo] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);

  const fetchCondominios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('condominios')
      .select('*')
      .order('nome');

    if (error) {
      console.error('Erro ao buscar condomínios:', error);
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

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      nome: form.nome,
      endereco: form.endereco,
      cnpj: form.cnpj,
      qtd_pnr: Number(form.qtd_pnr) || 0,
      qtd_civis: Number(form.qtd_civis) || 0,
      despesa_estimada: Number(form.despesa_estimada) || 0,
      dados_bancarios: form.dados_bancarios,
      saldo_reserva: Number(form.saldo_reserva) || 0,
      projetos_incendio_link: form.projetos_incendio_link,
      possui_elevadores: form.possui_elevadores,
      empresa_elevadores: form.empresa_elevadores,
      status_manutencao: form.status_manutencao,
    };

    if (editingId) {
      const { error } = await supabase
        .from('condominios')
        .update(payload)
        .eq('id', editingId);

      if (!error) {
        resetForm();
        fetchCondominios();
      } else {
        console.error('Erro ao atualizar:', error);
      }
    } else {
      const { error } = await supabase
        .from('condominios')
        .insert(payload);

      if (!error) {
        resetForm();
        fetchCondominios();
      } else {
        console.error('Erro ao inserir:', error);
      }
    }
  };

  const handleEdit = (cond) => {
    setForm({
      nome: cond.nome || '',
      endereco: cond.endereco || '',
      cnpj: cond.cnpj || '',
      qtd_pnr: cond.qtd_pnr ?? '',
      qtd_civis: cond.qtd_civis ?? '',
      despesa_estimada: cond.despesa_estimada ?? '',
      dados_bancarios: cond.dados_bancarios || '',
      saldo_reserva: cond.saldo_reserva ?? '',
      projetos_incendio_link: cond.projetos_incendio_link || '',
      possui_elevadores: cond.possui_elevadores || false,
      empresa_elevadores: cond.empresa_elevadores || '',
      status_manutencao: cond.status_manutencao || '',
    });
    setEditingId(cond.id);
    setActiveTab('gerenciar');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este condomínio?')) return;

    const { error } = await supabase
      .from('condominios')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchCondominios();
      if (selectedCondo && selectedCondo.id === id) setSelectedCondo(null);
    } else {
      console.error('Erro ao excluir:', error);
    }
  };

  const calculateTaxa = (cond) => {
    const divisor = Number(cond.qtd_pnr || 0) + Number(cond.qtd_civis || 0);
    if (!divisor) return 0;
    return (Number(cond.despesa_estimada || 0) / divisor) / 0.905;
  };

  const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

  const formInputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-blue-900 text-white p-4 shadow-md flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-7 h-7 text-green-400" />
          <h1 className="text-xl font-bold tracking-tight">Condomínios</h1>
        </div>

        <nav className="flex gap-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'dashboard'
                ? 'bg-green-500 text-white shadow'
                : 'bg-blue-800 hover:bg-blue-700'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('gerenciar')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              activeTab === 'gerenciar'
                ? 'bg-green-500 text-white shadow'
                : 'bg-blue-800 hover:bg-blue-700'
            }`}
          >
            <Settings className="w-4 h-4" />
            Gerenciar
          </button>
        </nav>
      </header>

      <main className="p-4 max-w-7xl mx-auto">
        {loading && (
          <div className="mt-16 flex flex-col items-center justify-center gap-2 text-blue-900">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-medium">Carregando condomínios...</span>
          </div>
        )}

        {!loading && activeTab === 'dashboard' && (
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-blue-900">
              <LayoutDashboard className="w-6 h-6 text-green-600" />
              Dashboard
            </h2>

            {condominios.length === 0 ? (
              <p className="text-slate-500">Nenhum condomínio cadastrado.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {condominios.map((cond) => (
                  <button
                    key={cond.id}
                    onClick={() => setSelectedCondo(cond)}
                    className="text-left rounded-xl border-l-4 border-green-500 bg-white p-5 shadow transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-900" />
                      <h3 className="text-lg font-bold text-blue-900">{cond.nome}</h3>
                    </div>
                    <div className="mb-2 flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <span>{cond.endereco}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Taxa Unitária: {formatCurrency(calculateTaxa(cond))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {!loading && activeTab === 'gerenciar' && (
          <section>
            <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-blue-900">
              <Settings className="w-6 h-6 text-green-600" />
              Gerenciar Condomínios
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mb-8 rounded-xl bg-white p-6 shadow"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Nome
                  </label>
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    className={formInputClass}
                    placeholder="Nome do condomínio"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Endereço
                  </label>
                  <input
                    type="text"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    required
                    className={formInputClass}
                    placeholder="Endereço completo"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    CNPJ
                  </label>
                  <input
                    type="text"
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleChange}
                    className={formInputClass}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Qtd PNR
                  </label>
                  <input
                    type="number"
                    name="qtd_pnr"
                    value={form.qtd_pnr}
                    onChange={handleChange}
                    min="0"
                    className={formInputClass}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Qtd Civis
                  </label>
                  <input
                    type="number"
                    name="qtd_civis"
                    value={form.qtd_civis}
                    onChange={handleChange}
                    min="0"
                    className={formInputClass}
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Despesa Estimada
                  </label>
                  <input
                    type="number"
                    name="despesa_estimada"
                    value={form.despesa_estimada}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={formInputClass}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Dados Bancários
                  </label>
                  <input
                    type="text"
                    name="dados_bancarios"
                    value={form.dados_bancarios}
                    onChange={handleChange}
                    className={formInputClass}
                    placeholder="Banco, agência, conta..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Saldo Reserva
                  </label>
                  <input
                    type="number"
                    name="saldo_reserva"
                    value={form.saldo_reserva}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={formInputClass}
                    placeholder="R$ 0,00"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Projetos Incêndio (Link)
                  </label>
                  <input
                    type="url"
                    name="projetos_incendio_link"
                    value={form.projetos_incendio_link}
                    onChange={handleChange}
                    className={formInputClass}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Empresa Elevadores
                  </label>
                  <input
                    type="text"
                    name="empresa_elevadores"
                    value={form.empresa_elevadores}
                    onChange={handleChange}
                    className={formInputClass}
                    placeholder="Nome da empresa"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Status Manutenção
                  </label>
                  <input
                    type="text"
                    name="status_manutencao"
                    value={form.status_manutencao}
                    onChange={handleChange}
                    className={formInputClass}
                    placeholder="Em dia, pendente, etc."
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      name="possui_elevadores"
                      checked={form.possui_elevadores}
                      onChange={handleChange}
                      className="h-4 w-4 accent-green-600"
                    />
                    Possui Elevadores
                  </label>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow transition hover:bg-green-500"
                >
                  {editingId ? (
                    <>
                      <Pencil className="w-4 h-4" /> Atualizar Condomínio
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" /> Salvar Condomínio
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex items-center gap-2 rounded-lg bg-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-300"
                  >
                    <XCircle className="w-4 h-4" /> Cancelar
                  </button>
                )}
              </div>
            </form>

            {condominios.length === 0 ? (
              <p className="text-slate-500">Nenhum condomínio para listar.</p>
            ) : (
              <ul className="space-y-3">
                {condominios.map((cond) => (
                  <li
                    key={cond.id}
                    className="flex flex-col justify-between gap-3 rounded-lg bg-white p-4 shadow md:flex-row md:items-center"
                  >
                    <div>
                      <h3 className="font-bold text-blue-900">{cond.nome}</h3>
                      <p className="text-sm text-slate-600">{cond.endereco}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cond)}
                        className="flex items-center gap-2 rounded-lg bg-blue-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
                      >
                        <Pencil className="w-4 h-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cond.id)}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-500"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {selectedCondo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-blue-900">
                <Building2 className="w-6 h-6 text-green-600" />
                Ficha Técnica
              </h2>
              <button
                onClick={() => setSelectedCondo(null)}
                className="text-slate-500 transition hover:text-red-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Nome:</span>
                  <p className="text-slate-900">{selectedCondo.nome}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Endereço:</span>
                  <p className="text-slate-900">{selectedCondo.endereco}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">CNPJ:</span>
                  <p className="text-slate-900">{selectedCondo.cnpj}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Qtd PNR:</span>
                  <p className="text-slate-900">{selectedCondo.qtd_pnr}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Qtd Civis:</span>
                  <p className="text-slate-900">{selectedCondo.qtd_civis}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Despesa Estimada:</span>
                  <p className="text-slate-900">{formatCurrency(selectedCondo.despesa_estimada)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Taxa Unitária:</span>
                  <p className="text-slate-900">{formatCurrency(calculateTaxa(selectedCondo))}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CreditCard className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Dados Bancários:</span>
                  <p className="text-slate-900">{selectedCondo.dados_bancarios}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <DollarSign className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Saldo Reserva:</span>
                  <p className="text-slate-900">{formatCurrency(selectedCondo.saldo_reserva)}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Flame className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Projetos Incêndio:</span>
                  <p className="break-all text-slate-900">
                    {selectedCondo.projetos_incendio_link ? (
                      <a
                        href={selectedCondo.projetos_incendio_link}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                      >
                        Acessar link <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ArrowUpCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Possui Elevadores:</span>
                  <p className="text-slate-900">{selectedCondo.possui_elevadores ? 'Sim' : 'Não'}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Empresa Elevadores:</span>
                  <p className="text-slate-900">{selectedCondo.empresa_elevadores}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Settings className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <div>
                  <span className="font-semibold text-slate-700">Status Manutenção:</span>
                  <p className="text-slate-900">{selectedCondo.status_manutencao}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedCondo(null)}
                className="flex items-center gap-2 rounded-lg bg-blue-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800"
              >
                <XCircle className="w-4 h-4" /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
