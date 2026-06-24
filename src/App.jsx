import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, MapPin, Users, Building2, Banknote } from 'lucide-react';

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';

const supabase = createClient(supabaseUrl, supabaseKey);

function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(Number(value))) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value));
}

function App() {
  const [condominios, setCondominios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCondominios() {
      try {
        setLoading(true);
        setError(null);

        const { data, error: supabaseError } = await supabase
          .from('view_gestao_condominios')
          .select('*');

        if (supabaseError) throw supabaseError;

        if (isMounted) {
          setCondominios(data || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.message || 'Erro ao carregar os dados.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchCondominios();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Gestão de Condomínios
              </h1>
              <p className="text-sm text-slate-500">
                Visualize os dados dos condomínios cadastrados
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="mt-4 text-slate-600 font-medium">
              Carregando condomínios...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-center">
            <p className="text-red-700 font-semibold">
              Ocorreu um erro ao buscar os dados.
            </p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {!loading && !error && condominios.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-600 text-lg font-medium">
              Nenhum condomínio encontrado.
            </p>
          </div>
        )}

        {!loading && !error && condominios.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {condominios.map((condominio, index) => (
              <div
                key={condominio.id || index}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900 leading-tight">
                    {condominio.nome || 'Sem nome'}
                  </h2>
                  <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    #{index + 1}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-slate-600">
                    <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      {condominio.endereco || 'Endereço não informado'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">PNR</p>
                        <p className="text-base font-bold text-slate-900">
                          {condominio.qtd_pnr ?? 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Users className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Civis</p>
                        <p className="text-base font-bold text-slate-900">
                          {condominio.qtd_civis ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl bg-indigo-50 p-3 mt-2">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Banknote className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-indigo-600 font-medium">
                        Taxa Unitária
                      </p>
                      <p className="text-lg font-bold text-indigo-900">
                        {formatCurrency(condominio.taxa_unitaria)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
