import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, MapPin, Loader2 } from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'SUBSTITUA_PELA_CHAVE_ANON_FORNECIDA';"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0"

const supabase = createClient(supabaseUrl, supabaseKey);

function getField(item, possibleNames) {
  if (!item) return undefined;
  for (const name of possibleNames) {
    if (item[name] !== undefined && item[name] !== null) return item[name];
  }
  return undefined;
}

function formatCurrency(value) {
  const number = typeof value === 'number' ? value : Number(value);
  if (value === undefined || value === null || Number.isNaN(number)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(number);
}

export default function App() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCondominios = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('view_gestao_condominios')
          .select('*');

        if (supabaseError) throw supabaseError;

        setCondominios(data || []);
      } catch (err) {
        setError(err?.message || 'Erro ao carregar os dados da gestão de condomínios.');
      } finally {
        setLoading(false);
      }
    };

    fetchCondominios();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
        <p className="text-base font-medium">Carregando condomínios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-red-100">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-2xl font-bold">!</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Erro ao carregar</h2>
          <p className="text-slate-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 flex items-center gap-3">
            <Building2 className="w-9 h-9 text-blue-600" />
            Gestão de Condomínios
          </h1>
          <p className="mt-2 text-slate-600 text-base">
            Visão geral dos condomínios com base nos dados calculados da view.
          </p>
        </header>

        {condominios.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Nenhum condomínio encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {condominios.map((item, index) => {
              const nome = getField(item, ['nome_condominio', 'nome', 'condominio', 'razao_social']);
              const endereco = getField(item, ['endereco', 'address', 'logradouro']);
              const qtdPnr = getField(item, ['qtd_pnr', 'quantidade_pnr', 'pnr', 'qtd_pessoas_nao_residentes']);
              const qtdCivis = getField(item, ['qtd_civis', 'civis', 'qtd_civil', 'qtd_pessoas_civis']);
              const taxa = getField(item, ['taxa_unitaria', 'taxa_unit', 'valor_unitario', 'taxa']);

              return (
                <div
                  key={item.id || index}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col"
                >
                  <div className="bg-gradient-to-r from-blue-700 to-blue-500 p-5">
                    <div className="flex items-start gap-3">
                      <div className="bg-white/20 p-2.5 rounded-xl shrink-0">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <h2 className="text-lg font-bold text-white leading-tight">
                        {nome || 'Condomínio sem nome'}
                      </h2>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-2.5 text-slate-600 mb-6">
                      <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <span className="text-sm leading-relaxed">
                        {endereco || 'Endereço não informado'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Qtd PNR
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {qtdPnr ?? 0}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Qtd Civis
                        </p>
                        <p className="text-2xl font-bold text-slate-800">
                          {qtdCivis ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                        Taxa Unitária
                      </p>
                      <p className="text-2xl font-extrabold text-emerald-700">
                        {formatCurrency(taxa)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
