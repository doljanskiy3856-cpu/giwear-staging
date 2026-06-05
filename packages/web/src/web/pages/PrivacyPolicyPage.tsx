import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-unbounded text-white text-base lg:text-lg font-bold mb-4 pb-2 border-b border-[#2E2E2E]">
        {title}
      </h2>
      <div className="space-y-3 font-inter text-[#B0B0B0] text-sm lg:text-[15px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function UL({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-[#E8232A] mt-1.5 shrink-0" style={{ fontSize: 6, lineHeight: 1 }}>●</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] pt-20 lg:pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs font-inter text-[#505050] mb-8" aria-label="breadcrumb">
          <Link href="/" className="hover:text-[#E8232A] transition-colors">Головна</Link>
          <ChevronRight size={12} />
          <span className="text-[#808080]">Політика конфіденційності</span>
        </nav>

        {/* Title */}
        <div className="mb-10">
          <span className="inline-block text-[#E8232A] font-inter text-xs font-semibold uppercase tracking-widest mb-3">
            Юридична інформація
          </span>
          <h1 className="font-unbounded text-white text-2xl lg:text-3xl font-black leading-snug">
            Політика конфіденційності
          </h1>
          <p className="font-inter text-[#606060] text-sm mt-3">
            Інтернет-магазин GIWEAR · Дата оновлення: 01.06.2026
          </p>
        </div>

        <Section title="1. Загальні положення">
          <P>1.1. Ця Політика конфіденційності пояснює, які персональні дані збирає інтернет-магазин GIWEAR, як вони використовуються, зберігаються та захищаються.</P>
          <P>1.2. Користуючись сайтом GIWEAR, оформлюючи замовлення або звертаючись через месенджери, Покупець погоджується з умовами цієї Політики конфіденційності.</P>
          <P>
            1.3. Обробка персональних даних здійснюється відповідно до Закону України «Про захист персональних даних» та умов{' '}
            <Link href="/offer" className="text-[#E8232A] hover:underline">Публічної оферти</Link>.
          </P>
        </Section>

        <Section title="2. Які дані збираються">
          <P>2.1. GIWEAR може збирати такі дані:</P>
          <UL items={[
            "ім\u2019я та прізвище;",
            'номер телефону;',
            'email;',
            'місто доставки;',
            'відділення, поштомат або адресу доставки;',
            'дані замовлення;',
            'історію комунікації з менеджером;',
            'технічні дані сайту (якщо вони збираються системою аналітики).',
          ]} />
        </Section>

        <Section title="3. Мета обробки даних">
          <P>3.1. Дані використовуються для:</P>
          <UL items={[
            'оформлення та обробки замовлення;',
            'доставки товару;',
            'проведення оплати;',
            "зв\u2019язку з Покупцем;",
            'консультації щодо розміру або товару;',
            'обміну або повернення товару;',
            'покращення роботи сайту та сервісу.',
          ]} />
        </Section>

        <Section title="4. Передача даних третім особам">
          <P>4.1. GIWEAR не продає персональні дані третім особам.</P>
          <P>4.2. Дані можуть передаватися лише тоді, коли це необхідно для виконання замовлення:</P>
          <UL items={[
            'Новій Пошті або іншому перевізнику;',
            'LiqPay або платіжним сервісам;',
            'банківським або фінансовим установам;',
            'технічним сервісам, що забезпечують роботу сайту;',
            'державним органам у випадках, передбачених законодавством.',
          ]} />
        </Section>

        <Section title="5. Зберігання даних">
          <P>5.1. Дані зберігаються протягом строку, необхідного для виконання замовлення, бухгалтерського обліку, гарантійних звернень, обміну, повернення або інших законних цілей.</P>
          <P>5.2. GIWEAR вживає розумних заходів для захисту персональних даних від втрати, несанкціонованого доступу або розголошення.</P>
        </Section>

        <Section title="6. Права користувача">
          <P>6.1. Користувач має право звернутися до GIWEAR щодо:</P>
          <UL items={[
            'уточнення своїх персональних даних;',
            'виправлення неточних даних;',
            'видалення даних, якщо це не суперечить законодавству або необхідності виконання замовлення;',
            'отримання інформації щодо обробки персональних даних.',
          ]} />
          <P>6.2. Для реалізації своїх прав Покупець може звернутися до Продавця через контакти, зазначені нижче.</P>
        </Section>

        <Section title="7. Контакти">
          <P>З питань обробки персональних даних можна звернутися:</P>
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl p-4 lg:p-5 space-y-2 font-inter text-sm mt-2">
            <p className="text-white font-semibold text-base mb-3">GIWEAR</p>
            <p className="text-[#B0B0B0]">
              Email:{' '}
              <a href="mailto:doljanskiy3856@gmail.com" className="text-[#E8232A] hover:underline">
                doljanskiy3856@gmail.com
              </a>
            </p>
            <p className="text-[#B0B0B0]">
              Телефон:{' '}
              <a href="tel:+380668564845" className="text-[#E8232A] hover:underline">
                +380 66 856 48 45
              </a>
            </p>
            <p className="text-[#B0B0B0]">
              Telegram / Viber / WhatsApp:{' '}
              <a href="tel:+380668564845" className="text-[#E8232A] hover:underline">
                +380 66 856 48 45
              </a>
            </p>
          </div>
        </Section>

      </div>
    </div>
  );
}
