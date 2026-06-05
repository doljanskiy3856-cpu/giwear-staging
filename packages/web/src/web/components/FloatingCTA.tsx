import { MessageCircle, Phone } from 'lucide-react';

export default function FloatingCTA() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#0F0F0F]/95 backdrop-blur-md border-t border-[#2E2E2E] px-4 py-3">
      <div className="flex gap-3">
        <a
          href="https://t.me/gistore_ua"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#1A1A1A] border border-[#2E2E2E] text-white text-sm font-bold py-3 rounded"
        >
          <MessageCircle size={18} className="text-[#2AABEE]" />
          Telegram
        </a>
        <a
          href="viber://chat?number=%2B380668564845"
          className="flex-1 flex items-center justify-center gap-2 bg-[#E8232A] text-white text-sm font-bold py-3 rounded"
        >
          <Phone size={18} />
          Viber
        </a>
        <a
          href="https://instagram.com/gistore_ua"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white text-sm font-bold py-3 rounded"
        >
          Instagram
        </a>
      </div>
    </div>
  );
}
