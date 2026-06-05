import { useState } from 'react';
import { Link } from 'wouter';
import { MessageCircle, Phone, Instagram, Mail, MapPin, ChevronDown } from 'lucide-react';

const catalogLinks = [
  { href: '/category/karate',       label: 'Кімоно для карате' },
  { href: '/category/judo',         label: 'Кімоно для дзюдо' },
  { href: '/category/bjj',          label: 'Гі для BJJ' },
  { href: '/category/children',     label: 'Дитячі кімоно' },
  { href: '/category/bags',         label: 'Сумки та рюкзаки' },
  { href: '/category/accessories',  label: 'Аксесуари' },
  { href: '/category/trainers',     label: 'Тренажери' },
  { href: '/trenery',               label: 'Тренерам і клубам' },
];

const infoLinks = [
  { href: '/dostavka', label: 'Доставка та обмін' },
  { href: '/kontakty', label: 'Контакти' },
  { href: '/offer',   label: 'Публічна оферта' },
  { href: '/privacy', label: 'Політика конфіденційності' },
];

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1E1E1E] lg:border-none">
      {/* Mobile toggle */}
      <button
        className="lg:hidden w-full flex items-center justify-between py-3.5 text-left"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span className="font-unbounded text-white text-[11px] font-bold uppercase tracking-wider">{title}</span>
        <ChevronDown
          size={15}
          className={`text-[#505050] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Desktop always visible */}
      <div className="hidden lg:block">
        <h4 className="font-unbounded text-white text-sm font-bold mb-5 uppercase tracking-wider">{title}</h4>
        {children}
      </div>

      {/* Mobile collapsible */}
      <div className={`lg:hidden overflow-hidden transition-all duration-200 ${open ? 'max-h-64 pb-3' : 'max-h-0'}`}>
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#0F0F0F] border-t border-[#2E2E2E] pt-8 pb-6 lg:pt-16 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Brand row — always visible */}
        <div className="flex items-start justify-between mb-6 lg:mb-0 lg:hidden">
          <div>
            <div className="mb-2">
              <img src="/logo/giwear-logo-header.svg" alt="GIWEAR" className="h-6 w-auto object-contain" />
            </div>
            <p className="text-[#606060] text-[12px] font-inter leading-relaxed max-w-[200px]">
              Кімоно та гі для єдиноборств в Україні
            </p>
          </div>
          <div className="flex gap-2.5 mt-1">
            <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#2AABEE] rounded-lg flex items-center justify-center transition-all">
              <MessageCircle size={16} className="text-[#2AABEE]" />
            </a>
            <a href="viber://chat?number=%2B380668564845"
              className="w-9 h-9 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#7B519D] rounded-lg flex items-center justify-center transition-all">
              <Phone size={16} className="text-[#7B519D]" />
            </a>
            <a href="https://instagram.com/gistore_ua" target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#E8232A] rounded-lg flex items-center justify-center transition-all">
              <Instagram size={16} className="text-[#E8232A]" />
            </a>
          </div>
        </div>

        {/* Desktop grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <img src="/logo/giwear-logo-header.svg" alt="GIWEAR" className="h-8 w-auto object-contain" />
            </div>
            <p className="text-[#A0A0A0] text-sm font-inter leading-relaxed mb-5">
              Кімоно та гі для єдиноборств. Карате, дзюдо, BJJ, айкідо — для дітей і дорослих. Доставка по всій Україні.
            </p>
            <div className="flex gap-3">
              <a href="https://t.me/gistore_ua" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#2AABEE] rounded flex items-center justify-center transition-all">
                <MessageCircle size={18} className="text-[#2AABEE]" />
              </a>
              <a href="viber://chat?number=%2B380668564845"
                className="w-10 h-10 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#7B519D] rounded flex items-center justify-center transition-all">
                <Phone size={18} className="text-[#7B519D]" />
              </a>
              <a href="https://instagram.com/gistore_ua" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1A1A1A] border border-[#2E2E2E] hover:border-[#E8232A] rounded flex items-center justify-center transition-all">
                <Instagram size={18} className="text-[#E8232A]" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-unbounded text-white text-sm font-bold mb-5 uppercase tracking-wider">Каталог</h4>
            <ul className="space-y-3">
              {catalogLinks.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#A0A0A0] text-sm font-inter hover:text-[#E8232A] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-unbounded text-white text-sm font-bold mb-5 uppercase tracking-wider">Інформація</h4>
            <ul className="space-y-3">
              {infoLinks.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#A0A0A0] text-sm font-inter hover:text-[#E8232A] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-unbounded text-white text-sm font-bold mb-5 uppercase tracking-wider">Контакти</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MessageCircle size={18} className="text-[#E8232A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[#A0A0A0] text-xs mb-1">Telegram/Viber</p>
                  <a href="https://t.me/gistore_ua" className="text-white text-sm font-medium hover:text-[#E8232A]">@gistore_ua</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={18} className="text-[#E8232A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[#A0A0A0] text-xs mb-1">Email</p>
                  <a href="mailto:doljanskiy3856@gmail.com" className="text-white text-sm font-medium hover:text-[#E8232A]">doljanskiy3856@gmail.com</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#E8232A] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[#A0A0A0] text-xs mb-1">Доставка</p>
                  <p className="text-white text-sm font-medium">По всій Україні</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Mobile accordion sections */}
        <div className="lg:hidden border-t border-[#1E1E1E]">
          <AccordionSection title="Каталог">
            <ul className="space-y-2.5">
              {catalogLinks.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#808080] text-[13px] font-inter hover:text-[#E8232A] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Інформація">
            <ul className="space-y-2.5">
              {infoLinks.map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[#808080] text-[13px] font-inter hover:text-[#E8232A] transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </AccordionSection>

          <AccordionSection title="Контакти">
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5">
                <MessageCircle size={14} className="text-[#E8232A] shrink-0" />
                <a href="https://t.me/gistore_ua" className="text-[#808080] text-[13px] font-inter hover:text-white">
                  @gistore_ua
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-[#E8232A] shrink-0" />
                <a href="mailto:doljanskiy3856@gmail.com" className="text-[#808080] text-[13px] font-inter hover:text-white">
                  doljanskiy3856@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={14} className="text-[#E8232A] shrink-0" />
                <span className="text-[#808080] text-[13px] font-inter">По всій Україні</span>
              </li>
            </ul>
          </AccordionSection>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1E1E1E] pt-4 lg:pt-8 mt-4 lg:mt-0 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[#505050] text-[11px] lg:text-sm font-inter">
            © 2025 GIWEAR. Усі права захищено.
          </p>
          <p className="text-[#505050] text-[11px] lg:text-sm font-inter">
            Доставка Новою поштою по всій Україні
          </p>
        </div>
      </div>
    </footer>
  );
}
