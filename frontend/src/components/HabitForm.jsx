import { useState } from "react";
import { describeHabitActionError } from "./actionErrors.js";
import { FREQUENCY_LABELS } from "./habitFormatting.js";

function validate(values) {
  const errors = {};

  if (values.name.trim().length === 0) {
    errors.name = "Habit name is required.";
  }
  if (!Object.hasOwn(FREQUENCY_LABELS, values.frequency)) {
    errors.frequency = "Choose a frequency: daily, weekdays, or weekly.";
  }

  return errors;
}

// Used for both creating and editing. `onSubmit` receives API-ready fields
// and should throw (an ApiError) if the save fails.
export default function HabitForm({ habit, onSubmit, onCancel }) {
  const isEditing = Boolean(habit);
  const [values, setValues] = useState({
    name: habit?.name ?? "",
    description: habit?.description ?? "",
    frequency: habit?.frequency ?? "daily",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  function updateField(name, value) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsSaving(true);
    setSubmitError(null);

    try {
      await onSubmit({
        name: values.name.trim(),
        description: values.description,
        frequency: values.frequency,
      });
    } catch (error) {
      console.error(error);
      setSubmitError(describeHabitActionError(error, "Unable to save the habit. Please try again."));
      setIsSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <p className="form-error" role="alert">
          {submitError}
        </p>
      )}

      <label className="form-field">
        <span>Name *</span>
        <input
          type="text"
          value={values.name}
          onChange={(event) => updateField("name", event.target.value)}
          aria-invalid={Boolean(fieldErrors.name)}
          autoFocus
        />
        {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
      </label>

      <label className="form-field">
        <span>Description</span>
        <textarea
          rows={3}
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
        />
      </label>

      <label className="form-field">
        <span>Frequency</span>
        <select
          value={values.frequency}
          onChange={(event) => updateField("frequency", event.target.value)}
          aria-invalid={Boolean(fieldErrors.frequency)}
        >
          {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {fieldErrors.frequency && <span className="field-error">{fieldErrors.frequency}</span>}
      </label>

      <div className="form-actions">
        <button type="button" className="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="button button-primary" disabled={isSaving}>
          {isSaving ? "Saving..." : isEditing ? "Save changes" : "Add habit"}
        </button>
      </div>
    </form>
  );
}
