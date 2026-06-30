import { useState, useEffect } from 'react'
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
  X
} from 'lucide-react'

const supabaseUrl = 'https://bjeklbralayvulcuqiqe.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'cole-sua-chave-anon-aqui'
const supabase = createClient(supabaseUrl, supabaseKey)

const initialForm = {
  nome: '',
  endereco: '',
  cnpj: '',
  unidades: '',
  saldo_reserva: '',
  banco: '',
  agencia: '',
  conta: '',
  elevador_empresa: '',
  elevador_status: 'Operacional',
  projetos_incendio: '',
}

export default function App() {
  const [condos, setCondos] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [formData, setFormData] = useState(initialForm)
  const [editingId, setEditingId] = useState(null)
  const [selectedCondo, setSelectedCondo] = useState(null)
  const [error, setError] = useState(null)

  const fetchCondos = async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('condominios')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCondos(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCondos()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const resetForm = () => {
    setFormData(initialForm)
    setEditingId(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const payload = {
      ...formData,
      unidades: Number(formData.unidades) || 0,
      saldo_reserva: Number(formData.saldo_reserva) || 0,
    }

    if (editingId) {
      const { error: upsertError } = await supabase
        .from('condominios')
        .update(payload)
        .eq('id', editingId)
      if (upsertError) return setError(upsertError.message)
    } else {
      const { error: insertError } = await supabase
        .from('condominios')
        .insert([payload])
      if (insertError) return setError(insertError.message)
    }

    resetForm()
    fetchCondos()
    setActiveTab('dashboard')
  }

  const handleEdit = (condo) => {
    setFormData({
      nome: condo.nome || '',
      endereco: condo.endereco || '',
      cnpj: condo.cnpj || '',
      unidades: condo.unidades || '',
      saldo_reserva: condo.saldo_reserva || '',
      banco: condo.banco || '',
      agencia: condo.agencia || '',
      conta: condo.conta || '',
      elevador_empresa: condo.elevador_empresa || '',
      elevador_status: condo.elevador_status || 'Operacional',
      projetos_incendio: condo.projetos_incendio || '',
    })
    setEditingId(condo.id)
    setActiveTab('gerenciar')
  }

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este condomínio?')) return
    setError(null)
    const { error: deleteError } = await supabase
      .from('condominios')
      .delete()
      .eq('id', id)
    if (deleteError) return setError(deleteError.message)
    fetchCondos()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(value) || 0)
  }

  const calcularTaxaUnitaria = (saldo, unidades) => {
    const u = Number(unidades) || 0
    const s = Number(saldo) || 0
    if (u <= 0) return 'N/A'
    return formatCurrency(s / u)
  }

  const renderProjetosIncendio = (text) => {
    if (!text) return <span className="text-slate-400">Não informado</span>
    const trimmed = text.trim()
    if (trimmed.startsWith('http')) {
      return (
        <a
          href={trimmed}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors"
        >
          {trimmed}
          <ExternalLink className="w-4 h-4" />
        </a>
      )
    }
    return <span className="text-slate-700">{text}</span>
  }

  const DetailItem = ({ icon: Icon, label, value, highlight }) => (
    <div className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-2 rounded-lg ${highlight ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="text-slate-800 font-medium break-words">{value}</div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">CondoManager</h1>
            </div>
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('gerenciar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'gerenciar'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4" />
                Gerenciar
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
              <p className="text-slate-500">Clique em um condomínio para visualizar os detalhes completos.</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
              </div>
            ) : condos.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum condomínio cadastrado.</p>
                <button
                  onClick={() => setActiveTab('gerenciar')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Cadastrar condomínio
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {condos.map((condo) => (
                  <button
                    key={condo.id}
                    onClick={() => setSelectedCondo(condo)}
                    className="text-left group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <ArrowUpCircle className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 truncate">{condo.nome}</h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{condo.endereco || 'Endereço não informado'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4" />
                        <span>{condo.unidades || 0} unidades</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span>{formatCurrency(condo.saldo_reserva)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'gerenciar' && (
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {editingId ? 'Editar Condomínio' : 'Cadastrar Condomínio'}
              </h2>
              <p className="text-slate-500">
                {editingId ? 'Atualize as informações do condomínio.' : 'Preencha todos os campos para cadastrar.'}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Condomínio</label>
                  <input
                    type="text"
                    name="nome"
                    required
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                  <input
                    type="text"
                    name="endereco"
                    required
                    value={formData.endereco}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    name="cnpj"
                    required
                    value={formData.cnpj}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Número de Unidades</label>
                  <input
                    type="number"
                    name="unidades"
                    required
                    min="0"
                    value={formData.unidades}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Saldo Reserva (R$)</label>
                  <input
                    type="number"
                    name="saldo_reserva"
                    required
                    min="0"
                    step="0.01"
                    value={formData.saldo_reserva}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
                  <input
                    type="text"
                    name="banco"
                    value={formData.banco}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Agência</label>
                  <input
                    type="text"
                    name="agencia"
                    value={formData.agencia}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
                  <input
                    type="text"
                    name="conta"
                    value={formData.conta}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Empresa do Elevador</label>
                  <input
                    type="text"
                    name="elevador_empresa"
                    value={formData.elevador_empresa}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status do Elevador</label>
                  <select
                    name="elevador_status"
                    value={formData.elevador_status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  >
                    <option value="Operacional">Operacional</option>
                    <option value="Em manutenção">Em manutenção</option>
                    <option value="Inoperante">Inoperante</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Projetos de Incêndio (URL ou descrição)
                  </label>
                  <input
                    type="text"
                    name="projetos_incendio"
                    value={formData.projetos_incendio}
                    onChange={handleChange}
                    placeholder="https://... ou descrição"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all"
                >
                  {editingId ? <Pencil className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                  {editingId ? 'Atualizar' : 'Cadastrar'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-all"
                  >
                    <XCircle className="w-4 h-4" />
                    Cancelar
                  </button>
                )}
              </div>
            </form>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Condomínios Cadastrados</h3>
              {condos.length === 0 ? (
                <p className="text-slate-500">Nenhum condomínio para listar.</p>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left font-semibold text-slate-700">Nome</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-700">Endereço</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-700">Unidades</th>
                          <th className="px-6 py-3 text-left font-semibold text-slate-700">Saldo</th>
                          <th className="px-6 py-3 text-right font-semibold text-slate-700">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {condos.map((condo) => (
                          <tr key={condo.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{condo.nome}</td>
                            <td className="px-6 py-4 text-slate-600">{condo.endereco}</td>
                            <td className="px-6 py-4 text-slate-600">{condo.unidades}</td>
                            <td className="px-6 py-4 text-slate-600">{formatCurrency(condo.saldo_reserva)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEdit(condo)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(condo.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {selectedCondo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSelectedCondo(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedCondo.nome}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {selectedCondo.endereco || 'Endereço não informado'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCondo(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem
                  icon={CreditCard}
                  label="CNPJ"
                  value={selectedCondo.cnpj || 'Não informado'}
                />
                <DetailItem
                  icon={DollarSign}
                  label="Saldo Reserva"
                  value={formatCurrency(selectedCondo.saldo_reserva)}
                  highlight
                />
                <DetailItem
                  icon={Building2}
                  label="Banco / Agência / Conta"
                  value={
                    selectedCondo.banco || selectedCondo.agencia || selectedCondo.conta
                      ? `${selectedCondo.banco || '-'} / Ag. ${selectedCondo.agencia || '-'} / Cc. ${selectedCondo.conta || '-'}`
                      : 'Não informado'
                  }
                />
                <DetailItem
                  icon={ArrowUpCircle}
                  label="Elevador"
                  value={
                    <span>
                      <span className="font-semibold">{selectedCondo.elevador_empresa || 'Empresa não informada'}</span>
                      <span className="block text-sm text-slate-500 mt-0.5">
                        Status: {selectedCondo.elevador_status || 'N/A'}
                      </span>
                    </span>
                  }
                />
                <DetailItem
                  icon={Flame}
                  label="Projetos de Incêndio"
                  value={renderProjetosIncendio(selectedCondo.projetos_incendio)}
                />
                <DetailItem
                  icon={Users}
                  label="Unidades"
                  value={selectedCondo.unidades || 0}
                />
                <DetailItem
                  icon={DollarSign}
                  label="Taxa Unitária Estimada"
                  value={calcularTaxaUnitaria(selectedCondo.saldo_reserva, selectedCondo.unidades)}
                  highlight
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-900">Como calculamos a Taxa Unitária?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Valor do Saldo Reserva dividido pelo número de unidades:{' '}
                    <span className="font-medium">
                      {formatCurrency(selectedCondo.saldo_reserva || 0)} ÷ {selectedCondo.unidades || 0} ={' '}
                      {calcularTaxaUnitaria(selectedCondo.saldo_reserva, selectedCondo.unidades)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setSelectedCondo(null)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
