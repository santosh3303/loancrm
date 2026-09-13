import { formatRupeeDisplay } from '../utils/currency';

// Drop-in replacement for `<input type="number" className="input" .../>` on any
// Rupee amount field. Displays "₹ 15,00,000" live as the person types, while the
// value passed to onChange is always a plain digit string (parse with
// parseRupeeValue / Number() at submit time, same as before).
export default function RupeeInput({ value, onChange, className = 'input', placeholder = '₹ 0' }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/[^\d]/g, '');
    onChange(digits);
  };
  return (
    <input
      className={className}
      value={formatRupeeDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      inputMode="numeric"
    />
  );
}
