import { Truck, RotateCcw, Shield, MessageCircle } from 'lucide-react';

const items = [
  { icon: Truck,         title: 'Доставка по Україні', desc: 'Нова пошта за 1–2 дні', dur: '5s',   delay: '0s'   },
  { icon: RotateCcw,     title: 'Обмін і повернення',  desc: '14 днів без питань',    dur: '5.5s', delay: '1.4s' },
  { icon: Shield,        title: 'Гарантія якості',      desc: 'Тільки перевірені бренди', dur: '6s', delay: '2.8s' },
  { icon: MessageCircle, title: 'Консультація',          desc: 'Telegram або Viber',   dur: '5s',   delay: '4.1s' },
];

export default function TrustBar() {
  return (
    <>
      <style>{`
        .trust-item {
          border-radius: 12px;
          padding: 10px 8px;
          transition: transform 200ms ease, background-color 200ms ease;
        }
        .trust-box {
          width: 44px;
          height: 44px;
          border-radius: 11px;
          background-color: rgba(232, 35, 42, 0.10);
          border: 1px solid rgba(232, 35, 42, 0.18);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background-color 200ms ease, border-color 200ms ease;
        }

        @media (hover: hover) {
          .trust-item:hover {
            transform: translateY(-2px);
            background-color: rgba(255, 255, 255, 0.03);
          }
          .trust-item:hover .trust-box {
            background-color: rgba(232, 35, 42, 0.18);
            border-color: rgba(232, 35, 42, 0.40);
          }
        }

        .trust-item:active .trust-box {
          background-color: rgba(232, 35, 42, 0.22);
          border-color: rgba(232, 35, 42, 0.50);
        }

        /* idle soft blink — only opacity + border-color, compositor-only */
        @keyframes trust-blink {
          0%, 100% {
            opacity: 1;
            border-color: rgba(232, 35, 42, 0.18);
            background-color: rgba(232, 35, 42, 0.10);
            transform: scale(1);
          }
          7% {
            opacity: 0.88;
            border-color: rgba(232, 35, 42, 0.60);
            background-color: rgba(232, 35, 42, 0.24);
            transform: scale(1.03);
          }
          14% {
            opacity: 1;
            border-color: rgba(232, 35, 42, 0.18);
            background-color: rgba(232, 35, 42, 0.10);
            transform: scale(1);
          }
        }

        @keyframes trust-icon-blink {
          0%, 100% { opacity: 0.75; }
          7%        { opacity: 1; }
          14%       { opacity: 0.75; }
        }

        .trust-box--blink {
          animation: trust-blink ease-in-out infinite;
        }
        .trust-box--blink > svg {
          opacity: 0.75;
          animation: trust-icon-blink ease-in-out infinite;
          animation-duration: inherit;
          animation-delay: inherit;
        }
        .trust-item:hover .trust-box--blink,
        .trust-item:active .trust-box--blink {
          animation: none;
          background-color: rgba(232, 35, 42, 0.18);
          border-color: rgba(232, 35, 42, 0.40);
          transform: scale(1);
        }
        .trust-item:hover .trust-box--blink > svg,
        .trust-item:active .trust-box--blink > svg {
          animation: none;
          opacity: 1;
        }

        @media (prefers-reduced-motion: reduce) {
          .trust-item { transition: none !important; transform: none !important; }
          .trust-box--blink,
          .trust-box--blink > svg { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      <div className="bg-[#1A1A1A] border-y border-[#2E2E2E] py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2">
            {items.map((item) => (
              <div key={item.title} className="trust-item flex items-center gap-3 min-w-0 cursor-default">
                <div
                  className="trust-box trust-box--blink"
                  style={{ animationDuration: item.dur, animationDelay: item.delay }}
                >
                  <item.icon size={20} strokeWidth={1.6} className="text-[#E8232A]" />
                </div>
                <div className="min-w-0">
                  <p className="font-unbounded text-white text-[10px] sm:text-[11px] font-bold leading-tight tracking-wide">
                    {item.title}
                  </p>
                  <p className="text-[#888] text-[9px] sm:text-[10px] font-inter mt-0.5 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
