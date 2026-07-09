import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Building2, MapPin, Users, DollarSign, Trash2,
  LayoutDashboard, Settings, Loader2, PlusCircle, Pencil, XCircle,
  CreditCard, Flame, ArrowUpCircle, ExternalLink, X,
  FileText, Calendar, Percent, Link2, ChevronDown, ChevronRight, 
  TrendingDown, Info, CheckCircle2, AlertCircle, Loader
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

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedCondoForPrestacao, setSelectedCondoForPrestacao] = useState(null);
  const [balancetes, setBalancetes] = useState({
    MARAGESC: { saldo_inicial: 0, entradas: 0, saidas: 0, saldo_final: 0 },
    AGESC: { saldo_inicial: 0, entradas: 0, saidas: 0, saldo_final: 0 }
  });
  const [movimentacoes, setMovimentacoes] = useState({ MARAGESC: [], AGESC: [] });
  const [loadingPrestacao, setLoadingPrestacao] = useState(false);
  const [stagingMovs, setStagingMovs] = useState([]);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [movForm, setMovForm] = useState(INITIAL_MOV_FORM);
  const [savingMov, setSavingMov] = useState(false);
  const [isReadingRF, setIsReadingRF] = useState(false);
  const [isReadingPP, setIsReadingPP] = useState(false);
  const [investimentoData, setInvestimentoData] = useState({
    rf_rendimentos: 0, rf_iof: 0, rf_ir: 0,
    pp_saldo: 0
  });
  
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js";
    script.async = true;
    document.body.appendChild(script);

    fetchCondominios();
    fetchContratos();
    fetchRateios();
  }, []);

  useEffect(() => {
    if (activeTab === 'prestacao') {
      fetchBalanceteData(selectedCondoForPrestacao?.id || null, selectedMonth);
    }
  }, [activeTab, selectedCondoForPrestacao, selectedMonth]);

  async function fetchBalanceteData(condoId, month) {
    try {
      setLoadingPrestacao(true);
      const accounts = ['MARAGESC', 'AGESC'];
      const newBalancetes = { ...balancetes };
      const newMovimentacoes = { ...movimentacoes };

      for (const account of accounts) {
        let { data: current, error: err1 } = await supabase
          .from('balancetes_mensais')
          .select('*')
          .eq('mes_referencia', month + '-01')
          .eq('conta', account)
          .maybeSingle();

                  // Calcula mês anterior por string (sem passar por Date, evitando bug de fuso)
        const [ano, mes] = month.split('-').map(Number);
        const mesAnteriorCalc = mes === 1 ? 12 : mes - 1;
        const anoAnteriorCalc = mes === 1 ? ano - 1 : ano;
        const mesAnteriorStr = `${anoAnteriorCalc}-${String(mesAnteriorCalc).padStart(2, '0')}`;

        let { data: saldoMensal } = await supabase
          .from('saldos_mensais')
          .select('*')
          .eq('mes_referencia', mesAnteriorStr + '-01')
          .maybeSingle();

        if (current) {
          newBalancetes[account] = {
            ...current,
            saldo_inicial: account === 'MARAGESC' && saldoMensal?.saldo_consolidado
              ? Number(saldoMensal.saldo_consolidado)
              : current.saldo_inicial
          };
        } else {
       
          let { data: prev, error: err2 } = await supabase
            .from('balancetes_mensais')
            .select('saldo_final')
            .lt('mes_referencia', month + '-01')
            .eq('conta', account)
            .order('mes_referencia', { ascending: false })
            .limit(1)
            .maybeSingle();
          newBalancetes[account] = {
            saldo_inicial: account === 'MARAGESC' && saldoMensal?.saldo_consolidado 
              ? Number(saldoMensal.saldo_consolidado) 
              : (prev?.saldo_final || 0),
            entradas: 0,
            saidas: 0,
            saldo_final: prev?.saldo_final || 0
          };
        }
        // Guarda saldo consolidado no estado para usar no saldo_final
        if (account === 'MARAGESC' && saldoMensal) {
          newBalancetes[account].saldo_consolidado = Number(saldoMensal.saldo_consolidado);
          newBalancetes[account].saldo_conta_corrente = Number(saldoMensal.saldo_conta_corrente);
          newBalancetes[account].saldo_rende_facil = Number(saldoMensal.saldo_rende_facil);
          newBalancetes[account].saldo_poupanca = Number(saldoMensal.saldo_poupanca);
        }
        
        let { data: movs, error: err3 } = await supabase
          .from('movimentacoes_extrato')
          .select('*')
          .eq('balancete_id', current?.id || null)
          .order('data_movimento', { ascending: true }).order('id', { ascending: true });
        newMovimentacoes[account] = movs || [];
        
                // Recalcula entradas e saídas a partir das movimentações reais
        
        const movsList = movs || [];
        // Filtra movimentações internas de investimento (BB Rende Fácil e Poupança)
        const isInvestimento = (m) => {
          const desc = (m.descricao || '').toUpperCase();
          return /RENDE.?F[AÁ]CIL|TRANSFERIDO.*POUPANCA|APLICA[ÇC][AÃ]O.*POUPANCA/i.test(desc);
        };
        // Totais operacionais (exclui investimentos)
        const totalEntradas = movsList.filter(m => m.tipo === 'entrada' && !isInvestimento(m)).reduce((s, m) => s + Number(m.valor), 0);
        const totalSaidas = movsList.filter(m => m.tipo === 'saida' && !isInvestimento(m)).reduce((s, m) => s + Number(m.valor), 0);
        // Totais de investimento (BB Rende Fácil + Poupança)
        const totalEntradasInv = movsList.filter(m => m.tipo === 'entrada' && isInvestimento(m)).reduce((s, m) => s + Number(m.valor), 0);
        const totalSaidasInv = movsList.filter(m => m.tipo === 'saida' && isInvestimento(m)).reduce((s, m) => s + Number(m.valor), 0);
        

        // Saldo final da MARAGESC usa o consolidado da tabela saldos_mensais (CC + RF + Poupança)
        // Para AGESC, calcula normalmente
        let saldoFinal;
        if (account === 'MARAGESC') {
          // Busca saldo consolidado do MÊS ATUAL
          const [anoAtual, mesAtual] = month.split('-').map(Number);
          const { data: saldoAtualMes } = await supabase
            .from('saldos_mensais')
            .select('saldo_consolidado')
            .eq('mes_referencia', `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`)
            .maybeSingle();
          saldoFinal = saldoAtualMes?.saldo_consolidado 
            ? Number(saldoAtualMes.saldo_consolidado) 
            : (Number(newBalancetes[account]?.saldo_inicial || 0) + totalEntradas - totalSaidas);
        } else {
          const saldoInicial = current?.saldo_inicial || newBalancetes[account]?.saldo_inicial || 0;
          saldoFinal = saldoInicial + totalEntradas - totalSaidas;
        }

        newBalancetes[account] = {
          ...newBalancetes[account],
          entradas: totalEntradas,
          saidas: totalSaidas,
          saldo_final: saldoFinal,
          entradas_investimento: totalEntradasInv,
          saidas_investimento: totalSaidasInv,
        };
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
          }])
          .select();
        if (createError) throw createError;
        balanceteId = newB[0].id;
      }

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

  async function saveStagingToSupabase() {
    if (stagingMovs.length === 0) return;
    setSavingMov(true);
    try {
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
            saldo_inicial: balancetes[movForm.conta]?.saldo_inicial || 0,
          }])
          .select();
        if (createError) throw createError;
        balanceteId = newB[0].id;
      }

      // Limpa registros antigos do mesmo mês/conta antes de reinserir
      await supabase.from('movimentacoes_extrato').delete().eq('balancete_id', balanceteId);
      const batch = stagingMovs.map(m => ({
        balancete_id: balanceteId,
        data_movimento: m.data_movimento,
        descricao: m.descricao,
        categoria: m.categoria || 'Outros',
        tipo: m.tipo,
        valor: Number(m.valor)
      }));

      const { error: batchError } = await supabase
        .from('movimentacoes_extrato')
        .insert(batch);

      if (batchError) throw batchError;
      
      // Recalcula os totais do balancete (entradas, saídas, saldo final)
      const { data: movsRecalc } = await supabase.from('movimentacoes_extrato').select('tipo,valor').eq('balancete_id', balanceteId);
      if (movsRecalc) {
        const totalEntradas = movsRecalc.filter(m => m.tipo === 'entrada').reduce((s, m) => s + Number(m.valor), 0);
        const totalSaidas = movsRecalc.filter(m => m.tipo === 'saida').reduce((s, m) => s + Number(m.valor), 0);
        await supabase.from('balancetes_mensais').update({
          entradas: totalEntradas,
          saidas: totalSaidas,
          saldo_final: (balancetes[movForm.conta]?.saldo_inicial || 0) + totalEntradas - totalSaidas
        }).eq('id', balanceteId);
      }
      alert(`${stagingMovs.length} lançamentos importados com sucesso!`);
      setStagingMovs([]);
      fetchBalanceteData(null, selectedMonth);
    } catch (err) {
      alert('Erro na persistência em lote: ' + err.message);
    } finally {
      setSavingMov(false);
    }
  }

  const autoCategorize = (descricao, conta) => {
    const desc = descricao.toUpperCase();
    const regras = {
      MARAGESC: [
        { padrao: /PAPEM|REPASSE.*MARINHA/i, cat: 'Repasse PAPEM' },
        { padrao: /NEOENERGIA|CEB/i, cat: 'Empresas Terceirizadas' },
        { padrao: /ASCON|CONTABIL/i, cat: 'Contabilidade (ASCON)' },
        { padrao: /TAR.*CONTA|DOC.*ELET/i, cat: 'Tarifas Bancárias' },
        { padrao: /IOF/i, cat: 'Tarifas Bancárias' },
        { padrao: /\bIR\b(?!.*IMPOSTO)/i, cat: 'Tarifas Bancárias' },
        { padrao: /REND.*APLIC|JUROS/i, cat: 'Rendimentos' },
        { padrao: /RENDE.?F[AÁ]CIL/i, cat: 'Rendimentos' },
        { padrao: /TRANSFERIDO.*POUPANCA|APLICA[ÇC][AÃ]O.*POUPANCA|TRANSFERENCIA.*POUPANCA/i, cat: 'Rendimentos' },
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
    return match ? match.cat : '';
  };

  const processRendeFacilPDF = async (file) => {
    if (!file) return;
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
      script.async = true;
      document.body.appendChild(script);
      alert("A ferramenta de leitura de PDF está carregando. Aguarde 5 segundos e tente novamente.");
      return;
    }
    setIsReadingRF(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }
      const linhas = fullText.split('\n');
      let rendimentos = 0, iof = 0, ir = 0;
      linhas.forEach(linha => {
        const texto = linha.toUpperCase();
        const matchValor = linha.match(/R?\$?\s*([\d.]+,\d{2})/);
        if (!matchValor) return;
        const valor = parseFloat(matchValor[1].replace(/\./g, '').replace(',', '.'));
        if (/RENDIMENTO/.test(texto)) rendimentos = valor;
        if (/^(?!.*SALDO).*IOF/i.test(texto)) iof = valor;
        if (/\bIR\b|IRRF/.test(texto) && !/IMPOSTO/i.test(texto)) ir = valor;
      });
      if (rendimentos > 0 || iof > 0 || ir >= 0) {
        const { data: balancete } = await supabase
          .from('balancetes_mensais')
          .select('id')
          .eq('mes_referencia', selectedMonth + '-01')
          .eq('conta', 'MARAGESC')
          .maybeSingle();
        if (balancete?.id) {
          if (rendimentos > 0) {
            await supabase.from('movimentacoes_extrato').insert({
              balancete_id: balancete.id, data_movimento: selectedMonth + '-28',
              descricao: 'Rendimentos (BB Rende Fácil)', categoria: 'Rendimentos',
              tipo: 'entrada', valor: rendimentos
            });
          }
          if (iof > 0) {
            await supabase.from('movimentacoes_extrato').insert({
              balancete_id: balancete.id, data_movimento: selectedMonth + '-28',
              descricao: 'IOF s/ Operações Financeiras', categoria: 'Tarifas Bancárias',
              tipo: 'saida', valor: iof
            });
          }
          if (ir > 0) {
            await supabase.from('movimentacoes_extrato').insert({
              balancete_id: balancete.id, data_movimento: selectedMonth + '-28',
              descricao: 'IRRF s/ Rendimentos', categoria: 'Tarifas Bancárias',
              tipo: 'saida', valor: ir
            });
          }
          setInvestimentoData(prev => ({ ...prev, rf_rendimentos: rendimentos, rf_iof: iof, rf_ir: ir }));
          alert(`✅ Rende Fácil processado com sucesso!\n\nRendimentos: R$ ${rendimentos.toFixed(2)}\nIOF: R$ ${iof.toFixed(2)}\nIR: R$ ${ir.toFixed(2)}\n\nOs valores foram adicionados ao balancete.`);
          fetchBalanceteData(null, selectedMonth);
        } else {
          alert('Primeiro importe e confirme o extrato da Conta Corrente do mês.');
        }
      } else {
        alert('Nenhum valor de Rendimentos, IOF ou IR encontrado no PDF. Verifique se é o extrato correto.');
      }
    } catch (err) {
      alert('Erro ao ler PDF do Rende Fácil: ' + err.message);
    } finally {
      setIsReadingRF(false);
    }
  };

  const processPoupancaPDF = async (file) => {
    if (!file) return;
    if (!window.pdfjsLib) {
      alert("Carregando leitor de PDF. Aguarde 5 segundos.");
      return;
    }
    setIsReadingPP(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map(item => item.str).join(' ') + '\n';
      }
      const linhas = fullText.split('\n');
      let saldoFinal = 0;
      linhas.forEach(linha => {
        const texto = linha.toUpperCase();
        if (/SALDO/.test(texto)) {
          const matchValor = linha.match(/R?\$?\s*([\d.]+,\d{2})/);
          if (matchValor) saldoFinal = parseFloat(matchValor[1].replace(/\./g, '').replace(',', '.'));
        }
      });
      if (saldoFinal > 0) {
        setInvestimentoData(prev => ({ ...prev, pp_saldo: saldoFinal }));
        alert(`✅ Poupança processada!\nSaldo informado: R$ ${saldoFinal.toFixed(2)}`);
      } else {
        alert('Não foi possível identificar o saldo no PDF.');
      }
    } catch (err) {
      alert('Erro ao ler PDF da Poupança: ' + err.message);
    } finally {
      setIsReadingPP(false);
    }
  };

  const processExcelFile = async (file) => {
    if (!file) return;
  
  const processExcelFile = async (file) => {
    if (!file) return;
    if (!window.XLSX) {
      alert("ERRO: A ferramenta de leitura de Excel ainda está sendo carregada. Aguarde 5 segundos e tente novamente.");
      return;
    }

    setIsReadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, { type: 'array', cellDates: true });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          
          const rows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (!rows || rows.length === 0) {
            alert("ERRO: O arquivo parece estar vazio.");
            return;
          }

          let headerIndex = rows.findIndex(r => 
            r.some(cell => cell && typeof cell === 'string' && (cell.includes('Data') || cell.includes('Histórico')))
          );
          if (headerIndex === -1) headerIndex = 0;

          const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { range: headerIndex });
          const [year, month] = selectedMonth.split('-');
          
          const normalized = jsonData.filter(row => {
            const rowStr = JSON.stringify(row);
            return !rowStr.includes('Extrato Conta Corrente') && !rowStr.includes('Saldos');
          }).map((row) => {
            const rawDate = row['Data'] || row['data'] || row['DATA'] || row['Data Movimento'];
            const rawInf = row['inf_'] || row['Inf.'] || row['inf'] || row['INF'];
            const rawDesc = row['historico'] || row['Historico'] || row['observacao'] || row['detalhamento_hist_'] || row['Detalhamento Hist'] || row['descricao'] || row['Descrição'];
            const valorKey = Object.keys(row).find(k => /valor/i.test(k)) || 'Valor';
            const rawValor = row[valorKey];
            const rawDoc = row['Número do Documento'] || row['documento'] || row['Documento'] || row['doc'];

            let dataMov = null;
            if (rawDate) {
              if (rawDate instanceof Date) {
                dataMov = rawDate;
              } else if (typeof rawDate === 'number') {
                dataMov = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
              } else if (typeof rawDate === 'string') {
                const parts = rawDate.split('/');
                if (parts.length === 3) {
                  dataMov = new Date(parts[2], parts[1] - 1, parts[0]);
                } else {
                  dataMov = new Date(rawDate);
                }
              }
            }
            
            if (!dataMov || isNaN(dataMov.getTime())) return null;

            const isSameMonth = dataMov.getFullYear() === parseInt(year) && 
                               (dataMov.getMonth() + 1) === parseInt(month);

            if (!isSameMonth) return null;

            let parsedValor = 0;
            if (typeof rawValor === 'number') {
              parsedValor = rawValor;
            } else if (typeof rawValor === 'string') {
              parsedValor = parseFloat(rawValor.replace(/\./g, '').replace(',', '.'));
            }

            // Determina entrada/saída pela coluna Inf. (C=Crédito, D=Débito)
            let tipo;
            const infIndicator = rawInf ? rawInf.toString().toUpperCase().trim() : '';
            if (infIndicator === 'C') {
              tipo = 'entrada';
            } else if (infIndicator === 'D') {
              tipo = 'saida';
            } else {
              tipo = (parsedValor < 0) ? 'saida' : 'entrada';
            }

            return {
              data_movimento: dataMov.toISOString().split('T')[0],
              descricao: rawDesc || 'Sem descrição',
              valor: Math.abs(parsedValor || 0),
              tipo: tipo,   // ← mudou de (parsedValor < 0) ... para a variável tipo
              documento: (rawDoc || '').toString(),
              categoria: autoCategorize(rawDesc || '', movForm?.conta || 'MARAGESC') 
            };
          }).filter(item => item !== null);

          if (normalized.length === 0) {
            const colunasEncontradas = Object.keys(jsonData[0] || {}).join(', ');
            alert(`ERRO DE COMPETÊNCIA:\n\nNão encontramos lançamentos para ${month}/${year}.\n\nColunas detectadas no arquivo: [${colunasEncontradas}]\n\nCertifique-se de que o mês selecionado no sistema é o mesmo do extrato.`);
          } else {
            setStagingMovs(normalized);
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }
        } catch (innerErr) {
          alert("Erro ao processar dados internos: " + innerErr.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      alert("Erro crítico no leitor de arquivos: " + err.message);
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
    const deducaoCivil = (Number(c.qtd_civis) || 0) * calcularTaxa(c);
    return receita - agesc - deducoes - deducaoCivil + BOLETO_FEE;
  };

  const formatCurrency = (val) => Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const getContractTotal = (c) => (Number(c.valor_mensal) || 0) + (Number(c.aditivo_valor) || 0);
  const currentAllocatedTotal = Object.values(allocations).filter(a => a.checked).reduce((sum, a) => sum + (Number(a.valor) || 0), 0);

  const renderPrestacao = () => (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-blue-900 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-blue-900 uppercase">
            Prestação de Contas - {selectedMonth.split('-').reverse().join('/')}
          </h2>
          <p className="text-sm text-slate-500 font-bold">Consolidado Global das Contas MARAGESC e AGESC</p>
        </div>
        
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
            <input type="file" accept=".xlsx" className="hidden" onChange={(e) => { const file = e.target.files?.[0] || null; processExcelFile(file); e.target.value = ''; }} />
          </label>
        </div>
      </div>

      {stagingMovs.length > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border-2 border-blue-900 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-blue-900 uppercase flex items-center gap-2">
              <CheckCircle2 size={20} className="text-emerald-500" /> Conferência de Lançamentos ({stagingMovs.length})
            </h3>
            <div className="flex gap-3">
              <button onClick={() => setStagingMovs([])} className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase">Descartar</button>
              <button 
                onClick={saveStagingToSupabase}
                disabled={savingMov}
                className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black hover:bg-emerald-600 transition-all shadow-md text-sm flex items-center gap-2"
              >
                {savingMov ? <Loader2 className="animate-spin" size={16} /> : 'CONFIRMAR E SALVAR TUDO'}
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
                        {(CATEGORIAS[movForm.conta]?.saidas || []).concat(CATEGORIAS[movForm.conta]?.entradas || []).map(cat => (
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

                </div>
        </div>
      )}

      {/* 🔵 SEÇÃO DE INVESTIMENTOS — aparece automaticamente após CC salva */}
      {balancetes.MARAGESC.entradas_investimento > 0 && (
        <div className="bg-white p-8 rounded-3xl shadow-2xl border-2 border-emerald-900 mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-emerald-900 p-3 rounded-2xl text-white">
              <TrendingDown size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-900 uppercase">
                📊 Investimentos do Mês
              </h3>
              <p className="text-xs text-slate-500 font-bold">
                Faça upload dos extratos para capturar Rendimentos, IOF e IR automaticamente
              </p>
            </div>
          </div>

          {/* BB Rende Fácil */}
          <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 mb-4 hover:bg-blue-50/30 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-black text-blue-900 text-sm">📄 BB Rende Fácil</p>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  Selecione o PDF de extrato do Rende Fácil do mesmo mês de referência
                </p>
              </div>
              <label className="cursor-pointer bg-blue-900 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-800 transition-all shadow-lg flex items-center gap-2">
                {isReadingRF ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                {isReadingRF ? 'LENDO PDF...' : '📄 SELECIONAR PDF'}
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; if (f) processRendeFacilPDF(f); e.target.value = ''; }} />
              </label>
            </div>
            {investimentoData.rf_rendimentos > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-xs font-black text-emerald-700 uppercase mb-2">✅ Rende Fácil já processado</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div><span className="text-slate-500">Rendimentos:</span> <span className="font-black text-emerald-600">R$ {formatCurrency(investimentoData.rf_rendimentos)}</span></div>
                  <div><span className="text-slate-500">IOF:</span> <span className="font-black text-red-500">R$ {formatCurrency(investimentoData.rf_iof)}</span></div>
                  <div><span className="text-slate-500">IR:</span> <span className="font-black text-red-500">R$ {formatCurrency(investimentoData.rf_ir)}</span></div>
                </div>
              </div>
            )}
          </div>

          {/* Poupança / Outros Investimentos */}
          <div className="border-2 border-dashed border-blue-200 rounded-2xl p-6 mb-4 hover:bg-blue-50/30 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-black text-blue-900 text-sm">🏦 Poupança / Outros Investimentos</p>
                <p className="text-xs text-slate-400 font-bold mt-1">
                  Selecione o PDF de extrato da Poupança do mesmo mês de referência
                </p>
              </div>
              <label className="cursor-pointer bg-blue-900 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-800 transition-all shadow-lg flex items-center gap-2">
                {isReadingPP ? <Loader2 className="animate-spin" size={18} /> : <PlusCircle size={18} />}
                {isReadingPP ? 'LENDO PDF...' : '🏦 SELECIONAR PDF'}
                <input type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0] || null; if (f) processPoupancaPDF(f); e.target.value = ''; }} />
              </label>
            </div>
            {investimentoData.pp_saldo > 0 && (
              <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <p className="text-xs font-black text-emerald-700 uppercase mb-2">✅ Poupança já processada</p>
                <div className="text-sm"><span className="text-slate-500">Saldo informado:</span> <span className="font-black text-blue-700">R$ {formatCurrency(investimentoData.pp_saldo)}</span></div>
              </div>
            )}
          </div>

          {/* Totais consolidados da CC já contabilizados */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 mt-2">
            <p className="text-[10px] font-black text-blue-800 uppercase mb-2">Movimentação via Conta Corrente (já contabilizada)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[13px]">
              <div className="flex justify-between bg-white p-2 rounded-lg">
                <span className="text-blue-600 font-bold">Total resgatado do RF:</span>
                <span className="font-black text-emerald-600">R$ {formatCurrency(balancetes.MARAGESC.entradas_investimento)}</span>
              </div>
              <div className="flex justify-between bg-white p-2 rounded-lg">
                <span className="text-blue-600 font-bold">Total aplicado no RF:</span>
                <span className="font-black text-red-500">R$ {formatCurrency(balancetes.MARAGESC.saidas_investimento)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {CATEGORIAS[movForm.conta]?.entradas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </optgroup>
              <optgroup label="Saídas">
                {CATEGORIAS[movForm.conta]?.saidas.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="border-2 border-blue-900 rounded-3xl p-6 bg-white flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tight">MARAGESC</h3>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full border border-emerald-200">CONTA OPERACIONAL</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase">Saldo Anterior</p>
              <p className="text-lg font-black text-slate-700">R$ {formatCurrency(balancetes.MARAGESC.saldo_inicial || balancetes.MARAGESC.saldo_consolidado)}{balancetes.MARAGESC.saldo_consolidado > 0 && (
              <span className="block text-[8px] font-bold text-slate-400 uppercase">CC + RF + Poupança</span>)}</p>
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
          
          </div>  {/* ← fecha o grid Saldo Anterior / Entradas / Saídas / Saldo Atual */}

          {/* 🔵 Linha informativa de investimentos — só aparece na MARAGESC */}
          {(balancetes.MARAGESC.entradas_investimento > 0 || balancetes.MARAGESC.saidas_investimento > 0) && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] mt-2">
              <p className="font-bold text-blue-800 flex items-center gap-1">
                <Info size={14} /> Movimentação de Investimentos (BB Rende Fácil + Poupança)
              </p>
              <div className="flex justify-between mt-1">
                <span className="text-blue-600">Total resgatado (entradas):</span>
                <span className="font-bold text-emerald-600">R$ {formatCurrency(balancetes.MARAGESC.entradas_investimento)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Total aplicado (saídas):</span>
                <span className="font-bold text-red-500">R$ {formatCurrency(balancetes.MARAGESC.saidas_investimento)}</span>
              </div>
            </div>
          )}

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
                      <td className="p-3 text-slate-500 font-bold">{new Date(m.data_movimento).toLocaleDateString('pt-BR')}</td>
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

        <div className="border-2 border-blue-900 rounded-3xl p-6 bg-white flex flex-col shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-blue-900 uppercase tracking-tight">AGESC</h3>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full border border-blue-200">CONTA ADMINISTRATIVA</span>
          </div>

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
                      <td className="p-3 text-slate-500 font-bold">{new Date(m.data_movimento).toLocaleDateString('pt-BR')}</td>
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
                  Valor Líquido de Repasse = Receita Bruta − Taxa AGESC (4,5%) − Deduções de Contratos (Rateio) − (Taxa dos proprietários civis) + R$ 3,00 (Restituição Boleto - Cortesia)
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
                  const deducaoCivil = (Number(c.qtd_civis) || 0) * calcularTaxa(c);
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
                        {deducaoCivil > 0 && <div className="flex justify-between"><span>− Dedução Proprietários Civis</span><span className="font-bold text-red-500">R$ {formatCurrency(deducaoCivil)}</span></div>}
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
                  {(Number(selectedCondo.qtd_civis) || 0) > 0 && <div className="flex justify-between"><span className="text-slate-500">− Dedução Proprietários Civis</span><span className="font-bold text-red-500">R$ {formatCurrency((Number(selectedCondo.qtd_civis) || 0) * calcularTaxa(selectedCondo))}</span></div>}
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
