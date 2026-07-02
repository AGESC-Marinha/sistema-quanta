import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Layout, Users, FileText, PieChart, Plus, Search,
  Building2, DollarSign, Calendar, CheckCircle2, AlertCircle,
  Info, ArrowRight, Save, Trash2, Edit3, ExternalLink, X, Lock
} from 'lucide-react';

// Configuração Supabase - Projeto bjeklbralayvulcuqiqe
const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTUyMDAsImV4cCI6MjAwODk5NTIwMH0.bjeklbralayvulcuqiqeAnonKeyPlaceholderForProject';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  // Estados Principais
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [rateios, setRateios] = useState([]);
  const [fechamentos, setFechamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondo, setSelectedCondo] = useState(null);

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

  // Estados para Fechamento Mensal
  const [fechamentoMes, setFechamentoMes] = useState('');
  const [fechamentoAno, setFechamentoAno] = useState('');
  const [fechamentoSelecionado, setFechamentoSelecionado] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: condos } = await supabase.from('condominios').select('*').order('nome');
      const { data: conts } = await supabase.from('contratos').select('*');
      const { data: rats } = await supabase.from('rateios').select('*');
      const { data: fech } = await supabase.from('fechamentos').select('*').order('created_at', { ascending: false });

      setCondominios(condos || []);
      setContratos(conts || []);
      setRateios(rats || []);
      setFechamentos(fech || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
    setLoading(false);
  };

  // Lógica de Cálculo de Rateio por Condomínio
  const getDeducoesPorCondominio = (condoId, condoNome) => {
    let totalDeducao = 0;

    // 1. Soma alocações diretas
    const diretos = rateios.filter(r => r.condominio_id === condoId || r.condominio === condoNome);
    totalDeducao += diretos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    // 2. Soma contratos marcados como "Todos" (Rateio igualitário entre os 43)
    const contratosTodos = rateios.filter(r => r.is_all_condos === true);
    contratosTodos.forEach(r => {
      totalDeducao += Number(r.valor || 0) / 43;
    });

    return totalDeducao;
  };

  // Cálculo financeiro completo por condomínio
  const calcularFinancas = (condo) => {
    const receitaBruta = Number(condo.despesa_estimada || 0);
    const taxaAgesc = receitaBruta * 0.045;
    const fundoReserva = receitaBruta * 0.05;
    const deducoesContratos = getDeducoesPorCondominio(condo.id, condo.nome);
    const restituicaoBoleto = Number(condo.qtd_civis || 0) * 3;
    // REGRA: Fundo Reserva é apenas informativo ('Incluso'), NÃO subtrair do líquido
    const valorLiquido = receitaBruta - taxaAgesc - deducoesContratos + restituicaoBoleto;
    const taxaUnitaria = (Number(condo.qtd_pnr || 0) + Number(condo.qtd_civis || 0)) > 0
      ? receitaBruta / (Number(condo.qtd_pnr || 0) + Number(condo.qtd_civis || 0))
      : 0;

    return {
      receitaBruta,
      taxaAgesc,
      fundoReserva,
      deducoesContratos,
      restituicaoBoleto,
      valorLiquido,
      taxaUnitaria
    };
  };

  const handleContractSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        empresa_contratada: currentContract.empresa_contratada,
        valor_mensal: Number(currentContract.valor_mensal) || 0,
        numero_contrato: currentContract.numero_contrato || null,
        tem_aditivo: currentContract.tem_aditivo || false,
        aditivo_valor: Number(currentContract.aditivo_valor) || 0,
        aditivo_descricao: currentContract.aditivo_descricao || null,
        prazo_inicio: currentContract.prazo_inicio || null,
        prazo_fim: currentContract.prazo_fim || null,
        link_pdf: currentContract.link_pdf || null
      };

      let contractData;
      if (currentContract.id) {
        const { data, error } = await supabase
          .from('contratos')
          .update(payload)
          .eq('id', currentContract.id)
          .select()
          .single();
        if (error) throw error;
        contractData = data;
        await supabase.from('rateios').delete().eq('contrato_id', currentContract.id);
      } else {
        const { data, error } = await supabase
          .from('contratos')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        contractData = data;
      }

      const novosRateios = [];

      if (isAgescOnly) {
        novosRateios.push({
          contrato_id: contractData.id,
          valor: Number(currentContract.valor_mensal) + Number(currentContract.aditivo_valor || 0),
          is_agesc: true
        });
      } else if (isAllCondos) {
        novosRateios.push({
          contrato_id: contractData.id,
          valor: Number(currentContract.valor_mensal) + Number(currentContract.aditivo_valor || 0),
          is_all_condos: true
        });
      } else {
        Object.keys(selectedCondosForContract).forEach(condoId => {
          if (selectedCondosForContract[condoId].selected) {
            novosRateios.push({
              contrato_id: contractData.id,
              condominio_id: Number(condoId),
              valor: Number(selectedCondosForContract[condoId].valor || 0)
            });
          }
        });
      }

      if (novosRateios.length > 0) {
        await supabase.from('rateios').insert(novosRateios);
      }

      alert('Contrato e rateios salvos com sucesso!');
      resetContractForm();
      fetchData();
      setIsEditingContract(false);
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

  const handleEditContract = (contrato) => {
    setCurrentContract({
      ...contrato,
      aditivo_valor: contrato.aditivo_valor || 0,
      aditivo_descricao: contrato.aditivo_descricao || '',
      numero_contrato: contrato.numero_contrato || '',
      prazo_inicio: contrato.prazo_inicio || '',
      prazo_fim: contrato.prazo_fim || '',
      link_pdf: contrato.link_pdf || ''
    });
    setIsEditingContract(true);
    setActiveTab('contratos');

    const condoMap = {};
    rateios.filter(r => r.contrato_id === contrato.id && r.condominio_id).forEach(r => {
      condoMap[r.condominio_id] = { selected: true, valor: Number(r.valor || 0) };
    });
    setSelectedCondosForContract(condoMap);

    const agescRateio = rateios.find(r => r.contrato_id === contrato.id && r.is_agesc);
    setIsAgescOnly(!!agescRateio);

    const allCondosRateio = rateios.find(r => r.contrato_id === contrato.id && r.is_all_condos);
    setIsAllCondos(!!allCondosRateio);
  };

  const handleDeleteContract = async (id) => {
    if (!window.confirm('Deseja realmente excluir este contrato e seus rateios?')) return;
    setLoading(true);
    try {
      await supabase.from('rateios').delete().eq('contrato_id', id);
      await supabase.from('contratos').delete().eq('id', id);
      alert('Contrato excluído com sucesso!');
      fetchData();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCondoCheckboxChange = (condoId) => {
    setSelectedCondosForContract(prev => ({
      ...prev,
      [condoId]: {
        selected: !prev[condoId]?.selected,
        valor: prev[condoId]?.valor || 0
      }
    }));
  };

  const handleCondoValorChange = (condoId, valor) => {
    setSelectedCondosForContract(prev => ({
      ...prev,
      [condoId]: {
        ...prev[condoId],
        selected: true,
        valor: Number(valor)
      }
    }));
  };

  // Salvar Fechamento Mensal
  const handleSaveFechamento = async () => {
    if (!fechamentoMes || !fechamentoAno) {
      alert('Selecione mês e ano para o fechamento.');
      return;
    }

    setLoading(true);
    try {
      const dadosFechamento = condominios.map(condo => {
        const fin = calcularFinancas(condo);
        return {
          condominio_id: condo.id,
          condominio_nome: condo.nome,
          receita_bruta: fin.receitaBruta,
          taxa_agesc: fin.taxaAgesc,
          fundo_reserva: fin.fundoReserva,
          deducoes_contratos: fin.deducoesContratos,
          restituicao_boleto: fin.restituicaoBoleto,
          valor_liquido: fin.valorLiquido,
          taxa_unitaria: fin.taxaUnitaria
        };
      });

      const payload = {
        mes: Number(fechamentoMes),
        ano: Number(fechamentoAno),
        referencia: `${fechamentoMes}/${fechamentoAno}`,
        dados: JSON.stringify(dadosFechamento),
        total_liquido: dadosFechamento.reduce((acc, d) => acc + d.valor_liquido, 0),
        total_receita: dadosFechamento.reduce((acc, d) => acc + d.receita_bruta, 0),
        status: 'fechado'
      };

      const { error } = await supabase.from('fechamentos').insert(payload);
      if (error) throw error;

      alert(`Fechamento ${fechamentoMes}/${fechamentoAno} salvo com sucesso!`);
      setFechamentoMes('');
      setFechamentoAno('');
      fetchData();
    } catch (error) {
      alert('Erro ao salvar fechamento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFechamento = async (id) => {
    if (!window.confirm('Deseja excluir este fechamento?')) return;
    setLoading(true);
    try {
      await supabase.from('fechamentos').delete().eq('id', id);
      alert('Fechamento excluído.');
      fetchData();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Renderização do Dashboard
  const renderDashboard = () => {
    const filteredCondos = condominios.filter(c =>
      c.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totais = condominios.reduce((acc, condo) => {
      const fin = calcularFinancas(condo);
      acc.receita += fin.receitaBruta;
      acc.liquido += fin.valorLiquido;
      return acc;
    }, { receita: 0, liquido: 0 });

    return (
      <div className="space-y-6">
        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Building2 className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total de Condomínios</p>
                <p className="text-2xl font-bold text-slate-800">{condominios.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Receita Bruta Total</p>
                <p className="text-2xl font-bold text-slate-800">R$ {formatCurrency(totais.receita)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 p-3 rounded-lg">
                <PieChart className="text-white" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-500">Líquido Total para Repasse</p>
                <p className="text-2xl font-bold text-slate-800">R$ {formatCurrency(totais.liquido)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Busca */}
        <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <Search className="text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar condomínio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-slate-700"
          />
        </div>

        {/* Cards de Condomínios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredCondos.map(condo => {
            const fin = calcularFinancas(condo);

            return (
              <div
                key={condo.id}
                onClick={() => setSelectedCondo(condo)}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer"
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{condo.nome}</h3>
                    <div className="inline-flex items-center gap-2 mt-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                      <CheckCircle2 size={14} />
                      TU: R$ {formatCurrency(fin.taxaUnitaria)}
                    </div>
                  </div>
                  <ExternalLink className="text-slate-300" size={18} />
                </div>

                {/* Box Azul - Receita Bruta */}
                <div className="bg-blue-500 text-white rounded-lg p-4 mb-3">
                  <p className="text-xs uppercase tracking-wide opacity-80">Receita Bruta</p>
                  <p className="text-xl font-bold">R$ {formatCurrency(fin.receitaBruta)}</p>
                </div>

                {/* Lista Detalhada de Deduções e Acréscimos */}
                <div className="bg-slate-50 rounded-lg p-4 mb-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Taxa AGESC (4,5%)</span>
                    <span className="text-red-600 font-semibold">- R$ {formatCurrency(fin.taxaAgesc)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Fundo Reserva (5%)</span>
                    <span className="text-amber-600 font-semibold flex items-center gap-1">
                      <Info size={12} />
                      Incluso
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Dedução Contratos</span>
                    <span className="text-red-600 font-semibold">- R$ {formatCurrency(fin.deducoesContratos)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Restituição Boleto</span>
                    <span className="text-green-600 font-semibold">+ R$ {formatCurrency(fin.restituicaoBoleto)}</span>
                  </div>
                </div>

                {/* Box Preto - Líquido para Repasse */}
                <div className="bg-slate-900 text-white rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide opacity-70">Líquido para Repasse</p>
                  <p className="text-xl font-bold">R$ {formatCurrency(fin.valorLiquido)}</p>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCondos.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Building2 size={48} className="mx-auto mb-3 opacity-50" />
            <p>Nenhum condomínio encontrado.</p>
          </div>
        )}
      </div>
    );
  };

  // Renderização da Aba de Contratos
  const renderContratos = () => {
    return (
      <div className="space-y-6">
        {/* Formulário de Contrato */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText size={22} className="text-blue-600" />
              {currentContract.id ? 'Editar Contrato' : 'Novo Contrato'}
            </h2>
            {currentContract.id && (
              <button
                onClick={() => resetContractForm()}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Cancelar Edição
              </button>
            )}
          </div>

          <form onSubmit={handleContractSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Empresa Contratada *</label>
                <input
                  type="text"
                  required
                  value={currentContract.empresa_contratada}
                  onChange={(e) => setCurrentContract({ ...currentContract, empresa_contratada: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Valor Mensal (R$) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={currentContract.valor_mensal}
                  onChange={(e) => setCurrentContract({ ...currentContract, valor_mensal: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Número do Contrato</label>
                <input
                  type="text"
                  value={currentContract.numero_contrato}
                  onChange={(e) => setCurrentContract({ ...currentContract, numero_contrato: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Link do PDF</label>
                <input
                  type="text"
                  value={currentContract.link_pdf}
                  onChange={(e) => setCurrentContract({ ...currentContract, link_pdf: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Prazo Início</label>
                <input
                  type="date"
                  value={currentContract.prazo_inicio}
                  onChange={(e) => setCurrentContract({ ...currentContract, prazo_inicio: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Prazo Fim</label>
                <input
                  type="date"
                  value={currentContract.prazo_fim}
                  onChange={(e) => setCurrentContract({ ...currentContract, prazo_fim: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Aditivo */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="tem_aditivo"
                checked={currentContract.tem_aditivo}
                onChange={(e) => setCurrentContract({ ...currentContract, tem_aditivo: e.target.checked })}
                className="w-5 h-5"
              />
              <label htmlFor="tem_aditivo" className="text-sm font-medium text-slate-600">Possui Aditivo</label>
            </div>

            {currentContract.tem_aditivo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Valor do Aditivo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={currentContract.aditivo_valor}
                    onChange={(e) => setCurrentContract({ ...currentContract, aditivo_valor: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Descrição do Aditivo</label>
                  <input
                    type="text"
                    value={currentContract.aditivo_descricao}
                    onChange={(e) => setCurrentContract({ ...currentContract, aditivo_descricao: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Tipo de Alocação */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3">Tipo de Alocação</p>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="alocacao"
                    checked={!isAgescOnly && !isAllCondos}
                    onChange={() => { setIsAgescOnly(false); setIsAllCondos(false); }}
                  />
                  <span className="text-sm text-slate-600">Alocação Direta por Condomínio</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="alocacao"
                    checked={isAllCondos}
                    onChange={() => { setIsAllCondos(true); setIsAgescOnly(false); }}
                  />
                  <span className="text-sm text-slate-600">Rateio entre Todos (43)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="alocacao"
                    checked={isAgescOnly}
                    onChange={() => { setIsAgescOnly(true); setIsAllCondos(false); }}
                  />
                  <span className="text-sm text-slate-600">Apenas AGESC</span>
                </label>
              </div>
            </div>

            {/* Seleção de Condomínios */}
            {!isAgescOnly && !isAllCondos && (
              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Selecione os Condomínios e Valores</p>
                <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
                  {condominios.map(condo => (
                    <div key={condo.id} className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedCondosForContract[condo.id]?.selected || false}
                        onChange={() => handleCondoCheckboxChange(condo.id)}
                        className="w-5 h-5"
                      />
                      <span className="flex-1 text-sm text-slate-700">{condo.nome}</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 0,00"
                        value={selectedCondosForContract[condo.id]?.valor || ''}
                        onChange={(e) => handleCondoValorChange(condo.id, e.target.value)}
                        className="w-32 border border-slate-300 rounded-lg px-2 py-1 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              {currentContract.id ? 'Atualizar Contrato' : 'Salvar Contrato'}
            </button>
          </form>
        </div>

        {/* Lista de Contratos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Contratos Cadastrados</h2>
          <div className="space-y-3">
            {contratos.map(contrato => {
              const rateiosContrato = rateios.filter(r => r.contrato_id === contrato.id);
              const tipoAlocacao = rateiosContrato.find(r => r.is_agesc)
                ? 'AGESC'
                : rateiosContrato.find(r => r.is_all_condos)
                  ? 'Todos (43)'
                  : `${rateiosContrato.length} Condomínio(s)`;

              return (
                <div key={contrato.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-800">{contrato.empresa_contratada}</h3>
                      {contrato.tem_aditivo && (
                        <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">Aditivo</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      R$ {formatCurrency(contrato.valor_mensal)} / mês · {tipoAlocacao}
                      {contrato.numero_contrato && ` · Contrato: ${contrato.numero_contrato}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {contrato.link_pdf && (
                      <a
                        href={contrato.link_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-blue-600"
                      >
                        <ExternalLink size={18} />
                      </a>
                    )}
                    <button
                      onClick={() => handleEditContract(contrato)}
                      className="p-2 text-slate-400 hover:text-blue-600"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteContract(contrato.id)}
                      className="p-2 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            {contratos.length === 0 && (
              <p className="text-center text-slate-400 py-6">Nenhum contrato cadastrado.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Renderização da Aba de Fechamento Mensal
  const renderFechamentoMensal = () => {
    const meses = [
      { value: 1, label: 'Janeiro' }, { value: 2, label: 'Fevereiro' },
      { value: 3, label: 'Março' }, { value: 4, label: 'Abril' },
      { value: 5, label: 'Maio' }, { value: 6, label: 'Junho' },
      { value: 7, label: 'Julho' }, { value: 8, label: 'Agosto' },
      { value: 9, label: 'Setembro' }, { value: 10, label: 'Outubro' },
      { value: 11, label: 'Novembro' }, { value: 12, label: 'Dezembro' }
    ];

    const anos = [2024, 2025, 2026, 2027];

    return (
      <div className="space-y-6">
        {/* Formulário de Fechamento */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Calendar size={22} className="text-blue-600" />
            Gerar Fechamento Mensal
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            O fechamento consolida os valores de repasse de todos os condomínios para o período selecionado.
            Os dados são persistidos no Supabase para consulta futura.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Mês</label>
              <select
                value={fechamentoMes}
                onChange={(e) => setFechamentoMes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">Selecione...</option>
                {meses.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Ano</label>
              <select
                value={fechamentoAno}
                onChange={(e) => setFechamentoAno(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="">Selecione...</option>
                {anos.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSaveFechamento}
              disabled={loading || !fechamentoMes || !fechamentoAno}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Lock size={18} />
              Fechar Mês
            </button>
          </div>
        </div>

        {/* Preview do Fechamento - mantendo visual do Dashboard */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Preview dos Valores Atuais</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {condominios.slice(0, 10).map(condo => {
              const fin = calcularFinancas(condo);
              return (
                <div key={condo.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-slate-800">{condo.nome}</h4>
                    <div className="inline-flex items-center gap-1 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-semibold">
                      TU: R$ {formatCurrency(fin.taxaUnitaria)}
                    </div>
                  </div>
                  <div className="bg-blue-500 text-white rounded-lg p-3 mb-2">
                    <p className="text-xs opacity-80">Receita Bruta</p>
                    <p className="font-bold">R$ {formatCurrency(fin.receitaBruta)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 mb-2 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Taxa AGESC (4,5%)</span>
                      <span className="text-red-600 font-semibold">- R$ {formatCurrency(fin.taxaAgesc)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fundo Reserva (5%)</span>
                      <span className="text-amber-600 font-semibold flex items-center gap-1">
                        <Info size={10} /> Incluso
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dedução Contratos</span>
                      <span className="text-red-600 font-semibold">- R$ {formatCurrency(fin.deducoesContratos)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Restituição Boleto</span>
                      <span className="text-green-600 font-semibold">+ R$ {formatCurrency(fin.restituicaoBoleto)}</span>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-white rounded-lg p-3">
                    <p className="text-xs opacity-70">Líquido para Repasse</p>
                    <p className="font-bold">R$ {formatCurrency(fin.valorLiquido)}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {condominios.length > 10 && (
            <p className="text-center text-sm text-slate-400 mt-4">
              Exibindo 10 de {condominios.length} condomínios no preview. O fechamento completo inclui todos.
            </p>
          )}
        </div>

        {/* Lista de Fechamentos Persistidos */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Fechamentos Realizados</h3>
          <div className="space-y-3">
            {fechamentos.map(fech => (
              <div key={fech.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-slate-800">{fech.referencia}</h4>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                      {fech.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">
                    Receita: R$ {formatCurrency(fech.total_receita)} · Líquido: R$ {formatCurrency(fech.total_liquido)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFechamentoSelecionado(fech)}
                    className="p-2 text-slate-400 hover:text-blue-600"
                  >
                    <Info size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteFechamento(fech.id)}
                    className="p-2 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {fechamentos.length === 0 && (
              <p className="text-center text-slate-400 py-6">Nenhum fechamento realizado ainda.</p>
            )}
          </div>
        </div>

        {/* Modal de Detalhes do Fechamento */}
        {fechamentoSelecionado && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  Fechamento {fechamentoSelecionado.referencia}
                </h3>
                <button
                  onClick={() => setFechamentoSelecionado(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(() => {
                  try {
                    const dados = JSON.parse(fechamentoSelecionado.dados || '[]');
                    return dados.map((d, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg p-3">
                        <p className="font-semibold text-slate-800 text-sm">{d.condominio_nome}</p>
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Receita</span>
                            <span className="font-semibold">R$ {formatCurrency(d.receita_bruta)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">AGESC</span>
                            <span className="text-red-600">- R$ {formatCurrency(d.taxa_agesc)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Contratos</span>
                            <span className="text-red-600">- R$ {formatCurrency(d.deducoes_contratos)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Boleto</span>
                            <span className="text-green-600">+ R$ {formatCurrency(d.restituicao_boleto)}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1">
                            <span className="text-slate-700 font-semibold">Líquido</span>
                            <span className="font-bold">R$ {formatCurrency(d.valor_liquido)}</span>
                          </div>
                        </div>
                      </div>
                    ));
                  } catch {
                    return <p className="text-slate-400">Dados indisponíveis.</p>;
                  }
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Modal de Detalhes do Condomínio (Restaurado com Scroll)
  const renderCondoModal = () => {
    if (!selectedCondo) return null;
    const fin = calcularFinancas(selectedCondo);

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          {/* Header do Modal */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800">{selectedCondo.nome}</h2>
            <button
              onClick={() => setSelectedCondo(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Conteúdo do Modal */}
          <div className="p-6 space-y-6">
            {/* Identificação */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Identificação e Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">CNPJ</p>
                  <p className="text-sm text-slate-700">{selectedCondo.cnpj || 'Não informado'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Endereço</p>
                  <p className="text-sm text-slate-700">{selectedCondo.endereco || 'Não informado'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Dados Bancários</p>
                  <p className="text-sm text-slate-700">{selectedCondo.dados_bancarios || 'Não informado'}</p>
                </div>
              </div>
            </div>

            {/* Ficha Técnica Financeira */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Ficha Técnica Financeira</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Unidades PNR</p>
                  <p className="text-lg font-bold text-slate-700">{selectedCondo.qtd_pnr}</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Unidades Civis</p>
                  <p className="text-lg font-bold text-slate-700">{selectedCondo.qtd_civis}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400">Fundo Reserva</p>
                  <p className="text-lg font-bold text-slate-700">R$ {formatCurrency(selectedCondo.saldo_fundo_reserva)}</p>
                </div>
              </div>
            </div>

            {/* Resumo Financeiro no Modal */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Resumo Financeiro</h3>
              <div className="bg-blue-500 text-white rounded-lg p-4 mb-3">
                <p className="text-xs opacity-80">Receita Bruta</p>
                <p className="text-xl font-bold">R$ {formatCurrency(fin.receitaBruta)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 mb-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Taxa AGESC (4,5%)</span>
                  <span className="text-red-600 font-semibold">- R$ {formatCurrency(fin.taxaAgesc)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Fundo Reserva (5%)</span>
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <Info size={12} /> Incluso
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Dedução Contratos</span>
                  <span className="text-red-600 font-semibold">- R$ {formatCurrency(fin.deducoesContratos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Restituição Boleto</span>
                  <span className="text-green-600 font-semibold">+ R$ {formatCurrency(fin.restituicaoBoleto)}</span>
                </div>
              </div>
              <div className="bg-slate-900 text-white rounded-lg p-4">
                <p className="text-xs opacity-70">Líquido para Repasse</p>
                <p className="text-xl font-bold">R$ {formatCurrency(fin.valorLiquido)}</p>
              </div>
            </div>

            {/* Sistema de Elevadores */}
            {selectedCondo.possui_elevadores && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Sistema de Elevadores</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantidade</span>
                    <span className="text-slate-700 font-medium">{selectedCondo.qtd_elevadores}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Empresa</span>
                    <span className="text-slate-700 font-medium">{selectedCondo.empresa_elevadores || 'Não informado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Em Operação</span>
                    <span className="text-green-600 font-medium">{selectedCondo.elevadores_operacao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Em Manutenção</span>
                    <span className="text-amber-600 font-medium">{selectedCondo.elevadores_manutencao}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Observações / Projetos */}
            {selectedCondo.projetos_incendio && (
              <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase mb-3">Observações / Projetos</h3>
                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
                  {selectedCondo.projetos_incendio}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Configuração das Abas
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'fechamento', label: 'Fechamento Mensal', icon: Calendar }
  ];

  if (loading && condominios.length === 0) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Sistema Quanta</h1>
                <p className="text-xs text-slate-400">Gestão AGESC</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Users size={16} />
              <span>{condominios.length} Condomínios</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navegação por Abas */}
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'contratos' && renderContratos()}
        {activeTab === 'fechamento' && renderFechamentoMensal()}
        {selectedCondo && renderCondoModal()}
      </main>
    </div>
  );
};

export default App;
