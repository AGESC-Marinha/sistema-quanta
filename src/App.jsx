import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Layout, Users, FileText, PieChart, Plus, Search,
  Building2, DollarSign, Calendar, CheckCircle2, AlertCircle,
  Info, ArrowRight, Save, Trash2, Edit3, ExternalLink,
  Lock, History, Archive, Clock, Database, Zap
} from 'lucide-react';

// Configuração Supabase — chaves fixas
const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

const MESES = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' }
];

const formatCurrency = (value) =>
  Number(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const App = () => {
  // Estados Principais
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [rateios, setRateios] = useState([]);
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
    prazo_fim: ''
  });
  const [selectedCondosForContract, setSelectedCondosForContract] = useState({});
  const [isAgescOnly, setIsAgescOnly] = useState(false);
  const [isAllCondos, setIsAllCondos] = useState(false);

  // Estados do Fechamento Mensal
  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth() + 1);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [fechamentos, setFechamentos] = useState([]);
  const [fechamentosHistorico, setFechamentosHistorico] = useState([]);
  const [historicoMes, setHistoricoMes] = useState(new Date().getMonth() + 1);
  const [historicoAno, setHistoricoAno] = useState(new Date().getFullYear());
  const [salvandoFechamento, setSalvandoFechamento] = useState(false);
  const [carregandoFechamento, setCarregandoFechamento] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'fechamento') {
      fetchFechamentos(mesSelecionado, anoSelecionado);
    }
  }, [activeTab, mesSelecionado, anoSelecionado]);

  useEffect(() => {
    if (activeTab === 'fechamento') {
      fetchHistorico(historicoMes, historicoAno);
    }
  }, [activeTab, historicoMes, historicoAno]);

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
      console.error('Erro ao buscar dados:', error.message);
      setCondominios([]);
      setContratos([]);
      setRateios([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFechamentos = async (mes, ano) => {
    setCarregandoFechamento(true);
    try {
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .select('*')
        .eq('mes', mes)
        .eq('ano', ano);

      if (error) throw error;
      setFechamentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar fechamentos:', error.message);
      setFechamentos([]);
    } finally {
      setCarregandoFechamento(false);
    }
  };

  const fetchHistorico = async (mes, ano) => {
    try {
      const { data, error } = await supabase
        .from('fechamentos_mensais')
        .select('*, condominios(nome)')
        .eq('mes', mes)
        .eq('ano', ano)
        .order('condominio_id');

      if (error) throw error;
      setFechamentosHistorico(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error.message);
      setFechamentosHistorico([]);
    }
  };

  // Lógica de Cálculo de Rateio por Condomínio
  const getDeducoesPorCondominio = useCallback((condoId, condoNome) => {
    if (!rateios || rateios.length === 0) return 0;

    let totalDeducao = 0;

    const diretos = rateios.filter(r => r.condominio_id === condoId || r.condominio === condoNome);
    totalDeducao += diretos.reduce((acc, curr) => acc + Number(curr.valor || 0), 0);

    const contratosTodos = rateios.filter(r => r.is_all_condos === true);
    contratosTodos.forEach(r => {
      totalDeducao += Number(r.valor || 0) / 43;
    });

    return totalDeducao;
  }, [rateios]);

  // Cálculo consolidado por condomínio (usado em Dashboard e Fechamento)
  const calcularValoresCondominio = useCallback((condo) => {
    if (!condo || loading) {
      return {
        receitaBruta: 0,
        taxaAgesc: 0,
        fundoReserva: 0,
        deducoesContratos: 0,
        restituicaoBoleto: 0,
        valorLiquido: 0,
        taxaUnitaria: 0
      };
    }

    const receitaBruta = Number(condo.despesa_estimada || 0);
    const taxaAgesc = receitaBruta * 0.045;
    const fundoReserva = receitaBruta * 0.05;
    const deducoesContratos = getDeducoesPorCondominio(condo.id, condo.nome);
    const restituicaoBoleto = Number(condo.qtd_civis || 0) * 3;
    const valorLiquido = receitaBruta - taxaAgesc - fundoReserva - deducoesContratos + restituicaoBoleto;
    const totalUnidades = Number(condo.qtd_pnr || 0) + Number(condo.qtd_civis || 0);
    const taxaUnitaria = totalUnidades > 0 ? receitaBruta / totalUnidades : 0;

    return {
      receitaBruta,
      taxaAgesc,
      fundoReserva,
      deducoesContratos,
      restituicaoBoleto,
      valorLiquido,
      taxaUnitaria
    };
  }, [getDeducoesPorCondominio, loading]);

  // Mapa de fechamentos salvos por condominio_id
  const fechamentoMap = useMemo(() => {
    const map = {};
    if (!fechamentos || fechamentos.length === 0) return map;
    fechamentos.forEach(f => {
      if (f && f.condominio_id) {
        map[f.condominio_id] = f;
      }
    });
    return map;
  }, [fechamentos]);

  // Verifica se o mês/ano está encerrado
  const mesEncerrado = useMemo(() => {
    if (!fechamentos || fechamentos.length === 0) return false;
    return fechamentos.some(f => f && f.status === 'fechado');
  }, [fechamentos]);

  // Indica se o dashboard está exibindo snapshot gravado
  const dashboardUsaSnapshot = useMemo(() => {
    return fechamentos.length > 0 && activeTab === 'dashboard';
  }, [fechamentos, activeTab]);

  // Salvar Rascunho / Encerrar Mês (UPSERT para os 43 condomínios)
  const salvarFechamento = async (status = 'rascunho') => {
    if (condominios.length === 0) {
      alert('Nenhum condomínio carregado para salvar o fechamento.');
      return;
    }

    if (status === 'fechado' && mesEncerrado) {
      alert('Este mês já está encerrado e não pode ser reencerrado.');
      return;
    }

    setSalvandoFechamento(true);
    try {
      const registros = condominios.map(condo => {
        const valores = calcularValoresCondominio(condo);
        return {
          condominio_id: condo.id,
          mes: mesSelecionado,
          ano: anoSelecionado,
          receita_bruta: valores.receitaBruta,
          taxa_agesc: valores.taxaAgesc,
          fundo_reserva: valores.fundoReserva,
          deducoes_contratos: valores.deducoesContratos,
          restituicao_boleto: valores.restituicaoBoleto,
          valor_liquido: valores.valorLiquido,
          status
        };
      });

      const { error } = await supabase
        .from('fechamentos_mensais')
        .upsert(registros, { onConflict: 'condominio_id,mes,ano' });

      if (error) throw error;

      alert(status === 'fechado'
        ? 'Mês encerrado com sucesso! Os valores foram gravados definitivamente.'
        : 'Rascunho salvo com sucesso para os 43 condomínios!');

      await fetchFechamentos(mesSelecionado, anoSelecionado);
      await fetchHistorico(historicoMes, historicoAno);
    } catch (error) {
      alert('Erro ao salvar fechamento: ' + error.message);
    } finally {
      setSalvandoFechamento(false);
    }
  };

  const handleContractSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: contractData, error: contractError } = await supabase
        .from('contratos')
        .upsert(currentContract)
        .select()
        .single();

      if (contractError) throw contractError;

      if (currentContract.id) {
        await supabase.from('rateios').delete().eq('contrato_id', currentContract.id);
      }

      const novosRateios = [];

      if (isAgescOnly) {
        novosRateios.push({
          contrato_id: contractData.id,
          valor: Number(contractData.valor_mensal) + Number(contractData.aditivo_valor || 0),
          is_agesc: true
        });
      } else if (isAllCondos) {
        novosRateios.push({
          contrato_id: contractData.id,
          valor: Number(contractData.valor_mensal) + Number(contractData.aditivo_valor || 0),
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
    } catch (error) {
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditContract = (contrato) => {
    setCurrentContract(contrato);
    setIsEditingContract(true);
  };

  const handleDeleteContract = async (id) => {
    if (!confirm('Deseja realmente excluir este contrato e seus rateios?')) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('contratos').delete().eq('id', id);
      if (error) throw error;
      alert('Contrato excluído com sucesso!');
      fetchData();
    } catch (error) {
      alert('Erro ao excluir: ' + error.message);
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
      prazo_fim: ''
    });
    setSelectedCondosForContract({});
    setIsAgescOnly(false);
    setIsAllCondos(false);
    setIsEditingContract(true);
  };

  // Renderização do Dashboard
  const renderDashboard = () => {
    if (loading || condominios.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Database size={40} className="mb-2" />
          <p>Carregando dados ou nenhum condomínio encontrado...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Financeiro</h2>
            <p className="text-slate-500">Visão detalhada dos repasses por condomínio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar condomínio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
          dashboardUsaSnapshot
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-blue-50 border-blue-200 text-blue-700'
        }`}>
          {dashboardUsaSnapshot ? <Database size={18} /> : <Zap size={18} />}
          <span className="text-sm font-medium">
            {dashboardUsaSnapshot
              ? `Snapshot Gravado — Exibindo valores salvos de ${MESES.find(m => m.value === mesSelecionado)?.label || ''}/${anoSelecionado}`
              : 'Cálculos em Tempo Real — Os valores exibidos são calculados dinamicamente a partir dos dados atuais'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {condominios
            .filter(c => c && c.nome && c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(condo => {
              const calculado = calcularValoresCondominio(condo);
              const snapshot = fechamentoMap[condo.id];
              const valores = snapshot && snapshot.status === 'fechado' ? {
                receitaBruta: Number(snapshot.receita_bruta || 0),
                taxaAgesc: Number(snapshot.taxa_agesc || 0),
                fundoReserva: Number(snapshot.fundo_reserva || 0),
                deducoesContratos: Number(snapshot.deducoes_contratos || 0),
                restituicaoBoleto: Number(snapshot.restituicao_boleto || 0),
                valorLiquido: Number(snapshot.valor_liquido || 0),
                taxaUnitaria: calculado.taxaUnitaria
              } : calculado;

              return (
                <div
                  key={condo.id}
                  onClick={() => setSelectedCondo(condo)}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-800">{condo.nome}</h3>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded font-medium">
                      TU: R$ {valores.taxaUnitaria.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between bg-blue-50 border border-blue-100 rounded-md px-3 py-2">
                      <span className="text-blue-600 font-medium">Receita Bruta</span>
                      <span className="font-bold text-blue-700">R$ {formatCurrency(valores.receitaBruta)}</span>
                    </div>

                    <div className="border-t border-slate-100 pt-2 space-y-1">
                      <div className="flex justify-between text-red-600">
                        <span>Taxa AGESC (4.5%)</span>
                        <span>- R$ {formatCurrency(valores.taxaAgesc)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Fundo Reserva (5%)</span>
                        <span>- R$ {formatCurrency(valores.fundoReserva)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Dedução Contratos</span>
                        <span>- R$ {formatCurrency(valores.deducoesContratos)}</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>Restituição Boleto</span>
                        <span>+ R$ {formatCurrency(valores.restituicaoBoleto)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between bg-slate-800 text-white rounded-md px-3 py-2 mt-2">
                      <span className="font-semibold">Líquido para Repasse</span>
                      <span className="font-bold">R$ {formatCurrency(valores.valorLiquido)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  // Renderização da aba Fechamento
  const renderFechamento = () => {
    if (loading || condominios.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Database size={40} className="mb-2" />
          <p>Carregando dados ou nenhum condomínio encontrado...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Fechamento Mensal</h2>
          <p className="text-slate-500">Motor de Cálculo de Repasses com Persistência</p>
        </div>

        {mesEncerrado && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <Lock size={20} />
            <div>
              <p className="font-semibold">Mês Encerrado</p>
              <p className="text-sm">
                O período de {MESES.find(m => m.value === mesSelecionado)?.label || ''}/{anoSelecionado} está fechado.
                As edições estão bloqueadas para garantir a integridade do histórico.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">Período do Fechamento</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Mês</label>
              <select
                value={mesSelecionado}
                onChange={(e) => setMesSelecionado(Number(e.target.value))}
                disabled={mesEncerrado}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {MESES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Ano</label>
              <select
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                disabled={mesEncerrado}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              >
                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(ano => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => salvarFechamento('rascunho')}
              disabled={salvandoFechamento || mesEncerrado || carregandoFechamento || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {salvandoFechamento ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
            <button
              onClick={() => salvarFechamento('fechado')}
              disabled={salvandoFechamento || mesEncerrado || carregandoFechamento || loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
            >
              <Lock size={18} />
              {salvandoFechamento ? 'Encerrando...' : 'Encerrar Mês'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 size={20} className="text-slate-600" />
              <h3 className="font-semibold text-slate-800">
                Valores Calculados — {MESES.find(m => m.value === mesSelecionado)?.label || ''}/{anoSelecionado}
              </h3>
            </div>
            {carregandoFechamento && <span className="text-sm text-slate-400">Carregando...</span>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 px-3">Condomínio</th>
                  <th className="py-2 px-3 text-right">Receita Bruta</th>
                  <th className="py-2 px-3 text-right">Taxa AGESC</th>
                  <th className="py-2 px-3 text-right">Fundo Reserva</th>
                  <th className="py-2 px-3 text-right">Deduções</th>
                  <th className="py-2 px-3 text-right">Restituição</th>
                  <th className="py-2 px-3 text-right">Valor Líquido</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {condominios.map(condo => {
                  const valores = calcularValoresCondominio(condo);
                  const salvo = fechamentoMap[condo.id];
                  return (
                    <tr key={condo.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-3 font-medium text-slate-700">{condo.nome}</td>
                      <td className="py-2 px-3 text-right">R$ {formatCurrency(valores.receitaBruta)}</td>
                      <td className="py-2 px-3 text-right text-red-600">R$ {formatCurrency(valores.taxaAgesc)}</td>
                      <td className="py-2 px-3 text-right text-red-600">R$ {formatCurrency(valores.fundoReserva)}</td>
                      <td className="py-2 px-3 text-right text-red-600">R$ {formatCurrency(valores.deducoesContratos)}</td>
                      <td className="py-2 px-3 text-right text-green-600">R$ {formatCurrency(valores.restituicaoBoleto)}</td>
                      <td className="py-2 px-3 text-right font-bold text-blue-600">R$ {formatCurrency(valores.valorLiquido)}</td>
                      <td className="py-2 px-3 text-center">
                        {salvo ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                            salvo.status === 'fechado'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {salvo.status === 'fechado' ? <Lock size={12} /> : <Clock size={12} />}
                            {salvo.status}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">não salvo</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300 font-semibold text-slate-800">
                  <td className="py-3 px-3">Total Geral (43 condomínios)</td>
                  <td className="py-3 px-3 text-right">R$ {formatCurrency(condominios.reduce((acc, c) => acc + calcularValoresCondominio(c).receitaBruta, 0))}</td>
                  <td className="py-3 px-3 text-right">R$ {formatCurrency(condominios.reduce((acc, c) => acc + calcularValoresCondominio(c).taxaAgesc, 0))}</td>
                  <td className="py-3 px-3 text-right">R$ {formatCurrency(condominios.reduce((acc, c) => acc + calcularValoresCondominio(c).fundoReserva, 0))}</td>
                  <td className="py-3 px-3 text-right">R$ {formatCurrency(condominios.reduce((acc, c) => acc + calcularValoresCondominio(c).deducoesContratos, 0))}</td>
                  <td className="py-3 px-3 text-right">R$ {formatCurrency(condominios.reduce((acc, c) => acc + calcularValoresCondominio(c).restituicaoBoleto, 0))}</td>
                  <td className="py-3 px-3 text-right text-blue-600">R$ {formatCurrency(condominios.reduce((acc, c) => acc + calcularValoresCondominio(c).valorLiquido, 0))}</td>
                  <td className="py-3 px-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {renderHistorico()}
      </div>
    );
  };

  // Histórico de Fechamentos
  const renderHistorico = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <History size={20} className="text-slate-600" />
        <h3 className="font-semibold text-slate-800">Histórico de Fechamentos</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Mês (Consulta)</label>
          <select
            value={historicoMes}
            onChange={(e) => setHistoricoMes(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MESES.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Ano (Consulta)</label>
          <select
            value={historicoAno}
            onChange={(e) => setHistoricoAno(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 2 + i).map(ano => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
        </div>
      </div>

      {fechamentosHistorico.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
          <Archive size={40} className="mb-2" />
          <p>Nenhum fechamento encontrado para {MESES.find(m => m.value === historicoMes)?.label || ''}/{historicoAno}.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="py-2 px-3">Condomínio</th>
                <th className="py-2 px-3 text-right">Receita Bruta</th>
                <th className="py-2 px-3 text-right">Taxa AGESC</th>
                <th className="py-2 px-3 text-right">Fundo Reserva</th>
                <th className="py-2 px-3 text-right">Deduções</th>
                <th className="py-2 px-3 text-right">Restituição</th>
                <th className="py-2 px-3 text-right">Valor Líquido</th>
                <th className="py-2 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {fechamentosHistorico.map(f => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium text-slate-700">
                    {f.condominios?.nome || `Condomínio #${f.condominio_id}`}
                  </td>
                  <td className="py-2 px-3 text-right">R$ {formatCurrency(f.receita_bruta)}</td>
                  <td className="py-2 px-3 text-right text-red-600">R$ {formatCurrency(f.taxa_agesc)}</td>
                  <td className="py-2 px-3 text-right text-red-600">R$ {formatCurrency(f.fundo_reserva)}</td>
                  <td className="py-2 px-3 text-right text-red-600">R$ {formatCurrency(f.deducoes_contratos)}</td>
                  <td className="py-2 px-3 text-right text-green-600">R$ {formatCurrency(f.restituicao_boleto)}</td>
                  <td className="py-2 px-3 text-right font-bold text-blue-600">R$ {formatCurrency(f.valor_liquido)}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      f.status === 'fechado'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {f.status === 'fechado' ? <Lock size={12} /> : <Clock size={12} />}
                      {f.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 font-semibold text-slate-800">
                <td className="py-3 px-3">Total</td>
                <td className="py-3 px-3 text-right">R$ {formatCurrency(fechamentosHistorico.reduce((a, f) => a + Number(f.receita_bruta || 0), 0))}</td>
                <td className="py-3 px-3 text-right">R$ {formatCurrency(fechamentosHistorico.reduce((a, f) => a + Number(f.taxa_agesc || 0), 0))}</td>
                <td className="py-3 px-3 text-right">R$ {formatCurrency(fechamentosHistorico.reduce((a, f) => a + Number(f.fundo_reserva || 0), 0))}</td>
                <td className="py-3 px-3 text-right">R$ {formatCurrency(fechamentosHistorico.reduce((a, f) => a + Number(f.deducoes_contratos || 0), 0))}</td>
                <td className="py-3 px-3 text-right">R$ {formatCurrency(fechamentosHistorico.reduce((a, f) => a + Number(f.restituicao_boleto || 0), 0))}</td>
                <td className="py-3 px-3 text-right text-blue-600">R$ {formatCurrency(fechamentosHistorico.reduce((a, f) => a + Number(f.valor_liquido || 0), 0))}</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );

  // Renderização de Contratos
  const renderContratos = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Database size={40} className="mb-2" />
          <p>Carregando contratos...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Contratos Avançados</h2>
            <p className="text-slate-500">Gestão de contratos e rateios por condomínio</p>
          </div>
          <button
            onClick={resetContractForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Novo Contrato
          </button>
        </div>

        {contratos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FileText size={40} className="mb-2" />
            <p>Nenhum contrato cadastrado. Clique em "Novo Contrato" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {contratos.map(contrato => (
              <div key={contrato.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-800">{contrato.empresa_contratada}</h3>
                    <p className="text-sm text-slate-500">
                      Contrato: {contrato.numero_contrato || 'N/I'} | Valor: R$ {formatCurrency(contrato.valor_mensal)}
                    </p>
                    {contrato.tem_aditivo && (
                      <p className="text-sm text-amber-600 mt-1">
                        Aditivo: {contrato.aditivo_descricao} — R$ {formatCurrency(contrato.aditivo_valor)}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {contrato.link_pdf && (
                        <a href={contrato.link_pdf} target="_blank" rel="noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <ExternalLink size={14} /> Ver PDF
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditContract(contrato)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => handleDeleteContract(contrato.id)}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {isEditingContract && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">
                  {currentContract.id ? 'Editar Contrato' : 'Novo Contrato'}
                </h3>
                <button onClick={() => setIsEditingContract(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <form onSubmit={handleContractSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Empresa Contratada</label>
                    <input type="text" required
                      value={currentContract.empresa_contratada}
                      onChange={(e) => setCurrentContract({ ...currentContract, empresa_contratada: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Número do Contrato</label>
                    <input type="text"
                      value={currentContract.numero_contrato}
                      onChange={(e) => setCurrentContract({ ...currentContract, numero_contrato: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Valor Mensal (R$)</label>
                    <input type="number" step="0.01" required
                      value={currentContract.valor_mensal}
                      onChange={(e) => setCurrentContract({ ...currentContract, valor_mensal: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="tem_aditivo"
                      checked={currentContract.tem_aditivo}
                      onChange={(e) => setCurrentContract({ ...currentContract, tem_aditivo: e.target.checked })} />
                    <label htmlFor="tem_aditivo" className="text-sm font-medium text-slate-600">Possui Aditivo</label>
                  </div>
                  {currentContract.tem_aditivo && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Valor do Aditivo (R$)</label>
                        <input type="number" step="0.01"
                          value={currentContract.aditivo_valor}
                          onChange={(e) => setCurrentContract({ ...currentContract, aditivo_valor: Number(e.target.value) })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Descrição do Aditivo</label>
                        <input type="text"
                          value={currentContract.aditivo_descricao}
                          onChange={(e) => setCurrentContract({ ...currentContract, aditivo_descricao: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Prazo Início</label>
                    <input type="date"
                      value={currentContract.prazo_inicio || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, prazo_inicio: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Prazo Fim</label>
                    <input type="date"
                      value={currentContract.prazo_fim || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, prazo_fim: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Link PDF</label>
                    <input type="text"
                      value={currentContract.link_pdf || ''}
                      onChange={(e) => setCurrentContract({ ...currentContract, link_pdf: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <p className="font-medium text-slate-700">Tipo de Rateio</p>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={isAgescOnly} onChange={() => { setIsAgescOnly(true); setIsAllCondos(false); }} />
                      Apenas AGESC
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={isAllCondos} onChange={() => { setIsAllCondos(true); setIsAgescOnly(false); }} />
                      Todos os 43 condomínios (Global - rateio igualitário)
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={!isAgescOnly && !isAllCondos} onChange={() => { setIsAgescOnly(false); setIsAllCondos(false); }} />
                      Selecionar condomínios específicos
                    </label>
                  </div>

                  {!isAgescOnly && !isAllCondos && (
                    <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3">
                      {condominios.length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-4">Nenhum condomínio disponível</p>
                      ) : (
                        condominios.map(condo => (
                          <div key={condo.id} className="flex items-center justify-between py-1">
                            <label className="flex items-center gap-2 text-sm">
                              <input type="checkbox"
                                checked={selectedCondosForContract[condo.id]?.selected || false}
                                onChange={(e) => setSelectedCondosForContract({
                                  ...selectedCondosForContract,
                                  [condo.id]: { selected: e.target.checked, valor: selectedCondosForContract[condo.id]?.valor || 0 }
                                })} />
                              {condo.nome}
                            </label>
                            {selectedCondosForContract[condo.id]?.selected && (
                              <input type="number" step="0.01" placeholder="Valor"
                                value={selectedCondosForContract[condo.id]?.valor || 0}
                                onChange={(e) => setSelectedCondosForContract({
                                  ...selectedCondosForContract,
                                  [condo.id]: { selected: true, valor: Number(e.target.value) }
                                })}
                                className="w-28 px-2 py-1 text-sm border border-slate-200 rounded" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button type="button" onClick={() => setIsEditingContract(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors">
                    <Save size={18} />
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

  // Modal de Detalhes do Condomínio (com scroll)
  const renderCondoModal = () => {
    if (!selectedCondo) return null;
    const valores = calcularValoresCondominio(selectedCondo);
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-slate-800">{selectedCondo.nome}</h3>
            <button onClick={() => setSelectedCondo(null)} className="text-slate-400 hover:text-slate-600">
              ✕
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Identificação e Contato</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">CNPJ: </span>{selectedCondo.cnpj || 'Não informado'}</div>
                <div><span className="text-slate-500">Endereço: </span>{selectedCondo.endereco || 'Não informado'}</div>
                <div><span className="text-slate-500">Dados Bancários: </span>{selectedCondo.dados_bancarios || 'Não informado'}</div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Ficha Técnica Financeira</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500">Unidades PNR</p>
                  <p className="font-bold text-slate-800">{selectedCondo.qtd_pnr || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500">Unidades Civis</p>
                  <p className="font-bold text-slate-800">{selectedCondo.qtd_civis || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg">
                  <p className="text-slate-500">Fundo Reserva</p>
                  <p className="font-bold text-slate-800">R$ {formatCurrency(selectedCondo.saldo_fundo_reserva)}</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-700 mb-2">Resumo do Repasse (Tempo Real)</h4>
              <div className="bg-blue-50 p-4 rounded-lg space-y-1 text-sm">
                <div className="flex justify-between"><span>Receita Bruta</span><span>R$ {formatCurrency(valores.receitaBruta)}</span></div>
                <div className="flex justify-between text-red-600"><span>Taxa AGESC</span><span>- R$ {formatCurrency(valores.taxaAgesc)}</span></div>
                <div className="flex justify-between text-red-600"><span>Fundo Reserva</span><span>- R$ {formatCurrency(valores.fundoReserva)}</span></div>
                <div className="flex justify-between text-red-600"><span>Deduções</span><span>- R$ {formatCurrency(valores.deducoesContratos)}</span></div>
                <div className="flex justify-between text-green-600"><span>Restituição</span><span>+ R$ {formatCurrency(valores.restituicaoBoleto)}</span></div>
                <div className="flex justify-between font-bold border-t border-blue-200 pt-1 mt-1"><span>Líquido</span><span>R$ {formatCurrency(valores.valorLiquido)}</span></div>
              </div>
            </div>

            {selectedCondo.possui_elevadores && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Sistema de Elevadores</h4>
                <div className="text-sm space-y-1">
                  <p>Quantidade: {selectedCondo.qtd_elevadores || 0}</p>
                  <p>Empresa: {selectedCondo.empresa_elevadores || 'N/I'}</p>
                  <p>Em Operação: {selectedCondo.elevadores_operacao || 0}</p>
                  <p>Em Manutenção: {selectedCondo.elevadores_manutencao || 0}</p>
                </div>
              </div>
            )}

            {selectedCondo.projetos_incendio && (
              <div>
                <h4 className="font-semibold text-slate-700 mb-2">Observações / Projetos</h4>
                <p className="text-sm text-slate-600">{selectedCondo.projetos_incendio}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: PieChart },
    { id: 'contratos', label: 'Contratos', icon: FileText },
    { id: 'fechamento', label: 'Fechamento', icon: Calendar }
  ];

  if (loading && condominios.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Carregando dados do sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Sistema Quanta</h1>
              <p className="text-xs text-slate-500">Gestão AGESC — 43 Condomínios</p>
            </div>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'contratos' && renderContratos()}
        {activeTab === 'fechamento' && renderFechamento()}
        {selectedCondo && renderCondoModal()}
      </main>
    </div>
  );
};

export default App;
