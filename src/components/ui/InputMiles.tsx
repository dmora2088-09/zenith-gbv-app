import { useState, useEffect } from 'react';
import { mascaraMiles, desformatearMiles } from '@/lib/formato';

/**
 * ================================================================
 * InputMiles — Input numérico con comas separadoras de miles
 *
 * Muestra "2,000,000" visualmente pero guarda el número limpio (2000000)
 * en el estado interno. Solo permite dígitos.
 *
 * Uso:
 *   <InputMiles value={ventas} onChange={setVentas} placeholder="0" />
 * ================================================================ */

interface InputMilesProps {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  min?: number;
  step?: number;
}

export default function InputMiles({
  value,
  onChange,
  placeholder = '0',
  className = '',
  disabled = false,
  min,
}: InputMilesProps) {
  const [display, setDisplay] = useState('');

  /* Sincronizar display cuando value cambia externamente */
  useEffect(() => {
    if (value === 0 && display === '') return; // no pisar input vacío
    if (value === desformatearMiles(display)) return; // ya está sincronizado
    setDisplay(value ? value.toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '');
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Solo permitir dígitos y comas
    const filtrado = raw.replace(/[^\d,]/g, '');
    const formateado = mascaraMiles(filtrado);
    setDisplay(formateado);
    onChange(desformatearMiles(formateado));
  };

  const handleBlur = () => {
    // Re-formatear al salir para asegurar consistencia
    const n = desformatearMiles(display);
    if (min !== undefined && n < min) {
      onChange(min);
      setDisplay(min.toLocaleString('es-MX', { maximumFractionDigits: 0 }));
    } else {
      setDisplay(n ? n.toLocaleString('es-MX', { maximumFractionDigits: 0 }) : '');
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={`zn-input font-mono tabular-nums ${className}`}
    />
  );
}
