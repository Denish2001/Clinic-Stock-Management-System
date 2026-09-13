// StockEditor.jsx
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';

export function StockEditor({ currentStock, onSave, isSaving, error }) {
  const [value, setValue] = useState(currentStock);
  const [dirty, setDirty] = useState(false);

  // Keep local value in sync with the source of truth whenever it
  // changes externally (successful save, navigating between products,
  // refetch) — but don't clobber what the user is actively typing.
  useEffect(() => {
    if (!dirty) {
      setValue(currentStock);
    }
  }, [currentStock, dirty]);

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      setValue('');
      setDirty(true);
      return;
    }
    const val = parseInt(raw, 10);
    if (!isNaN(val) && val >= 0) {
      setValue(val);
      setDirty(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value !== currentStock && value !== '') {
      onSave(Number(value));
      setDirty(false);
    }
  };

  const handleCancel = () => {
    setValue(currentStock);
    setDirty(false);
  };

  return (
    <div className="editor">
      <form onSubmit={handleSubmit}>
        <span className="editor__label">Update stock count</span>
        <div className="editor__row">
          <div className="editor__controls">
            <button
              type="button"
              className="editor__step"
              onClick={() => {
                setValue((v) => Math.max(0, (v === '' ? currentStock : v) - 1));
                setDirty(true);
              }}
              disabled={isSaving}
              aria-label="Decrease"
            >
              −
            </button>
            <input
              id="stock-input"
              type="number"
              min="0"
              className="editor__input"
              value={value}
              onChange={handleChange}
              disabled={isSaving}
              aria-describedby={error ? 'stock-error' : undefined}
            />
            <button
              type="button"
              className="editor__step"
              onClick={() => {
                setValue((v) => (v === '' ? currentStock : v) + 1);
                setDirty(true);
              }}
              disabled={isSaving}
              aria-label="Increase"
            >
              +
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={!dirty || isSaving || value === ''}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </Button>

          {dirty && !isSaving && (
            <Button variant="secondary" onClick={handleCancel} type="button">
              Cancel
            </Button>
          )}
        </div>

        {error && (
          <p id="stock-error" className="editor__error">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}