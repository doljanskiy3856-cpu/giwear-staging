import { useState, useEffect, useRef } from 'react';
import { X, Bell, Check, AlertCircle } from 'lucide-react';

export interface NotifyPayload {
  productName: string;
  brand?: string;
  color?: string;
  size?: string;
  fit?: string;
  vendorCode?: string;
  productUrl?: string;
  restockDate?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  payload: NotifyPayload;
}

type FieldError = { name?: string; phone?: string; email?: string };

export default function NotifyModal({ open, onClose, payload }: Props) {
  const [name, setName]   = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors]   = useState<FieldError>({});
  const [status, setStatus]   = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const nameRef  = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  /* reset on open */
  useEffect(() => {
    if (open) {
      setName(''); setPhone(''); setEmail('');
      setErrors({}); setStatus('idle');
      setTimeout(() => nameRef.current?.focus(), 120);
    }
  }, [open]);

  /* close on Escape */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  /* prevent body scroll while open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!name.trim())  e.name  = "Вкажіть ваше ім'я";
    if (!phone.trim()) e.phone = 'Вкажіть номер телефону';
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = 'Перевірте email';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/notify-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:         name.trim(),
          phone:        phone.trim(),
          email:        email.trim() || undefined,
          productName:  payload.productName,
          brand:        payload.brand,
          color:        payload.color,
          size:         payload.size,
          fit:          payload.fit,
          vendorCode:   payload.vendorCode,
          productUrl:   payload.productUrl,
          restockDate:  payload.restockDate,
        }),
      });
      if (!res.ok) throw new Error('server error');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  /* ── shared input style ── */
  const inputCls = (err?: string) =>
    `w-full bg-[#1A1A1A] rounded-xl font-inter text-[14px] text-white placeholder-[#505050] outline-none transition-all duration-150 px-4 py-3 ${
      err
        ? 'border border-[#E8232A]/60 focus:border-[#E8232A]'
        : 'border border-[#2E2E2E] focus:border-[#E8232A]/60'
    }`;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[900] bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — bottom sheet on mobile, centered modal on desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Повідомити про наявність"
        className="fixed z-[901] left-0 right-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center pointer-events-none"
      >
        <div
          className="pointer-events-auto w-full sm:w-auto sm:min-w-[420px] sm:max-w-[480px]"
          style={{
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: '20px 20px 0 0',
            padding: '0',
            // desktop: rounded all sides
          }}
          /* desktop override via inline — Tailwind not reliable here */
          ref={el => {
            if (!el) return;
            const isMd = window.matchMedia('(min-width:640px)').matches;
            if (isMd) el.style.borderRadius = '20px';
          }}
        >
          {/* drag handle (mobile only) */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-[#333]" />
          </div>

          <div className="px-5 pb-6 pt-4 sm:pt-5 sm:px-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(217,119,6,0.12)' }}
                >
                  <Bell size={15} style={{ color: '#D97706' }} />
                </span>
                <div>
                  <p className="font-unbounded text-white text-[13px] font-bold leading-tight">
                    Повідомити про наявність
                  </p>
                  <p className="font-inter text-[11.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Залиште контакти — напишемо, коли зʼявиться.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="shrink-0 ml-2 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                style={{ background: 'rgba(255,255,255,0.06)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                aria-label="Закрити"
              >
                <X size={13} style={{ color: 'rgba(255,255,255,0.60)' }} />
              </button>
            </div>

            {/* Product chip */}
            <div
              className="rounded-xl px-3.5 py-2.5 mb-4 flex items-start gap-2"
              style={{ background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-inter text-[12px] font-semibold text-white leading-snug truncate">
                  {payload.productName}
                </p>
                <p className="font-inter text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                  {[payload.color, payload.size && `Розмір ${payload.size}`, payload.fit].filter(Boolean).join(' · ')}
                </p>
              </div>
              {payload.restockDate && (
                <span
                  className="shrink-0 font-inter text-[11px] font-medium px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(217,119,6,0.12)', color: '#D97706', whiteSpace: 'nowrap' }}
                >
                  {payload.restockDate}
                </span>
              )}
            </div>

            {/* ── Success state ── */}
            {status === 'success' ? (
              <div
                className="rounded-xl px-4 py-5 text-center"
                style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(34,197,94,0.12)' }}>
                  <Check size={20} style={{ color: '#22c55e' }} />
                </div>
                <p className="font-inter text-white text-sm font-semibold mb-1">Дякуємо!</p>
                <p className="font-inter text-[12.5px]" style={{ color: 'rgba(255,255,255,0.50)' }}>
                  Ми повідомимо вас, щойно товар буде в наявності.
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 font-inter text-[13px] font-medium transition-colors"
                  style={{ color: '#E8232A' }}
                >
                  Закрити
                </button>
              </div>
            ) : (
              /* ── Form ── */
              <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-3">
                  {/* Name */}
                  <div>
                    <input
                      ref={nameRef}
                      type="text"
                      placeholder="Ваше ім'я"
                      value={name}
                      onChange={e => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
                      className={inputCls(errors.name)}
                      autoComplete="given-name"
                    />
                    {errors.name && (
                      <p className="font-inter text-[11.5px] mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
                        <AlertCircle size={11} /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <input
                      type="tel"
                      placeholder="+380 XX XXX XX XX"
                      value={phone}
                      onChange={e => { setPhone(e.target.value); if (errors.phone) setErrors(p => ({ ...p, phone: undefined })); }}
                      className={inputCls(errors.phone)}
                      autoComplete="tel"
                      inputMode="tel"
                    />
                    {errors.phone && (
                      <p className="font-inter text-[11.5px] mt-1 flex items-center gap-1" style={{ color: '#f87171' }}>
                        <AlertCircle size={11} /> {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email — optional */}
                  <div>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({ ...p, email: undefined })); }}
                      className={inputCls(errors.email)}
                      autoComplete="email"
                      inputMode="email"
                    />
                    <p className="font-inter text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
                      Email — за бажанням
                    </p>
                    {errors.email && (
                      <p className="font-inter text-[11.5px] mt-0.5 flex items-center gap-1" style={{ color: '#f87171' }}>
                        <AlertCircle size={11} /> {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Error banner */}
                {status === 'error' && (
                  <p
                    className="font-inter text-[12px] mt-3 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(232,35,42,0.08)', color: '#f87171', border: '1px solid rgba(232,35,42,0.20)' }}
                  >
                    Щось пішло не так. Спробуйте ще раз або напишіть у Telegram.
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full mt-4 font-inter font-semibold text-sm py-3.5 rounded-xl transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    background: status === 'loading' ? 'rgba(217,119,6,0.25)' : 'rgba(217,119,6,0.15)',
                    border: '1.5px solid rgba(217,119,6,0.55)',
                    color: status === 'loading' ? 'rgba(245,158,11,0.55)' : '#F59E0B',
                    cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                  }}
                  onMouseEnter={e => { if (status !== 'loading') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(217,119,6,0.22)'; }}
                  onMouseLeave={e => { if (status !== 'loading') (e.currentTarget as HTMLButtonElement).style.background = 'rgba(217,119,6,0.15)'; }}
                >
                  {status === 'loading' ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-[#F59E0B]/30 border-t-[#F59E0B] animate-spin" />
                      Відправляємо...
                    </>
                  ) : (
                    <>
                      <Bell size={15} />
                      Надіслати заявку
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
