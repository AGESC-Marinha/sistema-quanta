import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xyzcompany.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [aba, setAba] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    unidades: 0,
    taxa_condominio: 0,
    status_pagamento: 'Em dia',
    status_manutencao: 'Em dia',
    elevadores_operacao: 0,
    elevadores_manutencao: 0,
  });

  useEffect(() => {
    carregarCondominios();
  }, []);

  async function carregarCondominios() {
    setLoading(true);
    const { data, error } = await supabase.from('condominios').select('*');
    if (!error && data) {
      setCondominios(data);
    }
    setLoading(false);
  }

  function handleEdit(cond) {
    setEditando(cond.id);
    setFormData({
      nome: cond.nome || '',
      endereco: cond.endereco || '',
      unidades: cond.unidades || 0,
      taxa_condominio: cond.taxa_condominio || 0,
      status_pagamento: cond.status_pagamento || 'Em dia',
      status_manutencao: cond.status_manutencao || 'Em dia',
      elevadores_operacao: cond.elevadores_operacao || 0,
      elevadores_manutencao: cond.elevadores_manutencao || 0,
    });
  }

  function handleCancel() {
    setEditando(null);
    setFormData({
      nome: '',
      endereco: '',
      unidades: 0,
      taxa_condominio: 0,
      status_pagamento: 'Em dia',
      status_manutencao: 'Em dia',
      elevadores_operacao: 0,
      elevadores_manutencao: 0,
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    const payload = {
      nome: formData.nome,
      endereco: formData.endereco,
      unidades: parseInt(formData.unidades) || 0,
      taxa_condominio: parseFloat(formData.taxa_condominio) || 0,
      status_pagamento: formData.status_pagamento,
      status_manutencao: formData.status_manutencao,
      elevadores_operacao: parseInt(formData.elevadores_operacao) || 0,
      elevadores_manutencao: parseInt(formData.elevadores_manutencao) || 0,
    };
    if (editando) {
      await supabase.from('condominios').update(payload).eq('id', editando);
    } else {
      await supabase.from('condominios').insert([payload]);
    }
    handleCancel();
    carregarCondominios();
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const totalUnidades = condominios.reduce((acc, c) => acc + (c.unidades || 0), 0);
  const totalTaxa = condominios.reduce((acc, c) => acc + (c.taxa_condominio || 0), 0);
  const indiceEficiencia = totalUnidades > 0 ? (totalTaxa / totalUnidades) * 0.905 : 0;
  const totalElevadoresOperacao = condominios.reduce((acc, c) => acc + (c.elevadores_operacao || 0), 0);
  const totalElevadoresManutencao = condominios.reduce((acc, c) => acc + (c.elevadores_manutencao || 0), 0);

  const inputClass = 'w-full px-4 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900';
  const labelClass = 'block text-sm font-semibold text-slate-700 mb-1';
  const cardClass = 'bg-white border-2 border-blue-900 rounded-3xl p-6 shadow-lg';

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-blue-900 text-white px-6 py-4 shadow-md">
        <h1 className="text-2xl font-bold">Sistema Quanta Gestão - AGESC</h1>
        <p className="text-sm text-blue-200">Versão 1.1</p>
      </header>

      <nav className="bg-slate-800 px-6 py-3 flex gap-4">
        <button
          onClick={() => setAba('dashboard')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${aba === 'dashboard' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setAba('gerenciar')}
          className={`px-4 py-2 rounded-xl font-semibold transition ${aba === 'gerenciar' ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        >
          Gerenciar
        </button>
      </nav>

      <main className="p-6">
        {loading && <p className="text-slate-600">Carregando...</p>}

        {aba === 'dashboard' && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Total de Unidades</h2>
              <p className="text-4xl font-extrabold text-emerald-600">{totalUnidades}</p>
              <p className="text-sm text-slate-500 mt-2">Unidades gerenciadas</p>
            </div>
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Arrecadação Total</h2>
              <p className="text-4xl font-extrabold text-emerald-600">R$ {totalTaxa.toFixed(2)}</p>
              <p className="text-sm text-slate-500 mt-2">Taxas de condomínio</p>
            </div>
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Índice de Eficiência</h2>
              <p className="text-4xl font-extrabold text-emerald-600">{indiceEficiencia.toFixed(2)}</p>
              <p className="text-sm text-slate-500 mt-2">Cálculo: (taxa/unidades) × 0.905</p>
            </div>
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Elevadores em Operação</h2>
              <p className="text-4xl font-extrabold text-blue-700">{totalElevadoresOperacao}</p>
              <p className="text-sm text-slate-500 mt-2">Total operacional</p>
            </div>
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Elevadores em Manutenção</h2>
              <p className="text-4xl font-extrabold text-blue-700">{totalElevadoresManutencao}</p>
              <p className="text-sm text-slate-500 mt-2">Total em manutenção</p>
            </div>
            <div className={cardClass}>
              <h2 className="text-lg font-bold text-blue-900 mb-2">Condomínios Cadastrados</h2>
              <p className="text-4xl font-extrabold text-emerald-600">{condominios.length}</p>
              <p className="text-sm text-slate-500 mt-2">Total de registros</p>
            </div>
          </div>
        )}

        {aba === 'gerenciar' && !loading && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-blue-900">Gerenciar Condomínios</h2>
              <button
                onClick={() => { setEditando(null); handleCancel(); }}
                className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition"
              >
                Novo Condomínio
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={cardClass}>
                <h3 className="text-lg font-bold text-blue-900 mb-4">
                  {editando ? 'Editar Condomínio' : 'Cadastrar Condomínio'}
                </h3>
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className={labelClass}>Nome</label>
                    <input type="text" name="nome" value={formData.nome} onChange={handleChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Endereço</label>
                    <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Unidades</label>
                    <input type="number" name="unidades" value={formData.unidades} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className={labelClass}>Taxa de Condomínio (R$)</label>
                    <input type="number" step="0.01" name="taxa_condominio" value={formData.taxa_condominio} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className={labelClass}>Status de Pagamento</label>
                    <select name="status_pagamento" value={formData.status_pagamento} onChange={handleChange} className={inputClass}>
                      <option value="Em dia">Em dia</option>
                      <option value="Atrasado">Atrasado</option>
                      <option value="Inadimplente">Inadimplente</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Status de Manutenção</label>
                    <select name="status_manutencao" value={formData.status_manutencao} onChange={handleChange} className={inputClass}>
                      <option value="Em dia">Em dia</option>
                      <option value="Pendente">Pendente</option>
                      <option value="Atrasada">Atrasada</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Elevadores em Operação</label>
                    <input type="number" name="elevadores_operacao" value={formData.elevadores_operacao} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className={labelClass}>Elevadores em Manutenção</label>
                    <input type="number" name="elevadores_manutencao" value={formData.elevadores_manutencao} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" className="px-6 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition">
                      Salvar
                    </button>
                    <button type="button" onClick={handleCancel} className="px-6 py-2 bg-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-400 transition">
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>

              <div className={cardClass}>
                <h3 className="text-lg font-bold text-blue-900 mb-4">Lista de Condomínios</h3>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {condominios.length === 0 && (
                    <p className="text-slate-500 text-sm">Nenhum condomínio cadastrado.</p>
                  )}
                  {condominios.map((cond) => (
                    <div key={cond.id} className="border border-slate-200 rounded-xl p-4 hover:border-blue-900 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-slate-800">{cond.nome}</h4>
                          <p className="text-sm text-slate-500">{cond.endereco}</p>
                          <p className="text-sm text-slate-600 mt-1">Unidades: {cond.unidades} | Taxa: R$ {(cond.taxa_condominio || 0).toFixed(2)}</p>
                          <p className="text-sm text-slate-600">Pagamento: {cond.status_pagamento} | Manutenção: {cond.status_manutencao || 'N/A'}</p>
                          <p className="text-sm text-slate-600">Elevadores: {cond.elevadores_operacao || 0} em operação, {cond.elevadores_manutencao || 0} em manutenção</p>
                        </div>
                        <button
                          onClick={() => handleEdit(cond)}
                          className="px-3 py-1 bg-blue-900 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-800 text-slate-400 text-center py-4 mt-8">
        <p className="text-sm">Sistema Quanta Gestão AGESC - V1.1</p>
      </footer>
    </div>
  );
}
