import { ChevronDown } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  age: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedChildId: string;
  onSelect: (childId: string) => void;
}

export function ChildSelector({ children, selectedChildId, onSelect }: ChildSelectorProps) {
  const selectedChild = children.find(c => c.id === selectedChildId);

  return (
    <div className="relative">
      <select
        value={selectedChildId}
        onChange={(e) => onSelect(e.target.value)}
        className="appearance-none bg-white/20 backdrop-blur-sm text-white font-semibold pl-4 pr-10 py-3 rounded-xl border-2 border-white/30 focus:outline-none focus:border-white/50 cursor-pointer min-w-[200px]"
      >
        {children.map((child) => (
          <option key={child.id} value={child.id} className="text-gray-900">
            {child.name} ({child.age})
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none" />
    </div>
  );
}
