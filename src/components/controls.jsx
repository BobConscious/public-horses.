import { useId } from 'react';
import './controls.css';

export function Button({ href, variant = 'primary', type = 'button', className, ...props }) {
  const classes = ['button', `button-${variant}`, className].filter(Boolean).join(' ');
  return href === undefined
    ? <button type={type} className={classes} {...props} />
    : <a href={href} className={classes} {...props} />;
}

function feedbackAttributes(id, description, hint, error) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return { hintId, errorId, describedBy: [description, hintId, errorId].filter(Boolean).join(' ') || undefined };
}

function FieldFeedback({ hint, error, hintId, errorId }) {
  return (
    <>
      {hint && <p id={hintId} className="field-hint">{hint}</p>}
      {error && <p id={errorId} className="form-field__error">{error}</p>}
    </>
  );
}

export function Field({ label, as: Control = 'input', optional = false, hint, error, id, className,
  'aria-describedby': description, ...props }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const feedback = feedbackAttributes(controlId, description, hint, error);
  const classes = ['form-field__control', className].filter(Boolean).join(' ');
  return (
    <div className="form-field">
      <label htmlFor={controlId}>
        <span>{label}{optional && <> <span className="optional">Optional</span></>}</span>
      </label>
      <Control {...props} id={controlId} className={classes}
        aria-describedby={feedback.describedBy} aria-invalid={error ? true : props['aria-invalid']} />
      <FieldFeedback {...feedback} hint={hint} error={error} />
    </div>
  );
}

export function Checkbox({ label, hint, error, id, 'aria-describedby': description, ...props }) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const feedback = feedbackAttributes(controlId, description, hint, error);
  return (
    <div className="form-checkbox">
      <label className="check-field" htmlFor={controlId}>
        <input {...props} id={controlId} type="checkbox" aria-describedby={feedback.describedBy}
          aria-invalid={error ? true : props['aria-invalid']} /> <span>{label}</span>
      </label>
      <FieldFeedback {...feedback} hint={hint} error={error} />
    </div>
  );
}

export function Notice({ tone = 'status', className, ...props }) {
  const isError = tone === 'error';
  const classes = ['notice', isError && 'notice-error', className].filter(Boolean).join(' ');
  return <p {...props} className={classes} role={isError ? 'alert' : 'status'} />;
}

const statusLabels = {
  draft: 'Draft',
  submitted: 'Under review',
  changes_requested: 'Needs changes',
  published: 'Published',
  closed: 'Closed',
};

export function StatusChip({ status }) {
  return <span className="record-status" data-status={status}>{statusLabels[status] ?? status}</span>;
}
