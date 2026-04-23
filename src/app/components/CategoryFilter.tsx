interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export function CategoryFilter({ categories, selectedCategory, onSelectCategory }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-6 sm:mb-10 sm:flex-wrap sm:justify-center sm:overflow-visible sm:pb-0">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category)}
          className={`flex-shrink-0 px-4 py-1.5 sm:px-6 sm:py-2 rounded-full text-sm transition-all ${
            selectedCategory === category
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
