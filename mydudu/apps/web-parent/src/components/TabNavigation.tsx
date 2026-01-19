import { Home, TrendingUp } from 'lucide-react';

interface TabNavigationProps {
  activeTab: 'home' | 'history';
  onTabChange: (tab: 'home' | 'history') => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'home' as const, icon: Home, label: 'Beranda' },
    { id: 'history' as const, icon: TrendingUp, label: 'Riwayat' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="max-w-md mx-auto">
        <div className="flex justify-around items-center px-2 py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex flex-col items-center justify-center gap-1 px-6 py-3 rounded-xl
                  transition-all duration-200 min-w-[120px]
                  ${isActive 
                    ? 'gradient-primary text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-semibold whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
