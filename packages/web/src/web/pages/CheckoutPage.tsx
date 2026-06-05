import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Check, Truck, ChevronRight, ShoppingBag, Send } from 'lucide-react';
import { useCart } from '../context/CartContext';
import NovaPoshtaPicker from '../components/NovaPoshtaPicker';
import { VisaSVG, MastercardSVG, GooglePaySVG, ApplePaySVG, LiqPaySVG } from '../components/PaymentIcons';

type Step = 'form' | 'success';
type City = { ref: string; name: string; area: string; type: string };
type Warehouse = { ref: string; name: string; number: string; type: string };

// ─── Order ID generator ───────────────────────────────────────────────────────
function genOrderId(): string {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `GW-${ts}-${rnd}`;
}

interface OrderItem {
  id:    string;
  name:  string;
  image: string;
  size:  string;
  qty:   number;
  price: number; // unit price
}

interface OrderSnapshot {
  orderId:      string;
  name:         string;
  phone:        string;
  email:        string;
  deliveryText: string;
  paymentText:  string;
  total:        number;
  itemsCount:   number;
  items:        OrderItem[];
  tgMsg:        string;
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [step, setStep]   = useState<Step>('form');
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [name,         setName]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [email,        setEmail]        = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [delivery,     setDelivery]     = useState<'nova-poshta' | 'courier'>('nova-poshta');
  const [payment,      setPayment]      = useState<'cod' | 'prepay'>('cod');
  const [comment,      setComment]      = useState('');

  const [selectedCity,    setSelectedCity]    = useState<City | null>(null);
  const [selectedWh,      setSelectedWh]      = useState<Warehouse | null>(null);
  const [courierAddress,  setCourierAddress]  = useState('');

  // Scroll to top when success screen mounts — must be top-level (Rules of Hooks)
  useEffect(() => {
    if (step === 'success') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [step]);

  if (items.length === 0 && step === 'form') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center pt-16">
        <div className="text-center">
          <ShoppingBag size={64} className="text-[#2E2E2E] mx-auto mb-4" />
          <h1 className="font-unbounded text-white text-xl font-black mb-3">Кошик порожній</h1>
          <p className="font-inter text-[#A0A0A0] text-sm mb-6">Додайте товари перед оформленням</p>
          <Link href="/" className="bg-[#E8232A] text-white font-bold font-inter px-8 py-3 rounded inline-block">
            До каталогу
          </Link>
        </div>
      </div>
    );
  }

  // ─── Strip trailing size suffixes from product names ─────────────────────────
  function stripSizeSuffix(name: string): string {
    return name
      .replace(/\s*[\(\[]?\d{2,3}\s*см[\)\]]?\s*$/i, '')
      .replace(/\s*[\(\[]?[A-Z]\d?\/[A-Z]\d?[\)\]]?\s*$/i, '')
      .replace(/\s*[\(\[]?\d{3}[\)\]]?\s*$/i, '')
      .trim();
  }

  // ─── Build order payload ────────────────────────────────────────────────────
  function buildOrder(): OrderSnapshot {
    const orderId = genOrderId();

    const orderLines = items.map(i =>
      `• ${stripSizeSuffix(i.product.name)}${i.color ? ` (${i.color})` : ''} (розмір: ${i.size}) × ${i.qty} = ${(i.unitPrice * i.qty).toLocaleString('uk-UA')} грн`
    ).join('\n');

    let deliveryText = '';
    if (delivery === 'nova-poshta') {
      deliveryText = `Нова пошта · ${selectedCity?.name ?? ''}${selectedCity?.area ? `, ${selectedCity.area} обл.` : ''}` +
        (selectedWh ? ` · ${selectedWh.name}` : '');
    } else {
      deliveryText = `Кур'єр НП · ${selectedCity?.name ?? ''}${selectedCity?.area ? `, ${selectedCity.area} обл.` : ''}` +
        (courierAddress ? ` · ${courierAddress}` : '');
    }

    const paymentText = payment === 'cod' ? 'Накладений платіж (при отриманні)' : 'Передоплата';
    const emailLine   = email.trim() ? `\n📧 ${email.trim()}` : '';
    const orderIdLine = `🔖 Замовлення: ${orderId}`;

    const tgMsg =
      `🛒 НОВЕ ЗАМОВЛЕННЯ\n\n` +
      `${orderIdLine}\n` +
      `👤 ${name}\n📞 ${phone}${emailLine}\n\n` +
      `🚚 ${deliveryText}\n💳 ${paymentText}\n\n` +
      `📦 Товари:\n${orderLines}\n\n` +
      `💰 Сума: ${total.toLocaleString('uk-UA')} грн` +
      (comment ? `\n\n💬 ${comment}` : '');

    const snapshot: OrderSnapshot = {
      orderId,
      name,
      phone,
      email: email.trim(),
      deliveryText,
      paymentText,
      total,
      itemsCount: items.reduce((s, i) => s + i.qty, 0),
      items: items.map(i => ({
        id:    String(i.product.id),
        name:  stripSizeSuffix(i.product.name),
        image: i.product.image,
        size:  i.size,
        qty:   i.qty,
        price: i.unitPrice,
      })),
      tgMsg,
    };
    // Persist so success screen survives accidental refresh
    sessionStorage.setItem('gw_last_order', JSON.stringify(snapshot));
    return snapshot;
  }

  // ─── Main submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const snapshot = buildOrder();
      // POST to backend — fires emails; non-blocking on failure
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
      }).catch(() => {}); // best-effort
      setOrder(snapshot);
      clearCart();
      setStep('success');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    const o: OrderSnapshot | null = order ?? (() => {
      try { return JSON.parse(sessionStorage.getItem('gw_last_order') ?? 'null'); }
      catch { return null; }
    })();

    const clearLastOrder = () => sessionStorage.removeItem('gw_last_order');

    if (!o) {
      return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center pt-20 pb-16 px-4">
          <div className="text-center">
            <Check size={48} className="text-[#E8232A] mx-auto mb-4" />
            <h1 className="font-unbounded text-white text-2xl font-black mb-3">Дякуємо за замовлення!</h1>
            <Link href="/" className="bg-[#E8232A] text-white font-bold font-inter px-8 py-3 rounded inline-block mt-6">
              На головну
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-start pt-16 pb-14 px-4">
        <div className="w-full max-w-[520px] mt-8">

          {/* ── Icon + heading ── */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-[#E8232A]/10 border border-[#E8232A]/25 flex items-center justify-center mb-4">
              <Check size={24} className="text-[#E8232A]" strokeWidth={2.5} />
            </div>
            <h1 className="font-unbounded text-white text-xl font-black mb-2 leading-tight">
              Дякуємо за замовлення!
            </h1>
            <p className="font-inter text-[#909090] text-sm leading-relaxed max-w-[300px]">
              Замовлення прийнято. Менеджер GIWEAR зв'яжеться з вами для підтвердження деталей.
            </p>
          </div>

          {/* ── Compact order card ── */}
          <div className="bg-[#161616] border border-[#252525] rounded-xl overflow-hidden mb-3">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#252525] flex items-center justify-between">
              <span className="font-unbounded text-white text-[11px] font-bold tracking-wide">Деталі замовлення</span>
              <span className="font-unbounded text-[#E8232A] text-[11px] font-bold tracking-widest">{o.orderId}</span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-[#1E1E1E]">
              {/* Total */}
              <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                <span className="font-inter text-[#666] text-xs shrink-0">Сума</span>
                <span className="font-unbounded text-white text-sm font-black">
                  {o.total.toLocaleString('uk-UA')} грн
                </span>
              </div>
              {/* Delivery — stacked label+value for long text */}
              <div className="flex flex-col px-4 py-2.5 gap-0.5">
                <span className="font-inter text-[#666] text-xs">Доставка</span>
                <span className="font-inter text-white text-xs leading-relaxed">{o.deliveryText}</span>
              </div>
              {/* Payment */}
              <div className="flex items-center justify-between px-4 py-2.5 gap-3">
                <span className="font-inter text-[#666] text-xs shrink-0">Оплата</span>
                <span className="font-inter text-white text-xs text-right">{o.paymentText}</span>
              </div>
            </div>
          </div>

          {/* ── Email notice ── */}
          <p className="font-inter text-[#606060] text-xs text-center mb-4 leading-relaxed">
            {o.email
              ? <>Деталі замовлення надіслано на <span className="text-[#888]">{o.email}</span></>
              : 'Деталі замовлення підтвердить менеджер під час дзвінка або повідомлення.'
            }
          </p>

          {/* ── CTA buttons ── */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Link
              href="/"
              onClick={clearLastOrder}
              className="flex-1 bg-[#E8232A] hover:bg-[#C41E24] text-white font-bold font-inter text-sm py-3 rounded flex items-center justify-center transition-all"
            >
              Продовжити покупки
            </Link>
            <Link
              href="/"
              onClick={clearLastOrder}
              className="flex-1 bg-[#181818] hover:bg-[#202020] border border-[#2A2A2A] text-[#A0A0A0] hover:text-white font-inter text-sm py-3 rounded flex items-center justify-center transition-all"
            >
              На головну
            </Link>
          </div>

          {/* ── Telegram (secondary) ── */}
          <div className="text-center mt-5 pt-4 border-t border-[#1E1E1E]">
            <p className="font-inter text-[#484848] text-xs mb-2">Хочете уточнити деталі самостійно?</p>
            <button
              type="button"
              onClick={() => window.open('https://t.me/gistore_ua', '_blank')}
              className="inline-flex items-center gap-2 font-inter text-xs text-[#686868] hover:text-[#A0A0A0] transition-colors"
            >
              <Send size={11} />
              Написати в Telegram
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center gap-2 text-[#A0A0A0] text-sm font-inter mb-8">
          <Link href="/" className="hover:text-[#E8232A]">Головна</Link>
          <ChevronRight size={14} />
          <span className="text-white">Оформлення замовлення</span>
        </div>

        <h1 className="font-unbounded text-white text-2xl lg:text-3xl font-black mb-10">Оформлення замовлення</h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left */}
            <div className="lg:col-span-2 space-y-6">

              {/* Contact */}
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
                <h2 className="font-unbounded text-white text-base font-black mb-5">Контактні дані</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-inter text-[#A0A0A0] text-sm mb-2">Ім'я та прізвище *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required
                      placeholder="Іван Петренко"
                      className="w-full bg-[#0F0F0F] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors placeholder:text-[#555]" />
                  </div>
                  <div>
                    <label className="block font-inter text-[#A0A0A0] text-sm mb-2">Телефон *</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                      placeholder="+380 XX XXX XX XX"
                      className="w-full bg-[#0F0F0F] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors placeholder:text-[#555]" />
                  </div>
                </div>
                {/* Email — optional */}
                <div className="mt-4">
                  <label className="block font-inter text-[#A0A0A0] text-sm mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="example@gmail.com"
                    className={`w-full bg-[#0F0F0F] border text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors placeholder:text-[#555] ${
                      emailTouched && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
                        ? 'border-[#E8232A] focus:border-[#E8232A]'
                        : 'border-[#2E2E2E] focus:border-[#E8232A]'
                    }`}
                  />
                  {emailTouched && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                    <p className="font-inter text-[#E8232A] text-xs mt-1.5">Введіть коректний email</p>
                  )}
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
                <h2 className="font-unbounded text-white text-base font-black mb-5">Доставка</h2>

                {/* Delivery type */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { val: 'nova-poshta', label: 'Нова пошта', sub: 'Відділення або поштомат' },
                    { val: 'courier', label: 'Кур\'єр НП', sub: 'Адресна доставка' },
                  ].map(opt => (
                    <button key={opt.val} type="button"
                      onClick={() => { setDelivery(opt.val as typeof delivery); setSelectedWh(null); setCourierAddress(''); }}
                      className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${delivery === opt.val ? 'border-[#E8232A] bg-[#E8232A]/10' : 'border-[#2E2E2E] hover:border-[#E8232A]/50'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${delivery === opt.val ? 'border-[#E8232A]' : 'border-[#555]'}`}>
                        {delivery === opt.val && <div className="w-2 h-2 bg-[#E8232A] rounded-full" />}
                      </div>
                      <div>
                        <p className="font-inter text-white text-sm font-semibold">{opt.label}</p>
                        <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">{opt.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* NP Picker */}
                <NovaPoshtaPicker
                  deliveryType={delivery}
                  onCityChange={setSelectedCity}
                  onWarehouseChange={setSelectedWh}
                  onAddressChange={setCourierAddress}
                />
              </div>

              {/* Payment */}
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
                <h2 className="font-unbounded text-white text-base font-black mb-5">Оплата</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* COD */}
                  <button type="button" onClick={() => setPayment('cod')}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${payment === 'cod' ? 'border-[#E8232A] bg-[#E8232A]/10' : 'border-[#2E2E2E] hover:border-[#E8232A]/50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${payment === 'cod' ? 'border-[#E8232A]' : 'border-[#555]'}`}>
                      {payment === 'cod' && <div className="w-2 h-2 bg-[#E8232A] rounded-full" />}
                    </div>
                    <div>
                      <p className="font-inter text-white text-sm font-semibold">Оплата при отриманні</p>
                      <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">Накладений платіж — НП</p>
                    </div>
                  </button>

                  {/* Online / LiqPay */}
                  <button type="button" onClick={() => setPayment('prepay')}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${payment === 'prepay' ? 'border-[#E8232A] bg-[#E8232A]/10' : 'border-[#2E2E2E] hover:border-[#E8232A]/50'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${payment === 'prepay' ? 'border-[#E8232A]' : 'border-[#555]'}`}>
                      {payment === 'prepay' && <div className="w-2 h-2 bg-[#E8232A] rounded-full" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-inter text-white text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                        <span>Онлайн через</span>
                        <LiqPaySVG height={14} />
                      </p>
                      <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                        <VisaSVG width={28} />
                        <MastercardSVG size={22} />
                        <GooglePaySVG height={13} />
                        <ApplePaySVG height={13} />
                      </div>
                    </div>
                  </button>

                </div>
              </div>

              {/* Comment */}
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
                <h2 className="font-unbounded text-white text-base font-black mb-5">Коментар</h2>
                <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3}
                  placeholder="Додаткові побажання або уточнення..."
                  className="w-full bg-[#0F0F0F] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors resize-none placeholder:text-[#555]" />
              </div>
            </div>

            {/* Right: Summary */}
            <div>
              <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6 sticky top-24">
                <h2 className="font-unbounded text-white text-base font-black mb-5">Ваше замовлення</h2>

                <div className="space-y-4 mb-5">
                  {items.map(item => (
                    <div key={`${item.product.id}-${item.size}`} className="flex gap-3">
                      <img src={item.product.image} alt={item.product.name}
                        className="w-14 h-14 object-cover rounded-lg bg-[#242424] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-inter text-white text-xs font-semibold leading-tight line-clamp-2">{item.product.name}</p>
                        <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">Розмір: {item.size} · {item.qty} шт</p>
                        <p className="font-inter text-[#E8232A] text-sm font-bold mt-1">
                          {(item.unitPrice * item.qty).toLocaleString('uk-UA')} грн
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#2E2E2E] pt-4 mb-5 space-y-2">
                  <div className="flex justify-between font-inter text-sm text-[#A0A0A0]">
                    <span>Товари ({items.reduce((s, i) => s + i.qty, 0)} шт)</span>
                    <span>{total.toLocaleString('uk-UA')} грн</span>
                  </div>
                  <div className="flex justify-between font-inter text-sm text-[#A0A0A0]">
                    <span>Доставка</span>
                    <span>За тарифами НП</span>
                  </div>
                  <div className="flex justify-between font-unbounded text-white text-base font-black pt-2 border-t border-[#2E2E2E]">
                    <span>Разом</span>
                    <span>{total.toLocaleString('uk-UA')} грн</span>
                  </div>
                </div>

                {/* Delivery summary */}
                {selectedCity && (
                  <div className="bg-[#0F0F0F] border border-[#2E2E2E] rounded-lg p-3 mb-4 text-xs font-inter space-y-1">
                    <p className="text-[#A0A0A0]">📍 {selectedCity.name}, {selectedCity.area} обл.</p>
                    {selectedWh && <p className="text-[#A0A0A0]">🏪 {selectedWh.name}</p>}
                    {courierAddress && <p className="text-[#A0A0A0]">🚚 {courierAddress}</p>}
                  </div>
                )}

                {/* Primary: submit order on-site */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#E8232A] hover:bg-[#C41E24] disabled:opacity-60 text-white font-bold font-inter text-base py-4 rounded flex items-center justify-center gap-2 transition-all"
                >
                  {submitting ? 'Обробка...' : 'Підтвердити замовлення'}
                </button>

                <p className="font-inter text-[#505050] text-[11px] text-center mt-3 leading-relaxed">
                  Натискаючи «Підтвердити замовлення», ви погоджуєтесь з{' '}
                  <a href="/offer" className="text-[#808080] hover:text-[#E8232A] underline underline-offset-2 transition-colors">Публічною офертою</a>
                  {' '}та{' '}
                  <a href="/privacy" className="text-[#808080] hover:text-[#E8232A] underline underline-offset-2 transition-colors">Політикою конфіденційності</a>.
                </p>

                <div className="flex items-start gap-2 mt-4">
                  <Truck size={16} className="text-[#E8232A] shrink-0 mt-0.5" />
                  <p className="font-inter text-[#A0A0A0] text-xs">
                    Після підтвердження ми зв'яжемось з вами найближчим часом.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
