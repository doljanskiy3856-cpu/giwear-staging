import { useState } from 'react';
import { MessageCircle, Phone, Check, Users, Award, Truck, FileText } from 'lucide-react';
import TrustBar from '../components/TrustBar';

const benefits = [
  { icon: Users, title: 'Знижки від 5 одиниць', desc: 'Чим більше замовлення — тим нижча ціна. Від 5 шт — знижка 10%, від 20 шт — 15%, від 50 шт — 20%.' },
  { icon: Award, title: 'Фірмове нанесення', desc: 'Логотип клубу або школи на кімоно. Вишивка або шеврон. Від 10 одиниць.' },
  { icon: FileText, title: 'Офіційні документи', desc: 'Рахунок-фактура, накладна, договір для бухгалтерії. Працюємо з ФОП і юрособами.' },
  { icon: Truck, title: 'Пріоритетна відправка', desc: 'Клубні замовлення відправляємо першими. Допомагаємо з підготовкою до турнірів.' },
];

export default function TrainersPage() {
  const [name, setName] = useState('');
  const [club, setClub] = useState('');
  const [sport, setSport] = useState('');
  const [qty, setQty] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = encodeURIComponent(
      `Оптове замовлення\nТренер: ${name}\nКлуб: ${club}\nВид спорту: ${sport}\nКількість: ${qty} шт\nТелефон: ${phone}`
    );
    window.open(`https://t.me/gistore_ua?text=${msg}`, '_blank');
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F]">

      {/* Hero */}
      <section className="relative h-72 lg:h-96 flex items-end overflow-hidden bg-[#1A0A0A]">
        <div
          className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1616803140344-6682afbf4714?w=1200&q=60)', backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F0F0F]" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#E8232A]" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
          <span className="section-label">Для тренерів і клубів</span>
          <h1 className="font-unbounded text-3xl lg:text-5xl font-black text-white mb-2">
            Одягаємо цілі секції
          </h1>
          <p className="font-inter text-[#A0A0A0] text-base max-w-2xl">
            Оптові ціни, документи для бухгалтерії, нанесення логотипу клубу. Від 5 одиниць.
          </p>
        </div>
      </section>

      <TrustBar />

      {/* Benefits */}
      <section className="py-20 bg-[#0F0F0F]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <span className="section-label">Переваги</span>
            <h2 className="font-unbounded text-3xl font-black text-white">Чому клуби обирають GIWEAR</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map(b => (
              <div key={b.title} className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6">
                <div className="w-12 h-12 bg-[#E8232A]/10 rounded flex items-center justify-center mb-5">
                  <b.icon size={24} className="text-[#E8232A]" />
                </div>
                <h3 className="font-unbounded text-white text-base font-bold mb-2">{b.title}</h3>
                <p className="font-inter text-[#A0A0A0] text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing table */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <span className="section-label">Оптові умови</span>
            <h2 className="font-unbounded text-2xl font-black text-white">Знижки для клубів</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { qty: 'від 5 шт', disc: '-10%', label: 'Старт', color: 'border-[#2E2E2E]' },
              { qty: 'від 20 шт', disc: '-15%', label: 'Клуб', color: 'border-[#E8232A]' },
              { qty: 'від 50 шт', disc: '-20%', label: 'Академія', color: 'border-[#E8232A]' },
            ].map(tier => (
              <div key={tier.qty} className={`bg-[#0F0F0F] border-2 ${tier.color} rounded-xl p-6 text-center`}>
                <p className="font-inter text-[#A0A0A0] text-sm mb-2">{tier.label}</p>
                <p className="font-unbounded text-[#E8232A] text-4xl font-black mb-2">{tier.disc}</p>
                <p className="font-inter text-white text-sm font-semibold">{tier.qty}</p>
                <ul className="mt-4 space-y-2 text-left">
                  {['Офіційні документи', 'Консультація тренера', 'Пріоритетна відправка'].map(f => (
                    <li key={f} className="flex items-center gap-2 font-inter text-[#A0A0A0] text-xs">
                      <Check size={12} className="text-[#E8232A] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form + Telegram */}
      <section className="py-20 bg-[#0F0F0F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <span className="section-label">Залишити заявку</span>
              <h2 className="font-unbounded text-2xl font-black text-white mb-6">Заповніть форму — зв'яжемось протягом 2 годин</h2>
              {sent ? (
                <div className="bg-[#1A1A1A] border border-[#E8232A] rounded-xl p-8 text-center">
                  <div className="w-16 h-16 bg-[#E8232A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-white" />
                  </div>
                  <h3 className="font-unbounded text-white text-lg font-bold mb-2">Заявку відправлено!</h3>
                  <p className="font-inter text-[#A0A0A0] text-sm">Ми зв'яжемось з вами протягом 2 годин.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {[
                    { label: "Ваше ім'я", val: name, set: setName, placeholder: "Ігор Петренко", required: true },
                    { label: "Назва клубу / секції", val: club, set: setClub, placeholder: "Клуб карате «Самурай»", required: true },
                    { label: "Вид єдиноборства", val: sport, set: setSport, placeholder: "Карате / Дзюдо / BJJ", required: true },
                    { label: "Кількість кімоно", val: qty, set: setQty, placeholder: "Наприклад: 15", required: true },
                    { label: "Телефон або Telegram", val: phone, set: setPhone, placeholder: "+380 XX XXX XX XX", required: true },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block font-inter text-[#A0A0A0] text-sm mb-2">{f.label}</label>
                      <input
                        type="text"
                        value={f.val}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        required={f.required}
                        className="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors placeholder:text-[#555]"
                      />
                    </div>
                  ))}
                  <button type="submit"
                    className="w-full bg-[#E8232A] hover:bg-[#C41E24] text-white font-bold font-inter text-base py-4 rounded transition-all">
                    Надіслати заявку
                  </button>
                </form>
              )}
            </div>

            {/* Contact options */}
            <div>
              <span className="section-label">Або напишіть напряму</span>
              <h2 className="font-unbounded text-2xl font-black text-white mb-6">Зв'яжіться з нами</h2>
              <div className="space-y-4">
                <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#2AABEE] rounded-xl p-5 transition-all">
                  <div className="w-12 h-12 bg-[#2AABEE]/10 rounded-full flex items-center justify-center">
                    <MessageCircle size={24} className="text-[#2AABEE]" />
                  </div>
                  <div>
                    <p className="font-inter text-white text-sm font-semibold">Telegram</p>
                    <p className="font-inter text-[#A0A0A0] text-xs">@gistore_ua — відповідаємо швидко</p>
                  </div>
                </a>
                <a href="viber://chat?number=%2B380668564845"
                  className="flex items-center gap-4 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#7B519D] rounded-xl p-5 transition-all">
                  <div className="w-12 h-12 bg-[#7B519D]/10 rounded-full flex items-center justify-center">
                    <Phone size={24} className="text-[#7B519D]" />
                  </div>
                  <div>
                    <p className="font-inter text-white text-sm font-semibold">Viber</p>
                    <p className="font-inter text-[#A0A0A0] text-xs">Зателефонуємо або напишемо</p>
                  </div>
                </a>
              </div>
              <div className="mt-6 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-5">
                <h3 className="font-unbounded text-white text-sm font-bold mb-3">Що написати у першому повідомленні:</h3>
                <ul className="space-y-2">
                  {[
                    'Назву клубу або секції',
                    'Вид єдиноборства',
                    'Приблизна кількість кімоно',
                    'Розміри (якщо відомі)',
                  ].map(t => (
                    <li key={t} className="flex items-center gap-2 font-inter text-[#A0A0A0] text-sm">
                      <div className="w-1.5 h-1.5 bg-[#E8232A] rounded-full shrink-0" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
