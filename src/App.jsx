import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx'; // <--- ADICIONE ESTA LINHA PARA O EXCEL FUNCIONAR
import {
  Building2, MapPin, Users, DollarSign, Trash2,
  LayoutDashboard, Settings, Loader2, PlusCircle, Pencil, XCircle,
  CreditCard, Flame, ArrowUpCircle, ExternalLink, X,
  FileText, Calendar, Percent, Link2, ChevronDown, ChevronRight, 
  TrendingDown, Info, CheckCircle2, AlertCircle, Loader // <--- ÍCONES ADICIONADOS
} from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

const BOLETO_FEE = 3.00;
const AGESC_FEE_RATE = 0.045;
const FUNDO_RESERVA_RATE = 0.05;

const INITIAL_FORM = {
  nome: '', endereco: '', cnpj: '', dados_bancarios: '',
  saldo_fundo_reserva: '', projetos_incendio: '',
  possui_elevadores: false, qtd_elevadores: '',
  elevadores_operacao: '', elevadores_manutencao: '',
  empresa_elevadores: '', status_manutencao: '',
  qtd_pnr: '', qtd_civis: '', despesa_estimada: ''
};

const INITIAL_CONTRACT_FORM = {
  numero_contrato: '',
  empresa_contratada: '',
  valor_mensal: '',
  tem_aditivo: false,
  aditivo_descricao: '',
  aditivo_valor: '',
  prazo_inicio: '',
  prazo_fim: '',
  link_pdf: ''
};
// --- COPIE E COLE AQUI (Linha 32) ---
const CATEGORIAS = {
  MARAGESC: {
    entradas: ['Repasse PAPEM', 'Permissionário Civil', 'Desocupados (AGESC)', 'Taxa Extra', 'Reembolso', 'TLP', 'Rendimentos'],
    saidas: ['Repasse Condomínios', 'Taxa AGESC (4,5%)', 'Empresas Terceirizadas', 'Síndico Profissional', 'Contabilidade (ASCON)', 'Restituição', 'Taxas PNR Isolados', 'Auditoria', 'Seguros', 'Projetos/PPCI']
  },
  AGESC: {
    entradas: ['Taxa AGESC (4,5%)', 'Juros Investimentos', 'Dividendos', 'Saldos Investimentos'],
    saidas: ['Contabilidade', 'Advogado', 'Pró-labore', 'Impostos (DARF/FGTS)', 'Aluguel Sede', 'Neoenergia', 'Internet', 'Google Workspace', 'Cartão de Crédito', 'IPTU', 'Material Escritório', 'Tarifas Bancárias']
  }
};

const INITIAL_MOV_FORM = {
  data_movimento: new Date().toISOString().split('T')[0],
  descricao: '',
  valor: '',
  tipo: 'saida',
  conta: 'MARAGESC',
  categoria: ''
};
// --- FIM DA COLAGEM 1 ---
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [rateios, setRateios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedCondo, setSelectedCondo] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [contractForm, setContractForm] = useState(INITIAL_CONTRACT_FORM);
  const [editingContractId, setEditingContractId] = useState(null);
  const [savingContract, setSavingContract] = useState(false);
  const [allocations, setAllocations] = useState({});

  // Estados para Prestação de Contas
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCondoForPrestacao, setSelectedCondoForPrestacao] = useState(null);
  const [balancetes, setBalancetes] = useState({
    MARAGESC: { saldo_inicial: 0, entradas: 0, saidas: 0, saldo_final: 0 },
    AGESC: { saldo_inicial: 0, entradas: 0, saidas: 0, saldo_final: 0 }
  });
  const [movimentacoes, setMovimentacoes] = useState({ MARAGESC: [], AGESC: [] });
  const [loadingPrestacao, setLoadingPrestacao] = useState(false);
    // --- ESTADOS PARA CONCILIAÇÃO (SPRINT 1) ---
  const [stagingMovs, setStagingMovs] = useState([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
// --- COPIE E COLE AQUI (Linha 54) ---
  const [movForm, setMovForm] = useState(INITIAL_MOV_FORM);
  const [savingMov, setSavingMov] = useState(false);
// --- FIM DA COLAGEM 2 ---
  useEffect(() => {
    fetchCondominios();
    fetchContratos();
    fetchRateios();
  }, []);

  // useEffect corrigido para observar mudanças no mês e carregar dados globais ou específicos
  useEffect(() => {
    if (activeTab === 'prestacao') {
      fetchBalanceteData(selectedCondoForPrestacao?.id || null, selectedMonth);
    }
  }, [activeTab, selectedCondoForPrestacao, selectedMonth]);

// --- SUBSTITUA DA LINHA 58 ATÉ 105 POR ESTE BLOCO ---
  async function fetchBalanceteData(condoId, month) {
    try {
      setLoadingPrestacao(true);
      const accounts = ['MARAGESC', 'AGESC'];
      const newBalancetes = { ...balancetes };
      const newMovimentacoes = { ...movimentacoes };

      for (const account of accounts) {
        // 1. Buscar balancete do mês atual (Tabela corrigida: balancetes_mensais)
        let { data: current, error: err1 } = await supabase
          .from('balancetes_mensais')
          .select('*')
          .eq('mes_referencia', month + '-01')
          .eq('conta', account)
          .maybeSingle();

        if (current) {
          newBalancetes[account] = current;
        } else {
          // 2. Lógica de transporte de saldo anterior
          let { data: prev, error: err2 } = await supabase
            .from('balancetes_mensais')
            .select('saldo_final')
            .lt('mes_referencia', month + '-01')
            .eq('conta', account)
            .order('mes_referencia', { ascending: false })
            .limit(1)
            .maybeSingle();

          newBalancetes[account] = {
            saldo_inicial: prev?.saldo_final || 0,
            entradas: 0,
            saidas: 0,
            saldo_final: prev?.saldo_final || 0
          };
        }

        // 3. Buscar movimentações (Tabela corrigida: movimentacoes_extrato)
        let { data: movs, error: err3 } = await supabase
          .from('movimentacoes_extrato')
          .select('*')
          .eq('balancete_id', current?.id || null)
          .order('data_movimento', { ascending: true });

        newMovimentacoes[account] = movs || [];
      }
      setBalancetes(newBalancetes);
      setMovimentacoes(newMovimentacoes);
    } catch (err) {
      console.error('Erro ao buscar dados da prestação:', err);
    } finally {
      setLoadingPrestacao(false);
    }
  }

  async function handleMovSubmit(e) {
    e.preventDefault();
    if (!movForm.categoria) return alert('Selecione uma categoria');
    setSavingMov(true);
    try {
      // 1. Garantir que o Balancete Pai existe
      let { data: balancete, error: bError } = await supabase
        .from('balancetes_mensais')
        .select('id')
        .eq('mes_referencia', selectedMonth + '-01')
        .eq('conta', movForm.conta)
        .maybeSingle();

      let balanceteId = balancete?.id;

      if (!balanceteId) {
        const { data: newB, error: createError } = await supabase
          .from('balancetes_mensais')
          .insert([{ 
            mes_referencia: selectedMonth + '-01', 
            conta: movForm.conta,
            saldo_inicial: balancetes[movForm.conta].saldo_inicial,
            status: 'Aberto'
          }])
          .select();
        if (createError) throw createError;
        balanceteId = newB[0].id;
      }

      // 2. Inserir Movimentação
      const { error: movError } = await supabase
        .from('movimentacoes_extrato')
        .insert([{
          balancete_id: balanceteId,
          data_movimento: movForm.data_movimento,
          descricao: movForm.descricao,
          categoria: movForm.categoria,
          tipo: movForm.tipo,
          valor: Number(movForm.valor)
        }]);

      if (movError) throw movError;

      alert('Lançamento realizado com sucesso!');
      setMovForm({...INITIAL_MOV_FORM, conta: movForm.conta, data_movimento: movForm.data_movimento});
      fetchBalanceteData(null, selectedMonth);
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSavingMov(false);
    }
  }
// --- FIM DA SUBSTITUIÇÃO ---
  
    // MOTOR DE INTELIGÊNCIA: MAPEAMENTO DE PADRÕES (REGEX)
  const autoCategorize = (descricao, conta) => {
    const desc = descricao.toUpperCase();
    const regras = {
      MARAGESC: [
        { padrao: /PAPEM|REPASSE.*MARINHA/i, cat: 'Repasse PAPEM' },
        { padrao: /NEOENERGIA|CEB/i, cat: 'Empresas Terceirizadas' },
        { padrao: /ASCON|CONTABIL/i, cat: 'Contabilidade (ASCON)' },
        { padrao: /TAR.*CONTA|DOC.*ELET/i, cat: 'Tarifas Bancárias' },
        { padrao: /REND.*APLIC|JUROS/i, cat: 'Rendimentos' },
      ],
      AGESC: [
        { padrao: /ALUGUEL.*SEDE/i, cat: 'Aluguel Sede' },
        { padrao: /DARF|FGTS|IMPOSTO/i, cat: 'Impostos (DARF/FGTS)' },
        { padrao: /INTERNET|VIVO|CLARO/i, cat: 'Internet' },
        { padrao: /GOOGLE|WORKSPACE/i, cat: 'Google Workspace' },
        { padrao: /TAR.*CONTA/i, cat: 'Tarifas Bancárias' },
      ]
    };

    const match = regras[conta]?.find(r => r.padrao.test(desc));
    return match ? match.cat : ''; // Retorna a categoria ou vazio para preenchimento manual
  };
    // MOTOR DE CONCILIAÇÃO - PARSER XLSX BB (VERSÃO RESILIENTE)
  const processExcelFile = async (file) => {
    if (!file) return;
    setIsReadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const [year, month] = selectedMonth.split('-');
        
        const normalized = jsonData.map(row => {
          // Busca a data em colunas comuns (data, Data, DATA, dt_movimento)
          const rawDate = row.data || row.Data || row.DATA || row.dt_movimento;
          const dataMov = rawDate ? new Date(rawDate) : null;
          
          if (!dataMov || isNaN(dataMov.getTime())) return null;

          // Validação de Competência
          const isSameMonth = dataMov.getFullYear() === parseInt(year) && 
                             (dataMov.getMonth() + 1) === parseInt(month);

          if (!isSameMonth) return null;

          // Busca o valor em colunas comuns (valor_r_, Valor, VALOR)
          const rawValor = row.valor_r_ || row.Valor || row.VALOR || 0;

          return {
            data_movimento: dataMov.toISOString().split('T')[0],
            descricao: row.historico || row.Descrição || row.DESCRICAO || 'Sem descrição',
            valor: Math.abs(rawValor),
            tipo: (rawValor &lt; 0) ? 'saida' : 'entrada',
            documento: (row.numero_documento || row.Documento || '').toString(),
            categoria: autoCategorize(row.historico || '', movForm.conta) 
          };
        }).filter(item => item !== null);

        if (normalized.length === 0) {
          alert(`ERRO DE VALIDAÇÃO:\n\nNão encontramos lançamentos para ${month}/${year} neste arquivo.\n\nVerifique se:\n1. O mês selecionado no sistema coincide com o extrato.\n2. O arquivo XLSX contém a coluna 'data' ou 'Data'.`);
        } else {
          setStagingMovs(normalized);
          // Feedback visual imediato
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      alert("Erro crítico no Parser: " + err.message);
    } finally {
      setIsReadingFile(false);
    }
  };
  async function fetchCondominios() {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('condominios').select('*').order('nome');
      if (error) throw error;
      setCondominios(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchContratos() {
    try {
      const { data, error } = await supabase.from('contratos').select('*').order('numero_contrato');
      if (error) throw error;
      setContratos(data || []);
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
    }
  }

  async function fetchRateios() {
    try {
      const { data, error } = await supabase.from('rateios').select('*');
      if (error) throw error;
      setRateios(data || []);
    } catch (err) {
      console.error('Erro ao buscar rateios:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      qtd_pnr: Number(form.qtd_pnr) || 0,
      qtd_civis: Number(form.qtd_civis) || 0,
      despesa_estimada: Number(form.despesa_estimada) || 0,
      saldo_fundo_reserva: Number(form.saldo_fundo_reserva) || 0,
      qtd_elevadores: Number(form.qtd_elevadores) || 0,
      elevadores_operacao: Number(form.elevadores_operacao) || 0,
      elevadores_manutencao: Number(form.elevadores_manutencao) || 0
    };

    try {
      if (editingId) {
        const { error } = await supabase.from('condominios').update(payload).eq('id', editingId);
        if (error) throw error;
        setEditingId(null);
        alert('Atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('condominios').insert([payload]);
        if (error) throw error;
        alert('Cadastrado com sucesso!');
      }
      setForm(INITIAL_FORM);
      fetchCondominios();
      setActiveTab('dashboard');
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(c) {
    setEditingId(c.id);
    setForm({ ...c });
    setActiveTab('gerenciar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id) {
    if (!confirm('Tem certeza que deseja excluir este condomínio?')) return;
    try {
      const { error } = await supabase.from('condominios').delete().eq('id', id);
      if (error) throw error;
      fetchCondominios();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  async function handleContractSubmit(e) {
    e.preventDefault();

    const totalContrato = (Number(contractForm.valor_mensal) || 0) + (Number(contractForm.aditivo_valor) || 0);
    const totalAlocado = Object.values(allocations)
      .filter(a => a.checked)
      .reduce((sum, a) => sum + (Number(a.valor) || 0), 0);

    if (totalContrato.toFixed(2) !== totalAlocado.toFixed(2)) {
      alert(`Erro de integridade financeira: O valor total do contrato (R$ ${totalContrato.toFixed(2)}) não coincide com a soma dos rateios alocados (R$ ${totalAlocado.toFixed(2)}).`);
      return;
    }

    setSavingContract(true);
    const contractPayload = {
      numero_contrato: contractForm.numero_contrato,
      empresa_contratada: contractForm.empresa_contratada,
      valor_mensal: Number(contractForm.valor_mensal) || 0,
      tem_aditivo: contractForm.tem_aditivo,
      aditivo_descricao: contractForm.aditivo_descricao,
      aditivo_valor: Number(contractForm.aditivo_valor) || 0,
      prazo_inicio: contractForm.prazo_inicio,
      prazo_fim: contractForm.prazo_fim,
      link_pdf: contractForm.link_pdf
    };

    try {
      let contractId = editingContractId;
      if (editingContractId) {
        const { error } = await supabase.from('contratos').update(contractPayload).eq('id', editingContractId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('contratos').insert([contractPayload]).select();
        if (error) throw error;
        contractId = data[0].id;
      }

      await supabase.from('rateios').delete().eq('contrato_id', contractId);
      const rateioInserts = Object.entries(allocations)
        .filter(([_, data]) => data.checked)
        .map(([id, data]) => ({
          contrato_id: contractId,
          condominio_id: (id !== 'agesc' && id !== 'all') ? id : null,
          is_agesc: id === 'agesc',
          is_all_condos: id === 'all',
          valor: Number(data.valor) || 0
        }));

      if (rateioInserts.length > 0) {
        const { error: rError } = await supabase.from('rateios').insert(rateioInserts);
        if (rError) throw rError;
      }

      alert('Contrato e rateios salvos com sucesso!');
      setContractForm(INITIAL_CONTRACT_FORM);
      setAllocations({});
      setEditingContractId(null);
      fetchContratos();
      fetchRateios();
    } catch (err) {
      alert('Erro ao salvar contrato: ' + err.message);
    } finally {
      setSavingContract(false);
    }
  }

  function handleEditContract(c) {
    setEditingContractId(c.id);
    setContractForm({
      numero_contrato: c.numero_contrato || '',
      empresa_contratada: c.empresa_contratada || '',
      valor_mensal: c.valor_mensal?.toString() || '',
      tem_aditivo: c.tem_aditivo || false,
      aditivo_descricao: c.aditivo_descricao || '',
      aditivo_valor: c.aditivo_valor?.toString() || '',
      prazo_inicio: c.prazo_inicio || '',
      prazo_fim: c.prazo_fim || '',
      link_pdf: c.link_pdf || ''
    });

    const existing = rateios.filter(r => r.contrato_id === c.id);
    const newAllocations = {};
    existing.forEach(r => {
      const key = r.is_agesc ? 'agesc' : (r.is_all_condos ? 'all' : r.condominio_id);
      newAllocations[key] = { checked: true, valor: r.valor.toString() };
    });
    setAllocations(newAllocations);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteContract(id) {
    if (!confirm('Excluir contrato?')) return;
    try {
      await supabase.from('rateios').delete().eq('contrato_id', id);
      await supabase.from('contratos').delete().eq('id', id);
      fetchContratos();
      fetchRateios();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  const calcularTaxa = (c) => {
    const total = (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0);
    if (total === 0) return 0;
    return (Number(c.despesa_estimada) / total) / 0.905;
  };

  const calcularReceita = (c) => {
    const total = (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0);
    return calcularTaxa(c) * total;
  };

  const calcularDeducoesContratos = (condominioId) => {
    const direct = rateios.filter(r => r.condominio_id === condominioId).reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
    const global = rateios.filter(r => r.is_all_condos).reduce((sum, r) => sum + ((Number(r.valor) || 0) / (condominios.length || 1)), 0);
    return direct + global;
  };

  const calcularAGESC = (c) => calcularReceita(c) * AGESC_FEE_RATE;
  const calcularFundoReserva = (c) => calcularReceita(c) * FUNDO_RESERVA_RATE;

  const calcularValorLiquido = (c) => {
    const receita = calcularReceita(c);
    const agesc = calcularAGESC(c);
    const deducoes = calcularDeducoesContratos(c.id);
    return receita - agesc - deducoes + BOLETO_FEE;
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getContractTotal = (c) => (Number(c.valor_mensal) || 0) + (Number(c.aditivo_valor) || 0);
  const currentAllocatedTotal = Object.values(allocations).filter(a => a.checked).reduce((sum, a) => sum + (Number(a.valor) || 0), 0);

  const renderPrestacao = () => (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Cabeçalho Consolidado com Seletor Funcional */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-900 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-blue-900 uppercase">
            Prestação de Contas - {selectedMonth.split('-').reverse().join('/')}
          </h2>
          <p className="text-sm text-slate-500 font-bold">Consolidado Global das Contas MARAGESC e AGESC</p>
        </div>
        
        {/* SELETOR DE MÊS FUNCIONAL */}
        <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 flex items-center gap-4 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Período de Referência</span>
            <input 
              type="month" 
              className="bg-transparent border-none p-0 font-black text-blue-900 focus:ring-0 outline-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
          <Calendar className="text-blue-900 opacity-40" size={24} />
        </div>
              {/* PAINEL DE IMPORTAÇÃO XLSX (SPRINT 1) */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border-2 border-dashed border-blue-200 mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-900 p-3 rounded-2xl text-white">
            <FileText size={24} />
          </div>
          <div>
            <h3 className="font-black text-blue-900 uppercase text-sm">Conciliação Bancária Automática</h3>
            <p className="text-xs text-slate-500 font-bold">Importe o XLSX do Banco do Brasil para o mês de {selectedMonth.split('-').reverse().join('/')}</p>
          </div>
        </div>
        <label className="cursor-pointer bg-blue-900 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-800 transition-all shadow-lg flex items-center gap-2">
          {isReadingFile ? <Loader2 className="animate-spin" size={20} /> : <PlusCircle size={20} />}
          {isReadingFile ? 'LENDO ARQUIVO...' : 'SELECIONAR EXTRATO XLSX'}
          <input type="file" accept=".xlsx" className="hidden" onChange={(e) => processExcelFile(e.target.files[0])} />
        </label>
      </div>
      </div>
            {/* TABELA DE STAGING - REVISÃO DE IMPORTAÇÃO */}
      {stagingMovs.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-900 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-blue-900 uppercase flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> Conferência de Lançamentos ({stagingMovs.length})
            </h3>
            <div className="flex gap-3">
              <button onClick={() => setStagingMovs([])} className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase">Descartar</button>
              <button 
                onClick={async () => {
                  // Lógica para salvar em lote no Supabase (Sprint 2)
                  alert("Iniciando persistência no Supabase...");
                }}
                className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black hover:bg-emerald-600 transition-all shadow-md text-sm"
              >
                CONFIRMAR E SALVAR TUDO
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black">
                <tr>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-left">Descrição do Banco</th>
                  <th className="p-3 text-left">Categoria Sugerida</th>
                  <th className="p-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stagingMovs.map((m, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-3 font-bold text-slate-500">{new Date(m.data_movimento).toLocaleDateString('pt-BR')}</td>
                    <td className="p-3 font-bold text-slate-700">{m.descricao}</td>
                    <td className="p-3">
                      <select 
                        className="bg-slate-100 border-none rounded-lg p-1 text-xs font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
                        value={m.categoria}
                        onChange={(e) => {
                          const newMovs = [...stagingMovs];
                          newMovs[idx].categoria = e.target.value;
                          setStagingMovs(newMovs);
                        }}
                      >
                        <option value="">Selecionar...</option>
                        {CATEGORIAS[movForm.conta].saidas.concat(CATEGORIAS[movForm.conta].entradas).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`p-3 text-right font-black ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {m.tipo === 'entrada' ? '+' : '-'} R$ {m.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* --- FORMULÁRIO DE LANÇAMENTOS MANUAIS --- */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-900 mb-8">
        <h3 className="text-lg font-black text-blue-900 uppercase mb-6 flex items-center gap-2">
          <PlusCircle size={20} /> Novo Lançamento Manual
        </h3>
        <form onSubmit={handleMovSubmit} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Conta</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 font-bold text-blue-900"
              value={movForm.conta}
              onChange={e => setMovForm({...movForm, conta: e.target.value, categoria: ''})}
            >
              <option value="MARAGESC">MARAGESC</option>
              <option value="AGESC">AGESC</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Data</label>
            <input 
              type="date" 
              className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 font-bold"
              value={movForm.data_movimento}
              onChange={e => setMovForm({...movForm, data_movimento: e.target.value})}
              required
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição</label>
            <input 
              className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 font-bold"
              placeholder="Ex: Pagamento Neoenergia"
              value={movForm.descricao}
              onChange={e => setMovForm({...movForm, descricao: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Categoria</label>
            <select 
              className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 font-bold text-slate-700"
              value={movForm.categoria}
              onChange={e => setMovForm({...movForm, categoria: e.target.value})}
              required
            >
              <option value="">Selecione...</option>
              <optgroup label="Entradas">
                {CATEGORIAS[movForm.conta].entradas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </optgroup>
              <optgroup label="Saídas">
                {CATEGORIAS[movForm.conta].saidas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </optgroup>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Valor (R$)</label>
            <div className="relative">
              <input 
                type="number" step="0.01"
                className="w-full bg-slate-50 border-none rounded-xl p-3 mt-1 font-black text-blue-900"
                value={movForm.valor}
                onChange={e => setMovForm({...movForm, valor: e.target.value})}
                required
              />
              <button 
                type="button"
                onClick={() => setMovForm({...movForm, tipo: movForm.tipo === 'entrada' ? 'saida' : 'entrada'})}
                className={`absolute right-2 top-2 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${movForm.tipo === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
              >
                {movForm.tipo}
              </button>
            </div>
          </div>
          <div className="md:col-span-3 lg:col-span-6 flex justify-end mt-2">
            <button 
              disabled={savingMov}
              className="bg-blue-900 text-white px-10 py-3 rounded-xl font-black hover:bg-blue-800 transition-all flex items-center gap-2 shadow-lg"
            >
              {savingMov ? <Loader2 className="animate-spin" size={20} /> : 'REGISTRAR LANÇAMENTO'}
            </button>
          </div>
        </form>
      </div>
      {/* Dualidade de Contas: Lado a Lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUNA 1: CONTA MARAGESC */}
        <div className="border-2 border-blue-900 rounded-3xl p-6 bg-white flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tight">MARAGESC</h3>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">CONTA OPERACIONAL</span>
          </div>

          {/* Mini Dashboard MARAGESC */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Anterior</p>
              <p className="text-lg font-black text-slate-700">R$ {formatCurrency(balancetes.MARAGESC.saldo_inicial)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase">Entradas</p>
              <p className="text-lg font-black text-emerald-700">R$ {formatCurrency(balancetes.MARAGESC.entradas)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-[10px] font-black text-red-600 uppercase">Saídas</p>
              <p className="text-lg font-black text-red-700">R$ {formatCurrency(balancetes.MARAGESC.saidas)}</p>
            </div>
            <div className="p-4 bg-blue-900 rounded-2xl shadow-md">
              <p className="text-[10px] font-black text-blue-200 uppercase">Saldo Atual</p>
              <p className="text-lg font-black text-white">R$ {formatCurrency(balancetes.MARAGESC.saldo_final)}</p>
            </div>
          </div>

          {/* Tabela de Movimentações MARAGESC */}
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 ml-1">Extrato Operacional</p>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Descrição</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movimentacoes.MARAGESC.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-500 font-bold">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-bold text-slate-700">{m.descricao}</td>
                      <td className={`p-3 text-right font-black ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.tipo === 'entrada' ? '+' : '-'} R$ {formatCurrency(m.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUNA 2: CONTA AGESC */}
        <div className="border-2 border-blue-900 rounded-3xl p-6 bg-white flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tight">AGESC</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full border border-blue-200">CONTA ADMINISTRATIVA</span>
          </div>

          {/* Mini Dashboard AGESC */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Anterior</p>
              <p className="text-lg font-black text-slate-700">R$ {formatCurrency(balancetes.AGESC.saldo_inicial)}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-600 uppercase">Entradas</p>
              <p className="text-lg font-black text-emerald-700">R$ {formatCurrency(balancetes.AGESC.entradas)}</p>
            </div>
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-[10px] font-black text-red-600 uppercase">Saídas</p>
              <p className="text-lg font-black text-red-700">R$ {formatCurrency(balancetes.AGESC.saidas)}</p>
            </div>
            <div className="p-4 bg-blue-900 rounded-2xl shadow-md">
              <p className="text-[10px] font-black text-blue-200 uppercase">Saldo Atual</p>
              <p className="text-lg font-black text-white">R$ {formatCurrency(balancetes.AGESC.saldo_final)}</p>
            </div>
          </div>

          {/* Tabela de Movimentações AGESC */}
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-3 ml-1">Extrato Administrativo</p>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black">
                  <tr>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Descrição</th>
                    <th className="p-3 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {movimentacoes.AGESC.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-slate-500 font-bold">{new Date(m.data).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 font-bold text-slate-700">{m.descricao}</td>
                      <td className={`p-3 text-right font-black ${m.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {m.tipo === 'entrada' ? '+' : '-'} R$ {formatCurrency(m.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-900 text-white p-6 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Building2 size={32} />
          <h1 className="text-2xl font-black">SISTEMA QUANTA</h1>
        </div>
        <nav className="flex gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('prestacao')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'prestacao' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Prestação de Contas</button>
          <button onClick={() => setActiveTab('gerenciar')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'gerenciar' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Gerenciar</button>
          <button onClick={() => setActiveTab('contratos')} className={`px-4 py-2 rounded-lg font-bold ${activeTab === 'contratos' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Contratos</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? <div className="text-center py-20">
          <Loader2 className="animate-spin mx-auto text-blue-900" size={48} />
        </div> : (
          activeTab === 'dashboard' ? (
            <div>
              <div className="mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-sm text-blue-800 font-bold">
                  <TrendingDown size={16} className="inline mr-1" />
                  Valor Líquido de Repasse = Receita Bruta − Taxa AGESC (4,5%) − Deduções de Contratos (Rateio) + R$ 3,00 (Restituição Boleto - Cortesia)
                </p>
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1"><Info size={12}/> O Fundo de Reserva (5%) está incluso no montante total enviado ao condomínio.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {condominios.map(c => {
                  const liquido = calcularValorLiquido(c);
                  const receita = calcularReceita(c);
                  const agesc = calcularAGESC(c);
                  const fundo = calcularFundoReserva(c);
                  const deducoes = calcularDeducoesContratos(c.id);
                  return (
                    <div key={c.id} onClick={() => setSelectedCondo(c)} className="cursor-pointer bg-white rounded-3xl shadow-sm border border-blue-900 p-6 hover:shadow-xl transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-black text-xl text-blue-900 group-hover:text-blue-600">{c.nome}</h3>
                        {c.possui_elevadores && <ArrowUpCircle className="text-orange-500" size={20} />}
                      </div>
                      <p className="text-slate-500 text-sm flex items-center gap-1 mt-1"><MapPin size={14}/> {c.endereco || 'Brasília, DF'}</p>
                      
                      <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-600 uppercase">Taxa Unitária (0,905)</p>
                        <p className="text-2xl font-black text-emerald-700">R$ {formatCurrency(calcularTaxa(c))}</p>
                      </div>

                      <div className="mt-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <p className="text-[10px] font-black text-blue-600 uppercase">Receita Bruta</p>
                        <p className="text-xl font-black text-blue-700">R$ {formatCurrency(receita)}</p>
                      </div>

                      <div className="mt-3 space-y-1 text-xs text-slate-500">
                        <div className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                          <span className="font-black text-amber-700">− Taxa AGESC (4,5%)</span>
                          <span className="font-bold text-amber-700">R$ {formatCurrency(agesc)}</span>
                        </div>
                        <div className="flex justify-between items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                          <span className="font-black text-slate-600">Fundo de Reserva (5%)</span>
                          <span className="font-bold text-slate-600">R$ {formatCurrency(fundo)} <span className="text-[9px] uppercase ml-1 opacity-70">[Incluso]</span></span>
                        </div>
                        <div className="flex justify-between"><span>− Deduções Contratos</span><span className="font-bold text-red-500">R$ {formatCurrency(deducoes)}</span></div>
                        <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                          <span className="font-black text-emerald-700">+ Restituição Boleto (Cortesia)</span>
                          <span className="font-bold text-emerald-700">R$ {formatCurrency(BOLETO_FEE)}</span>
                        </div>
                      </div>

                      <div className="mt-3 p-4 bg-slate-900 rounded-2xl">
                        <p className="text-[10px] font-black text-white uppercase">Valor Líquido de Repasse</p>
                        <p className={`text-2xl font-black ${liquido >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {formatCurrency(liquido)}</p>
                      </div>
                      <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">Clique para ver detalhes</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : activeTab === 'prestacao' ? (
            renderPrestacao()
          ) : activeTab === 'contratos' ? (
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-900">
                  {editingContractId ? <Pencil size={24}/> : <PlusCircle size={24}/>}
                  {editingContractId ? 'EDITAR CONTRATO' : 'NOVO CONTRATO'}
                </h2>
                <form onSubmit={handleContractSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Nº Contrato</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.numero_contrato} onChange={e => setContractForm({...contractForm, numero_contrato: e.target.value})} required /></div>
                  <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Empresa Contratada</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.empresa_contratada} onChange={e => setContractForm({...contractForm, empresa_contratada: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Valor Mensal (R$)</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 font-bold text-blue-900" value={contractForm.valor_mensal} onChange={e => setContractForm({...contractForm, valor_mensal: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Prazo Início</label><input type="date" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.prazo_inicio} onChange={e => setContractForm({...contractForm, prazo_inicio: e.target.value})} /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Prazo Fim</label><input type="date" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.prazo_fim} onChange={e => setContractForm({...contractForm, prazo_fim: e.target.value})} /></div>
                  
                  <div className="md:col-span-3 flex items-center gap-3 p-4 bg-slate-100 rounded-xl">
                    <input type="checkbox" id="adit" checked={contractForm.tem_aditivo} onChange={e => setContractForm({...contractForm, tem_aditivo: e.target.checked})} className="w-5 h-5 text-blue-600" />
                    <label htmlFor="adit" className="font-bold text-blue-900">Possui Aditivo?</label>
                  </div>

                  {contractForm.tem_aditivo && (
                    <>
                      <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Descrição do Aditivo</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={contractForm.aditivo_descricao} onChange={e => setContractForm({...contractForm, aditivo_descricao: e.target.value})} /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Valor Aditivo (R$)</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 font-bold text-blue-900" value={contractForm.aditivo_valor} onChange={e => setContractForm({...contractForm, aditivo_valor: e.target.value})} /></div>
                    </>
                  )}

                  <div className="md:col-span-3 border-t pt-6 mt-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase mb-4 flex items-center gap-2"><Percent size={18}/> Guia de Rateio Avançada</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {[ {id: 'agesc', nome: 'AGESC (Sede)'}, {id: 'all', nome: 'Todos os Condomínios (Rateio Global)'} ].map(target => (
                        <div key={target.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${allocations[target.id]?.checked ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={allocations[target.id]?.checked || false} onChange={e => setAllocations({...allocations, [target.id]: { ...allocations[target.id], checked: e.target.checked, valor: allocations[target.id]?.valor || '' }})} className="w-5 h-5" />
                            <span className="font-bold text-sm">{target.nome}</span>
                          </div>
                          {allocations[target.id]?.checked && (
                            <input type="number" placeholder="Valor R$" className="w-28 bg-white border-none rounded-lg p-2 text-sm font-bold" value={allocations[target.id]?.valor || ''} onChange={e => setAllocations({...allocations, [target.id]: { ...allocations[target.id], valor: e.target.value }})} />
                          )}
                        </div>
                      ))}
                      {condominios.map(c => (
                        <div key={c.id} className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${allocations[c.id]?.checked ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={allocations[c.id]?.checked || false} onChange={e => setAllocations({...allocations, [c.id]: { ...allocations[c.id], checked: e.target.checked, valor: allocations[c.id]?.valor || '' }})} className="w-5 h-5" />
                            <span className="font-bold text-sm">{c.nome}</span>
                          </div>
                          {allocations[c.id]?.checked && (
                            <input type="number" placeholder="Valor R$" className="w-28 bg-white border-none rounded-lg p-2 text-sm font-bold" value={allocations[c.id]?.valor || ''} onChange={e => setAllocations({...allocations, [c.id]: { ...allocations[c.id], valor: e.target.value }})} />
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 p-6 bg-slate-900 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Total do Contrato</p>
                        <p className="text-2xl font-black">R$ {formatCurrency(getContractTotal(contractForm))}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center md:text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase">Total Alocado</p>
                          <p className={`text-2xl font-black ${Math.abs(currentAllocatedTotal - getContractTotal(contractForm)) < 0.01 ? 'text-emerald-400' : 'text-amber-400'}`}>R$ {formatCurrency(currentAllocatedTotal)}</p>
                        </div>
                        {Math.abs(currentAllocatedTotal - getContractTotal(contractForm)) < 0.01 ? <CheckCircle2 className="text-emerald-400" size={32}/> : <AlertCircle className="text-amber-400" size={32}/>}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3 flex gap-4">
                    <button disabled={savingContract} className="flex-1 bg-blue-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-blue-800 transition-all">
                      {savingContract ? <Loader2 className="animate-spin mx-auto" /> : (editingContractId ? 'SALVAR ALTERAÇÕES' : 'SALVAR CONTRATO')}
                    </button>
                    {editingContractId && <button type="button" onClick={() => {setEditingContractId(null); setContractForm(INITIAL_CONTRACT_FORM); setAllocations({})}} className="bg-slate-200 text-slate-600 px-8 rounded-2xl font-black">CANCELAR</button>}
                  </div>
                </form>
              </div>

              <div className="space-y-4">
                {contratos.map(ct => (
                  <div key={ct.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex justify-between items-center">
                    <div>
                      <h3 className="font-black text-blue-900">{ct.empresa_contratada} - {ct.numero_contrato}</h3>
                      <p className="text-sm text-slate-500 font-bold">R$ {formatCurrency(getContractTotal(ct))}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditContract(ct)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl"><Pencil size={20}/></button>
                      <button onClick={() => handleDeleteContract(ct.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-10">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-blue-900">
                  {editingId ? <Pencil size={24}/> : <PlusCircle size={24}/>}
                  {editingId ? 'EDITAR CONDOMÍNIO' : 'NOVO CADASTRO'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Nome</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">CNPJ</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.cnpj} onChange={e => setForm({...form, cnpj: e.target.value})} /></div>
                  <div className="md:col-span-3"><label className="text-xs font-black text-slate-400 uppercase ml-1">Endereço</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd PNR</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.qtd_pnr} onChange={e => setForm({...form, qtd_pnr: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd Civis</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.qtd_civis} onChange={e => setForm({...form, qtd_civis: e.target.value})} required /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Despesa Estimada</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1 font-bold text-blue-900" value={form.despesa_estimada} onChange={e => setForm({...form, despesa_estimada: e.target.value})} required /></div>
                  <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Dados Bancários</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.dados_bancarios} onChange={e => setForm({...form, dados_bancarios: e.target.value})} /></div>
                  <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Saldo Fundo Reserva</label><input type="number" step="0.01" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.saldo_fundo_reserva} onChange={e => setForm({...form, saldo_fundo_reserva: e.target.value})} /></div>
                  
                  <div className="md:col-span-3">
                    <label className="text-xs font-black text-slate-400 uppercase ml-1">Projetos / Observações (PPCI)</label>
                    <textarea className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" rows="2" value={form.projetos_incendio} onChange={e => setForm({...form, projetos_incendio: e.target.value})} />
                  </div>

                  <div className="md:col-span-3 flex items-center gap-3 p-4 bg-slate-100 rounded-xl">
                    <input type="checkbox" id="elev" checked={form.possui_elevadores} onChange={e => setForm({...form, possui_elevadores: e.target.checked})} className="w-5 h-5 text-blue-600" />
                    <label htmlFor="elev" className="font-bold text-blue-900">Possui Elevadores?</label>
                  </div>
                  {form.possui_elevadores && (
                    <>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd Total</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.qtd_elevadores} onChange={e => setForm({...form, qtd_elevadores: e.target.value})} /></div>
                      <div className="md:col-span-2"><label className="text-xs font-black text-slate-400 uppercase ml-1">Empresa Responsável</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.empresa_elevadores} onChange={e => setForm({...form, empresa_elevadores: e.target.value})} /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd em Operação</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.elevadores_operacao} onChange={e => setForm({...form, elevadores_operacao: e.target.value})} /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Qtd em Manutenção</label><input type="number" className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.elevadores_manutencao} onChange={e => setForm({...form, elevadores_manutencao: e.target.value})} /></div>
                      <div><label className="text-xs font-black text-slate-400 uppercase ml-1">Status da Manutenção</label><input className="w-full bg-slate-50 border-none rounded-xl p-4 mt-1" value={form.status_manutencao} onChange={e => setForm({...form, status_manutencao: e.target.value})} /></div>
                    </>
                  )}
                  <div className="md:col-span-3 flex gap-4">
                    <button disabled={saving} className="flex-1 bg-blue-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-blue-800 transition-all">{saving ? <Loader2 className="animate-spin mx-auto" /> : (editingId ? 'SALVAR ALTERAÇÕES' : 'SALVAR CONDOMÍNIO')}</button>
                    {editingId && <button type="button" onClick={() => {setEditingId(null); setForm(INITIAL_FORM)}} className="bg-slate-200 text-slate-600 px-8 rounded-2xl font-black">CANCELAR</button>}
                  </div>
                </form>
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-slate-100">
                    {condominios.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-6 font-bold text-slate-700">{c.nome}</td>
                        <td className="p-6 text-right flex justify-end gap-2">
                          <button onClick={() => handleEdit(c)} className="text-blue-600 p-2 hover:bg-blue-50 rounded-xl"><Pencil size={20}/></button>
                          <button onClick={() => handleDelete(c.id)} className="text-red-400 p-2 hover:bg-red-50 rounded-xl"><Trash2 size={20}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </main>

      {selectedCondo && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedCondo(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center shrink-0">
              <h2 className="text-xl font-black flex items-center gap-2"><Building2 /> {selectedCondo.nome}</h2>
              <button onClick={() => setSelectedCondo(null)} className="p-2 hover:bg-white/10 rounded-full"><X /></button>
            </div>
            <div className="p-8 pb-10 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto custom-scrollbar">
              <div><p className="text-[10px] font-black text-slate-400 uppercase">CNPJ</p><p className="font-bold">{selectedCondo.cnpj || '—'}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Endereço</p><p className="font-bold">{selectedCondo.endereco || '—'}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Dados Bancários</p><p className="font-bold">{selectedCondo.dados_bancarios || '—'}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase">Saldo Fundo Reserva</p><p className="font-bold text-emerald-600">R$ {formatCurrency(selectedCondo.saldo_fundo_reserva)}</p></div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Elevadores</p>
                {selectedCondo.possui_elevadores ? (
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <p className="font-bold text-orange-800">Sim ({selectedCondo.qtd_elevadores} total)</p>
                    <p className="text-xs mt-1">Empresa: <span className="font-black">{selectedCondo.empresa_elevadores || '—'}</span></p>
                    <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-orange-200/50">
                      <p className="text-[10px] text-orange-700 font-bold">Em Operação: <span className="font-black">{selectedCondo.elevadores_operacao || 0}</span></p>
                      <p className="text-[10px] text-orange-700 font-bold">Em Manutenção: <span className="font-black">{selectedCondo.elevadores_manutencao || 0}</span></p>
                      <p className="text-[10px] text-orange-700 font-bold">Status: <span className="font-black">{selectedCondo.status_manutencao || '—'}</span></p>
                    </div>
                  </div>
                ) : <p className="font-bold text-slate-500">Não possui elevadores.</p>}
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Projetos / Observações</p>
                <div className="bg-slate-50 p-4 rounded-xl text-sm">
                  {selectedCondo.projetos_incendio?.startsWith('http') ? (
                    <a href={selectedCondo.projetos_incendio} target="_blank" rel="noreferrer" className="text-blue-600 font-bold underline flex items-center gap-1">Abrir Link Externo <ExternalLink size={14}/></a>
                  ) : <p>{selectedCondo.projetos_incendio || 'Nenhuma observação.'}</p>}
                </div>
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Ficha Técnica Financeira</p>
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Receita Bruta</span><span className="font-bold text-blue-700">R$ {formatCurrency(calcularReceita(selectedCondo))}</span></div>
                  <div className="flex justify-between items-center bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                    <span className="font-black text-amber-700">− Taxa AGESC (4,5%)</span>
                    <span className="font-bold text-amber-700">R$ {formatCurrency(calcularAGESC(selectedCondo))}</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-100 border border-slate-200 rounded-lg px-2 py-1">
                    <span className="font-black text-slate-600">Fundo de Reserva (5%)</span>
                    <span className="font-bold text-slate-600">R$ {formatCurrency(calcularFundoReserva(selectedCondo))} <span className="text-[9px] uppercase ml-1 opacity-70">[Incluso no Repasse]</span></span>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-500">− Deduções de Contratos</span><span className="font-bold text-red-500">R$ {formatCurrency(calcularDeducoesContratos(selectedCondo.id))}</span></div>
                  <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 rounded-lg px-2 py-1">
                    <span className="font-black text-emerald-700">+ Restituição Boleto</span>
                    <span className="font-bold text-emerald-700">R$ {formatCurrency(BOLETO_FEE)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2"><span className="font-black text-slate-700">Valor Líquido de Repasse</span><span className={`font-black ${calcularValorLiquido(selectedCondo) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>R$ {formatCurrency(calcularValorLiquido(selectedCondo))}</span></div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-50 flex justify-end shrink-0"><button onClick={() => setSelectedCondo(null)} className="bg-blue-900 text-white px-8 py-3 rounded-xl font-black">FECHAR</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
