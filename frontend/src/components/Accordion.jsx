// Shared single-open accordion. Exactly one section is open at a time — opening a
// section closes any other section in the same group. There is no "all collapsed"
// state; the parent's openSection state always names exactly one section key.
//
// sections: [{ key, title, content }]
export default function Accordion({ sections, openSection, onOpenSection }) {
  return (
    <div className="mb-1">
      {sections.map(s => {
        const isOpen = openSection === s.key;
        return (
          <div key={s.key} className="border border-gray-200 rounded-xl mb-2.5 overflow-hidden">
            <button
              type="button"
              onClick={() => onOpenSection(s.key)}
              className="w-full flex justify-between items-center px-3.5 py-2.5 bg-gray-50 text-left"
            >
              <span className="text-[12.5px] font-bold text-navy-900">{s.title}</span>
              <span className={`text-gray-400 text-[11px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[999px] px-3.5 py-3' : 'max-h-0 px-3.5 py-0'}`}>
              {s.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
