import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, MapPin, Users, Trash2, LayoutDashboard, Settings } from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    cidade: '',
    estado: '',
    quantidade_unidades: '',
    quantidade_moradores: '',
    situacao: 'Ativo'
  });

  useEffect(() => {
    fetchCondominios();
  }, []);

  async function fetchCondominios() {
    setLoading(true);
    const { data, error } = await supabase
      .from('view_gestao_condominios')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.error('Erro ao carregar condomínios:', error);
      setCondominios([]);
    } else {
      setCondominios(data || []);
    }
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      endereco: form.endereco,
      cidade: form.cidade,
      estado: form.estado,
      quantidade_unidades: Number(form.quantidade_unidades) || 0,
      quantidade_moradores: Number(form.quantidade_moradores) || 0,
      situacao: form.situacao
    };

    const { error } = await supabase.from('condominios').insert([payload]);
    if (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao cadastrar condomínio.');
    } else {
      setForm({
        nome: '',
        endereco: '',
        cidade: '',
        estado: '',
        quantidade_unidades: '',
        quantidade_moradores: '',
        situacao: 'Ativo'
      });
      fetchCondominios();
      setActiveTab('dashboard');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Deseja realmente excluir este condomínio?')) return;
    const { error } = await supabase.from('condominios').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir condomínio.');
    } else {
      fetchCondominios();
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Gestão de Condomínios
          </h1>
          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('gerenciar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === 'gerenciar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Gerenciar
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <LayoutDashboard className="w-6 h-6 text-blue-600" />
              Dashboard
            </h2>
            {loading ? (
              <p className="text-gray-500">Carregando...</p>
            ) : condominios.length === 0 ? (
              <p className="text-gray-500">Nenhum condomínio encontrado.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {condominios.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          item.situacao === 'Ativo'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.situacao || 'Ativo'}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.nome}</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {item.endereco}, {item.cidade} - {item.estado}
                      </p>
                      <p className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {item.quantidade_moradores} moradores
                      </p>
                      <p className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {item.quantidade_unidades} unidades
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'gerenciar' && (
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-blue-600" />
              Gerenciar Condomínios
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Cadastrar Condomínio</h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                  <input
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input
                    type="text"
                    name="cidade"
                    value={form.cidade}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <input
                    type="text"
                    name="estado"
                    value={form.estado}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidades</label>
                  <input
                    type="number"
                    name="quantidade_unidades"
                    value={form.quantidade_unidades}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moradores</label>
                  <input
                    type="number"
                    name="quantidade_moradores"
                    value={form.quantidade_moradores}
                    onChange={handleChange}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Situação</label>
                  <select
                    name="situacao"
                    value={form.situacao}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Cadastrar
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <h3 className="text-lg font-semibold p-6 border-b border-gray-200">Lista de Condomínios</h3>
              {loading ? (
                <p className="p-6 text-gray-500">Carregando...</p>
              ) : condominios.length === 0 ? (
                <p className="p-6 text-gray-500">Nenhum condomínio cadastrado.</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {condominios.map((item) => (
                    <li
                      key={item.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{item.nome}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.endereco}, {item.cidade} - {item.estado}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Excluir"
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
