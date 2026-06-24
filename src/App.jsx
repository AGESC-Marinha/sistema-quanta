import React, { useState } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Wrench,
  Bell,
  Calendar,
  TrendingUp,
  Home,
  Menu,
  X,
  AlertTriangle,
  Clock,
  MoreVertical,
  MapPin
} from 'lucide-react';

const condominium = {
  name: 'Vila Naval Visconde de Inhaúma',
  address: 'Rua Almirante Tamandaré, 123 - Rio de Janeiro/RJ',
  totalUnits: 96,
  occupiedUnits: 88,
  residents: 214,
  employees: 14,
  monthlyRevenue: 48200,
  delinquencyRate: 6.4,
  cashBalance: 127450,
  pendingMaintenance: 5
};

const notices = [
  { id: 1, title: 'Assembleia Geral Ordinária', date: '15/06/2025', urgent: true, content: 'Convocamos todos os condôminos para a AGO no salão de festas às 19h.' },
  { id: 2, title: 'Manutenção dos elevadores', date: '18/06/2025', urgent: false, content: 'Parada programada dos elevadores das torres A e B entre 9h e 12h.' },
  { id: 3, title: 'Nova regra para área de lazer', date: '20/06/2025', urgent: false, content: 'Reservas de churrasqueira devem ser feitas com 7 dias de antecedência.' }
];

const reservations = [
  { id: 1, area: 'Salão de Festas', resident: 'Carlos Mendes', date: '21/06/2025', status: 'Aprovada' },
  { id: 2, area: 'Churrasqueira 01', resident: 'Fernanda Lima', date: '22/06/2025', status: 'Pendente' },
  { id: 3, area: 'Quadra Poliesportiva', resident: 'Roberto Silva', date: '25/06/2025', status: 'Aprovada' }
];

const maintenance = [
  { id: 1, title: 'Troca de lâmpadas do hall', priority: 'Baixa', status: 'Em andamento' },
  { id: 2, title: 'Reparo em vazamento torre C', priority: 'Alta', status: 'Pendente' },
  { id: 3, title: 'Pintura da grade do playground', priority: 'Média', status: 'Concluído' },
  { id: 4, title: "Limpeza das caixas d'água", priority: 'Alta', status: 'Agendado' }
];

const transactions = [
  { id: 1, description: 'Taxa condominial - Maio/2025', amount: 48200, type: 'Receita', status: 'Recebido' },
  { id: 2, description: 'Manutenção elevadores', amount: -3500, type: 'Despesa', status: 'Pago' },
  { id: 3, description: 'Conta de água', amount: -4200, type: 'Despesa', status: 'Pago' },
  { id: 4, description: 'Taxa condominial - Junho/2025', amount: 12400, type: 'Receita', status: 'Pendente' }
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const Card = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
};

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <button className="text-slate-400 hover:text-slate-600">
        <MoreVertical className="w-5 h-5" />
      </button>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Aprovada: 'bg-emerald-100 text-emerald-700',
    Recebido: 'bg-emerald-100 text-emerald-700',
    Concluído: 'bg-emerald-100 text-emerald-700',
    Pendente: 'bg-amber-100 text-amber-700',
    Pago: 'bg-blue-100 text-blue-700',
    'Em andamento': 'bg-blue-100 text-blue-700',
    Agendado: 'bg-purple-100 text-purple-700'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    Baixa: 'bg-slate-100 text-slate-700',
    Média: 'bg-amber-100 text-amber-700',
    Alta: 'bg-rose-100 text-rose-700'
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[priority] || 'bg-slate-100 text-slate-700'}`}>
      {priority}
    </span>
  );
};

const App = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { label: 'Dashboard', icon: Home },
    { label: 'Unidades', icon: Building2 },
    { label: 'Moradores', icon: Users },
    { label: 'Financeiro', icon: DollarSign },
    { label: 'Manutenção', icon: Wrench },
    { label: 'Reservas', icon: Calendar },
    { label: 'Comunicados', icon: Bell }
  ];

  const occupancyPercentage = Math.round((condominium.occupiedUnits / condominium.totalUnits) * 100);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{condominium.name}</h1>
              <p className="text-xs text-slate-500 hidden sm:block">Gestão de Condomínios</p>
            </div>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <nav className="hidden sm:flex items-center gap-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        {isMenuOpen && (
          <nav className="sm:hidden border-t border-slate-100 px-4 py-3 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <MapPin className="w-4 h-4" />
            {condominium.address}
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="text-slate-500">Resumo geral do condomínio</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card icon={Building2} label="Unidades Totais" value={condominium.totalUnits} color="blue" />
          <Card icon={Users} label="Moradores" value={condominium.residents} color="emerald" />
          <Card icon={DollarSign} label="Receita Mensal" value={formatCurrency(condominium.monthlyRevenue)} color="amber" />
          <Card icon={AlertTriangle} label="Inadimplência" value={`${condominium.delinquencyRate}%`} color="rose" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Taxa de Ocupação</h3>
              <Home className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{occupancyPercentage}%</div>
            <p className="text-sm text-slate-500">{condominium.occupiedUnits} de {condominium.totalUnits} unidades ocupadas</p>
            <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${occupancyPercentage}%` }} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Saldo em Caixa</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{formatCurrency(condominium.cashBalance)}</div>
            <p className="text-sm text-slate-500">Balanço atual do condomínio</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span>+3,2% em relação ao mês anterior</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Manutenção</h3>
              <Wrench className="w-5 h-5 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">{condominium.pendingMaintenance}</div>
            <p className="text-sm text-slate-500">Ordens de serviço pendentes</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600">
              <Clock className="w-4 h-4" />
              <span>2 chamados com alta prioridade</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Section title="Avisos e Comunicados" icon={Bell}>
            <div className="space-y-4">
              {notices.map((notice) => (
                <div key={notice.id} className="flex gap-4 p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 ${notice.urgent ? 'text-rose-500' : 'text-blue-500'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-900">{notice.title}</h4>
                      <span className="text-xs text-slate-500">{notice.date}</span>
                    </div>
                    <p className="text-sm text-slate-600">{notice.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Reservas" icon={Calendar}>
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">{reservation.area}</p>
                    <p className="text-sm text-slate-500">{reservation.resident} • {reservation.date}</p>
                  </div>
                  <StatusBadge status={reservation.status} />
                </div>
              ))}
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Manutenção" icon={Wrench}>
            <div className="space-y-3">
              {maintenance.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.status}</p>
                  </div>
                  <PriorityBadge priority={item.priority} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Movimentação Financeira" icon={DollarSign}>
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-medium text-slate-900">{transaction.description}</p>
                    <p className="text-sm text-slate-500">{transaction.type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </p>
                    <StatusBadge status={transaction.status} />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
};

export default App;
