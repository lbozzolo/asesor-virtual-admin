"use client";
import React, { useState } from 'react';

interface Props {
  conversationId: string;
  onCompleted: () => void;
}

export const LeadCaptureForm: React.FC<Props> = ({ conversationId, onCompleted }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, firstName, lastName, email, phone, consent })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      setSuccess(true);
      onCompleted();
    } catch (e:any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <div className="p-4 border rounded-md bg-green-50 text-sm text-green-700">Datos guardados correctamente. ¡Gracias!</div>;
  }

  return (
    <form onSubmit={submit} className="space-y-3 p-4 border rounded-md bg-muted/30">
      <p className="text-sm font-medium">Déjanos tus datos para continuar:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1 font-medium">Nombre *</label>
          <input value={firstName} onChange={e=>setFirstName(e.target.value)} required className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Apellido</label>
          <input value={lastName} onChange={e=>setLastName(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Email *</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Teléfono *</label>
          <input value={phone} onChange={e=>setPhone(e.target.value)} required className="w-full border rounded px-2 py-1 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input id="consent" type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="border" />
        <label htmlFor="consent" className="text-xs">Acepto ser contactado por un asesor.</label>
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      <button type="submit" disabled={loading} className="text-sm px-4 py-2 rounded-md bg-primary text-primary-foreground disabled:opacity-50">{loading ? 'Guardando...' : 'Enviar datos'}</button>
    </form>
  );
};
