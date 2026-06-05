import { useEffect } from 'react';
import { useLocation } from 'wouter';

const CATEGORY_PATHS = ['/category/karate', '/category/judo', '/category/bjj', '/category/children', '/category/dytiachy'];

export default function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    // Category pages handle their own scroll to #products
    if (CATEGORY_PATHS.includes(location)) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location]);

  return null;
}
