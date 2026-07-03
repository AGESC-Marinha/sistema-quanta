import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://seu-projeto.supabase.co';
const supabaseKey = 'sua-chave-anon';
const supabase = createClient(supabaseUrl, supabaseKey);

const styles = {
  container: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
  },
  header: {
    backgroundColor: '#1a237e',
    color: '#fff',
    padding: '20px 30px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
  },
  headerVersion: {
    fontSize: '13px',
    opacity: 0.8,
  },
  tabs: {
    display: 'flex',
    gap: '5px',
    marginBottom: '20px',
    borderBottom: '2px solid #1a237e',
  },
  tab: {
    padding: '12px 24px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: 600,
    color: '#666',
    borderBottom: '3px solid transparent',
    marginBottom: '-2px',
    transition: 'all 0.2s',
  },
  tabActive: {
    color: '#1a237e',
    borderBottom: '3px solid #1a237e',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '20px',
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    color: '#1a237e',
    borderBottom: '1px solid #e0e0e0',
    paddingBottom: '8px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
  },
  button: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  buttonPrimary: {
    backgroundColor: '#1a237e',
    color: '#fff',
  },
  buttonDanger: {
    backgroundColor: '#c62828',
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#e0e0e0',
    color: '#333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  th: {
    textAlign: 'left',
    padding: '10px 12px',
    backgroundColor: '#1a237e',
    color: '#fff',
    fontWeight: 600,
    borderBottom: '2px solid #1a237e',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #e0e0e0',
  },
  trHover: {
    cursor: 'pointer',
  },
  resultBox: {
    backgroundColor: '#e8eaf6',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '16px',
  },
  resultValue: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1a237e',
  },
  resultLabel: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '4px',
  },
  resultGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  badge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
  badgeGreen: { backgroundColor: '#c8e6c9', color: '#2e7d32' },
  badgeRed: { backgroundColor: '#ffcdd2', color: '#c62828' },
  badgeYellow: { backgroundColor: '#fff9c4', color: '#f57f17' },
  badgeBlue: { backgroundColor: '#bbdefb', color: '#1565c0' },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  message: {
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  messageSuccess: { backgroundColor: '#c8e6c9', color: '#2e7d32' },
  messageError: { backgroundColor: '#ffcdd2', color: '#c62828' },
};

const TABS = ['Dashboard', 'Calcular', 'Gerenciar', 'Relatórios'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    endereco: '',
    sindico: '',
    email: '',
    telefone: '',
    unidades: '',
    andares: '',
    valor_condominio: '',
    status_manutencao: 'Em dia',
    elevadores_operacao: 0,
    elevadores_manutencao: 0,
  });

  // Campos de cálculo
  const [calcData, setCalcData] = useState({
    unidades: '',
    valor_unitario_tu: '',
    fator_agesc: '',
    descontos: '',
  });
  const [calcResult, setCalcResult] = useState(null);

  useEffect(() => {
    fetchCondominios();
  }, []);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchCondominios = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('condominios')
        .select('*')
        .order('nome', { ascending: true });
      if (error) throw error;
      setCondominios(data || []);
    } catch (err) {
      showMessage('Erro ao carregar condomínios: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCalcChange = (e) => {
    const { name, value } = e.target;
    setCalcData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = (cond) => {
    setEditing(cond.id);
    setFormData({
      nome: cond.nome || '',
      endereco: cond.endereco || '',
      sindico: cond.sindico || '',
      email: cond.email || '',
      telefone: cond.telefone || '',
      unidades: cond.unidades || '',
      andares: cond.andares || '',
      valor_condominio: cond.valor_condominio || '',
      status_manutencao: cond.status_manutencao || 'Em dia',
      elevadores_operacao: cond.elevadores_operacao ?? 0,
      elevadores_manutencao: cond.elevadores_manutencao ?? 0,
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setFormData({
      nome: '',
      endereco: '',
      sindico: '',
      email: '',
      telefone: '',
      unidades: '',
      andares: '',
      valor_condominio: '',
      status_manutencao: 'Em dia',
      elevadores_operacao: 0,
      elevadores_manutencao: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nome: formData.nome,
        endereco: formData.endereco,
        sindico: formData.sindico,
        email: formData.email,
        telefone: formData.telefone,
        unidades: parseInt(formData.unidades) || 0,
        andares: parseInt(formData.andares) || 0,
        valor_condominio: parseFloat(formData.valor_condominio) || 0,
        status_manutencao: formData.status_manutencao,
        elevadores_operacao: parseInt(formData.elevadores_operacao) || 0,
        elevadores_manutencao: parseInt(formData.elevadores_manutencao) || 0,
      };

      if (editing) {
        const { error } = await supabase
          .from('condominios')
          .update(payload)
          .eq('id', editing);
        if (error) throw error;
        showMessage('Condomínio atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('condominios').insert([payload]);
        if (error) throw error;
        showMessage('Condomínio cadastrado com sucesso!');
      }
      handleCancelEdit();
      fetchCondominios();
    } catch (err) {
      showMessage('Erro ao salvar: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este condomínio?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('condominios').delete().eq('id', id);
      if (error) throw error;
      showMessage('Condomínio excluído com sucesso!');
      fetchCondominios();
    } catch (err) {
      showMessage('Erro ao excluir: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    const unidades = parseFloat(calcData.unidades) || 0;
    const valorUnitarioTU = parseFloat(calcData.valor_unitario_tu) || 0;
    const fatorAGESC = parseFloat(calcData.fator_agesc) || 0;
    const descontos = parseFloat(calcData.descontos) || 0;

    const tu = unidades * valorUnitarioTU;
    const agesc = tu * fatorAGESC;
    const liquido = agesc - descontos;

    setCalcResult({ tu, agesc, liquido });
  };

  const getBadge = (status) => {
    const map = {
      'Em dia': { ...styles.badge, ...styles.badgeGreen },
      'Atrasada': { ...styles.badge, ...styles.badgeRed },
      'Programada': { ...styles.badge, ...styles.badgeYellow },
      'Em andamento': { ...styles.badge, ...styles.badgeBlue },
    };
    return map[status] || { ...styles.badge, ...styles.badgeGreen };
  };

  const renderDashboard = () => {
    const totalCond = condominios.length;
    const totalUnidades = condominios.reduce((s, c) => s + (c.unidades || 0), 0);
    const totalElevadores = condominios.reduce(
      (s, c) => s + (c.elevadores_operacao || 0) + (c.elevadores_manutencao || 0),
      0
    );
    const emManutencao = condominios.reduce(
      (s, c) => s + (c.elevadores_manutencao || 0),
      0
    );

    return (
      <div>
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Visão Geral</h2>
          <div style={styles.resultGrid}>
            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Total de Condomínios</div>
              <div style={styles.resultValue}>{totalCond}</div>
            </div>
            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Total de Unidades</div>
              <div style={styles.resultValue}>{totalUnidades}</div>
            </div>
            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Elevadores em Operação</div>
              <div style={styles.resultValue}>{totalElevadores - emManutencao}</div>
            </div>
            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Elevadores em Manutenção</div>
              <div style={styles.resultValue}>{emManutencao}</div>
            </div>
          </div>
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Status de Manutenção</h2>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Condomínio</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Elev. Operação</th>
                <th style={styles.th}>Elev. Manutenção</th>
              </tr>
            </thead>
            <tbody>
              {condominios.length === 0 && (
                <tr>
                  <td style={styles.td} colSpan={4}>
                    Nenhum condomínio cadastrado.
                  </td>
                </tr>
              )}
              {condominios.map((c) => (
                <tr key={c.id}>
                  <td style={styles.td}>{c.nome}</td>
                  <td style={styles.td}>
                    <span style={getBadge(c.status_manutencao)}>
                      {c.status_manutencao || 'Em dia'}
                    </span>
                  </td>
                  <td style={styles.td}>{c.elevadores_operacao ?? 0}</td>
                  <td style={styles.td}>{c.elevadores_manutencao ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCalcular = () => (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>Cálculo TU / AGESC / Líquido</h2>
      <form onSubmit={handleCalculate}>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Número de Unidades</label>
            <input
              style={styles.input}
              type="number"
              name="unidades"
              value={calcData.unidades}
              onChange={handleCalcChange}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Valor Unitário TU (R$)</label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              name="valor_unitario_tu"
              value={calcData.valor_unitario_tu}
              onChange={handleCalcChange}
              required
            />
          </div>
        </div>
        <div style={styles.formRow}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Fator AGESC</label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              name="fator_agesc"
              value={calcData.fator_agesc}
              onChange={handleCalcChange}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Descontos (R$)</label>
            <input
              style={styles.input}
              type="number"
              step="0.01"
              name="descontos"
              value={calcData.descontos}
              onChange={handleCalcChange}
            />
          </div>
        </div>
        <button
          style={{ ...styles.button, ...styles.buttonPrimary }}
          type="submit"
          disabled={loading}
        >
          Calcular
        </button>
      </form>

      {calcResult && (
        <div style={styles.resultBox}>
          <div style={styles.resultGrid}>
            <div>
              <div style={styles.resultLabel}>TU (Total de Unidades)</div>
              <div style={styles.resultValue}>
                R$ {calcResult.tu.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={styles.resultLabel}>AGESC</div>
              <div style={styles.resultValue}>
                R$ {calcResult.agesc.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={styles.resultLabel}>Líquido</div>
              <div style={styles.resultValue}>
                R$ {calcResult.liquido.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGerenciar = () => (
    <div>
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>
          {editing ? 'Editar Condomínio' : 'Cadastrar Novo Condomínio'}
        </h2>
        {message && (
          <div
            style={{
              ...styles.message,
              ...(message.type === 'error'
                ? styles.messageError
                : styles.messageSuccess),
            }}
          >
            {message.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nome do Condomínio</label>
              <input
                style={styles.input}
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Endereço</label>
              <input
                style={styles.input}
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Síndico</label>
              <input
                style={styles.input}
                type="text"
                name="sindico"
                value={formData.sindico}
                onChange={handleInputChange}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>E-mail</label>
              <input
                style={styles.input}
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Telefone</label>
              <input
                style={styles.input}
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleInputChange}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Unidades</label>
              <input
                style={styles.input}
                type="number"
                name="unidades"
                value={formData.unidades}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Andares</label>
              <input
                style={styles.input}
                type="number"
                name="andares"
                value={formData.andares}
                onChange={handleInputChange}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Valor do Condomínio (R$)</label>
              <input
                style={styles.input}
                type="number"
                step="0.01"
                name="valor_condominio"
                value={formData.valor_condominio}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* === CAMPOS DE ELEVADORES ADICIONADOS (Versão 1.1) === */}
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Status da Manutenção</label>
              <select
                style={styles.select}
                name="status_manutencao"
                value={formData.status_manutencao}
                onChange={handleInputChange}
              >
                <option value="Em dia">Em dia</option>
                <option value="Atrasada">Atrasada</option>
                <option value="Programada">Programada</option>
                <option value="Em andamento">Em andamento</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Elevadores em Operação</label>
              <input
                style={styles.input}
                type="number"
                name="elevadores_operacao"
                value={formData.elevadores_operacao}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Elevadores em Manutenção</label>
              <input
                style={styles.input}
                type="number"
                name="elevadores_manutencao"
                value={formData.elevadores_manutencao}
                onChange={handleInputChange}
                min="0"
              />
            </div>
          </div>
          {/* === FIM DOS CAMPOS DE ELEVADORES === */}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              style={{ ...styles.button, ...styles.buttonPrimary }}
              type="submit"
              disabled={loading}
            >
              {editing ? 'Atualizar' : 'Cadastrar'}
            </button>
            {editing && (
              <button
                style={{ ...styles.button, ...styles.buttonSecondary }}
                type="button"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Condomínios Cadastrados</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nome</th>
              <th style={styles.th}>Síndico</th>
              <th style={styles.th}>Unidades</th>
              <th style={styles.th}>Status Manut.</th>
              <th style={styles.th}>Elev. Operação</th>
              <th style={styles.th}>Elev. Manut.</th>
              <th style={styles.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td style={styles.td} colSpan={7}>
                  Carregando...
                </td>
              </tr>
            )}
            {!loading && condominios.length === 0 && (
              <tr>
                <td style={styles.td} colSpan={7}>
                  Nenhum condomínio cadastrado.
                </td>
              </tr>
            )}
            {!loading &&
              condominios.map((c) => (
                <tr key={c.id} style={styles.trHover}>
                  <td style={styles.td}>{c.nome}</td>
                  <td style={styles.td}>{c.sindico || '-'}</td>
                  <td style={styles.td}>{c.unidades || 0}</td>
                  <td style={styles.td}>
                    <span style={getBadge(c.status_manutencao)}>
                      {c.status_manutencao || 'Em dia'}
                    </span>
                  </td>
                  <td style={styles.td}>{c.elevadores_operacao ?? 0}</td>
                  <td style={styles.td}>{c.elevadores_manutencao ?? 0}</td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        style={{
                          ...styles.button,
                          ...styles.buttonSecondary,
                          padding: '6px 14px',
                        }}
                        onClick={() => handleEdit(c)}
                      >
                        Editar
                      </button>
                      <button
                        style={{
                          ...styles.button,
                          ...styles.buttonDanger,
                          padding: '6px 14px',
                        }}
                        onClick={() => handleDelete(c.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderRelatorios = () => {
    const totalUnidades = condominios.reduce((s, c) => s + (c.unidades || 0), 0);
    const totalValor = condominios.reduce(
      (s, c) => s + (parseFloat(c.valor_condominio) || 0),
      0
    );
    const totalElevOp = condominios.reduce(
      (s, c) => s + (c.elevadores_operacao || 0),
      0
    );
    const totalElevMan = condominios.reduce(
      (s, c) => s + (c.elevadores_manutencao || 0),
      0
    );

    return (
      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Relatório Consolidado</h2>
        <table style={styles.table}>
          <tbody>
            <tr>
              <td style={styles.td}>
                <strong>Total de Condomínios</strong>
              </td>
              <td style={styles.td}>{condominios.length}</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Total de Unidades</strong>
              </td>
              <td style={styles.td}>{totalUnidades}</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Valor Total de Condomínios</strong>
              </td>
              <td style={styles.td}>R$ {totalValor.toFixed(2)}</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Elevadores em Operação</strong>
              </td>
              <td style={styles.td}>{totalElevOp}</td>
            </tr>
            <tr>
              <td style={styles.td}>
                <strong>Elevadores em Manutenção</strong>
              </td>
              <td style={styles.td}>{totalElevMan}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>SISTEMA QUANTA GESTÃO AGESC</h1>
        <span style={styles.headerVersion}>Versão 1.1</span>
      </div>

      <div style={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Dashboard' && renderDashboard()}
      {activeTab === 'Calcular' && renderCalcular()}
      {activeTab === 'Gerenciar' && renderGerenciar()}
      {activeTab === 'Relatórios' && renderRelatorios()}
    </div>
  );
}
