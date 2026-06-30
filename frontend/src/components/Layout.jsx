import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Laptop, Users, ClipboardList,
  AlertTriangle, Package, ScanLine, Menu, X, QrCode, LogOut, User,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '#lib/utils.js';

const navSections = [
  {
    label: 'Principal',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/equipos', icon: Laptop, label: 'Equipos' },
      { to: '/trabajadores', icon: Users, label: 'Trabajadores' },
      { to: '/asignaciones', icon: ClipboardList, label: 'Asignaciones' },
      { to: '/componentes', icon: Package, label: 'Componentes' },
      { to: '/incidencias', icon: AlertTriangle, label: 'Incidencias' },
    ],
  },
  {
    label: 'Herramientas',
    items: [
      { to: '/scan', icon: ScanLine, label: 'Escanear QR' },
    ],
  },
];

function NavItem({ item, active, onClick }) {
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
        active
          ? 'bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-5 before:rounded-r-full before:bg-primary'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col',
        'transform transition-transform duration-200 ease-in-out',
        'lg:translate-x-0 lg:static lg:inset-auto',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border shrink-0">
          <div className="p-1.5 rounded-lg bg-primary">
            <QrCode className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-base text-foreground">InventarioGP</span>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Sistema de Gestión</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavItem
                    key={item.to}
                    item={item}
                    active={isActive(item.to)}
                    onClick={() => setSidebarOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-border shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
            <div className="p-1.5 rounded-full bg-primary/10 text-primary">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{usuario?.nombre || 'Invitado'}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{usuario?.rol || '—'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:bg-accent"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">InventarioGP</span>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-foreground font-medium">
              {navSections.flatMap(s => s.items).find(i => isActive(i.to))?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 text-sm">
              <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
                <span>{usuario?.nombre || 'Invitado'}</span>
                <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                  {usuario?.rol || '—'}
                </span>
              </div>
            </div>
            {usuario && (
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
