import React, { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
  boxSizing: 'border-box'
}

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: '600',
  color: '#1e3a5f'
}

const fieldGroupStyle = {
  marginBottom: '16px'
}

const buttonStyle = {
  padding: '10px 20px',
  backgroundColor: '#1e3a5f',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600'
}

const tabButtonStyle = (active) => ({
  padding: '10px 20px',
  backgroundColor: active ? '#1e3a5f' : '#f3f4f6',
  color: active ? '#fff' : '#374151',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '600',
  marginRight: '8px'
})

const emptyCondominio = {
  id: null,
  nome: '',
  endereco: '',
  status_manutencao: '',
  elevadores_operacao: 0,
  elevadores_manutencao: 0
}

export default function App() {
  const [activeTab, setActiveTab] = useState('gerenciar')
  const [condominios, setCondominios] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyCondominio)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchCondominios()
  }, [])

  async function fetchCondominios() {
    setLoading(true)
    const { data, error } = await supabase
      .from('condominios')
      .select('*')
      .order('nome', { ascending: true })
    if (error) {
      setMessage('Erro ao carregar condomínios: ' + error.message)
    } else {
      setCondominios(data || [])
    }
    setLoading(false)
  }

  function handleEdit(condominio) {
    setEditingId(condominio.id)
    setFormData({
      id: condominio.id,
      nome: condominio.nome || '',
      endereco: condominio.endereco || '',
      status_manutencao: condominio.status_manutencao || '',
      elevadores_operacao: condominio.elevadores_operacao ?? 0,
      elevadores_manutencao: condominio.elevadores_manutencao ?? 0
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setFormData(emptyCondominio)
    setMessage('')
  }

  function handleChange(e) {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value
    }))
  }

  async function handleSave() {
    if (!formData.nome) {
      setMessage('O nome do condomínio é obrigatório.')
      return
    }

    setLoading(true)
    setMessage('')

    const payload = {
      nome: formData.nome,
      endereco: formData.endereco,
      status_manutencao: formData.status_manutencao,
      elevadores_operacao: formData.elevadores_operacao,
      elevadores_manutencao: formData.elevadores_manutencao
    }

    const { error } = await supabase
      .from('condominios')
      .update(payload)
      .eq('id', editingId)

    if (error) {
      setMessage('Erro ao salvar: ' + error.message)
    } else {
      setMessage('Condomínio atualizado com sucesso!')
      setEditingId(null)
      setFormData(emptyCondominio)
      await fetchCondominios()
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px', fontFamily: 'Segoe UI, Arial, sans-serif' }}>
      <h1 style={{ color: '#1e3a5f', marginBottom: '24px' }}>Gestão de Condomínios</h1>

      <div style={{ marginBottom: '24px' }}>
        <button style={tabButtonStyle(activeTab === 'gerenciar')} onClick={() => setActiveTab('gerenciar')}>
          Gerenciar
        </button>
      </div>

      {activeTab === 'gerenciar' && (
        <div>
          {loading && <p style={{ color: '#6b7280' }}>Carregando...</p>}
          {message && (
            <p style={{ padding: '10px', borderRadius: '8px', backgroundColor: message.includes('Erro') ? '#fee2e2' : '#dcfce7', color: message.includes('Erro') ? '#991b1b' : '#166534', marginBottom: '16px' }}>
              {message}
            </p>
          )}

          {editingId ? (
            <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <h2 style={{ color: '#1e3a5f', marginBottom: '20px' }}>Editar Condomínio</h2>

              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="nome">Nome</label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  value={formData.nome}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="endereco">Endereço</label>
                <input
                  id="endereco"
                  name="endereco"
                  type="text"
                  value={formData.endereco}
                  onChange={handleChange}
                  style={inputStyle}
                />
              </div>

              <div style={fieldGroupStyle}>
                <label style={labelStyle} htmlFor="status_manutencao">Status da Manutenção</label>
                <select
                  id="status_manutencao"
                  name="status_manutencao"
                  value={formData.status_manutencao}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Selecione...</option>
                  <option value="em_dia">Em dia</option>
                  <option value="atrasada">Atrasada</option>
                  <option value="programada">Programada</option>
                  <option value="em_andamento">Em andamento</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                <div style={{ ...fieldGroupStyle, flex: 1 }}>
                  <label style={labelStyle} htmlFor="elevadores_operacao">Elevadores em Operação</label>
                  <input
                    id="elevadores_operacao"
                    name="elevadores_operacao"
                    type="number"
                    min="0"
                    value={formData.elevadores_operacao}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={{ ...fieldGroupStyle, flex: 1 }}>
                  <label style={labelStyle} htmlFor="elevadores_manutencao">Elevadores em Manutenção</label>
                  <input
                    id="elevadores_manutencao"
                    name="elevadores_manutencao"
                    type="number"
                    min="0"
                    value={formData.elevadores_manutencao}
                    onChange={handleChange}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={buttonStyle} onClick={handleSave} disabled={loading}>
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  style={{ ...buttonStyle, backgroundColor: '#6b7280' }}
                  onClick={handleCancelEdit}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div>
              {condominios.length === 0 && !loading && (
                <p style={{ color: '#6b7280' }}>Nenhum condomínio cadastrado.</p>
              )}
              {condominios.map((cond) => (
                <div
                  key={cond.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    marginBottom: '12px'
                  }}
                >
                  <div>
                    <strong style={{ color: '#1e3a5f' }}>{cond.nome}</strong>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
                      {cond.endereco || 'Sem endereço'}
                    </p>
                    <p style={{ color: '#6b7280', fontSize: '12px', margin: '4px 0 0 0' }}>
                      Elevadores: {cond.elevadores_operacao ?? 0} em operação / {cond.elevadores_manutencao ?? 0} em manutenção
                    </p>
                  </div>
                  <button style={buttonStyle} onClick={() => handleEdit(cond)}>
                    Editar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
