"use client";

import Link from "next/link";
import { useRole } from "@/components/RoleProvider";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import useSearchSuggest from "@/lib/useSearchSuggest";
import SearchDropdown from "@/components/SearchDropdown";
import * as searchHistory from "@/lib/searchHistory";
import { getBodegaId } from "@/lib/storage";
import Modal from "@/components/Modal";
import { useCart } from "@/app/providers";
// Importaciones para autenticación
import { useSession, signOut } from "next-auth/react";

export default function TopNav() {
  const { role, setRole } = useRole();
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const { productos, bodegas, categorias, didYouMean } = useSearchSuggest(q);
  const [bodegaId, setBodegaId] = useState<string | null>(null);
  const { count: cartCount } = useCart();
  const [showTour, setShowTour] = useState(false);
  const [showStepTips, setShowStepTips] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  
  // Estado de autenticación
  const { data: session, status } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    setBodegaId(getBodegaId());
  }, [role]);

  useEffect(() => {
    if (role !== "tendero") {
      setShowTour(false);
      setShowStepTips(false);
      return;
    }
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem("tendero_tour_dismissed");
    setShowTour(!dismissed);
    const tipsDismissed = window.localStorage.getItem("tendero_steps_tips_dismissed");
    setShowStepTips(!tipsDismissed);
  }, [role]);


  const placeholder = useMemo(() => {
    if (role === "bodega") return "Buscar pedidos, clientes o zonas...";
    if (role === "repartidor") return "Buscar entregas o direcciones...";
    return "Buscar productos, bodegas...";
  }, [role]);

  const roleLabel = useMemo(() => {
    const map: Record<string, string> = {
      tendero: "Tendero",
      bodega: "Bodega",
      repartidor: "Repartidor",
      admin: "Admin",
    };
    return map[role] ?? "Usuario";
  }, [role]);

  const locationLabel = useMemo(() => {
    const path = pathname || "";
    if (role === "bodega") {
      if (path.includes("/productos")) return "Productos";
      if (path.includes("/pedidos")) return "Pedidos";
      if (path.includes("/inventario")) return "Inventario";
      if (path.includes("/cupones")) return "Cupones";
      if (path.includes("/panel")) return "Panel";
      return "Bodega";
    }
    if (role === "repartidor") {
      if (path.includes("/ganancias")) return "Ganancias";
      if (path.includes("/entregas/")) return "Detalle entrega";
      if (path.includes("/entregas")) return "Entregas";
      return "Repartidor";
    }
    if (role === "tendero") {
      if (path.includes("/checkout")) return "Checkout";
      if (path.includes("/pedido")) return "Pedido";
      if (path.includes("/bodegas")) return "Bodegas";
      if (path.includes("/buscar")) return "Buscar";
      return "Inicio";
    }
    if (role === "admin") {
      return "Admin";
    }
    return "";
  }, [pathname, role]);

  const tenderoSteps = useMemo(
    () => [
      {
        key: "bodegas",
        label: "Bodegas",
        match: (path: string) =>
          path.startsWith("/tendero") || path.startsWith("/bodegas") || path.startsWith("/buscar"),
      },
      {
        key: "carrito",
        label: "Carrito",
        match: (path: string) => path.includes("/checkout") || path.includes("/carrito"),
      },
      {
        key: "confirmar",
        label: "Confirmar",
        match: (path: string) => path.includes("/pedido/confirmar"),
      },
      {
        key: "seguimiento",
        label: "Seguimiento",
        match: (path: string) => path.startsWith("/tendero/seguimiento") || path.startsWith("/pedidos"),
      },
    ],
    [],
  );

  const tenderoStepIndex = useMemo(() => {
    const path = pathname || "";
    const idx = tenderoSteps.findIndex((step) => step.match(path));
    return idx === -1 ? 0 : idx;
  }, [pathname, tenderoSteps]);

  const baseBodegaPath = bodegaId ? `/bodega/${bodegaId}` : "/bodega/BOD_002";
  const cartHref = "/tendero/checkout";

  const quickLinks = useMemo(() => {
    if (role === "tendero") {
      return [
        { href: "/tendero", label: "Inicio" },
        { href: cartHref, label: "Carrito" },
        { href: "/pedidos", label: "Mis pedidos" },
      ];
    }
    if (role === "bodega") {
      return [
        { href: `${baseBodegaPath}/panel`, label: "Panel" },
        { href: `${baseBodegaPath}/productos`, label: "Productos" },
        { href: `${baseBodegaPath}/pedidos`, label: "Pedidos" },
      ];
    }
    if (role === "repartidor") {
      return [
        { href: "/repartidor", label: "Home" },
        { href: "/repartidor/entregas", label: "Entregas" },
        { href: "/repartidor/ganancias", label: "Ganancias" },
      ];
    }
    return [];
  }, [role, baseBodegaPath, cartHref]);

  const uniqueQuickLinks = useMemo(
    () => quickLinks.filter((it, i, arr) => arr.findIndex((x) => x.href === it.href) === i),
    [quickLinks],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term.length > 0) {
      searchHistory.addQuery(role, term);
      router.push(`/buscar?q=${encodeURIComponent(term)}`);
      setQ("");
      setOpen(false);
    }
  };

  return (
    // Contenedor principal con mejor contraste y sombra para móvil
    <div className="w-full border-b border-slate-200 bg-white sticky top-0 z-40 shadow-sm">
      {/* Navegación principal - responsive con mejor espaciado */}
      <nav className="mx-auto flex max-w-7xl flex-col gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3">
        {/* Fila superior: Logo y acciones principales */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          {/* Logo y badge de modo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/inicio" className="font-bold text-base sm:text-lg text-slate-900">
              🏪 APP Bodegas
            </Link>
            {/* Badge de modo - visible en tablet/desktop */}
            <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              Modo: {roleLabel}
              {locationLabel ? <span className="text-slate-600">•</span> : null}
              {locationLabel ? `En: ${locationLabel}` : null}
            </span>
          </div>

          {/* Acciones de navegación - adaptadas para móvil */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Selector de rol - más grande en móvil para mejor touch */}
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="rounded-full border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-1 text-sm sm:text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[36px] sm:min-h-0"
              aria-label="Cambiar modo"
            >
              <option value="tendero">Tendero</option>
              <option value="bodega">Bodega</option>
              <option value="repartidor">Repartidor</option>
              <option value="admin">Admin</option>
            </select>
            {/* Links rápidos - responsive */}
            {uniqueQuickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-1 text-sm sm:text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[36px] sm:min-h-0 flex items-center"
              >
                {link.label}
                {role === "tendero" && link.label === "Carrito" && cartCount > 0 ? (
                  <span className="ml-1.5 sm:ml-2 inline-flex items-center justify-center rounded-full bg-slate-900 px-1.5 sm:px-2 py-0.5 text-[11px] sm:text-[10px] font-bold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            ))}
            {/* Botón de ayuda - más visible */}
            <Link
              href="/inicio"
              className="rounded-full bg-slate-900 px-2.5 sm:px-3 py-1.5 sm:py-1 text-sm sm:text-xs font-semibold text-white hover:bg-slate-800 min-h-[36px] sm:min-h-0 flex items-center"
            >
              Ayuda
            </Link>
            {/* Botón "Cómo funciona" - solo tendero, oculto en móvil muy pequeño */}
            {role === "tendero" ? (
              <button
                type="button"
                onClick={() => setHelpOpen(true)}
                className="hidden xs:flex rounded-full border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-1 text-sm sm:text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[36px] sm:min-h-0 items-center"
              >
                ¿Cómo funciona?
              </button>
            ) : null}
            
            {/* ====== Menú de Usuario / Login ====== */}
            {status === "loading" ? (
              // Loading state
              <div className="animate-pulse rounded-full bg-slate-200 w-8 h-8"></div>
            ) : session?.user ? (
              // Usuario autenticado - mostrar menú
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 px-2.5 sm:px-3 py-1.5 sm:py-1 text-sm sm:text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[36px] sm:min-h-0"
                >
                  {/* Icono según rol */}
                  <span>
                    {session.user.rol === 'ADMIN' && '👑'}
                    {session.user.rol === 'BODEGUERO' && '📦'}
                    {session.user.rol === 'CLIENTE' && '👤'}
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate">
                    {session.user.nombre}
                  </span>
                  <span className="text-[10px]">▼</span>
                </button>
                
                {/* Dropdown del menú de usuario */}
                {userMenuOpen && (
                  <>
                    {/* Overlay para cerrar */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    {/* Menú desplegable */}
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                      <div className="p-3 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 truncate">
                          {session.user.nombre}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {session.user.email}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                          ${session.user.rol === 'ADMIN' ? 'bg-purple-100 text-purple-700' : ''}
                          ${session.user.rol === 'BODEGUERO' ? 'bg-blue-100 text-blue-700' : ''}
                          ${session.user.rol === 'CLIENTE' ? 'bg-green-100 text-green-700' : ''}
                        `}>
                          {session.user.rol}
                        </span>
                      </div>
                      <div className="p-1">
                        {/* Enlaces según rol */}
                        {session.user.rol === 'ADMIN' && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
                          >
                            👑 Panel Admin
                          </Link>
                        )}
                        {(session.user.rol === 'ADMIN' || session.user.rol === 'BODEGUERO') && session.user.bodegaId && (
                          <Link
                            href={`/bodega/${session.user.bodegaId}`}
                            onClick={() => setUserMenuOpen(false)}
                            className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
                          >
                            📦 Mi Bodega
                          </Link>
                        )}
                        <Link
                          href="/pedidos"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded"
                        >
                          📋 Mis Pedidos
                        </Link>
                        <hr className="my-1 border-slate-100" />
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            signOut({ callbackUrl: '/login' });
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                        >
                          🚪 Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              // No autenticado - mostrar botón de login
              <Link
                href="/login"
                className="rounded-full border-2 border-cyan-500 bg-cyan-500 text-white px-3 sm:px-4 py-1.5 sm:py-1 text-sm sm:text-xs font-semibold hover:bg-cyan-600 hover:border-cyan-600 min-h-[36px] sm:min-h-0 flex items-center transition-colors"
              >
                Iniciar Sesión
              </Link>
            )}
          </div>
        </div>

        <div className="relative">
          <form onSubmit={onSubmit} className="flex items-center gap-2 w-full">
            <input
              ref={inputRef}
              aria-label={placeholder}
              placeholder={`🔍 ${placeholder}`}
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-300"
            />
          </form>

          <SearchDropdown
            open={open}
            q={q}
            productos={productos}
            bodegas={bodegas}
            categorias={categorias}
            didYouMean={didYouMean}
            history={searchHistory.getHistory(role)}
            trends={searchHistory.getHistory(role).trends}
            onClearHistory={() => {
              searchHistory.clearHistory(role);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
            onSelect={(s: any) => {
              setOpen(false);
              if (s.type === "producto") {
                searchHistory.addClick(role, "producto", s.id, s.label);
                if (s.meta?.bodegaId) {
                  router.push(`/bodegas/${s.meta.bodegaId}?highlight=${encodeURIComponent(s.id)}`);
                } else {
                  router.push(`/buscar?q=${encodeURIComponent(s.label)}`);
                }
              } else if (s.type === "bodega") {
                searchHistory.addClick(role, "bodega", s.id, s.label);
                router.push(`/bodegas/${s.id}`);
              } else if (s.type === "categoria") {
                searchHistory.addQuery(role, s.label);
                searchHistory.addCategoryUse(role, s.label);
                router.push(`/buscar?q=&category=${encodeURIComponent(s.label)}`);
              }
              setQ("");
            }}
          />
        </div>

        {/* Pasos del tendero - mejorado para móvil */}
        {role === "tendero" ? (
          <div className="flex flex-col gap-2 sm:gap-3">
            {/* Barra de pasos - responsive y con mejor contraste */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700">
              <span className="text-slate-600 mr-1">Pasos:</span>
              {tenderoSteps.map((step, index) => {
                const isActive = index === tenderoStepIndex;
                const isDone = index < tenderoStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-1 sm:gap-2">
                    <span
                      className={`rounded-full px-2 sm:px-3 py-0.5 sm:py-1 text-xs sm:text-sm ${isActive
                        ? "bg-slate-900 text-white font-bold"
                        : isDone
                          ? "bg-emerald-100 text-emerald-800 font-semibold"
                          : "bg-white text-slate-600 border border-slate-200"
                        }`}
                    >
                      {step.label}
                    </span>
                    {index < tenderoSteps.length - 1 ? (
                      <span className="text-slate-500 font-bold">→</span>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {showTour ? (
              <div className="flex flex-col gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800">Mini guía rápida</span>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.localStorage.setItem("tendero_tour_dismissed", "1");
                      } catch {
                        // noop
                      }
                      setShowTour(false);
                    }}
                    className="rounded-full border border-sky-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Entendido
                  </button>
                </div>
                <ul className="list-disc pl-4">
                  <li>Explora bodegas y agrega productos.</li>
                  <li>Revisa el carrito y confirma el pedido.</li>
                  <li>Sigue el estado en “Mis pedidos”.</li>
                </ul>
              </div>
            ) : null}

            {showStepTips ? (
              <div className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">Tips rápidos por paso</span>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.localStorage.setItem("tendero_steps_tips_dismissed", "1");
                      } catch {
                        // noop
                      }
                      setShowStepTips(false);
                    }}
                    className="rounded-full border border-amber-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    Entendido
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2 py-1">Comprar: filtra por bodega.</span>
                  <span className="rounded-full bg-white px-2 py-1">Carrito: valida cantidades.</span>
                  <span className="rounded-full bg-white px-2 py-1">Checkout: confirma pago.</span>
                  <span className="rounded-full bg-white px-2 py-1">Seguimiento: revisa estado.</span>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>

      <Modal
        isOpen={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="¿Cómo funciona?"
        cancelText="Cerrar"
      >
        <div className="space-y-3 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Flujo rápido en 4 pasos</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Comprar: entra a una bodega y agrega productos.</li>
            <li>Carrito: revisa cantidades y subtotal.</li>
            <li>Checkout: confirma pago y dirección.</li>
            <li>Seguimiento: mira el estado del pedido.</li>
          </ol>
          <p className="text-xs text-slate-500">
            Consejo: usa el buscador para encontrar productos más rápido.
          </p>
        </div>
      </Modal>
    </div>
  );
}
