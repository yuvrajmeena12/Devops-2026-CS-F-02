/**
 * Visual progress tracker for a swap, shown consistently everywhere a swap appears.
 * This is the single source of truth for "what state is this swap in and what's next" —
 * removes the guesswork the old badge-only UI had.
 *
 * currentStep: 'requested' | 'accepted' | 'scheduled' | 'confirmed' | 'completed' | 'reviewed'
 */
const STEPS = [
  { key: 'requested', label: 'Requested' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'reviewed', label: 'Reviewed' },
];

export default function SwapStepper({ currentStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="stepper">
      {STEPS.map((step, i) => {
        const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : '';
        return (
          <div key={step.key} className={`step ${state}`}>
            <div className="step-line" />
            <div className="step-dot">{i < currentIndex ? '✓' : i + 1}</div>
            <div className="step-label">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
}
