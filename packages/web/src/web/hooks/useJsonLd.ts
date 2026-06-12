import { useEffect } from 'react';

export function useJsonLd(key: string, schema: object | object[] | null): void {
  useEffect(() => {
    if (!schema) return;
    const id = `jsonld-${key}`;
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(schema);
    return () => {
      document.getElementById(id)?.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, JSON.stringify(schema)]);
}
