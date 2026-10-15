import React from 'react';

export function AutoSaveWidget({ countdown, saveCount, lastSavedPayload }) {
  return (
    <section className="grid-3">
      <div className="card">
        <span className="label">Auto-save</span>
        <p className="big mono accent">Next auto-save in: {countdown} seconds</p>
        <span className="muted small">Saves completed: {saveCount}</span>
      </div>
      <div className="card span-2">
        <span className="label">Last Saved Payload</span>
        <pre className="payload mono">
          {lastSavedPayload
            ? JSON.stringify(lastSavedPayload, null, 2)
            : 'Awaiting first auto-save...'}
        </pre>
      </div>
    </section>
  );
}
