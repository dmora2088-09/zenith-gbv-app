/**
 * ================================================================
 * Logo Zenith GBV — Imagen oficial
 *
 * Renderiza la Z cromada directamente, sin contenedor ni fondo.
 * Los filtros CSS adaptan el color según el contexto:
 *
 *   dark = true   → Sidebar azul oscuro: logo plateado brillante
 *   dark = false  → Fondos claros: logo en tonos azulados
 *
 * Uso:
 *   <LogoZenith size={56} dark />     ← Sidebar (sobre azul)
 *   <LogoZenith size={40} />           ← Inicio (sobre blanco, tono azul)
 * ================================================================
 */

interface LogoZenithProps {
  /** Tamaño en píxeles (ancho y alto) */
  size?: number;
  /** true para fondos oscuros (sidebar), false para fondos claros (inicio) */
  dark?: boolean;
  className?: string;
}

export default function LogoZenith({ size = 40, dark = false, className = '' }: LogoZenithProps) {
  return (
    <img
      src="/logo-zenith.png"
      alt="Zenith"
      className={`object-contain flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        filter: dark
          ? 'brightness(1.2) saturate(0)'
          : 'brightness(0.75) hue-rotate(5deg) saturate(1.3)',
        mixBlendMode: dark ? 'lighten' : 'multiply',
      }}
      draggable={false}
    />
  );
}
