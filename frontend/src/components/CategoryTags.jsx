import { formatAddedAt } from "./taskFormatting.js";

// With `showAddedAt`, each tag also says when it was added to the task.
export default function CategoryTags({ categories, showAddedAt = false }) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <ul className="category-tags" aria-label="Categories">
      {categories.map((category) => (
        <li
          key={category.id}
          className="category-tag"
          style={{ "--category-color": category.color }}
        >
          {category.name}
          {showAddedAt && category.added_at && (
            <span className="category-tag-added"> · added {formatAddedAt(category.added_at)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
