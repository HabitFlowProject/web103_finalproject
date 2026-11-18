import { useEffect, useState } from "react";
import { listCategories } from "../api/categories.js";
import { SearchIcon } from "./Icons.jsx";

export const FILTER_NAMES = ["completed", "priority", "category", "due", "sort", "order"];

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "false", label: "Open" },
  { value: "true", label: "Done" },
];

// A select shown as an outlined pill with its label inside ("Priority: All").
function FilterSelect({ label, value, onChange, disabled, title, children }) {
  return (
    <label className={value !== "" ? "filter-pill is-set" : "filter-pill"} title={title}>
      <span className="filter-pill-label">{label}:</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {children}
      </select>
    </label>
  );
}

// Filter and sort controls. `values` holds the current query (strings,
// "" meaning "any"); `onChange(name, value)` updates one of them.
// `search` / `onSearchChange` drive an optional client-side title search.
export default function TaskFilters({ values, onChange, onClear, search, onSearchChange }) {
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    listCategories({ signal: controller.signal })
      .then(setCategories)
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        console.error(error);
        setCategoryError(true);
      });

    return () => controller.abort();
  }, []);

  const hasFilters = FILTER_NAMES.some((name) => values[name] !== "");

  return (
    <div className="task-filters" role="search" aria-label="Filter and sort tasks">
      {onSearchChange && (
        <label className="filter-search">
          <SearchIcon size={18} />
          <span className="visually-hidden">Search tasks</span>
          <input
            type="search"
            placeholder="Search tasks"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>
      )}

      <div className="status-tabs" role="group" aria-label="Status">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            className={values.completed === tab.value ? "status-tab active" : "status-tab"}
            aria-pressed={values.completed === tab.value}
            onClick={() => onChange("completed", tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="filter-pills">
        <FilterSelect label="Priority" value={values.priority} onChange={(value) => onChange("priority", value)}>
          <option value="">All</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </FilterSelect>

        <FilterSelect
          label="Category"
          value={values.category}
          onChange={(value) => onChange("category", value)}
          disabled={categoryError}
          title={categoryError ? "Unable to load categories." : undefined}
        >
          <option value="">{categoryError ? "Unavailable" : "All"}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.name}>
              {category.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect label="Due" value={values.due} onChange={(value) => onChange("due", value)}>
          <option value="">Any</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due today</option>
          <option value="week">Next 7 days</option>
          <option value="none">No due date</option>
        </FilterSelect>

        <FilterSelect label="Sort" value={values.sort} onChange={(value) => onChange("sort", value)}>
          <option value="">Default</option>
          <option value="due_date">Due date</option>
          <option value="priority">Priority</option>
          <option value="created_at">Created date</option>
          <option value="title">Title</option>
        </FilterSelect>

        {/* Order only applies once a sort is chosen. */}
        {values.sort !== "" && (
          <FilterSelect label="Order" value={values.order} onChange={(value) => onChange("order", value)}>
            <option value="">Default</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </FilterSelect>
        )}

        {hasFilters && (
          <button type="button" className="button button-quiet button-small" onClick={onClear}>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
