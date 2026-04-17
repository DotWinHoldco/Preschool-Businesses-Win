'use client';

import { useState, type FormEvent } from 'react';

export function ContactForm() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }
      setStatus('success');
      setForm({ firstName: '', lastName: '', email: '', message: '' });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center p-8 bg-cca-cream rounded-2xl">
        <p className="font-kollektif text-2xl text-cca-green mb-2">Message Sent!</p>
        <p className="font-questrial text-cca-ink/70">
          Thanks for reaching out — we&apos;ll be in touch within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-questrial text-sm text-cca-ink/70 mb-1">First Name</label>
          <input
            type="text"
            value={form.firstName}
            onChange={(e) => update('firstName', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent"
          />
        </div>
        <div>
          <label className="block font-questrial text-sm text-cca-ink/70 mb-1">Last Name</label>
          <input
            type="text"
            value={form.lastName}
            onChange={(e) => update('lastName', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent"
          />
        </div>
      </div>
      <div>
        <label className="block font-questrial text-sm text-cca-ink/70 mb-1">Email*</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent"
        />
      </div>
      <div>
        <label className="block font-questrial text-sm text-cca-ink/70 mb-1">Message*</label>
        <textarea
          required
          rows={5}
          value={form.message}
          onChange={(e) => update('message', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 font-questrial focus:outline-none focus:ring-2 focus:ring-cca-blue focus:border-transparent resize-none"
        />
      </div>
      <input type="text" name="company" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-cca-blue text-white font-kollektif text-lg py-4 rounded-full hover:bg-cca-blue/90 transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? 'Sending...' : 'Submit'}
      </button>
      {status === 'error' && (
        <p className="text-red-500 text-sm text-center font-questrial">{errorMsg}</p>
      )}
    </form>
  );
}
