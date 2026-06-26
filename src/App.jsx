import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error(
    'Chave anon do Supabase não configurada. Defina VITE_SUPABASE_ANON_KEY (Vite) ou REACT_APP_SUPABASE_ANON_KEY (CRA).'
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const calcularTaxaUnitaria = (totalAPagar, areaTotal) => {
  const divisor = areaTotal * 0.905;
  if (!divisor || divisor === 0) return 0;
  return Number((totalAPagar / divisor).toFixed(4));
};

export default function App() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    nome: '',
    cnpj: '',
    total_a_pagar: '',
    area_total: '',
  });

  const fetchCondominios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('condominios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCondominios(data || []);
    } catch (err) {
      console.error('Erro ao buscar condomínios:', err);
      alert('Erro ao buscar condomínios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCondominios();
  }, []);

  const resumo = useMemo(() => {
    const totalCondominios = condominios.length;
    const areaTotal = condominios.reduce((acc, c) => acc + Number(c.area_total || 0), 0);
    const valorTotal = condominios.reduce((acc, c) => acc + Number(c.total_a_pagar || 0), 0);
    const taxaMedia =
      totalCondominios > 0
        ? Number((condominios.reduce((acc, c) => acc + Number(c.taxa_unitária || 0), 0) / totalCondominios).toFixed(4))
        : 0;
    return { totalCondominios, areaTotal, valorTotal, taxaMedia };
  }, [condominios]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({ nome: '', cnpj: '', total_a_pagar: '', area_total: '' });
    setEditingId(null);
  };

  const handleEdit = (cond) => {
    setEditingId(cond.id);
    setForm({
      nome: cond.nome || '',
      cnpj: cond.cnpj || '',
      total_a_pagar: cond.total_a_pagar ?? '',
      area_total: cond.area_total ?? '',
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este condomínio?')) return;

    try {
      setLoading(true);
      const { error } = await supabase.from('condominios').delete().eq('id', id);
      if (error) throw error;
      await fetchCondominios();
    } catch (err) {
      console.error('Erro ao excluir:', err);
      alert('Erro ao excluir: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalAPagar = parseFloat(form.total_a_pagar) || 0;
    const areaTotal = parseFloat(form.area_total) || 0;
    const taxaUnitaria = calcularTaxaUnitaria(totalAPagar, areaTotal);

    const payload = {
      nome: form.nome.trim(),
      cnpj: form.cnpj.trim(),
      total_a_pagar: totalAPagar,
      area_total: areaTotal,
      taxa_unitária: taxaUnitaria,
    };

    try {
      setLoading(true);

      if (editingId) {
        const { data, error } = await supabase
          .from('condominios')
          .update(payload)
          .eq('id', editingId)
          .select();

        if (error) throw error;
        console.log('Update realizado com sucesso:', data);
      } else {
        const { error } = await supabase.from('condominios').insert([payload]);
        if (error) throw error;
      }

      await fetchCondominios();
      resetForm();
    } catch (err) {
      console.error('Erro ao salvar condomínio:', err);
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f8; color: #333; }
        .app { max-width: 1200px; margin: 0 auto; padding: 24px; }
        h1, h2 { color: #1a237e; margin: 0 0 16px; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        .card h3 { margin: 0 0 8px; font-size: 14px; color: #546e7a; text-transform: uppercase; }
        .card p { margin: 0; font-size: 24px; font-weight: 700; color: #0d47a1; }
        .form-section { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .form-group { display: flex; flex-direction: column; }
        .form-group label { font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #37474f; }
        .form-group input { padding: 10px; border: 1px solid #cfd8dc; border-radius: 8px; font-size: 14px; }
        .form-actions { margin-top: 20px; display: flex; gap: 12px; }
        button { padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 14px; transition: opacity .2s; }
        button:disabled { opacity: .6; cursor: not-allowed; }
        .btn-primary { background: #0d47a1; color: #fff; }
        .btn-secondary { background: #78909c; color: #fff; }
        .btn-edit { background: #0288d1; color: #fff; margin-right: 8px; }
        .btn-delete { background: #d32f2f; color: #fff; }
        table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
        thead { background: #1a237e; color: #fff; }
        th, td { padding: 14px 16px; text-align: left; font-size: 14px; }
        tbody tr:nth-child(even) { background: #f8f9fa; }
        .empty { text-align: center; padding: 24px; color: #78909c; }
      `}</style>

      <h1>Dashboard de Condomínios</h1>

      <div className="dashboard">
        <div className="card">
          <h3>Condomínios</h3>
          <p>{resumo.totalCondominios}</p>
        </div>
        <div className="card">
          <h3>Área Total</h3>
          <p>{resumo.areaTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²</p>
        </div>
        <div className="card">
          <h3>Valor Total a Pagar</h3>
          <p>
            R${' '}
            {resumo.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card">
          <h3>Taxa Unitária Média</h3>
          <p>R$ {resumo.taxaMedia.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</p>
        </div>
      </div>

      <div className="form-section">
        <h2>{editingId ? 'Editar Condomínio' : 'Novo Condomínio'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input id="nome" name="nome" value={form.nome} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label htmlFor="cnpj">CNPJ</label>
              <input id="cnpj" name="cnpj" value={form.cnpj} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="total_a_pagar">Total a Pagar (R$)</label>
              <input
                id="total_a_pagar"
                name="total_a_pagar"
                type="number"
                step="0.01"
                min="0"
                value={form.total_a_pagar}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="area_total">Área Total (m²)</label>
              <input
                id="area_total"
                name="area_total"
                type="number"
                step="0.01"
                min="0"
                value={form.area_total}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Salvando...' : editingId ? 'Atualizar' : 'Salvar'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm} disabled={loading}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="table-section">
        <h2>Listagem</h2>
        {condominios.length === 0 ? (
          <div className="card empty">Nenhum condomínio encontrado.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Total a Pagar</th>
                <th>Área Total</th>
                <th>Taxa Unitária</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {condominios.map((c) => (
                <tr key={c.id}>
                  <td>{c.nome}</td>
                  <td>{c.cnpj}</td>
                  <td>
                    R${' '}
                    {Number(c.total_a_pagar || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>{Number(c.area_total || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} m²</td>
                  <td>
                    R${' '}
                    {Number(c.taxa_unitária || 0).toLocaleString('pt-BR', {
                      minimumFractionDigits: 4,
                      maximumFractionDigits: 4,
                    })}
                  </td>
                  <td>
                    <button className="btn-edit" onClick={() => handleEdit(c)} disabled={loading}>
                      Editar
                    </button>
                    <button className="btn-delete" onClick={() => handleDelete(c.id)} disabled={loading}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
