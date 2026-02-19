import { LucideIcon } from 'lucide-react';
import styles from './DashboardCards.module.css';

interface OverviewCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export function OverviewCard({ title, value, icon: Icon, color, subtitle }: OverviewCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-[15px] mb-2">{title}</p>
          <h2
            className={`text-[36px] font-extrabold ${styles.overviewValue}`}
            style={{ '--card-color': color } as React.CSSProperties}
          >
            {value}
          </h2>
          {subtitle && <p className="text-gray-500 text-[13px] mt-1">{subtitle}</p>}
        </div>
        <div
          className={`w-14 h-14 rounded-xl flex items-center justify-center ${styles.iconWrapper}`}
          style={{ '--icon-bg-color': `${color}15` } as React.CSSProperties}
        >
          <Icon
            className={`w-7 h-7 ${styles.icon}`}
            style={{ '--icon-color': color } as React.CSSProperties}
          />
        </div>
      </div>
    </div>
  );
}
