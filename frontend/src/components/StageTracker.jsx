import { Check } from 'lucide-react';

export const STAGES = [
  'File Prep', 'Docs Prep', 'Docs Collection', 'File Ready', 'File Login',
  'PF Clearance', 'RCU/FCU', 'Valuation Visit', 'Employment Verification', 'Credit PD',
  'Query Resolution', 'Offer Discussion', 'Sanction Letter', 'T&C Discussion',
  'Property Registration', 'Post-Sanction Docs', 'Agreement Vetting', 'Final PF Payment',
  'OCR Clearance', 'PDC Submission', 'Agreement Signing', 'Disbursement Query', 'Disbursed'
];
const PIVOT = STAGES.indexOf('PF Clearance');

function Path({ stages, offset, currentIndex, onSelect, sectionLabel }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-navy-700/50 mb-3">{sectionLabel}</div>
      <div className="flex items-start overflow-x-auto pb-2 -mx-1 px-1">
        {stages.map((s, localIdx) => {
          const i = localIdx + offset;
          const done = i < currentIndex;
          const active = i === currentIndex;
          const locked = offset > 0 && currentIndex < offset; // bank stages before File Login reached
          return (
            <div key={s} className="flex items-center shrink-0">
              {localIdx > 0 && (
                <div className={`h-0.5 w-6 sm:w-8 ${done || active ? 'bg-amber-500' : 'bg-gray-200'}`} />
              )}
              <button
                onClick={() => !locked && onSelect(s)}
                disabled={locked}
                title={locked ? 'Unlocks after File Login' : s}
                className="group flex flex-col items-center gap-1.5 px-1"
              >
                <span className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shrink-0 transition-all
                  ${active ? 'bg-amber-500 text-white ring-4 ring-amber-100 scale-110' :
                    done ? 'bg-navy-500 text-white' :
                    locked ? 'bg-gray-50 text-gray-300 border border-dashed border-gray-200' :
                    'bg-white text-navy-300 border-2 border-navy-100'}`}>
                  {done ? <Check size={13} /> : localIdx + 1}
                </span>
                <span className={`text-[10px] leading-tight text-center w-16 ${active ? 'text-navy-700 font-semibold' : locked ? 'text-gray-300' : 'text-gray-500'}`}>
                  {s}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StageTracker({ currentStage, onChange }) {
  const currentIndex = STAGES.indexOf(currentStage);
  const progress = Math.round(((currentIndex + 1) / STAGES.length) * 100);

  return (
    <div className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-navy-700">Loan Journey</span>
        <span className="text-xs text-gray-400">{progress}% through — Stage {currentIndex + 1} of {STAGES.length}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div className="h-full bg-amber-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
      </div>
      <div className="space-y-5">
        <Path stages={STAGES.slice(0, PIVOT)} offset={0} currentIndex={currentIndex} onSelect={onChange} sectionLabel="Sales-side (with you)" />
        <Path stages={STAGES.slice(PIVOT)} offset={PIVOT} currentIndex={currentIndex} onSelect={onChange} sectionLabel="Bank-side (after File Login)" />
      </div>
    </div>
  );
}
