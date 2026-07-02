import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-url';
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Save, 
  Search, 
  ChevronRight, 
  Info, 
  AlertCircle, 
  CheckCircle2,
  Lock,
  Unlock,
  History,
  Calendar
} from 'lucide-react';

// CONFIGURAÇÃO SUPABASE
const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';
const supabase = createClient(supabaseUrl, supabaseKey);

const App = () => {
  // ESTADOS PRINCIPAIS
  const [activeTab, setActiveTab] = useState('dashboard');
  const [condominios, setCondominios] = useState([]);
  const [contratos, setContratos] = useState([]);
  const [rateios, setRateios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCondo, setSelectedCondo] = useState(null);

  // ESTADOS DE FECHAMENTO
  const [mesReferencia, setMesReferencia] = useState(new Date().getMonth() + 1);
  const [anoReferencia, setAnoReferencia] = useState(new Date().getFullYear());
  const [fechamentosSalvos, setFechamentosSalvos] = useState([]);
  const [statusMes, setStatusMes] = useState('aberto');

  useEffect(() => {
    fetchData();
    fetchFechamentos();
  }, [mesReferencia, anoReferencia]);

  const fetchData = async () => {
    setLoading(true);
    const { data: condos } = await supabase.from('condominios').select('*').order('nome');<br/>
    const { data: conts } = await supabase.from('contratos').select('*');<br/>
    const { data: rats } = await supabase.from('rateios').select('*');
    
    setCondominios(condos || []);
    setContratos(conts || []);
    setRateios(rats || []);
    setLoading(false);
  };

  const fetchFechamentos = async () => {
    const { data } = await supabase
      .from('fechamentos_mensais')
      .select('*')
      .eq('mes', mesReferencia)
      .eq('ano', anoReferencia);
    
    setFechamentosSalvos(data || []);
    if (data && data.length > 0) {
      setStatusMes(data[0].status);
    } else {
      setStatusMes('aberto');
    }
  };

  // LÓGICA DE CÁLCULO AGESC
  const calcularDadosCondominio = (condo) => {
    const tu = condo.taxa_unitaria || 0;
    const qtd = (condo.pnr_civis || 0) + (condo.pnr_militares || 0);
    const receitaBruta = tu * qtd;
    
    // Deduções de Contratos (Rateios)
    const deducoesContratos = rateios
      .filter(r => r.condominio_id === condo.id)
      .reduce((acc, curr) => acc + (curr.valor_alocado || 0), 0);

    const taxaAgesc = receitaBruta * 0.045;
    const fundoReserva = receitaBruta * 0.05; // Apenas informativo
    const restituicaoBoleto = (condo.pnr_civis || 0) * 3;

    const valorLiquido = receitaBruta - taxaAgesc - deducoesContratos + restituicaoBoleto;

    return {
      tu,
      qtd,
      receitaBruta,
      taxaAgesc,
      fundoReserva,
      deducoesContratos,
      restituicaoBoleto,
      valorLiquido
    };
  };

  // PERSISTÊNCIA DE FECHAMENTO (UPSERT)
  const salvarFechamento = async (status = 'rascunho') => {
    const payloads = condominios.map(condo => {
      const calc = calcularDadosCondominio(condo);
      return {
        condominio_id: condo.id,<br/>
        mes: mesReferencia,<br/>
        ano: anoReferencia,<br/>
        receita_bruta: calc.receitaBruta,<br/>
        taxa_agesc: calc.taxaAgesc,<br/>
        fundo_reserva: calc.fundoReserva,<br/>
        deducoes_contratos: calc.deducoesContratos,<br/>
        restituicao_boleto: calc.restituicaoBoleto,<br/>
        valor_liquido: calc.valorLiquido,<br/>
        status: status
      };
    });

    const { error } = await supabase
      .from('fechamentos_mensais')
      .upsert(payloads, { onConflict: 'condominio_id,mes,ano' });

    if (!error) {
      alert(status === 'fechado' ? 'Mês encerrado com sucesso!' : 'Rascunho salvo!');
      fetchFechamentos();
    }
  };

  // COMPONENTE DE CARD DO DASHBOARD (LAYOUT APROVADO)
  const CondoCard = ({ condo }) => {
    const calc = calcularDadosCondominio(condo);
    
    return (
      <div 
        onClick={() => setSelectedCondo(condo)}
        className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-slate-800 text-lg uppercase">{condo.nome}</h3>
            <p className="text-xs text-slate-500">{condo.pnr_civis + condo.pnr_militares} Unidades</p>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg">
            <p className="text-[10px] text-emerald-600 font-bold uppercase">Taxa Unitária</p>
            <p className="text-emerald-700 font-bold">R$ {calc.tu.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium text-blue-700">Receita Bruta</span>
            <span className="font-bold text-blue-800 text-lg">R$ {calc.receitaBruta.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>

          <div className="text-sm space-y-1 px-1">
            <div className="flex justify-between text-slate-600">
              <span>Taxa AGESC (4,5%)</span>
              <span className="font-medium text-red-500">- R$ {calc.taxaAgesc.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Deduções Contratos</span>
              <span className="font-medium text-red-500">- R$ {calc.deducoesContratos.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Restituição Boletos</span>
              <span className="font-medium text-emerald-600">+ R$ {calc.restituicaoBoleto.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-slate-400 italic text-xs pt-1 border-t border-slate-100">
              <span>Fundo Reserva (5%)</span>
              <span>Incluso</span>
            </div>
          </div>

          <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center mt-2">
            <span className="text-sm font-medium text-slate-300">Valor Líquido</span>
            <span className="font-bold text-white text-xl">R$ {calc.valorLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>
        </div>
      </div>
    );
  };

  // RENDERIZAÇÃO DO MODAL (COM SCROLL)
  const ModalDetalhes = () => {
    if (!selectedCondo) return null;
    const calc = calcularDadosCondominio(selectedCondo);

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">{selectedCondo.nome}</h2>
            <button onClick={() => setSelectedCondo(null)} className="text-slate-400 hover:text-slate-600">✕</button>
          </div>
          
          <div className="p-6 space-y-8">
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Identificação e Localização</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-slate-500">CNPJ</p><p className="font-medium">{selectedCondo.cnpj || 'Não informado'}</p></div>
                <div><p className="text-slate-500">Endereço</p><p className="font-medium">{selectedCondo.endereco || 'Não informado'}</p></div>
              </div>
            </section>

            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dados Bancários</h4>
              <div className="grid grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                <div><p className="text-slate-500">Banco</p><p className="font-medium">{selectedCondo.banco || '-'}</p></div>
                <div><p className="text-slate-500">Agência</p><p className="font-medium">{selectedCondo.agencia || '-'}</p></div>
                <div><p className="text-slate-500">Conta</p><p className="font-medium">{selectedCondo.conta || '-'}</p></div>
              </div>
            </section>

            {selectedCondo.possui_elevador && (
              <section>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sistema de Elevadores</h4>
                <div className="grid grid-cols-2 gap-4 text-sm border border-blue-100 p-4 rounded-xl">
                  <div><p className="text-slate-500">Empresa Manutenção</p><p className="font-medium">{selectedCondo.empresa_elevador || '-'}</p></div>
                  <div><p className="text-slate-500">Status Operacional</p><p className="text-blue-600 font-bold">Em operação</p></div>
                </div>
              </section>
            )}

            <section className="bg-slate-900 text-white p-6 rounded-2xl">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ficha Técnica Financeira</h4>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span>Receita Bruta</span>
                  <span className="font-bold">R$ {calc.receitaBruta.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2 text-red-400">
                  <span>Deduções Totais</span>
                  <span className="font-bold">- R$ {(calc.taxaAgesc + calc.deducoesContratos).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between pt-2 text-xl">
                  <span className="font-bold text-emerald-400">Repasse Líquido</span>
                  <span className="font-bold text-emerald-400">R$ {calc.valorLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xl">Q</span>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-slate-900">QUANTA <span className="text-slate-400 font-light">| AGESC</span></h1>
          </div>
          
          <nav className="flex gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },<br/>
              { id: 'gerenciar', label: 'Condomínios', icon: Building2 },<br/>
              { id: 'contratos', label: 'Contratos', icon: FileText },<br/>
              { id: 'fechamento', label: 'Fechamento', icon: Calendar }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === item.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">Painel de Repasses</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar condomínio..." 
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl w-64 focus:ring-2 focus:ring-slate-900 outline-none"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {condominios
                .filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(condo => <CondoCard key={condo.id} condo={condo} />)
              }
            </div>
          </div>
        )}

        {activeTab === 'fechamento' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-slate-500">Mês:</label>
                  <select 
                    value={mesReferencia} 
                    onChange={(e) => setMesReferencia(Number(e.target.value))}
                    className="border-slate-200 rounded-lg text-sm font-bold p-1"
                  >
                    {Array.from({length: 12}, (_, i) => (
                      <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('pt-BR', {month: 'long'})}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold text-slate-500">Ano:</label>
                  <select 
                    value={anoReferencia} 
                    onChange={(e) => setAnoReferencia(Number(e.target.value))}
                    className="border-slate-200 rounded-lg text-sm font-bold p-1"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => salvarFechamento('rascunho')}
                  disabled={statusMes === 'fechado'}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 disabled:opacity-50"
                >
                  <Save size={18} /> Salvar Rascunho
                </button>
                <button 
                  onClick={() => salvarFechamento('fechado')}
                  disabled={statusMes === 'fechado'}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
                >
                  <Lock size={18} /> Encerrar Mês
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-6 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
                <Info size={18} />
                <span>{statusMes === 'fechado' ? 'Este mês está ENCERRADO. Os valores estão congelados para auditoria.' : 'Mês em aberto. Você pode atualizar os valores conforme necessário.'}</span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="pb-4 font-bold uppercase tracking-wider">Condomínio</th>
                    <th className="pb-4 font-bold uppercase tracking-wider">Receita Bruta</th>
                    <th className="pb-4 font-bold uppercase tracking-wider">Deduções</th>
                    <th className="pb-4 font-bold uppercase tracking-wider">Líquido</th>
                    <th className="pb-4 font-bold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {condominios.map(condo => {
                    const calc = calcularDadosCondominio(condo);
                    return (
                      <tr key={condo.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-slate-700">{condo.nome}</td>
                        <td className="py-4">R$ {calc.receitaBruta.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="py-4 text-red-500">- R$ {(calc.taxaAgesc + calc.deducoesContratos).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="py-4 font-black">R$ {calc.valorLiquido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${statusMes === 'fechado' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                            {statusMes}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <ModalDetalhes />
    </div>
  );
};

export default App;
