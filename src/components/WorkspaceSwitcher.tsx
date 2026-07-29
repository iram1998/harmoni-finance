import { useFinance } from '../store';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export function WorkspaceSwitcher() {
  const { workspace, setWorkspace } = useFinance();
  const { language } = useThemeLanguage();

  return (
    <div className="flex items-center gap-1 bg-surface-container-low border border-outline-variant p-1 rounded-xl w-full sm:w-auto">
      {(['all', 'keluarga', 'pribadi'] as const).map((w) => {
        const isActive = workspace === w;
        const label = w === 'all' 
          ? (language === 'id' ? 'Semua Workspace' : 'All Workspaces') 
          : w === 'keluarga'
          ? (language === 'id' ? 'Keluarga' : 'Family')
          : (language === 'id' ? 'Pribadi' : 'Personal');
        return (
          <button
            key={w}
            type="button"
            onClick={() => setWorkspace(w)}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all text-center truncate ${
              isActive
                ? 'bg-primary text-on-primary shadow-2xs'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/50'
            }`}
            title={label}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

