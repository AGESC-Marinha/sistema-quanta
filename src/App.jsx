import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  Building2,
  MapPin,
  Users,
  DollarSign,
  Trash2,
  LayoutDashboard,
  Settings,
  Loader2,
  PlusCircle,
  Pencil,
  XCircle,
  CreditCard,
  Flame,
  ArrowUpCircle,
  ExternalLink,
  X,
} from 'lucide-react'

const SUPABASE_URL = 'https://bjeklbralayvulcuqiqe.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const TABLE = 'condominios'

const INITIAL_FORM = {
  nome: '',
  endereco: '',
  cnpj: '',
  qtd_pnr: '',
  qtd_civis: '',
  despesa_estimada: '',
  dados_bancarios: '',
  saldo_fundo_reserva: '',
  projetos_incendio: '',
  possui_elevadores: false,
  qtd_elevadores: '',
  empresa_elevadores: '',
  status_manutencao: '',
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return 'R$ 0,00'
  const num = Number(value)
  if (Number.isNaN(num)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num)
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '0'
  const num = Number(value)
  if (Number.isNaN(num)) return '0'
  return new Intl.NumberFormat('pt-BR').format(num)
}

function calculateRate(condo) {
  const despesa = Number(condo.despesa_estimada) || 0
  const pnr = Number(condo.qtd_pnr) || 0
  const civis = Number(condo.qtd_civis) || 0
  const total = pnr + civis
  if (total <= 0) return null
  return despesa / total / 0.905
}

function FireProjectLink({ text }) {
  if (!text || typeof text !== 'string') return null
  const tokens = text.split(/\s+/)
  return (
    <div className="space-y-1">
      {tokens.map((token, idx) => {
        if (token.toLowerCase().includes('http')) {
          return (
            <a
              key={idx}
              href={token}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold underline break-all"
            >
              {token}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          )
        }
        return <span key={idx}>{token} </span>
      })}
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [condos, setCondos] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [editingId, setEditingId] = useState(null)
  const [modalCondo, setModalCondo] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  useEffect(() => {
    fetchCondos()
  }, [])

  useEffect(() => {
    function handleEsc(e) {
      if (e.key === 'Escape') {
        setModalCondo(null)
        setDeleteId(null)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  async function fetchCondos() {
    setLoading(true)
    setError(null)
    try {
      const { data, error: sbError } = await supabase
        .from(TABLE)
        .select('*')
        .order('nome', { ascending: true })
      if (sbError) throw sbError
      setCondos(data || [])
    } catch (err) {
      setError(err?.message || 'Erro ao carregar condomínios.')
    } finally {
      setLoading(false)
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function resetForm() {
    setFormData(INITIAL_FORM)
    setEditingId(null)
  }

  function editCondo(condo) {
    setFormData({
      nome: condo.nome || '',
      endereco: condo.endereco || '',
      cnpj: condo.cnpj || '',
      qtd_pnr: condo.qtd_pnr ?? '',
      qtd_civis: condo.qtd_civis ?? '',
      despesa_estimada: condo.despesa_estimada ?? '',
      dados_bancarios: condo.dados_bancarios || '',
      saldo_fundo_reserva: condo.saldo_fundo_reserva ?? '',
      projetos_incendio: condo.projetos_incendio || '',
      possui_elevadores: !!condo.possui_elevadores,
      qtd_elevadores: condo.qtd_elevadores ?? '',
      empresa_elevadores: condo.empresa_elevadores || '',
      status_manutencao: condo.status_manutencao || '',
    })
    setEditingId(condo.id)
    setActiveTab('manage')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)

    const payload = {
      nome: formData.nome.trim(),
      endereco: formData.endereco.trim(),
      cnpj: formData.cnpj.trim(),
      qtd_pnr: Number(formData.qtd_pnr) || 0,
      qtd_civis: Number(formData.qtd_civis) || 0,
      despesa_estimada: Number(formData.despesa_estimada) || 0,
      dados_bancarios: formData.dados_bancarios.trim(),
      saldo_fundo_reserva: Number(formData.saldo_fundo_reserva) || 0,
      projetos_incendio: formData.projetos_incendio.trim(),
      possui_elevadores: !!formData.possui_elevadores,
      qtd_elevadores: formData.possui_elevadores
        ? Number(formData.qtd_elevadores) || 0
        : 0,
      empresa_elevadores: formData.possui_elevadores
        ? formData.empresa_elevadores.trim()
        : '',
      status_manutencao: formData.status_manutencao.trim(),
    }

    if (!payload.nome) {
      setError('O campo Nome é obrigatório.')
      setSaving(false)
      return
    }

    try {
      let result
      if (editingId) {
        const { data, error: sbError } = await supabase
          .from(TABLE)
          .update(payload)
          .eq('id', editingId)
          .select()
          .single()
        if (sbError) throw sbError
        result = data
        setMessage('Condomínio atualizado com sucesso.')
      } else {
        const { data, error: sbError } = await supabase
          .from(TABLE)
          .insert(payload)
          .select()
          .single()
        if (sbError) throw sbError
        result = data
        setMessage('Condomínio cadastrado com sucesso.')
      }

      setCondos((prev) => {
        const exists = prev.find((c) => c.id === result.id)
        if (exists) {
          return prev.map((c) => (c.id === result.id ? result : c))
        }
        return [...prev, result]
      })
      resetForm()
    } catch (err) {
      setError(err?.message || 'Erro ao salvar condomínio.')
    } finally {
      setSaving(false)
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    setError(null)
    setMessage(null)
    try {
      const { error: sbError } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', deleteId)
      if (sbError) throw sbError
      setCondos((prev) => prev.filter((c) => c.id !== deleteId))
      setMessage('Condomínio excluído com sucesso.')
    } catch (err) {
      setError(err?.message || 'Erro ao excluir condomínio.')
    } finally {
      setDeleteId(null)
    }
  }

  const totalCondominios = condos.length
  const totalPessoas = useMemo(
    () =>
      condos.reduce(
        (acc, c) =>
          acc + (Number(c.qtd_pnr) || 0) + (Number(c.qtd_civis) || 0),
        0
      ),
    [condos]
  )
  const totalDespesas = useMemo(
    () => condos.reduce((acc, c) => acc + (Number(c.despesa_estimada) || 0), 0),
    [condos]
  )

  function renderLabel(text) {
    return (
      <label className="block text-xs font-black text-slate-400 uppercase tracking-wide mb-1">
        {text}
      </label>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-gradient-to-r from-slate-900 to-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2 rounded-lg shadow-md">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Sistema de Condomínios
              </h1>
              <p className="text-sm text-slate-300">
                Gestão integrada de taxas, fundos e manutenções
              </p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${
                activeTab === 'dashboard'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-blue-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition ${
                activeTab === 'manage'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-blue-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              Gerenciar
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {message && (
          <div className="mb-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 px-4 py-3 rounded shadow-sm flex items-center justify-between">
            <span className="font-semibold text-sm">{message}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded shadow-sm flex items-center justify-between">
            <span className="font-semibold text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-blue-900 text-white p-3 rounded-lg">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Condomínios
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    {formatNumber(totalCondominios)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-emerald-500 text-white p-3 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Pessoas
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    {formatNumber(totalPessoas)}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
                <div className="bg-blue-700 text-white p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase">
                    Despesas Totais
                  </p>
                  <p className="text-2xl font-black text-slate-800">
                    {formatCurrency(totalDespesas)}
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <span className="ml-3 text-slate-500 font-semibold">
                  Carregando...
                </span>
              </div>
            ) : condos.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-10 text-center">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-700">
                  Nenhum condomínio cadastrado
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Vá até a aba Gerenciar para adicionar o primeiro condomínio.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {condos.map((condo) => {
                  const rate = calculateRate(condo)
                  return (
                    <button
                      key={condo.id}
                      onClick={() => setModalCondo(condo)}
                      className="text-left bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:border-emerald-400 transition p-5 group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-900 text-white p-2 rounded-lg group-hover:bg-emerald-500 transition">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-black text-slate-800 leading-tight">
                              {condo.nome}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {condo.endereco}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            PNR / Civis
                          </p>
                          <p className="text-lg font-black text-slate-800">
                            {formatNumber(condo.qtd_pnr)} /{' '}
                            {formatNumber(condo.qtd_civis)}
                          </p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            Despesa Estimada
                          </p>
                          <p className="text-lg font-black text-emerald-600">
                            {formatCurrency(condo.despesa_estimada)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">
                            Taxa Unitária
                          </p>
                          <p className="text-lg font-black text-blue-900">
                            {rate ? formatCurrency(rate) : '—'}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          Ver ficha <ArrowUpCircle className="w-3 h-3" />
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="bg-emerald-500 text-white p-2 rounded-lg">
                  {editingId ? (
                    <Pencil className="w-5 h-5" />
                  ) : (
                    <PlusCircle className="w-5 h-5" />
                  )}
                </div>
                <h2 className="text-lg font-black text-slate-800">
                  {editingId ? 'Editar Condomínio' : 'Cadastrar Condomínio'}
                </h2>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="ml-auto text-xs font-bold text-slate-500 hover:text-red-600 flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    {renderLabel('Nome')}
                    <input
                      type="text"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Nome do condomínio"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    {renderLabel('Endereço')}
                    <input
                      type="text"
                      name="endereco"
                      value={formData.endereco}
                      onChange={handleInputChange}
                      placeholder="Endereço completo"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    {renderLabel('CNPJ')}
                    <input
                      type="text"
                      name="cnpj"
                      value={formData.cnpj}
                      onChange={handleInputChange}
                      placeholder="00.000.000/0000-00"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {renderLabel('Qtd. PNR')}
                      <input
                        type="number"
                        name="qtd_pnr"
                        min="0"
                        value={formData.qtd_pnr}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      {renderLabel('Qtd. Civis')}
                      <input
                        type="number"
                        name="qtd_civis"
                        min="0"
                        value={formData.qtd_civis}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    {renderLabel('Despesa Estimada')}
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        name="despesa_estimada"
                        min="0"
                        step="0.01"
                        value={formData.despesa_estimada}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    {renderLabel('Saldo Fundo Reserva')}
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        name="saldo_fundo_reserva"
                        min="0"
                        step="0.01"
                        value={formData.saldo_fundo_reserva}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  {renderLabel('Dados Bancários')}
                  <textarea
                    name="dados_bancarios"
                    rows={2}
                    value={formData.dados_bancarios}
                    onChange={handleInputChange}
                    placeholder="Banco, agência, conta, titularidade..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div>
                  {renderLabel('Projetos de Incêndio')}
                  <div className="relative">
                    <Flame className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <textarea
                      name="projetos_incendio"
                      rows={2}
                      value={formData.projetos_incendio}
                      onChange={handleInputChange}
                      placeholder="Cole o link do projeto ou descrição"
                      className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="possui_elevadores"
                      name="possui_elevadores"
                      checked={formData.possui_elevadores}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="possui_elevadores"
                      className="text-sm font-black text-slate-700"
                    >
                      Possui Elevadores
                    </label>
                  </div>

                  {formData.possui_elevadores && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        {renderLabel('Qtd. Elevadores')}
                        <input
                          type="number"
                          name="qtd_elevadores"
                          min="0"
                          value={formData.qtd_elevadores}
                          onChange={handleInputChange}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        {renderLabel('Empresa de Elevadores')}
                        <input
                          type="text"
                          name="empresa_elevadores"
                          value={formData.empresa_elevadores}
                          onChange={handleInputChange}
                          placeholder="Nome da empresa"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  {renderLabel('Status de Manutenção')}
                  <textarea
                    name="status_manutencao"
                    rows={2}
                    value={formData.status_manutencao}
                    onChange={handleInputChange}
                    placeholder="Status atual das manutenções"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-lg shadow-md transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando...
                    </>
                  ) : editingId ? (
                    <>
                      <Pencil className="w-4 h-4" />
                      Atualizar Condomínio
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4" />
                      Cadastrar Condomínio
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="bg-blue-900 text-white p-2 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-slate-800">
                  Condomínios Cadastrados
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                </div>
              ) : condos.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-sm">Nenhum registro</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {condos.map((condo) => (
                    <div
                      key={condo.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:border-emerald-400 hover:shadow-sm transition bg-slate-50"
                    >
                      <div>
                        <p className="font-black text-slate-800 text-sm">
                          {condo.nome}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {condo.endereco}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => editCondo(condo)}
                          title="Editar"
                          className="p-2 text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(condo.id)}
                          title="Excluir"
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {modalCondo && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalCondo(null)
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-5 sm:p-6 flex items-start justify-between sticky top-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500 p-2 rounded-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">
                    {modalCondo.nome}
                  </h2>
                  <p className="text-sm text-slate-300 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {modalCondo.endereco}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalCondo(null)}
                className="text-white/80 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    CNPJ
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {modalCondo.cnpj || '—'}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Qtd. PNR
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {formatNumber(modalCondo.qtd_pnr)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Qtd. Civis
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {formatNumber(modalCondo.qtd_civis)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                  <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                    Taxa Unitária
                  </p>
                  <p className="text-lg font-black text-emerald-700">
                    {formatCurrency(calculateRate(modalCondo))}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Despesa Estimada
                  </p>
                  <p className="text-lg font-black text-slate-800">
                    {formatCurrency(modalCondo.despesa_estimada)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    Saldo Fundo Reserva
                  </p>
                  <p className="text-lg font-black text-slate-800">
                    {formatCurrency(modalCondo.saldo_fundo_reserva)}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 sm:col-span-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <CreditCard className="w-3 h-3" /> Dados Bancários
                  </p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {modalCondo.dados_bancarios || '—'}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                  <Flame className="w-3 h-3" /> Projetos de Incêndio
                </p>
                <div className="text-sm text-slate-700 whitespace-pre-wrap">
                  {modalCondo.projetos_incendio ? (
                    <FireProjectLink text={modalCondo.projetos_incendio} />
                  ) : (
                    '—'
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                  Elevadores
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Possui:</span>
                    <p className="font-bold text-slate-800">
                      {modalCondo.possui_elevadores ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Quantidade:</span>
                    <p className="font-bold text-slate-800">
                      {modalCondo.possui_elevadores
                        ? formatNumber(modalCondo.qtd_elevadores)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Empresa:</span>
                    <p className="font-bold text-slate-800">
                      {modalCondo.possui_elevadores
                        ? modalCondo.empresa_elevadores || '—'
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                  Status de Manutenção
                </p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {modalCondo.status_manutencao || '—'}
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 p-4 flex justify-end">
              <button
                onClick={() => setModalCondo(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-5 py-2 rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteId(null)
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-black">Confirmar Exclusão</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja excluir este condomínio? Esta ação não pode
              ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 rounded-lg font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg font-bold bg-red-600 hover:bg-red-700 text-white transition"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
