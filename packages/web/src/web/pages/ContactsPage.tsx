import { useState } from 'react';
import { MessageCircle, Phone, Instagram, Mail, MapPin, Clock, Check } from 'lucide-react';
import { Link } from 'wouter';
import TrustBar from '../components/TrustBar';

export default function ContactsPage() {
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = encodeURIComponent(`Повідомлення від ${name}:\n${msg}`);
    window.open(`https://t.me/gistore_ua?text=${text}`, '_blank');
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <section className="pt-24 pb-12 bg-[#0F0F0F] border-b border-[#2E2E2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[#A0A0A0] text-sm font-inter mb-4">
            <Link href="/" className="hover:text-[#E8232A]">Головна</Link>
            <span>/</span>
            <span className="text-white">Контакти</span>
          </div>
          <span className="section-label">Зв'яжіться з нами</span>
          <h1 className="font-unbounded text-3xl lg:text-5xl font-black text-white mb-3">Контакти</h1>
          <p className="font-inter text-[#A0A0A0] text-base">Відповідаємо в Telegram, Viber та Instagram. Зазвичай — протягом 30 хвилин.</p>
        </div>
      </section>

      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

          {/* Contacts */}
          <div>
            <h2 className="font-unbounded text-white text-xl font-black mb-6">Способи зв'язку</h2>
            <div className="space-y-4 mb-8">
              <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#2AABEE] rounded-xl p-5 transition-all group">
                <div className="w-14 h-14 bg-[#2AABEE]/10 rounded-full flex items-center justify-center">
                  <MessageCircle size={28} className="text-[#2AABEE]" />
                </div>
                <div>
                  <p className="font-inter text-white text-base font-semibold group-hover:text-[#2AABEE] transition-colors">Telegram</p>
                  <p className="font-inter text-[#A0A0A0] text-sm">@gistore_ua</p>
                  <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">Найшвидший спосіб</p>
                </div>
              </a>

              <a href="viber://chat?number=%2B380668564845"
                className="flex items-center gap-4 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#7B519D] rounded-xl p-5 transition-all group">
                <div className="w-14 h-14 bg-[#7B519D]/10 rounded-full flex items-center justify-center">
                  <Phone size={28} className="text-[#7B519D]" />
                </div>
                <div>
                  <p className="font-inter text-white text-base font-semibold group-hover:text-[#7B519D] transition-colors">Viber</p>
                  <p className="font-inter text-[#A0A0A0] text-sm">+380 XX XXX XX XX</p>
                  <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">Дзвінки та повідомлення</p>
                </div>
              </a>

              <a href="https://instagram.com/gistore_ua" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#E8232A] rounded-xl p-5 transition-all group">
                <div className="w-14 h-14 bg-[#E8232A]/10 rounded-full flex items-center justify-center">
                  <Instagram size={28} className="text-[#E8232A]" />
                </div>
                <div>
                  <p className="font-inter text-white text-base font-semibold group-hover:text-[#E8232A] transition-colors">Instagram</p>
                  <p className="font-inter text-[#A0A0A0] text-sm">@gistore_ua</p>
                  <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">Фото, відео, Direct</p>
                </div>
              </a>

              <a href="mailto:doljanskiy3856@gmail.com"
                className="flex items-center gap-4 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-white rounded-xl p-5 transition-all group">
                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center">
                  <Mail size={28} className="text-[#A0A0A0]" />
                </div>
                <div>
                  <p className="font-inter text-white text-base font-semibold group-hover:text-white transition-colors">Email</p>
                  <p className="font-inter text-[#A0A0A0] text-sm">doljanskiy3856@gmail.com</p>
                  <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">Для оптових і ділових запитів</p>
                </div>
              </a>
            </div>

            {/* Working hours */}
            <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={18} className="text-[#E8232A]" />
                <h3 className="font-inter text-white text-sm font-semibold">Години роботи</h3>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-inter text-[#A0A0A0] text-sm">Пн–Пт</span>
                  <span className="font-inter text-white text-sm font-medium">9:00 – 20:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-inter text-[#A0A0A0] text-sm">Сб–Нд</span>
                  <span className="font-inter text-white text-sm font-medium">10:00 – 18:00</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-3 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-5">
              <MapPin size={18} className="text-[#E8232A] mt-0.5 shrink-0" />
              <div>
                <p className="font-inter text-white text-sm font-semibold">Доставка</p>
                <p className="font-inter text-[#A0A0A0] text-sm">Відправляємо Новою поштою по всій Україні</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="font-unbounded text-white text-xl font-black mb-6">Написати нам</h2>
            {sent ? (
              <div className="bg-[#1A1A1A] border border-[#E8232A] rounded-xl p-10 text-center">
                <div className="w-16 h-16 bg-[#E8232A] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-white" />
                </div>
                <h3 className="font-unbounded text-white text-lg font-bold mb-2">Повідомлення відправлено!</h3>
                <p className="font-inter text-[#A0A0A0] text-sm">Відповімо протягом 30 хвилин у робочий час.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-inter text-[#A0A0A0] text-sm mb-2">Ваше ім'я</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required
                    placeholder="Іван Іванченко"
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors placeholder:text-[#555]" />
                </div>
                <div>
                  <label className="block font-inter text-[#A0A0A0] text-sm mb-2">Повідомлення</label>
                  <textarea value={msg} onChange={e => setMsg(e.target.value)} required rows={5}
                    placeholder="Ваше запитання або замовлення..."
                    className="w-full bg-[#1A1A1A] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors resize-none placeholder:text-[#555]" />
                </div>
                <button type="submit"
                  className="w-full bg-[#E8232A] hover:bg-[#C41E24] text-white font-bold font-inter text-base py-4 rounded transition-all">
                  Надіслати в Telegram
                </button>
                <p className="font-inter text-[#A0A0A0] text-xs text-center">
                  Форма відкриє Telegram з готовим повідомленням
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
