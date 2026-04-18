'use client';

import { useState, type FormEvent } from 'react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!consent) {
      setErrorMsg('Please check the newsletter consent box.');
      setStatus('error');
      return;
    }
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }
      setStatus('success');
      setEmail('');
      setConsent(false);
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center text-white">
        <p className="font-kollektif text-2xl mb-2">Thank you!</p>
        <p className="font-questrial text-white/80">You&apos;re subscribed to our newsletter.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h3 className="font-kollektif text-2xl md:text-3xl text-white text-center mb-6">
        Subscribe To Our Newsletter
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-white/90 font-questrial mb-1.5">
            Email <span className="text-white/60">*</span>
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-sm text-cca-ink font-questrial focus:outline-none focus:ring-2 focus:ring-cca-green"
            aria-label="Email address"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-white/80 font-questrial cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="rounded border-white/40"
          />
          Yes, subscribe me to your newsletter.
        </label>
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-cca-green text-white font-kollektif px-6 py-3 rounded-sm hover:bg-cca-green/90 transition-colors disabled:opacity-50"
        >
          {status === 'loading' ? 'Sending...' : 'Submit'}
        </button>
      </div>
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      {status === 'error' && (
        <p className="text-red-300 text-sm mt-2 text-center font-questrial">{errorMsg}</p>
      )}
    </form>
  );
}
