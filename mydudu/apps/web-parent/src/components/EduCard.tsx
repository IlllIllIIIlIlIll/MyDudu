import { ChevronRight } from 'lucide-react';

interface EduCardProps {
  title: string;
  description: string;
  image: string;
  category: string;
  onClick?: () => void;
}

const IMAGE_MAP: Record<string, string> = {
  'stunting_care': 'https://images.unsplash.com/photo-1588710929895-6ee7a0a4d155?crop=entropy&fit=max&fm=jpg&q=80&w=1080',
  'healthy_food': 'https://images.unsplash.com/photo-1651718243509-742f5bd5836c?crop=entropy&fit=max&fm=jpg&q=80&w=1080',
  'posyandu_visit': 'https://images.unsplash.com/photo-1758691462164-100b5e356169?crop=entropy&fit=max&fm=jpg&q=80&w=1080',
  'healthy_child_growth': 'https://images.unsplash.com/photo-1580447029514-6352934f8202?crop=entropy&fit=max&fm=jpg&q=80&w=1080'
};

export function EduCard({ title, description, image, category, onClick }: EduCardProps) {
  // If image is a full HTTP URL, use it directly, otherwise map keyword, fallback to a default.
  const imageUrl = image?.startsWith('http') ? image : (IMAGE_MAP[image] || 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?crop=entropy&fit=max&fm=jpg&q=80&w=1080');

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      <div className="relative h-40 bg-gradient-to-br from-green-100 to-emerald-50">
        <img
          src={imageUrl}
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
        <button className="flex items-center gap-1 text-sm font-medium text-[#129c8d]">
          Baca Selengkapnya
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
