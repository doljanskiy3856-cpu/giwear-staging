import { Link } from 'wouter';
import { Truck, RefreshCw, CreditCard, MapPin, Package2, AlertCircle } from 'lucide-react';
import TrustBar from '../components/TrustBar';
import { VisaSVG, MastercardSVG, GooglePaySVG, ApplePaySVG, LiqPaySVG } from '../components/PaymentIcons';

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F]">

      {/* Hero */}
      <section className="pt-24 pb-12 bg-[#0F0F0F] border-b border-[#2E2E2E]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[#A0A0A0] text-sm font-inter mb-4">
            <Link href="/" className="hover:text-[#E8232A]">Головна</Link>
            <span>/</span>
            <span className="text-white">Доставка, оплата та обмін</span>
          </div>
          <span className="section-label">Умови роботи</span>
          <h1 className="font-unbounded text-3xl lg:text-5xl font-black text-white mb-3">Доставка, оплата та обмін</h1>
          <p className="font-inter text-[#A0A0A0] text-base">Нова Пошта по всій Україні. Онлайн-оплата LiqPay. Обмін 14 днів без питань.</p>
        </div>
      </section>

      <TrustBar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">

        {/* Delivery */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E8232A] rounded-lg flex items-center justify-center">
              <Truck size={20} className="text-white" />
            </div>
            <h2 className="font-unbounded text-white text-xl font-black">Доставка</h2>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6 space-y-5">

            {[
              {
                icon: Package2,
                title: 'Нова Пошта — кур\'єр',
                desc: 'Адресна доставка до дверей. Доступно у більшості міст України. Вартість — за тарифами перевізника.',
              },
              {
                icon: MapPin,
                title: 'Нова Пошта — відділення',
                desc: 'Доставка до найближчого відділення по всій Україні. Вартість — за тарифами перевізника.',
              },
              {
                icon: MapPin,
                title: 'Нова Пошта — поштомат',
                desc: 'Зручне самостійне отримання у поштоматі 24/7. Вартість — за тарифами перевізника.',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="w-8 h-8 bg-[#E8232A]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={16} className="text-[#E8232A]" />
                </div>
                <div>
                  <p className="font-inter text-white text-sm font-semibold">{item.title}</p>
                  <p className="font-inter text-[#A0A0A0] text-sm mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E8232A] rounded-lg flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <h2 className="font-unbounded text-white text-xl font-black">Оплата</h2>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6 space-y-5">

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#E8232A]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <Package2 size={16} className="text-[#E8232A]" />
              </div>
              <div>
                <p className="font-inter text-white text-sm font-semibold">Оплата при отриманні</p>
                <p className="font-inter text-[#A0A0A0] text-sm mt-0.5">Накладений платіж — оплата готівкою або карткою у відділенні Нової Пошти. Комісія НП — за тарифами перевізника.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 bg-[#E8232A]/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard size={16} className="text-[#E8232A]" />
              </div>
              <div>
                <p className="font-inter text-white text-sm font-semibold">Онлайн-оплата через LiqPay</p>
                <p className="font-inter text-[#A0A0A0] text-sm mt-0.5">Безпечна онлайн-оплата. Підтримуються:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                    <VisaSVG width={34} />
                  </div>
                  <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                    <MastercardSVG size={28} />
                  </div>
                  <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                    <GooglePaySVG height={16} />
                  </div>
                  <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                    <ApplePaySVG height={16} />
                  </div>
                  <div className="inline-flex items-center justify-center h-7 px-2.5 bg-[#252525] border border-[#383838] rounded-md">
                    <LiqPaySVG height={16} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Return / exchange */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#E8232A] rounded-lg flex items-center justify-center">
              <RefreshCw size={20} className="text-white" />
            </div>
            <h2 className="font-unbounded text-white text-xl font-black">Обмін і повернення</h2>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-6 space-y-5">
            <div className="bg-[#E8232A]/10 border border-[#E8232A]/30 rounded-lg p-4">
              <p className="font-unbounded text-white text-sm font-bold mb-1">14 днів без питань</p>
              <p className="font-inter text-[#A0A0A0] text-sm">Протягом 14 днів після отримання можна повернути або обміняти товар. Обмін розміру доступний.</p>
            </div>

            <div>
              <h3 className="font-inter text-white text-sm font-semibold mb-3">Умови</h3>
              <ul className="space-y-2">
                {[
                  'Товар не носився і не був у використанні',
                  'Збережено оригінальний вигляд і упаковку',
                  'Є чек або скріншот замовлення',
                  'Обмін розміру — безкоштовно',
                  'Повернення коштів — протягом 3–5 робочих днів',
                ].map(t => (
                  <li key={t} className="flex items-start gap-2 font-inter text-[#A0A0A0] text-sm">
                    <div className="w-1.5 h-1.5 bg-[#E8232A] rounded-full mt-2 shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-inter text-white text-sm font-semibold mb-2">Як оформити</h3>
              <p className="font-inter text-[#A0A0A0] text-sm">
                Напишіть у{' '}
                <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer" className="text-[#E8232A] font-medium">Telegram</a>:{' '}
                вкажіть номер замовлення та причину. Підготуємо нову посилку або повернення коштів.
              </p>
            </div>
          </div>
        </section>

        {/* Note */}
        <div className="flex gap-3 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-5">
          <AlertCircle size={20} className="text-[#E8232A] shrink-0 mt-0.5" />
          <p className="font-inter text-[#A0A0A0] text-sm leading-relaxed">
            Є запитання? Напишіть у{' '}
            <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer" className="text-[#E8232A] font-medium">Telegram</a>{' '}
            — відповімо швидко.
          </p>
        </div>
      </div>
    </div>
  );
}
