"use client";

interface Props {
  categories: string[];
  activeCategory: string;
  onSelect: (cat: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onSelect }: Props) {
  if (categories.length <= 1) return null;

  return (
    <div className="flex gap-2 flex-wrap mb-4">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors shrink-0"
          style={{
            background: activeCategory === cat ? "#c45a1a" : "#fff",
            color: activeCategory === cat ? "#fff" : "#4a4535",
            border: "1px solid",
            borderColor: activeCategory === cat ? "#c45a1a" : "#d6d0b4",
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
