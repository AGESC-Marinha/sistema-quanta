import React, { useState, useMemo, useEffect, useCallback } from 'react';
import './App.css';

const CONDOMINIOS = [
  'Residencial Aurora', 'Residencial Bom Jesus', 'Residencial Centro', 'Residencial Das Acácias',
  'Residencial Das Flores', 'Residencial Das Hortênsias', 'Residencial Das Palmeiras', 'Residencial Das Rosas',
  'Edifício Everest', 'Residencial Florença', 'Residencial Girassol', 'Residencial Horizonte',
  'Residencial Ipê Amarelo', 'Residencial Jardim Botânico', 'Residencial Jardim Europa', 'Residencial Jardim Itu',
  'Residencial Jardim Paulista', 'Residencial Lago Azul', 'Residencial Lagoa Santa', 'Residencial Lar Cristão',
  'Residencial Manacá', 'Residencial Maravilha', 'Residencial Monte Carlo', 'Residencial Monte Verde',
  'Residencial Nova Esperança', 'Residencial Orquídeas', 'Residencial Paraíso', 'Residencial Parque das Águas',
  'Residencial Parque dos Pássaros', 'Residencial Primavera', 'Residencial Quatro Estações', 'Residencial Recanto Verde',
  'Residencial Renascer', 'Residencial Rio das Pedras', 'Residencial Santa Cruz', 'Residencial Santa Helena',
  'Residencial Santa Mônica', 'Residencial Santo Antônio', 'Residencial São Jorge', 'Residencial São José',
  'Residencial Serra Azul', 'Residencial Sol Nascente', 'Residencial Vale do Sol'
];

const OPCOES_EXTRA = ['Todos', 'AGESC'];

const TAXA_AGESC = 0.05; // 5% AGESC fee

const formatBRL = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));

const parseNumber = (value) => {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = String(value).replace(/[^0-9,-]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyContract = () => ({
  id: uid(),
  numero: '',
  fornecedor: '',
  objeto: '',
  valorTotal: '',
  dataInicio: '',
  dataFim: '',
  condominios: {}, // { nome: valorFixo }
  aditivos: [],
  parentId: null,
  isAditivo: false,
  boletoRestituicao: false,
  valorRestituicao: ''
});

export default function App() {
  const [contracts, setContracts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard | contracts
  const [search, setSearch] = useState('');

  const openNewContract = useCallback(() => {
    setEditing(emptyContract());
    setModalOpen(true);
  }, []);

  const openEditContract = useCallback((contract) => {
    setEditing(JSON.parse(JSON.stringify(contract)));
    setModalOpen(true);
  }, []);

  const openNewAditivo = useCallback((parent) => {
    const aditivo = emptyContract();
    aditivo.isAditivo = true;
    aditivo.parentId = parent.id;
    aditivo.numero = `${parent.numero}-ADT/${(parent.aditivos?.length || 0) + 1}`;
    aditivo.fornecedor = parent.fornecedor;
    aditivo.objeto = `Aditivo: ${parent.objeto}`;
    aditivo.dataInicio = parent.dataInicio;
    aditivo.dataFim = parent.dataFim;
    // Herança de condomínios e valores
    aditivo.condominios = JSON.parse(JSON.stringify(parent.condominios || {}));
    aditivo.valorTotal = parent.valorTotal;
    setEditing(aditivo);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditing(null);
  }, []);

  const saveContract = useCallback(() => {
    if (!editing) return;
    if (!editing.numero || !editing.fornecedor) {
      alert('Preencha número e fornecedor.');
      return;
    }
    const soma = Object.values(editing.condominios).reduce((a, b) => a + parseNumber(b), 0);
    const total = parseNumber(editing.valorTotal);
    if (total > 0 && Math.abs(soma - total) > 0.01) {
      const ok = confirm(
        `A soma das alocações (${formatBRL(soma)}) não bate com o valor total (${formatBRL(total)}). Deseja salvar mesmo assim?`
      );
      if (!ok) return;
    }
    setContracts((prev) => {
      const exists = prev.find((c) => c.id === editing.id);
      if (exists) {
        return prev.map((c) => (c.id === editing.id ? editing : c));
      }
      if (editing.parentId) {
        return prev.map((c) =>
          c.id === editing.parentId
            ? { ...c, aditivos: [...(c.aditivos || []), editing] }
            : c
        );
      }
      return [...prev, editing];
    });
    closeModal();
  }, [editing, closeModal]););

  const deleteContract = useCallback((id) => {
    if (!confirm('Excluir este contrato?')) return;
    setContracts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const updateField = (field, value) => {
    setEditing((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCondominio = (name) => {
    setEditing((prev) => {
      const cond = { ...prev.condominios };
      if (name === 'Todos') {
        if (cond['Todos']) {
          delete cond['Todos'];
          CONDOMINIOS.forEach((c) => delete cond[c]);
        } else {
          cond['Todos'] = prev.valorTotal || '';
          CONDOMINIOS.forEach((c) => {
            if (!(c in cond)) cond[c] = '';
          });
        }
        return { ...prev, condominios: cond };
      }
      if (cond[name]) {
        delete cond[name];
      } else {
        cond[name] = '';
      }
      return { ...prev, condominios: cond };
    });
  };

  const setCondominioValue = (name, value) => {
    setEditing((prev) => ({
      ...prev,
      condominios: { ...prev.condominios, [name]: value }
    }));
  };

  const somaAlocacoes = useMemo(() => {
    if (!editing) return 0;
    return Object.entries(editing.condominios)
      .filter(([k]) => k !== 'Todos' && k !== 'AGESC')
      .reduce((a, [, v]) => a + parseNumber(v), 0);
  }, [editing]);

  const valorTotalNum = useMemo(() => parseNumber(editing?.valorTotal), [editing]);
  const alocacaoMatch = Math.abs(somaAlocacoes - valorTotalNum) <= 0.01 && valorTotalNum > 0;

  // Dashboard: valor fixo alocado por condomínio subtraído do total
  const dashboard = useMemo(() => {
    const map = {};
    CONDOMINIOS.forEach((c) => (map[c] = { alocado: 0, contratos: 0 }));
    map['AGESC'] = { alocado: 0, contratos: 0 };

    const processContract = (c) => {
      Object.entries(c.condominios || {}).forEach(([name, val]) => {
        if (name === 'Todos') return;
        if (!map[name]) return;
        const v = parseNumber(val);
        map[name].alocado += v;
        map[name].contratos += 1;
      });
      (c.aditivos || []).forEach(processContract);
    };
    contracts.forEach(processContract);

    const totalAlocado = Object.values(map).reduce((a, b) => a + b.alocado, 0);
    const totalContratos = contracts.reduce((a, c) => a + parseNumber(c.valorTotal), 0);
    const saldo = totalContratos - totalAlocado;
    return { map, totalAlocado, totalContratos, saldo };
  }, [contracts]);

  const filteredContracts = useMemo(() => {
    if (!search) return contracts;
    const s = search.toLowerCase();
    return contracts.filter(
      (c) =>
        c.numero.toLowerCase().includes(s) ||
        c.fornecedor.toLowerCase().includes(s) ||
        c.objeto.toLowerCase().includes(s)
    );
  }, [contracts, search]);

  // Lock body scroll when modal open (correção de rolagem do modal)
  useEffect(() => {
    if (modalOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [modalOpen]);

  const renderCondominioGrid = () => {
    if (!editing) return null;
    const cond = editing.condominios || {};
    return (
      <div className="cond-grid">
        <div className="cond-section-title">Seleção de Condomínios</div>
        <div className="cond-grid-options">
          {OPCOES_EXTRA.map((name) => (
            <label key={name} className="cond-item cond-item-extra">
              <input
                type="checkbox"
                checked={!!cond[name]}
                onChange={() => toggleCondominio(name)}
              />
              <span>{name}</span>
              {cond[name] !== undefined && name !== 'Todos' && (
                <input
                  type="text"
                  className="cond-value-input"
                  placeholder="R$ 0,00"
                  value={cond[name]}
                  onChange={(e) => setCondominioValue(name, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        <div className="cond-grid-list">
          {CONDOMINIOS.map((name) => (
            <label key={name} className="cond-item">
              <input
                type="checkbox"
                checked={!!cond[name]}
                onChange={() => toggleCondominio(name)}
              />
              <span className="cond-name">{name}</span>
              {cond[name] !== undefined && (
                <input
                  type="text"
                  className="cond-value-input"
                  placeholder="R$ 0,00"
                  value={cond[name]}
                  onChange={(e) => setCondominioValue(name, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderModal = () => {
    if (!modalOpen || !editing) return null;
    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>{editing.isAditivo ? 'Termo Aditivo' : 'Novo Contrato'}</h2>
            <button className="modal-close" onClick={closeModal} aria-label="Fechar">×</button>
          </div>

          <div className="modal-body">
            {editing.parentId && (
              <div className="inheritance-banner">
                Herdando dados do contrato pai. Condomínios e valores carregados automaticamente.
              </div>
            )}

            <div className="form-row">
              <label>Número</label>
              <input value={editing.numero} onChange={(e) => updateField('numero', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Fornecedor</label>
              <input value={editing.fornecedor} onChange={(e) => updateField('fornecedor', e.target.value)} />
            </div>
            <div className="form-row">
              <label>Objeto</label>
              <input value={editing.objeto} onChange={(e) => updateField('objeto', e.target.value)} />
            </div>
            <div className="form-row form-row-3">
              <div>
                <label>Valor Total (R$)</label>
                <input
                  value={editing.valorTotal}
                  onChange={(e) => updateField('valorTotal', e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label>Data Início</label>
                <input type="date" value={editing.dataInicio} onChange={(e) => updateField('dataInicio', e.target.value)} />
              </div>
              <div>
                <label>Data Fim</label>
                <input type="date" value={editing.dataFim} onChange={(e) => updateField('dataFim', e.target.value)} />
              </div>
            </div>

            {renderCondominioGrid()}

            <div className="allocation-counter">
              <div className="counter-item">
                <span className="counter-label">Soma das Alocações:</span>
                <span className="counter-value">{formatBRL(somaAlocacoes)}</span>
              </div>
              <div className="counter-item">
                <span className="counter-label">Valor Total do Contrato:</span>
                <span className="counter-value">{formatBRL(valorTotalNum)}</span>
              </div>
              <div className="counter-status">
                {valorTotalNum > 0 ? (
                  alocacaoMatch ? (
                    <span className="status-ok">OK ✓</span>
                  ) : (
                    <span className="status-diff">
                      Diferença: {formatBRL(somaAlocacoes - valorTotalNum)}
                    </span>
                  )
                ) : (
                  <span className="status-neutral">Informe o valor total</span>
                )}
              </div>
            </div>

            <div className="form-row form-row-checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={!!editing.boletoRestituicao}
                  onChange={(e) => updateField('boletoRestituicao', e.target.checked)}
                />
                Restituição de Boleto
              </label>
              {editing.boletoRestituicao && (
                <input
                  value={editing.valorRestituicao}
                  onChange={(e) => updateField('valorRestituicao', e.target.value)}
                  placeholder="Valor da restituição R$"
                />
              )}
            </div>

            <div className="agesc-info">
              Taxa AGESC aplicada: {formatBRL(valorTotalNum * TAXA_AGESC)} ({(TAXA_AGESC * 100).toFixed(0)}%)
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModal}>Cancelar</button>
            <button className="btn btn-primary" onClick={saveContract}>Salvar</button>
          </div>
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className="dashboard">
      <div className="dashboard-summary">
        <div className="summary-card">
          <span className="summary-label">Total de Contratos</span>
          <span className="summary-value">{formatBRL(dashboard.totalContratos)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Total Alocado</span>
          <span className="summary-value">{formatBRL(dashboard.totalAlocado)}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Saldo (Total − Alocado)</span>
          <span className="summary-value">{formatBRL(dashboard.saldo)}</span>
        </div>
      </div>

      <div className="dashboard-table-wrap">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Condomínio</th>
              <th>Valor Fixo Alocado</th>
              <th>Contratos</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(dashboard.map)
              .filter(([, v]) => v.alocado > 0 || v.contratos > 0)
              .map(([name, v]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{formatBRL(v.alocado)}</td>
                  <td>{v.contratos}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderContracts = () => (
    <div className="contracts-view">
      <div className="contracts-toolbar">
        <input
          className="search-input"
          placeholder="Buscar por número, fornecedor ou objeto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-primary" onClick={openNewContract}>+ Novo Contrato</button>
      </div>

      <div className="contracts-list">
        {filteredContracts.length === 0 && (
          <div className="empty-state">Nenhum contrato cadastrado.</div>
        )}
        {filteredContracts.map((c) => (
          <div key={c.id} className="contract-card">
            <div className="contract-card-header">
              <div>
                <strong>{c.numero}</strong> — {c.fornecedor}
              </div>
              <div className="contract-card-actions">
                <button className="btn btn-small" onClick={() => openNewAditivo(c)}>+ Aditivo</button>
                <button className="btn btn-small" onClick={() => openEditContract(c)}>Editar</button>
                <button className="btn btn-small btn-danger" onClick={() => deleteContract(c.id)}>Excluir</button>
              </div>
            </div>
            <div className="contract-card-body">
              <div><strong>Objeto:</strong> {c.objeto || '—'}</div>
              <div><strong>Valor Total:</strong> {formatBRL(c.valorTotal)}</div>
              <div><strong>Vigência:</strong> {c.dataInicio || '—'} a {c.dataFim || '—'}</div>
              <div><strong>Condomínios:</strong> {Object.keys(c.condominios || {}).filter((k) => k !== 'Todos').length}</div>
              {c.boletoRestituicao && (
                <div><strong>Restituição Boleto:</strong> {formatBRL(c.valorRestituicao)}</div>
              )}
              {(c.aditivos || []).length > 0 && (
                <div><strong>Aditivos:</strong> {c.aditivos.length}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>Gestão de Contratos</h1>
        <nav className="app-nav">
          <button
            className={view === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('dashboard')}
          >Dashboard</button>
          <button
            className={view === 'contracts' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setView('contracts')}
          >Contratos</button>
        </nav>
      </header>

      <main className="app-main">
        {view === 'dashboard' ? renderDashboard() : renderContracts()}
      </main>

      {renderModal()}
    </div>
  );
}
