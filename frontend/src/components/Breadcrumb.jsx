import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ items }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={13} />}
          {item.to ? (
            <Link to={item.to} className="hover:text-amber-700 transition-colors">{item.label}</Link>
          ) : (
            <span className="text-navy-700 font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}
