import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Layout, Users, FileText, PieChart, Plus, Search,
  Building2, DollarSign, Calendar, CheckCircle2, AlertCircle,
  Info, ArrowRight, Save, Trash2, Edit3, ExternalLink, X,
  Flame, ArrowUpCircle, Wrench, Settings, Shield, ChevronRight
} from 'lucide-react';

// =============================================================
// SISTEMA QUANTA - VERSÃO 1.2 - 3JUL26 - ESTÁVEL
// Gestão AGESC - 43 Condomínios
// =============================================================

// Configuração Supabase - Projeto bjeklbralayvulcuqiqe
const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE';
const supabase = createClient(supabaseUrl, supabaseKey);

// =============================================================
// CONSTANTES DE NEGÓCIO
// =============================================================
const TAXA_AGESC = 0.045;          // 4.5%
const FUNDO_RESERVA = 0.05;        // 5% (Informativo - Incluso na TU)
const FATOR_LIQUIDO = 0.905;       // 1 - 4.5% - 5% = 0.905
const RESTITUICAO_BOLETO = 3.00;   // R$ 3,00 fixo por condomínio
const TOTAL_CONDOMINIOS = 43;

const App = () => {
  // =============================================================
  // ESTADOS PRINCIPAIS
  // =============================================================
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [rateios, setRateios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondo, setSelectedCondo] = useState(null);

  // Estados da Aba Gerenciar
  const [editingCondo, setEditingCondo] = useState(null);
  const [gerenciarSearch, setGerenciarSearch] = useState('');
  const [savingCondo, setSavingCondo] = useState(false);

  // Estados para Formulário de Contrato
  const [isEditingContract, setIsEditingContract] = useState(false);
  const [currentContract, setCurrentContract] = useState({
    empresa_contratada: '',
    valor_mensal: 0,
    numero_contrato: '',
    tem_aditivo: false,
    aditivo_valor: 0,
    aditivo_descricao: '',
    prazo_inicio: '',
    prazo_fim: '',
    link_pdf: ''
  });
  const [selectedCondosForContract, setSelectedCondosForContract] = useState({});
  const [isAgescOnly, setIsAgescOnly] = useState(false);
  const [isAllCondos, setIsAllCondos] = useState(false);

  // =============================================================
  // CARREGAMENTO DE DADOS
  // =============================================================
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: condos } = await supabase.from('condominios').select('*').order('nome');
      const { data: conts } = await supabase.from('contratos').select('*');
      const { data: rats } = await supabase.from('rateios').select('*');

      setCondominios(condos || []);
      setContratos(conts || []);
      setRateios(rats || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // LÓGICA DE CÁLCULO FINANCEIRO
  // =============================================================

  // Deduções de contratos por condomínio
  const getDeducoesPorCondominio = (condoId, condoNome) => {
    let totalDeducao = 0;

    // 1. Soma alocações diretas
    const diretos = rateios.filter(r => r.condominio_id === condoId || r.condominio === condoNome);
    totalDeducao += diretos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    // 2. Soma contratos marcados como "Todos" (Rateio igualitário entre os 43)
    const contratosTodos = rateios.filter(r => r.is_all_condos === true);
    contratosTodos.forEach(r => {
      totalDeducao += Number(r.valor || 0) / TOTAL_CONDOMINIOS;
    });

    return totalDeducao;
  };

  // Cálculo centralizado de métricas por condomínio
  const calculateMetrics = (condo) => {
    const receitaBruta = Number(condo.despesa_estimada || 0);
    const unidades = (Number(condo.qtd_pnr || 0) + Number(condo.qtd_civis || 0));

    // TU: (Despesa / Unidades) / 0.905
    const taxaUnitaria = unidades > 0
      ? (receitaBruta / unidades) / FATOR_LIQUIDO
      : 0;

    // Taxa AGESC (4.5% sobre Receita Bruta) - Deduzida do líquido
    const taxaAgesc = receitaBruta * TAXA_AGESC;

    // Fundo de Reserva (5%) - Informativo [Incluso], NÃO subtrair do líquido
    const fundoReserva = receitaBruta * FUNDO_RESERVA;

    // Deduções de Contratos
    const deducoesContratos = getDeducoesPorCondominio(condo.id, condo.nome);

    // Restituição Boleto: R$ 3,00 fixo por condomínio somado ao líquido final
    const restituicaoBoleto = RESTITUICAO_BOLETO;

    // Valor Líquido: Receita - AGESC - Contratos + Restituição Boleto
    // (Fundo de Reserva NÃO é subtraído - é informativo/incluso)
    const valorLiquido = receitaBruta - taxaAgesc - deducoesContratos + restituicaoBoleto;

    return {
      receitaBruta,
      unidades,
      taxaUnitaria,
      taxaAgesc,
      fundoReserva,
      deducoesContratos,
      restituicaoBoleto,
      valorLiquido
    };
  };

  // Formatação monetária
  const formatMoeda = (valor) => {
    return Number(valor || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // =============================================================
  // HANDLERS - GERENCIAR CONDOMÍNIOS
  // =============================================================
  const handleEditCondo = (condo) => {
    setEditingCondo({ ...condo });
  };

  const handleCondoFieldChange = (field, value) => {
    setEditingCondo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveCondo = async () => {
    setSavingCondo(true);
    try {
      const { id, ...updateData } = editingCondo;
      const { error } = await supabase
        .from('condominios')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      alert('Condomínio atualizado com sucesso!');
      setEditingCondo(null);
      fetchData();
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setSavingCondo(false);
    }
  };

  // =============================================================
  // HANDLERS - CONTRATOS
  // =============================================================
  const handleContractSubmit = async (e) => {
    e.preventDefault();

    // 1. Cálculo do valor total do contrato (Mensal + Aditivo)
    const totalContrato = Number(currentContract.valor_mensal || 0) + Number(currentContract.aditivo_valor || 0);
    
    // 2. Cálculo da soma dos rateios definidos
    let somaRateios = 0;
    if (isAgescOnly || isAllCondos) {
      // Nestes casos, o sistema aloca o valor total automaticamente
      somaRateios = totalContrato;
    } else {
      // Soma os valores individuais inseridos para cada condomínio selecionado
      somaRateios = Object.values(selectedCondosForContract).reduce((acc, item) => {
        return item.selected ? acc + Number(item.valor || 0) : acc;
      }, 0);
    }

    // 3. Validação de Integridade Financeira (Trava)
    // Usamos toFixed(2) para evitar problemas de precisão de ponto flutuante do JavaScript
    if (somaRateios.toFixed(2) !== totalContrato.toFixed(2)) {
      alert(`ERRO DE INTEGRIDADE FINANCEIRA:\n\nA soma dos rateios (R$ ${formatMoeda(somaRateios)}) não coincide com o valor total do contrato (R$ ${formatMoeda(totalContrato)}).\n\nPor favor, ajuste a distribuição dos valores antes de salvar.`);
      return;
    }

    setLoading(true);

    try {
      const { data: contractData, error: contractError } = await supabase
        .from('contratos')
        .upsert(currentContract)
        .select()
        .single();

      if (contractError) throw contractError;

      // Limpa rateios antigos se for edição
      if (currentContract.id) {
        await supabase.from('rateios').delete().eq('contrato_id', currentContract.id);
      }

      // Prepara novos rateios
      const novosRateios = [];

      if (isAgescOnly) {
        novosRateios.push({
          contrato_id: contractData.id,
          valor: totalContrato,
          is_agesc: true
        });
      } else if (isAllCondos) {
        novosRateios.push({ 
          contrato_id: contractData.id,
          valor: totalContrato,
          is_all_condos: true
        });
      } else {
        Object.keys(selectedCondosForContract).forEach(condoId => {
          if (selectedCondosForContract[condoId].selected) {
            novosRateios.push({
              contrato_id: contractData.id,
              condominio_id: condoId,
              valor: Number(selectedCondosForContract[condoId].valor || 0)
            });
          }
        });
      }

      await supabase.from('rateios').insert(novosRateios);
      alert('Contrato e rateios salvos com sucesso!');
      fetchData();
      setIsEditingContract(false);
      resetContractForm();
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetContractForm = () => {
    setCurrentContract({
      empresa_contratada: '',
      valor_mensal: 0,
      numero_contrato: '',
      tem_aditivo: false,
      aditivo_valor: 0,
      aditivo_descricao: '',
      prazo_inicio: '',
      prazo_fim: '',
      link_pdf: ''
    });
    setSelectedCondosForContract({});
    setIsAgescOnly(false);
    setIsAllCondos(false);
  };

  const handleDeleteContract = async (contractId) => {
    if (!confirm('Deseja realmente excluir este contrato e seus rateios?')) return;
    try {
      await supabase.from('rateios').delete().eq('contrato_id', contractId);
      await supabase.from('contratos').delete().eq('id', contractId);
      alert('Contrato excluído com sucesso!');
      fetchData();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    }
  };

  const handleEditContract = (contract) => {
    setCurrentContract(contract);
    setIsEditingContract(true);
    setIsAgescOnly(false);
    setIsAllCondos(false);
    setSelectedCondosForContract({});

    const contractRateios = rateios.filter(r => r.contrato_id === contract.id);
    contractRateios.forEach(r => {
      if (r.is_agesc) setIsAgescOnly(true);
      if (r.is_all_condos) setIsAllCondos(true);
      if (r.condominio_id) {
        setSelectedCondosForContract(prev => ({
          ...prev,
          [r.condominio_id]: { selected: true, valor: r.valor }
        }));
      }
    });
  };

  // =============================================================
  // RENDERIZAÇÃO - DASHBOARD
  // =============================================================
  const renderDashboard = () => {
    const filteredCondos = condominios.filter(c =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Totais gerais
    const totais = condominios.reduce((acc, condo) => {
      const m = calculateMetrics(condo);
      return {
        receita: acc.receita + m.receitaBruta,
        liquido: acc.liquido + m.valorLiquido,
        deducoes: acc.deducoes + m.taxaAgesc + m.deducoesContratos,
        unidades: acc.unidades + m.unidades
      };
    }, { receita: 0, liquido: 0, deducoes: 0, unidades: 0 });

    return (
      <div className="space-y-6">
        {/* Barra de Pesquisa */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar condomínio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm text-slate-500">
            {filteredCondos.length} de {condominios.length} condomínios
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-600 text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs opacity-80 uppercase tracking-wide">Receita Total</div>
            <div className="text-2xl font-bold mt-1">R$ {formatMoeda(totais.receita)}</div>
          </div>
          <div className="bg-blue-600 text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs opacity-80 uppercase tracking-wide">Líquido Total</div>
            <div className="text-2xl font-bold mt-1">R$ {formatMoeda(totais.liquido)}</div>
          </div>
          <div className="bg-slate-600 text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs opacity-80 uppercase tracking-wide">Deduções Totais</div>
            <div className="text-2xl font-bold mt-1">R$ {formatMoeda(totais.deducoes)}</div>
          </div>
          <div className="bg-black text-white rounded-2xl p-4 shadow-lg">
            <div className="text-xs opacity-80 uppercase tracking-wide">Total Unidades</div>
            <div className="text-2xl font-bold mt-1">{totais.unidades}</div>
          </div>
        </div>

        {/* Cards dos Condomínios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCondos.map(condo => {
            const m = calculateMetrics(condo);

            return (
              <div
                key={condo.id}
                onClick={() => setSelectedCondo(condo)}
                className="bg-white rounded-3xl shadow-sm border-2 border-blue-900 p-5 hover:shadow-xl transition-all cursor-pointer"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{condo.nome}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {condo.qtd_pnr || 0} PNR · {condo.qtd_civis || 0} Civis · {m.unidades} Total
                    </p>
                  </div>
                  {condo.possui_elevadores && (
                    <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                      <ArrowUpCircle size={14} />
                      {condo.qtd_elevadores || 0} Elev.
                    </div>
                  )}
                </div>

                {/* Box Verde - TU */}
                <div className="bg-green-600 text-white rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide opacity-90">Taxa Unitária (TU)</span>
                    <span className="text-lg font-bold">R$ {formatMoeda(m.taxaUnitaria)}</span>
                  </div>
                </div>

                {/* Box Azul - Receita */}
                <div className="bg-blue-600 text-white rounded-xl p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide opacity-90">Receita Bruta</span>
                    <span className="text-lg font-bold">R$ {formatMoeda(m.receitaBruta)}</span>
                  </div>
                </div>

                {/* Box Slate - Deduções */}
                <div className="bg-slate-600 text-white rounded-xl p-3 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">Taxa AGESC (4.5%)</span>
                    <span>- R$ {formatMoeda(m.taxaAgesc)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">Fundo Reserva (5%) [Incluso]</span>
                    <span className="opacity-60 italic">R$ {formatMoeda(m.fundoReserva)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">Dedução Contratos</span>
                    <span>- R$ {formatMoeda(m.deducoesContratos)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="opacity-90">Restituição Boleto</span>
                    <span>+ R$ {formatMoeda(m.restituicaoBoleto)}</span>
                  </div>
                </div>

                {/* Box Preto - Líquido */}
                <div className="bg-black text-white rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wide opacity-90">Líquido para Repasse</span>
                    <span className="text-xl font-bold">R$ {formatMoeda(m.valorLiquido)}</span>
                  </div>
                </div>

                {/* Link de Detalhes */}
                <div className="mt-3 flex items-center justify-end text-sm text-blue-600 hover:text-blue-800">
                  <span>Ver Raio-X Completo</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>

        {filteredCondos.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum condomínio encontrado.</p>
          </div>
        )}
      </div>
    );
  };

  // =============================================================
  // RENDERIZAÇÃO - GERENCIAR
  // =============================================================
  const renderGerenciar = () => {
    const filteredCondos = condominios.filter(c =>
      c.nome.toLowerCase().includes(gerenciarSearch.toLowerCase())
    );

    return (
      <div className="flex gap-6 h-[calc(100vh-180px)]">
        {/* Lista de Condomínios */}
        <div className="w-1/3 flex flex-col">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar condomínio..."
              value={gerenciarSearch}
              onChange={(e) => setGerenciarSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredCondos.map(condo => (
              <div
                key={condo.id}
                onClick={() => handleEditCondo(condo)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  editingCondo?.id === condo.id
                    ? 'border-blue-900 bg-blue-50 shadow-md'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-slate-800">{condo.nome}</h4>
                    <p className="text-xs text-slate-500">
                      {condo.qtd_pnr || 0} PNR · {condo.qtd_civis || 0} Civis
                    </p>
                  </div>
                  <Edit3 size={16} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulário de Edição */}
        <div className="flex-1 overflow-y-auto bg-white rounded-3xl border-2 border-blue-900 p-6">
          {!editingCondo ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Building2 size={48} className="mb-4 opacity-50" />
              <p>Selecione um condomínio para editar</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header do Formulário */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-800">{editingCondo.nome}</h2>
                <button
                  onClick={handleSaveCondo}
                  disabled={savingCondo}
                  className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {savingCondo ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>

              {/* Seção: Identificação */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Building2 size={16} /> Identificação e Contato
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Nome</label>
                    <input
                      type="text"
                      value={editingCondo.nome || ''}
                      onChange={(e) => handleCondoFieldChange('nome', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">CNPJ</label>
                    <input
                      type="text"
                      value={editingCondo.cnpj || ''}
                      onChange={(e) => handleCondoFieldChange('cnpj', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Endereço</label>
                    <input
                      type="text"
                      value={editingCondo.endereco || ''}
                      onChange={(e) => handleCondoFieldChange('endereco', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Dados Bancários</label>
                    <input
                      type="text"
                      value={editingCondo.dados_bancarios || ''}
                      onChange={(e) => handleCondoFieldChange('dados_bancarios', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Unidades e Financeiro */}
              <div>
                <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Users size={16} /> Unidades e Financeiro
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Unidades PNR</label>
                    <input
                      type="number"
                      value={editingCondo.qtd_pnr || 0}
                      onChange={(e) => handleCondoFieldChange('qtd_pnr', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Unidades Civis</label>
                    <input
                      type="number"
                      value={editingCondo.qtd_civis || 0}
                      onChange={(e) => handleCondoFieldChange('qtd_civis', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Despesa Estimada (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingCondo.despesa_estimada || 0}
                      onChange={(e) => handleCondoFieldChange('despesa_estimada', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs text-slate-500 mb-1 block">Saldo Fundo de Reserva (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingCondo.saldo_fundo_reserva || 0}
                      onChange={(e) => handleCondoFieldChange('saldo_fundo_reserva', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: PPCI - Prevenção e Combate a Incêndio */}
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Flame size={16} /> PPCI - Prevenção e Combate a Incêndio
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Status do PPCI</label>
                    <select
                      value={editingCondo.ppci_status || ''}
                      onChange={(e) => handleCondoFieldChange('ppci_status', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm bg-white"
                    >
                      <option value="">Selecione...</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="em_tramitacao">Em Tramitação</option>
                      <option value="vencido">Vencido</option>
                      <option value="nao_iniciado">Não Iniciado</option>
                      <option value="em_correcao">Em Correção</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Validade do PPCI</label>
                    <input
                      type="date"
                      value={editingCondo.ppci_validade || ''}
                      onChange={(e) => handleCondoFieldChange('ppci_validade', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Empresa Responsável PPCI</label>
                    <input
                      type="text"
                      value={editingCondo.ppci_empresa || ''}
                      onChange={(e) => handleCondoFieldChange('ppci_empresa', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Projeto de Incêndio (Resumo)</label>
                    <input
                      type="text"
                      value={editingCondo.projetos_incendio || ''}
                      onChange={(e) => handleCondoFieldChange('projetos_incendio', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Observações PPCI</label>
                    <textarea
                      value={editingCondo.ppci_observacoes || ''}
                      onChange={(e) => handleCondoFieldChange('ppci_observacoes', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção: Elevadores */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide flex items-center gap-2">
                    <ArrowUpCircle size={16} /> Sistema de Elevadores
                  </h3>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCondo.possui_elevadores || false}
                      onChange={(e) => handleCondoFieldChange('possui_elevadores', e.target.checked)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-slate-600">Possui Elevadores</span>
                  </label>
                </div>

                {editingCondo.possui_elevadores && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Quantidade de Elevadores</label>
                      <input
                        type="number"
                        value={editingCondo.qtd_elevadores || 0}
                        onChange={(e) => handleCondoFieldChange('qtd_elevadores', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Empresa de Manutenção</label>
                      <input
                        type="text"
                        value={editingCondo.empresa_elevadores || ''}
                        onChange={(e) => handleCondoFieldChange('empresa_elevadores', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Elevadores em Operação</label>
                      <input
                        type="number"
                        value={editingCondo.elevadores_operacao || 0}
                        onChange={(e) => handleCondoFieldChange('elevadores_operacao', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Elevadores em Manutenção</label>
                      <input
                        type="number"
                        value={editingCondo.elevadores_manutencao || 0}
                        onChange={(e) => handleCondoFieldChange('elevadores_manutencao', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-slate-500 mb-1 block">Status de Manutenção</label>
                      <select
                        value={editingCondo.status_manutencao || ''}
                        onChange={(e) => handleCondoFieldChange('status_manutencao', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      >
                        <option value="">Selecione...</option>
                        <option value="em_dia">Em Dia</option>
                        <option value="atrasada">Manutenção Atrasada</option>
                        <option value="agendada">Manutenção Agendada</option>
                        <option value="em_andamento">Manutenção em Andamento</option>
                        <option value="parada">Operação Parada</option>
                        <option value="sem_contrato">Sem Contrato de Manutenção</option>
                      </select>
                    </div>
                  </div>
                )}

                {!editingCondo.possui_elevadores && (
                  <p className="text-sm text-slate-400 italic">Marque "Possui Elevadores" para habilitar os campos.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // =============================================================
  // RENDERIZAÇÃO - CONTRATOS
  // =============================================================
  const renderContratos = () => {
    return (
      <div className="space-y-6">
        {/* Botão Novo Contrato */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Gestão de Contratos e Rateios</h2>
          <button
            onClick={() => { resetContractForm(); setIsEditingContract(true); }}
            className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors"
          >
            <Plus size={18} />
            Novo Contrato
          </button>
        </div>

        {/* Lista de Contratos Existentes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contratos.map(contract => {
            const contractRateios = rateios.filter(r => r.contrato_id === contract.id);
            const totalRateado = contractRateios.reduce((acc, r) => acc + Number(r.valor || 0), 0);

            return (
              <div key={contract.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{contract.empresa_contratada}</h3>
                    <p className="text-xs text-slate-500">Contrato: {contract.numero_contrato || 'N/I'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditContract(contract)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteContract(contract.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valor Mensal:</span>
                    <span className="font-semibold">R$ {formatMoeda(contract.valor_mensal)}</span>
                  </div>
                  {contract.tem_aditivo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Aditivo:</span>
                      <span className="font-semibold">R$ {formatMoeda(contract.aditivo_valor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Rateado:</span>
                    <span className="font-semibold">R$ {formatMoeda(totalRateado)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rateios:</span>
                    <span>{contractRateios.length}</span>
                  </div>
                  {contract.prazo_inicio && contract.prazo_fim && (
                    <div className="flex justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 mt-2">
                      <span>{new Date(contract.prazo_inicio).toLocaleDateString('pt-BR')}</span>
                      <ArrowRight size={14} />
                      <span>{new Date(contract.prazo_fim).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  {contract.link_pdf && (
                    <a
                      href={contract.link_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs pt-2"
                    >
                      <ExternalLink size={12} /> Ver PDF do Contrato
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {contratos.length === 0 && !isEditingContract && (
          <div className="text-center py-12 text-slate-400">
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhum contrato cadastrado. Clique em "Novo Contrato" para começar.</p>
          </div>
        )}

        {/* Formulário de Contrato */}
        {isEditingContract && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {currentContract.id ? 'Editar Contrato' : 'Novo Contrato'}
                </h2>
                <button
                  onClick={() => { setIsEditingContract(false); resetContractForm(); }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleContractSubmit} className="space-y-4">
                {/* Dados do Contrato */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Empresa Contratada *</label>
                    <input
                      type="text"
                      required
                      value={currentContract.empresa_contratada}
                      onChange={(e) => setCurrentContract({ ...currentContract, empresa_contratada: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Número do Contrato</label>
                    <input
                      type="text"
                      value={currentContract.numero_contrato}
                      onChange={(e) => setCurrentContract({ ...currentContract, numero_contrato: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Valor Mensal (R$) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={currentContract.valor_mensal}
                      onChange={(e) => setCurrentContract({ ...currentContract, valor_mensal: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Prazo Início</label>
                    <input
                      type="date"
                      value={currentContract.prazo_inicio || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, prazo_inicio: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Prazo Fim</label>
                    <input
                      type="date"
                      value={currentContract.prazo_fim || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, prazo_fim: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-slate-500 mb-1 block">Link do PDF</label>
                    <input
                      type="url"
                      value={currentContract.link_pdf || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, link_pdf: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Aditivo */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={currentContract.tem_aditivo}
                      onChange={(e) => setCurrentContract({ ...currentContract, tem_aditivo: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="font-semibold text-slate-700">Possui Aditivo</span>
                  </label>
                  {currentContract.tem_aditivo && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Valor do Aditivo (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={currentContract.aditivo_valor}
                          onChange={(e) => setCurrentContract({ ...currentContract, aditivo_valor: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Descrição do Aditivo</label>
                        <input
                          type="text"
                          value={currentContract.aditivo_descricao || ''}
                          onChange={(e) => setCurrentContract({ ...currentContract, aditivo_descricao: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Tipo de Rateio */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Tipo de Rateio</h3>
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={!isAgescOnly && !isAllCondos}
                        onChange={() => { setIsAgescOnly(false); setIsAllCondos(false); }}
                        className="w-4 h-4"
                      />
                      <span>Por Condomínio</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={isAllCondos}
                        onChange={() => { setIsAllCondos(true); setIsAgescOnly(false); }}
                        className="w-4 h-4"
                      />
                      <span>Todos os Condomínios (Rateio Igualitário)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={isAgescOnly}
                        onChange={() => { setIsAgescOnly(true); setIsAllCondos(false); }}
                        className="w-4 h-4"
                      />
                      <span>Somente AGESC</span>
                    </label>
                  </div>

                  {/* Seleção por Condomínio */}
                  {!isAgescOnly && !isAllCondos && (
                    <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3 bg-white">
                      {condominios.map(condo => (
                        <div key={condo.id} className="flex items-center gap-3">
                          <label className="flex items-center gap-2 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCondosForContract[condo.id]?.selected || false}
                              onChange={(e) => {
                                setSelectedCondosForContract(prev => ({
                                  ...prev,
                                  [condo.id]: {
                                    ...prev[condo.id],
                                    selected: e.target.checked,
                                    valor: prev[condo.id]?.valor || 0
                                  }
                                }));
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-sm text-slate-700">{condo.nome}</span>
                          </label>
                          {selectedCondosForContract[condo.id]?.selected && (
                            <input
                              type="number"
                              step="0.01"
                              placeholder="R$"
                              value={selectedCondosForContract[condo.id]?.valor || 0}
                              onChange={(e) => {
                                setSelectedCondosForContract(prev => ({
                                  ...prev,
                                  [condo.id]: {
                                    ...prev[condo.id],
                                    valor: parseFloat(e.target.value) || 0
                                  }
                                }));
                              }}
                              className="w-28 px-2 py-1 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {isAllCondos && (
                    <p className="text-sm text-slate-600">
                      O valor total (R$ {formatMoeda(Number(currentContract.valor_mensal) + Number(currentContract.aditivo_valor || 0))})
                      será dividido igualmente entre os {TOTAL_CONDOMINIOS} condomínios
                      (R$ {formatMoeda((Number(currentContract.valor_mensal) + Number(currentContract.aditivo_valor || 0)) / TOTAL_CONDOMINIOS)} por condomínio).
                    </p>
                  )}

                  {isAgescOnly && (
                    <p className="text-sm text-slate-600">
                      O valor total (R$ {formatMoeda(Number(currentContract.valor_mensal) + Number(currentContract.aditivo_valor || 0))})
                      será rateado exclusivamente como despesa da AGESC.
                    </p>
                  )}
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => { setIsEditingContract(false); resetContractForm(); }}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-900 text-white px-6 py-2 rounded-xl hover:bg-blue-800 text-sm disabled:opacity-50"
                  >
                    <Save size={16} />
                    {loading ? 'Salvando...' : 'Salvar Contrato'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // =============================================================
  // RENDERIZAÇÃO - MODAL DE DETALHES (RAIO-X COMPLETO)
  // =============================================================
  const renderCondoModal = () => {
    if (!selectedCondo) return null;
    const m = calculateMetrics(selectedCondo);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header do Modal */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{selectedCondo.nome}</h2>
              <p className="text-sm text-slate-500">Raio-X Completo do Condomínio</p>
            </div>
            <button
              onClick={() => setSelectedCondo(null)}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Box Verde - TU */}
            <div className="bg-green-600 text-white rounded-2xl p-4">
              <div className="text-xs uppercase tracking-wide opacity-80 mb-1">Taxa Unitária (TU)</div>
              <div className="text-3xl font-bold">R$ {formatMoeda(m.taxaUnitaria)}</div>
              <div className="text-xs opacity-70 mt-1">
                Cálculo: (R$ {formatMoeda(m.receitaBruta)} ÷ {m.unidades} un.) ÷ 0.905
              </div>
            </div>

            {/* Identificação e Contato */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Building2 size={16} /> Identificação e Contato
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">CNPJ</div>
                  <div className="font-medium text-slate-700">{selectedCondo.cnpj || 'Não informado'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Endereço</div>
                  <div className="font-medium text-slate-700">{selectedCondo.endereco || 'Não informado'}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 col-span-2">
                  <div className="text-xs text-slate-400 mb-1">Dados Bancários</div>
                  <div className="font-medium text-slate-700">{selectedCondo.dados_bancarios || 'Não informado'}</div>
                </div>
              </div>
            </div>

            {/* Ficha Técnica Financeira */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <DollarSign size={16} /> Ficha Técnica Financeira
              </h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">Unidades PNR</div>
                  <div className="text-xl font-bold text-slate-700">{selectedCondo.qtd_pnr || 0}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">Unidades Civis</div>
                  <div className="text-xl font-bold text-slate-700">{selectedCondo.qtd_civis || 0}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <div className="text-xs text-slate-400 mb-1">Total Unidades</div>
                  <div className="text-xl font-bold text-slate-700">{m.unidades}</div>
                </div>
              </div>

              {/* Detalhamento Financeiro */}
              <div className="mt-3 space-y-2">
                {/* Box Azul - Receita */}
                <div className="bg-blue-600 text-white rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm">Receita Bruta (Despesa Estimada)</span>
                  <span className="font-bold">R$ {formatMoeda(m.receitaBruta)}</span>
                </div>

                {/* Box Slate - Deduções */}
                <div className="bg-slate-600 text-white rounded-xl p-3 space-y-2">
                  <div className="text-xs uppercase tracking-wide opacity-80 border-b border-white/20 pb-1 mb-1">Deduções</div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">Taxa AGESC (4.5%)</span>
                    <span>- R$ {formatMoeda(m.taxaAgesc)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">Fundo Reserva (5%) [Incluso]</span>
                    <span className="opacity-60 italic">R$ {formatMoeda(m.fundoReserva)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">Dedução Contratos</span>
                    <span>- R$ {formatMoeda(m.deducoesContratos)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="opacity-90">Restituição Boleto</span>
                    <span>+ R$ {formatMoeda(m.restituicaoBoleto)}</span>
                  </div>
                </div>

                {/* Box Preto - Líquido */}
                <div className="bg-black text-white rounded-xl p-4 flex items-center justify-between">
                  <span className="text-sm uppercase tracking-wide opacity-90">Líquido para Repasse</span>
                  <span className="text-2xl font-bold">R$ {formatMoeda(m.valorLiquido)}</span>
                </div>
              </div>

              {/* Saldo Fundo Reserva */}
              <div className="mt-3 bg-slate-50 rounded-lg p-3 flex items-center justify-between text-sm">
                <span className="text-slate-500">Saldo Acumulado Fundo de Reserva</span>
                <span className="font-semibold text-slate-700">R$ {formatMoeda(selectedCondo.saldo_fundo_reserva)}</span>
              </div>
            </div>

            {/* PPCI - Prevenção e Combate a Incêndio */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Flame size={16} /> PPCI - Prevenção e Combate a Incêndio
              </h3>
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-medium text-slate-700">
                    {selectedCondo.ppci_status
                      ? selectedCondo.ppci_status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                      : 'Não informado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Validade:</span>
                  <span className="font-medium text-slate-700">
                    {selectedCondo.ppci_validade
                      ? new Date(selectedCondo.ppci_validade).toLocaleDateString('pt-BR')
                      : 'Não informado'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Empresa Responsável:</span>
                  <span className="font-medium text-slate-700">{selectedCondo.ppci_empresa || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Projeto de Incêndio:</span>
                  <span className="font-medium text-slate-700">{selectedCondo.projetos_incendio || 'Não informado'}</span>
                </div>
                {selectedCondo.ppci_observacoes && (
                  <div className="pt-2 border-t border-orange-200">
                    <div className="text-xs text-slate-500 mb-1">Observações:</div>
                    <div className="text-slate-700">{selectedCondo.ppci_observacoes}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Sistema de Elevadores */}
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                <ArrowUpCircle size={16} /> Sistema de Elevadores
              </h3>
              {selectedCondo.possui_elevadores ? (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex justify-between bg-white rounded-lg p-2 px-3">
                      <span className="text-slate-500">Quantidade:</span>
                      <span className="font-bold text-slate-700">{selectedCondo.qtd_elevadores || 0}</span>
                    </div>
                    <div className="flex justify-between bg-white rounded-lg p-2 px-3">
                      <span className="text-slate-500">Empresa:</span>
                      <span className="font-medium text-slate-700">{selectedCondo.empresa_elevadores || 'N/I'}</span>
                    </div>
                    <div className="flex justify-between bg-white rounded-lg p-2 px-3">
                      <span className="text-slate-500 flex items-center gap-1">
                        <CheckCircle2 size={14} className="text-green-600" /> Em Operação:
                      </span>
                      <span className="font-bold text-green-700">{selectedCondo.elevadores_operacao || 0}</span>
                    </div>
                    <div className="flex justify-between bg-white rounded-lg p-2 px-3">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Wrench size={14} className="text-orange-600" /> Em Manutenção:
                      </span>
                      <span className="font-bold text-orange-700">{selectedCondo.elevadores_manutencao || 0}</span>
                    </div>
                  </div>
                  <div className="flex justify-between bg-white rounded-lg p-2 px-3">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Settings size={14} /> Status de Manutenção:
                    </span>
                    <span className="font-medium text-slate-700">
                      {selectedCondo.status_manutencao
                        ? selectedCondo.status_manutencao.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                        : 'Não informado'}
                    </span>
                  </div>
                  {/* Indicador visual de status */}
                  <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                    {selectedCondo.status_manutencao === 'em_dia' && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
                        <CheckCircle2 size={12} /> Manutenção em Dia
                      </span>
                    )}
                    {selectedCondo.status_manutencao === 'atrasada' && (
                      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                        <AlertCircle size={12} /> Manutenção Atrasada
                      </span>
                    )}
                    {selectedCondo.status_manutencao === 'agendada' && (
                      <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
                        <Calendar size={12} /> Manutenção Agendada
                      </span>
                    )}
                    {selectedCondo.status_manutencao === 'em_andamento' && (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                        <Wrench size={12} /> Manutenção em Andamento
                      </span>
                    )}
                    {selectedCondo.status_manutencao === 'parada' && (
                      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full">
                        <AlertCircle size={12} /> Operação Parada
                      </span>
                    )}
                    {selectedCondo.status_manutencao === 'sem_contrato' && (
                      <span className="flex items-center gap-1 text-xs bg-slate-200 text-slate-700 px-3 py-1 rounded-full">
                        <AlertCircle size={12} /> Sem Contrato
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-400 italic text-center">
                  Este condomínio não possui sistema de elevadores.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =============================================================
  // RENDERIZAÇÃO PRINCIPAL
  // =============================================================
  if (loading && condominios.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando Sistema Quanta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-900 text-white p-2 rounded-xl">
                <Layout size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">Sistema Quanta</h1>
                <p className="text-xs text-slate-500">Gestão AGESC · Versão 1.2 · 3JUL26 · ESTÁVEL</p>
              </div>
            </div>

            {/* Navegação por Abas */}
            <nav className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <PieChart size={18} />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('gerenciar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'gerenciar'
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Building2 size={18} />
                Gerenciar
              </button>
              <button
                onClick={() => setActiveTab('contratos')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === 'contratos'
                    ? 'bg-blue-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileText size={18} />
                Contratos
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'gerenciar' && renderGerenciar()}
        {activeTab === 'contratos' && renderContratos()}
      </main>

      {/* Modal de Detalhes */}
      {selectedCondo && renderCondoModal()}
    </div>
  );
};

export default App;
