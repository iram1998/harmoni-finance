import { useFinance } from '../store';

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useFinance();

  return (
    <div className="flex bg-surface-container-low rounded-lg p-1 w-full max-w-[240px] md:max-w-[300px] border border-outline-variant shadow-sm md:shadow-none">
      {(['pribadi', 'keluarga'] as const).map((w) => {
        const isActive = workspace === w;
        return (
          <button
            key={w}
            onClick={() => setWorkspace(w)}
            className={`relative flex-1 py-2 font-label-md md:font-label-caps text-center rounded-md transition-colors z-10 ${
              isActive ? 'text-on-primary bg-primary shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {w.charAt(0).toUpperCase() + w.slice(1)}
          </button>
        );
      })}
    </div>
  );
}
