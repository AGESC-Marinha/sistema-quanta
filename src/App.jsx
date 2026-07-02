import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, MapPin, Users, DollarSign, Trash2, 
  LayoutDashboard, Settings, Loader2, PlusCircle, Pencil, XCircle,
  CreditCard, Flame, ArrowUpCircle, ExternalLink, X,
  FileText, Calendar, Percent, Link2, ChevronDown, ChevronRight, TrendingDown, Info, CheckCircle2
} from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

const TAXA_AGESC_RATE = 0.045;
const FUNDO_RESERVA_RATE = 0.05;
const BOLETO_RESTITUICAO = 3.00;

const CONDOMINIOS_LIST = [
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

const INITIAL_CONTRACT = {
  numero_contrato: '', empresa_contratada: '', valor_mensal: '',
  tem_aditivo: false, aditivo_descricao: '', aditivo_valor: '',
  prazo_inicio: '', prazo_fim: '', link_pdf: '',
  alocacoes: {} // { 'Nome Condominio': valor }
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCondo, setSelectedCondo] = useState(null);
  const [contractForm, setContractForm] = useState(INITIAL_CONTRACT);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const { data: cData } = await supabase.from('condominios').select('*').order('nome');
      const { data: ctData } = await supabase.from('contratos').select('*').order('numero_contrato');
      const { data: rData } = await supabase.from('rateios').select('*');
      
      setCondominios(cData || []);
      
      const contratosComAlocacao = (ctData || []).map(ct => {
        const alocs = {};
        (rData || []).filter(r => r.contrato_id === ct.id).forEach(r => {
          alocs[r.condominio] = r.valor;
        });
        return { ...ct, alocacoes: alocs };
      });
      setContratos(contratosComAlocacao);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  }
    /* --- Lógica de Salvamento --- */
  async function saveContract(e) {
    e.preventDefault();
    if (!contractForm.numero_contrato || !contractForm.empresa_contratada) {
      alert('Por favor, preencha o número do contrato e a empresa.');
      return;
    }

    const somaAlocacoes = Object.values(contractForm.alocacoes).reduce((a, b) => a + (Number(b) || 0), 0);
    const valorTotal = Number(contractForm.valor_mensal) || 0;

    if (valorTotal > 0 && Math.abs(somaAlocacoes - valorTotal) > 0.01) {
      const confirmSave = confirm(`A soma das alocações (R$ ${somaAlocacoes.toFixed(2)}) não bate com o valor total (R$ ${valorTotal.toFixed(2)}). Deseja salvar mesmo assim?`);
      if (!confirmSave) return;
    }

    setSaving(true);
    try {
      const payload = {
        numero_contrato: contractForm.numero_contrato,
        empresa_contratada: contractForm.empresa_contratada,
        valor_mensal: valorTotal,
        tem_aditivo: contractForm.tem_aditivo,
        aditivo_descricao: contractForm.aditivo_descricao,
        aditivo_valor: Number(contractForm.aditivo_valor) || 0,
        prazo_inicio: contractForm.prazo_inicio || null,
        prazo_fim: contractForm.prazo_fim || null,
        link_pdf: contractForm.link_pdf
      };

      let contratoId = editingId;

      if (editingId) {
        const { error } = await supabase.from('contratos').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('contratos').insert([payload]).select();
        if (error) throw error;
        contratoId = data[0].id;
      }

      // Salvar Alocações (Rateios)
      await supabase.from('rateios').delete().eq('contrato_id', contratoId);
      
      const alocacoesRows = Object.entries(contractForm.alocacoes)
        .filter(([_, valor]) => Number(valor) > 0)
        .map(([condo, valor]) => ({
          contrato_id: contratoId,
          condominio: condo,
          valor: Number(valor)
        }));

      if (alocacoesRows.length > 0) {
        const { error: rError } = await supabase.from('rateios').insert(alocacoesRows);
        if (rError) throw rError;
      }

      alert('Contrato e alocações salvos com sucesso!');
      setEditingId(null);
      setContractForm(INITIAL_CONTRACT);
      fetchData();
      setActiveTab('dashboard');
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro técnico ao salvar. Verifique o console (F12).');
    } finally {
      setSaving(false);
    }
  }

  const handleToggleCondo = (name) => {
    const newAlocs = { ...contractForm.alocacoes };
    if (name === 'Todos') {
      const isSelectingAll = !newAlocs['Todos'];
      if (isSelectingAll) {
        newAlocs['Todos'] = true;
        CONDOMINIOS_LIST.forEach(c => { if (!newAlocs[c]) newAlocs[c] = ''; });
      } else {
        delete newAlocs['Todos'];
        CONDOMINIOS_LIST.forEach(c => delete newAlocs[c]);
      }
    } else {
      if (newAlocs[name] !== undefined) delete newAlocs[name];
      else newAlocs[name] = '';
    }
    setContractForm({ ...contractForm, alocacoes: newAlocs });
  };

  const handleAlocacaoChange = (name, val) => {
    setContractForm({
      ...contractForm,
      alocacoes: { ...contractForm.alocacoes, [name]: val }
    });
  };

  /* --- Renderização --- */
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-blue-900 text-white p-6 shadow-xl flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Building2 size={32} />
          <h1 className="text-2xl font-black tracking-tighter">SISTEMA QUANTA</h1>
        </div>
        <nav className="flex gap-2">
          <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Dashboard</button>
          <button onClick={() => setActiveTab('contratos')} className={`px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'contratos' ? 'bg-white text-blue-900 shadow-lg' : 'hover:bg-blue-800'}`}>Contratos</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-8">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="animate-spin text-blue-900" size={48} />
            <p className="font-bold text-slate-400 uppercase tracking-widest">Sincronizando com AGESC...</p>
          </div>
        ) : activeTab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {condominios.map(c => {
              const alocacaoTotal = contratos.reduce((sum, ct) => sum + (Number(ct.alocacoes[c.nome]) || 0), 0);
              const receitaBruta = (Number(c.qtd_pnr) + Number(c.qtd_civis)) * ((Number(c.despesa_estimada) / (Number(c.qtd_pnr) + Number(c.qtd_civis))) / 0.905);
              const taxaAgesc = receitaBruta * TAXA_AGESC_RATE;
              const liquido = receitaBruta - taxaAgesc - alocacaoTotal + BOLETO_RESTITUICAO;

              return (
                <div key={c.id} className="bg-white rounded-3xl shadow-sm border p-6 hover:shadow-xl transition-all">
                  <h3 className="font-black text-xl text-blue-900 mb-2">{c.nome}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Receita Bruta:</span><span className="font-bold">R$ {receitaBruta.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between text-red-500"><span>− Taxa AGESC (4,5%):</span><span className="font-bold">R$ {taxaAgesc.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between text-red-500"><span>− Contratos Alocados:</span><span className="font-bold">R$ {alocacaoTotal.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span></div>
                    <div className="flex justify-between text-emerald-600"><span>+ Restituição Boleto:</span><span className="font-bold">R$ {BOLETO_RESTITUICAO.toFixed(2)}</span></div>
                    <div className="pt-4 border-t mt-2">
                      <p className="text-[10px] font-black uppercase text-slate-400">Repasse Líquido</p>
                      <p className="text-2xl font-black text-blue-900">R$ {liquido.toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-blue-900 p-8 text-white">
              <h2 className="text-2xl font-black flex items-center gap-3"><FileText /> GESTÃO DE CONTRATOS</h2>
              <p className="text-blue-200 text-sm mt-1">Cadastre empresas e aloque valores por condomínio.</p>
            </div>
            
            <form onSubmit={saveContract} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Nº Contrato</label>
                <input className="w-full bg-slate-100 border-none rounded-xl p-4 focus:ring-2 ring-blue-500" value={contractForm.numero_contrato} onChange={e => setContractForm({...contractForm, numero_contrato: e.target.value})} required /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Empresa Contratada</label>
                <input className="w-full bg-slate-100 border-none rounded-xl p-4 focus:ring-2 ring-blue-500" value={contractForm.empresa_contratada} onChange={e => setContractForm({...contractForm, empresa_contratada: e.target.value})} required /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Valor Mensal Total (R$)</label>
                <input type="number" step="0.01" className="w-full bg-blue-50 border-none rounded-xl p-4 font-black text-blue-900" value={contractForm.valor_mensal} onChange={e => setContractForm({...contractForm, valor_mensal: e.target.value})} required /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Início Vigência</label>
                <input type="date" className="w-full bg-slate-100 border-none rounded-xl p-4" value={contractForm.prazo_inicio} onChange={e => setContractForm({...contractForm, prazo_inicio: e.target.value})} /></div>
                <div><label className="block text-xs font-black text-slate-400 uppercase mb-1">Fim Vigência</label>
                <input type="date" className="w-full bg-slate-100 border-none rounded-xl p-4" value={contractForm.prazo_fim} onChange={e => setContractForm({...contractForm, prazo_fim: e.target.value})} /></div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-black text-blue-900 mb-4 flex items-center gap-2"><Building2 size={20}/> ALOCAÇÃO POR CONDOMÍNIO</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 custom-scrollbar">
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-blue-100 cursor-pointer hover:bg-blue-50">
                    <input type="checkbox" className="w-5 h-5 rounded" checked={!!contractForm.alocacoes['Todos']} onChange={() => handleToggleCondo('Todos')} />
                    <span className="font-black text-blue-900 uppercase text-xs">Selecionar Todos</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-amber-100 cursor-pointer hover:bg-amber-50">
                    <input type="checkbox" className="w-5 h-5 rounded" checked={contractForm.alocacoes['AGESC'] !== undefined} onChange={() => handleToggleCondo('AGESC')} />
                    <span className="font-black text-amber-700 uppercase text-xs">Administração AGESC</span>
                  </label>
                  {CONDOMINIOS_LIST.map(name => (
                    <div key={name} className="flex flex-col gap-2 p-3 bg-white rounded-xl border border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" className="w-5 h-5 rounded text-blue-600" checked={contractForm.alocacoes[name] !== undefined} onChange={() => handleToggleCondo(name)} />
                        <span className="text-xs font-bold text-slate-700">{name}</span>
                      </label>
                      {contractForm.alocacoes[name] !== undefined && (
                        <input type="number" step="0.01" placeholder="Valor R$" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-sm font-bold text-blue-900" value={contractForm.alocacoes[name]} onChange={e => handleAlocacaoChange(name, e.target.value)} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-blue-900 rounded-2xl text-white flex justify-between items-center shadow-inner">
                <div>
                  <p className="text-[10px] font-black uppercase opacity-60">Soma das Alocações</p>
                  <p className="text-2xl font-black">R$ {Object.values(contractForm.alocacoes).reduce((a, b) => a + (Number(b) || 0), 0).toLocaleString('pt-BR', {minimumFractionDigits:2})}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase opacity-60">Status</p>
                  {Math.abs(Object.values(contractForm.alocacoes).reduce((a, b) => a + (Number(b) || 0), 0) - (Number(contractForm.valor_mensal) || 0)) < 0.01 ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-black"><CheckCircle2 size={16}/> VALORES BATEM</span>
                  ) : (
                    <span className="text-amber-400 font-black">DIFERENÇA DETECTADA</span>
                  )}
                </div>
              </div>

              <button type="submit" disabled={saving} className="w-full bg-blue-900 text-white p-6 rounded-2xl font-black text-xl hover:bg-blue-800 transition-all shadow-xl flex justify-center items-center gap-3">
                {saving ? <Loader2 className="animate-spin" /> : <><PlusCircle /> SALVAR CONTRATO E ALOCAÇÕES</>}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
