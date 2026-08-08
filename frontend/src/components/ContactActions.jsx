export default function ContactActions({ mobile, message }) {
  if (!mobile) return null;
  const clean = mobile.replace(/\D/g, '');
  const waLink = `https://wa.me/91${clean}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  return (
    <span className="inline-flex gap-2">
      <a href={waLink} target="_blank" rel="noreferrer"
        className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 hover:bg-green-200">WhatsApp</a>
      <a href={`tel:${clean}`}
        className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Call</a>
    </span>
  );
}
