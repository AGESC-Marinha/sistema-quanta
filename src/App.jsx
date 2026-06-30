import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
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
} from "lucide-react";

const supabaseUrl = "https://bjeklbralayvulcuqiqe.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqZWtsYnJhbGF5dnVsY3VxaXFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNDA4MDQsImV4cCI6MjA5NzgxNjgwNH0.dWPW_JUp9ZimTm_g00fZgum8-NPAOhFAe1k38ZLOko0";
const supabase = createClient(supabaseUrl, supabaseKey);

const initialForm = {
  nome: "",
  endereco: "",
  cnpj: "",
  qtd_pnr: "",
  qtd_civis: "",
  despesa_estimada: "",
  taxa_unitaria: "",
  dados_bancarios: "",
  saldo_fundo_reserva: "",
  projetos_incendio: "",
  possui_elevadores: false,
  qtd_total_elevadores: "",
  em_operacao: "",
  em_manutencao: "",
  empresa_responsavel: "",
  status_manutencao: "",
};

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("condominios")
      .select("*")
      .order("nome", { ascending: true });
    if (err) {
      setError(err.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "-";
    const num = Number(value);
    if (Number.isNaN(num)) return value;
    return num.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const buildPayload = () => ({
    nome: form.nome,
    endereco: form.endereco,
    cnpj: form.cnpj,
    qtd_pnr: form.qtd_pnr === "" ? null : Number(form.qtd_pnr),
    qtd_civis: form.qtd_civis === "" ? null : Number(form.qtd_civis),
    despesa_estimada: form.despesa_estimada === "" ? null : Number(form.despesa_estimada),
    taxa_unitaria: form.taxa_unitaria === "" ? null : Number(form.taxa_unitaria),
    dados_bancarios: form.dados_bancarios,
    saldo_fundo_reserva: form.saldo_fundo_reserva === "" ? null : Number(form.saldo_fundo_reserva),
    projetos_incendio: form.projetos_incendio,
    possui_elevadores: form.possui_elevadores,
    qtd_total_elevadores: form.qtd_total_elevadores === "" || !form.possui_elevadores ? null : Number(form.qtd_total_elevadores),
    em_operacao: form.em_operacao === "" || !form.possui_elevadores ? null : Number(form.em_operacao),
    em_manutencao: form.em_manutencao === "" || !form.possui_elevadores ? null : Number(form.em_manutencao),
    empresa_responsavel: form.possui_elevadores ? form.empresa_responsavel : "",
    status_manutencao: form.possui_elevadores ? form.status_manutencao : "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const payload = buildPayload();

    let result;
    if (editingId) {
      result = await supabase.from("condominios").update(payload).eq("id", editingId).select();
    } else {
      result = await supabase.from("condominios").insert(payload).select();
    }

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setForm(initialForm);
    setEditingId(null);
    await fetchItems();
    setTab("dashboard");
  };

  const handleEdit = (item) => {
    setForm({
      nome: item.nome || "",
      endereco: item.endereco || "",
      cnpj: item.cnpj || "",
      qtd_pnr: item.qtd_pnr ?? "",
      qtd_civis: item.qtd_civis ?? "",
      despesa_estimada: item.despesa_estimada ?? "",
      taxa_unitaria: item.taxa_unitaria ?? "",
      dados_bancarios: item.dados_bancarios || "",
      saldo_fundo_reserva: item.saldo_fundo_reserva ?? "",
      projetos_incendio: item.projetos_incendio || "",
      possui_elevadores: !!item.possui_elevadores,
      qtd_total_elevadores: item.qtd_total_elevadores ?? "",
      em_operacao: item.em_operacao ?? "",
      em_manutencao: item.em_manutencao ?? "",
      empresa_responsavel: item.empresa_responsavel || "",
      status_manutencao: item.status_manutencao || "",
    });
    setEditingId(item.id);
    setTab("gerenciar");
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deseja realmente remover este condomínio?")) return;
    setError(null);
    const { error: err } = await supabase.from("condominios").delete().eq("id", id);
    if (err) {
      setError(err.message);
      return;
    }
    await fetchItems();
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
    setTab("dashboard");
  };

  const FieldLabel = ({ icon: Icon, children }) => (
    <span className="flex items-center gap-2">
      <Icon size={16} className="text-emerald-500" />
      <span className="font-medium text-slate-700">{children}</span>
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-blue-950 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 size={28} className="text-emerald-400" />
            <h1 className="text-xl font-bold tracking-tight">Gestão de Condomínios</h1>
          </div>
          <nav className="flex gap-2">
            <button
              onClick={() => setTab("dashboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                tab === "dashboard"
                  ? "bg-emerald-500 text-white"
                  : "hover:bg-blue-900 text-blue-100"
              }`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </button>
            <button
              onClick={() => setTab("gerenciar")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                tab === "gerenciar"
                  ? "bg-emerald-500 text-white"
                  : "hover:bg-blue-900 text-blue-100"
              }`}
            >
              <Settings size={18} />
              Gerenciar
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-3 flex items-center gap-2">
            <XCircle size={20} />
            {error}
          </div>
        )}

        {tab === "dashboard" && (
          <section>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
                <LayoutDashboard className="text-emerald-500" /> Dashboard
              </h2>
              <button
                onClick={() => {
                  setForm(initialForm);
                  setEditingId(null);
                  setTab("gerenciar");
                }}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <PlusCircle size={18} /> Novo Condomínio
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-blue-900">
                <Loader2 className="animate-spin mb-3" size={40} />
                Carregando...
              </div>
            ) : items.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
                    Nenhum condomínio cadastrado.
                  </div>
                ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-900 transition cursor-pointer p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-950 text-white p-2 rounded-lg">
                          <Building2 size={22} />
                        </div>
                        <h3 className="font-bold text-blue-950 line-clamp-1">{item.nome}</h3>
                      </div>
                      <div
                        className="flex items-center gap-1 text-sm text-emerald-600 font-medium opacity-0 group-hover:opacity-100 transition"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                      >
                        <Pencil size={14} /> Editar
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-emerald-500" />
                        <span className="truncate">{item.endereco || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-emerald-500" />
                        <span>PNR: {item.qtd_pnr ?? 0} | Civis: {item.qtd_civis ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-emerald-500" />
                        <span>Despesa: {formatCurrency(item.despesa_estimada)}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-xs font-semibold text-blue-900 uppercase tracking-wide">
                        {item.possui_elevadores ? "Com Elevadores" : "Sem Elevadores"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition"
                        title="Remover"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === "gerenciar" && (
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-2xl font-bold text-blue-950 mb-6 flex items-center gap-2">
              <Settings className="text-emerald-500" />
              {editingId ? "Editar Condomínio" : "Cadastrar Condomínio"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Nome</label>
                  <input
                    required
                    type="text"
                    name="nome"
                    value={form.nome}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Endereço</label>
                  <input
                    required
                    type="text"
                    name="endereco"
                    value={form.endereco}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">CNPJ</label>
                  <input
                    required
                    type="text"
                    name="cnpj"
                    value={form.cnpj}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Qtd PNR</label>
                  <input
                    type="number"
                    name="qtd_pnr"
                    value={form.qtd_pnr}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Qtd Civis</label>
                  <input
                    type="number"
                    name="qtd_civis"
                    value={form.qtd_civis}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Despesa Estimada</label>
                  <input
                    type="number"
                    step="0.01"
                    name="despesa_estimada"
                    value={form.despesa_estimada}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Taxa Unitária</label>
                  <input
                    type="number"
                    step="0.01"
                    name="taxa_unitaria"
                    value={form.taxa_unitaria}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Dados Bancários</label>
                  <input
                    type="text"
                    name="dados_bancarios"
                    value={form.dados_bancarios}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Saldo Fundo Reserva</label>
                  <input
                    type="number"
                    step="0.01"
                    name="saldo_fundo_reserva"
                    value={form.saldo_fundo_reserva}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Projetos Incêndio (Link)</label>
                  <input
                    type="url"
                    name="projetos_incendio"
                    value={form.projetos_incendio}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <label className="flex items-center gap-3 text-blue-950 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    name="possui_elevadores"
                    checked={form.possui_elevadores}
                    onChange={handleInputChange}
                    className="h-5 w-5 accent-emerald-500 rounded"
                  />
                  Possui Elevadores
                </label>

                {form.possui_elevadores && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Qtd Total Elevadores</label>
                      <input
                        type="number"
                        name="qtd_total_elevadores"
                        value={form.qtd_total_elevadores}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Em Operação</label>
                      <input
                        type="number"
                        name="em_operacao"
                        value={form.em_operacao}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Em Manutenção</label>
                      <input
                        type="number"
                        name="em_manutencao"
                        value={form.em_manutencao}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">Empresa Responsável</label>
                      <input
                        type="text"
                        name="empresa_responsavel"
                        value={form.empresa_responsavel}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2 lg:col-span-4">
                      <label className="block text-sm font-medium text-slate-700">Status Manutenção</label>
                      <input
                        type="text"
                        name="status_manutencao"
                        value={form.status_manutencao}
                        onChange={handleInputChange}
                        className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold transition"
                >
                  <Pencil size={18} />
                  {editingId ? "Salvar Atualizações" : "Salvar Condomínio"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-6 py-2.5 rounded-lg font-semibold transition"
                >
                  <XCircle size={18} /> Cancelar
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-blue-950 flex items-center gap-2">
                <Building2 className="text-emerald-500" /> {selected.nome}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={28} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={MapPin}>Endereço</FieldLabel>
                <p className="mt-1 text-slate-700">{selected.endereco || "—"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={Building2}>CNPJ</FieldLabel>
                <p className="mt-1 text-slate-700">{selected.cnpj || "—"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={Users}>Qtd PNR</FieldLabel>
                <p className="mt-1 text-slate-700">{selected.qtd_pnr ?? "—"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={Users}>Qtd Civis</FieldLabel>
                <p className="mt-1 text-slate-700">{selected.qtd_civis ?? "—"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={DollarSign}>Despesa Estimada</FieldLabel>
                <p className="mt-1 text-slate-700">{formatCurrency(selected.despesa_estimada)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={DollarSign}>Taxa Unitária</FieldLabel>
                <p className="mt-1 text-slate-700">{formatCurrency(selected.taxa_unitaria)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={CreditCard}>Dados Bancários</FieldLabel>
                <p className="mt-1 text-slate-700">{selected.dados_bancarios || "—"}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <FieldLabel icon={DollarSign}>Saldo Fundo Reserva</FieldLabel>
                <p className="mt-1 text-slate-700">{formatCurrency(selected.saldo_fundo_reserva)}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2">
                <FieldLabel icon={Flame}>Projetos Incêndio</FieldLabel>
                {selected.projetos_incendio ? (
                  <a
                    href={selected.projetos_incendio}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium underline"
                  >
                    Acessar link <ExternalLink size={16} />
                  </a>
                ) : (
                  <p className="mt-1 text-slate-700">—</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 md:col-span-2">
                <h3 className="text-lg font-bold text-blue-950 mb-4 flex items-center gap-2">
                  <ArrowUpCircle className="text-emerald-500" /> Elevadores
                </h3>
                {selected.possui_elevadores ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-500">Qtd Total</span>
                      <p className="text-slate-700">{selected.qtd_total_elevadores ?? "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500">Em Operação</span>
                      <p className="text-slate-700">{selected.em_operacao ?? "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500">Em Manutenção</span>
                      <p className="text-slate-700">{selected.em_manutencao ?? "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-500">Empresa Responsável</span>
                      <p className="text-slate-700">{selected.empresa_responsavel || "—"}</p>
                    </div>
                    <div className="sm:col-span-2 md:col-span-3">
                      <span className="text-sm font-medium text-slate-500">Status Manutenção</span>
                      <p className="text-slate-700">{selected.status_manutencao || "—"}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600">Este condomínio não possui elevadores cadastrados.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  handleEdit(selected);
                  setSelected(null);
                }}
                className="flex items-center gap-2 bg-blue-950 hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg font-medium transition"
              >
                <Pencil size={18} /> Editar
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-medium transition"
              >
                <X size={18} /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
