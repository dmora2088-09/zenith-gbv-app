import { useState, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { useDiagnostico } from '@/context/DiagnosticoContext';
import ScrollToTop from '@/components/shared/ScrollToTop';
import {
  Home,
  Upload,
  FileText,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Activity,
  BarChart3,
  AlertTriangle,
  LayoutDashboard,
  Target,
  FolderOpen,
} from 'lucide-react';

/**
 * ============================================================
 * Zenith GBV — AppLayout con Sidebar + Contenido scrollable
 *
 * Estructura:
 *   Plataforma:
 *     - Inicio
 *     - Nuevo Analisis
 *     - Reportes
 *
 *   Resultados: (solo si hay diagnostico)
 *     - Dashboard
 *     - Diagnostico Detallado
 *     - Plan de Accion
 *
 * SCROLL: El contenedor real es el <div> con overflow-y-auto
 * en la línea ~268. Se le pasa un ref a ScrollToTop para que
 * haga scrollTo(0,0) en cada cambio de ruta.
 * ============================================================
 */

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  requiresDiagnostico?: boolean;
}

const PLATAFORMA_ITEMS: NavItem[] = [
  { path: '/', label: 'Inicio', icon: <Home size={18} /> },
  { path: '/ingesta', label: 'Nuevo Analisis', icon: <Upload size={18} /> },
  { path: '/reportes', label: 'Reportes', icon: <FileText size={18} />, requiresDiagnostico: true },
  { path: '/metodologia', label: 'Metodologia Zenith', icon: <BookOpen size={18} /> },
];

const RESULTADOS_ITEMS: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard Principal', icon: <LayoutDashboard size={15} /> },
  { path: '/resultados/diagnostico', label: 'Diagnostico Detallado', icon: <BarChart3 size={15} /> },
  { path: '/resultados/plan-accion', label: 'Plan de Accion', icon: <Target size={15} /> },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { resultados, motorReady, status } = useDiagnostico();

  /* Ref del contenedor que realmente hace scroll */
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasDiagnostico = !!resultados;

  /* ── Helpers de navegacion activa ────────────────────────── */
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname === path;
  };

  const isInResultados = location.pathname.startsWith('/dashboard');

  /* ── Titulo del header segun ruta ────────────────────────── */
  const headerTitle = () => {
    if (location.pathname === '/') return 'Inicio';
    if (location.pathname === '/ingesta') return 'Nuevo Analisis';
    if (location.pathname === '/reportes') return 'Reportes';
    if (location.pathname === '/dashboard') return 'Dashboard Principal';
    if (location.pathname === '/resultados/diagnostico') return 'Diagnostico Detallado';
    if (location.pathname === '/resultados/plan-accion') return 'Plan de Accion';
    if (location.pathname.startsWith('/dashboard') && resultados) return resultados.empresa;
    return 'Zenith GBV';
  };

  /* ── Spinner mientras el motor se descarga ───────────────── */
  if (status === 'cargando_motor' || !motorReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-pearl px-4">
        <div className="relative w-14 h-14 mb-5">
          <div className="absolute inset-0 rounded-2xl bg-navy-900 opacity-20 animate-pulse" />
          <div className="relative w-full h-full rounded-2xl bg-navy-900 flex items-center justify-center">
            <Activity size={26} className="text-steel-400" style={{ animation: 'spin 2s linear infinite' }} />
          </div>
        </div>
        <h2 className="text-lg font-bold text-navy-900 mb-1">Zenith GBV</h2>
        <p className="text-sm text-[#6b7a8d]">Cargando motor de calculo financiero...</p>
        <div className="mt-4 w-48 h-1 bg-[#e8ebf0] rounded-full overflow-hidden">
          <div className="h-full bg-steel-400 rounded-full" style={{ width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      </div>
    );
  }

  /* ── Error cargando motor ────────────────────────────────── */
  if (status === 'error' && !motorReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-pearl px-4">
        <div className="w-14 h-14 rounded-2xl bg-danger-light flex items-center justify-center mb-5">
          <AlertTriangle size={26} className="text-danger" />
        </div>
        <h2 className="text-lg font-bold text-navy-900 mb-2">Error cargando el motor</h2>
        <p className="text-sm text-[#6b7a8d] text-center max-w-md mb-6">
          No se pudo cargar el motor de calculo. Recarga la pagina para intentar de nuevo.
        </p>
        <button onClick={() => window.location.reload()} className="zn-btn-primary">
          Recargar pagina
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-pearl overflow-hidden">
      {/* SIDEBAR */}
      <aside
        className={`
          flex flex-col bg-navy-900 text-white
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[60px]' : 'w-[240px]'}
          flex-shrink-0
        `}
        style={{ boxShadow: '4px 0 24px -4px rgba(15,43,76,0.15)' }}
      >
        {/* Logo oro/blanco + texto — sin contenedor, sin filtros */}
        <div className="flex items-center h-16 px-4 border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/logo-sidebar-oro.png"
              alt="Zenith"
              className="h-9 w-auto object-contain flex-shrink-0"
              draggable={false}
            />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-[13px] font-bold tracking-tight leading-tight text-white">Zenith</span>
                <span className="text-[9px] font-medium text-navy-300 tracking-widest uppercase leading-tight">Consultoria Financiera</span>
              </div>
            )}
          </div>
        </div>

        {/* Navegacion */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto zn-scrollbar">

          {/* SECCION: Plataforma */}
          {!collapsed && (
            <div className="px-3 mb-3 text-[11px] font-semibold text-navy-300 uppercase tracking-widest">
              Plataforma
            </div>
          )}
          {collapsed && <div className="mb-2 border-t border-transparent" />}
          <div className="space-y-1">
            {PLATAFORMA_ITEMS.map((item) => {
              const active = isActive(item.path);
              const disabled = item.requiresDiagnostico && !hasDiagnostico;
              return (
                <button
                  key={item.path}
                  onClick={() => !disabled && navigate(item.path)}
                  disabled={disabled}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                    transition-all duration-150 group relative
                    ${active ? 'bg-white/10 text-white font-medium' : 'text-navy-200 hover:bg-white/5 hover:text-white'}
                    ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className={active ? 'text-steel-400' : 'text-navy-300 group-hover:text-white'}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && !collapsed && <span className="ml-auto w-1 h-4 rounded-full bg-steel-400 flex-shrink-0" />}
                  {disabled && !collapsed && <span className="ml-auto text-[10px] text-navy-400">Requiere</span>}
                </button>
              );
            })}
          </div>

          {/* SECCION: Resultados (solo con diagnostico) */}
          {hasDiagnostico && (
            <>
              {!collapsed && (
                <div className="px-3 mt-10 mb-3 text-[11px] font-semibold text-navy-300 uppercase tracking-widest flex items-center gap-1.5">
                  <FolderOpen size={10} />
                  Resultados
                </div>
              )}
              {collapsed && <div className="mt-8 mb-2 border-t border-white/10 mx-3" />}
              <div className="space-y-1">
                {RESULTADOS_ITEMS.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs
                        transition-all duration-150
                        ${active ? 'bg-steel-400/20 text-white font-medium' : 'text-navy-300 hover:bg-white/5 hover:text-white'}
                      `}
                    >
                      <span className={active ? 'text-steel-400' : 'text-navy-400'}>{item.icon}</span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {active && !collapsed && <span className="ml-auto w-1 h-3 rounded-full bg-steel-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </nav>

        {/* Footer del sidebar */}
        <div className="px-2 py-3 border-t border-white/10">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center px-3 py-2 rounded-md
                       text-navy-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <>
              <ChevronLeft size={16} className="mr-2" />
              <span className="text-xs">Ocultar</span>
            </>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-[#e8ebf0] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-navy-900">{headerTitle()}</h1>
            {resultados && isInResultados && (
              <span className={`
                px-2 py-0.5 rounded-full text-[10px] font-semibold
                ${resultados.crea_valor ? 'bg-success-light text-success' : 'bg-danger-light text-danger'}
              `}>
                {resultados.veredicto}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {resultados && isInResultados && (
              <div className="flex items-center gap-2 text-xs text-[#6b7a8d]">
                <span className="font-mono">Score:</span>
                <span className={`font-bold ${resultados.score_global >= 75 ? 'text-success' : resultados.score_global >= 50 ? 'text-warning' : 'text-danger'}`}>
                  {resultados.score_global}/100
                </span>
              </div>
            )}
            {/* Auth placeholders */}
            <button className="text-xs text-navy-600 hover:text-navy-900 font-medium px-3 py-1.5 rounded-md hover:bg-navy-50 transition-colors">
              Iniciar Sesion
            </button>
            <button className="text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 px-3 py-1.5 rounded-md transition-colors">
              Registrarse
            </button>
          </div>
        </header>

        {/* Content area — CONTENEDOR DEL SCROLL */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto zn-scrollbar p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ScrollToTop: escucha cambios de ruta y scrollea el contenedor */}
      <ScrollToTop containerRef={scrollRef} />
    </div>
  );
}
