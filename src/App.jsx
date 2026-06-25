import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';

const supabase = createClient(supabaseUrl, supabaseKey);

export default function GerenciarCondominios() {
  const [condominios, setCondominios] = useState([]);
  const [form, setForm] = useState({
    nome: '',
    endereco: '',
    qtd_pnr: '',
    qtd_civis: '',
    despesa_estimada: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function fetchCondominios() {
    const { data, error } = await supabase
      .from('condominios')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      setError(error.message);
      return;
    }

    setCondominios(data || []);
  }

  useEffect(() => {
    fetchCondominios();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.from('condominios').insert({
      nome: form.nome,
      endereco: form.endereco,
      qtd_pnr: Number(form.qtd_pnr),
      qtd_civis: Number(form.qtd_civis),
      despesa_estimada: Number(form.despesa_estimada),
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setForm({
      nome: '',
      endereco: '',
      qtd_pnr: '',
      qtd_civis: '',
      despesa_estimada: '',
    });

    await fetchCondominios();
  }

  async function handleDelete(id) {
    if (!confirm('Deseja realmente excluir este condomínio?')) return;

    setError(null);

    const { error } = await supabase.from('condominios').delete().eq('id', id);

    if (error) {
      setError(error.message);
      return;
    }

    await fetchCondominios();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">Gerenciar Condomínios</h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 rounded-lg bg-white p-6 shadow md:grid-cols-2"
        >
          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-gray-700">Nome</label>
            <input
              type="text"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              required
              className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-gray-700">Endereço</label>
            <input
              type="text"
              name="endereco"
              value={form.endereco}
              onChange={handleChange}
              required
              className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-gray-700">Qtd. PNR</label>
            <input
              type="number"
              name="qtd_pnr"
              value={form.qtd_pnr}
              onChange={handleChange}
              required
              min="0"
              className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 text-sm font-semibold text-gray-700">Qtd. Civis</label>
            <input
              type="number"
              name="qtd_civis"
              value={form.qtd_civis}
              onChange={handleChange}
              required
              min="0"
              className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col md:col-span-2">
            <label className="mb-1 text-sm font-semibold text-gray-700">Despesa Estimada</label>
            <input
              type="number"
              name="despesa_estimada"
              value={form.despesa_estimada}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="rounded-md border border-gray-300 p-2 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Condomínio'}
            </button>
          </div>

          {error && (
            <p className="md:col-span-2 text-sm text-red-600">{error}</p>
          )}
        </form>

        <div className="overflow-x-auto rounded-lg bg-white shadow">
          <table className="min-w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Endereço</th>
                <th className="px-4 py-3">Qtd. PNR</th>
                <th className="px-4 py-3">Qtd. Civis</th>
                <th className="px-4 py-3">Despesa Estimada</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {condominios.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                    Nenhum condomínio cadastrado.
                  </td>
                </tr>
              ) : (
                condominios.map((cond) => (
                  <tr key={cond.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{cond.nome}</td>
                    <td className="px-4 py-3">{cond.endereco}</td>
                    <td className="px-4 py-3">{cond.qtd_pnr}</td>
                    <td className="px-4 py-3">{cond.qtd_civis}</td>
                    <td className="px-4 py-3">
                      {Number(cond.despesa_estimada).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(cond.id)}
                        className="rounded-md bg-red-600 px-3 py-1 text-white hover:bg-red-700"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
