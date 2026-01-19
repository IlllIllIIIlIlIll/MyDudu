import { ChevronRight } from 'lucide-react';

interface EduCardProps {
  title: string;
  description: string;
  image: string;
  category: string;
  onClick?: () => void;
}

export function EduCard({ title, description, image, category, onClick }: EduCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative h-40 bg-gradient-to-br from-green-100 to-emerald-50">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700">
            {category}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="mb-2 line-clamp-2">{title}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3">{description}</p>
        <button className="flex items-center gap-1 text-sm font-medium text-gradient">
          Baca Selengkapnya
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
