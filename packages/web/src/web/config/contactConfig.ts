/**
 * Centralized contact / messenger config.
 * Set to empty string to hide that channel everywhere.
 */
const PHONE = '+380668564845';

export const CONTACT = {
  phone:        PHONE,
  phoneDisplay: '+380 66 856 48 45',
  telegram:     'https://t.me/gistore_ua',
  viber:        `viber://chat?number=${encodeURIComponent(PHONE)}`,
  whatsapp:     `https://wa.me/${PHONE.replace('+', '')}`,
  tel:          `tel:${PHONE}`,
} as const;
