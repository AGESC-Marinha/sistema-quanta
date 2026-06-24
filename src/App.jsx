import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Building2, MapPin, Users, Shield, DollarSign, Loader2 } from 'lucide-react';

const SUPABASE_URL = 'https://bjeklbralayvulcuqiqe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return number.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export default function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const { data, error: supaError } = await supabase
        .from('view_gestao_condominios')
        .select('*')
        .order('nome', { ascending: true });

      if (supaError) {
        setError(supaError.message || 'Erro ao carregar dados.');
      } else {
        setItems(data || []);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center text-slate-600">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-lg font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 max-w-md shadow-lg">
          <h2 className="text-lg font-bold mb-2">Erro ao carregar dados</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-gradient-to-r from-blue-900 to-slate-800 text-white py-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Gestão de Condomínios
          </h1>
          <p className="mt-2 text-blue-100 text-lg">
            Dashboard profissional de visualização e acompanhamento
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {items.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-lg">Nenhum condomínio encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((cond, index) => (
              <div
                key={cond.id ?? index}
                className="bg-white rounded-xl shadow-lg overflow-hidden border-t-4 border-blue-500 transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-700">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800 leading-tight">
                        {cond.nome || 'Sem nome'}
                      </h2>
                      <span className="inline-flex items-center gap-1 text-sm text-slate-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        {cond.endereco || 'Endereço não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <Users className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">PNR</p>
                        <p className="text-lg font-bold text-slate-700">{cond.qtd_pnr ?? 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                      <Shield className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide">Civis</p>
                        <p className="text-lg font-bold text-slate-700">{cond.qtd_civis ?? 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-green-50 border border-green-100">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Taxa Unitária</span>
                    </div>
                    <span className="text-2xl font-extrabold text-green-700">
                      {formatCurrency(cond.taxa_unitária ?? cond.taxa_unitaria)}
                    </span>
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
