import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, ChevronDown, X, Loader2 } from 'lucide-react';

type City = { ref: string; name: string; area: string; type: string };
type Warehouse = { ref: string; name: string; number: string; type: string };

interface Props {
  onCityChange: (city: City | null) => void;
  onWarehouseChange: (warehouse: Warehouse | null) => void;
  deliveryType: 'nova-poshta' | 'courier';
  onAddressChange: (address: string) => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function NovaPoshtaPicker({ onCityChange, onWarehouseChange, deliveryType, onAddressChange }: Props) {
  // City
  const [cityInput, setCityInput] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCities, setShowCities] = useState(false);

  // Warehouse
  const [whInput, setWhInput] = useState('');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWh, setSelectedWh] = useState<Warehouse | null>(null);
  const [whLoading, setWhLoading] = useState(false);
  const [showWh, setShowWh] = useState(false);

  // Address (courier)
  const [address, setAddress] = useState('');

  const debouncedCity = useDebounce(cityInput, 300);
  const debouncedWh = useDebounce(whInput, 300);

  const cityRef = useRef<HTMLDivElement>(null);
  const whRef = useRef<HTMLDivElement>(null);

  // Fetch cities
  useEffect(() => {
    if (!debouncedCity || debouncedCity.length < 2 || selectedCity?.name === debouncedCity) {
      setCities([]);
      return;
    }
    setCityLoading(true);
    fetch(`/api/np/cities?q=${encodeURIComponent(debouncedCity)}`)
      .then(r => r.json())
      .then((data: City[]) => { setCities(data); setShowCities(true); })
      .finally(() => setCityLoading(false));
  }, [debouncedCity]);

  // Fetch warehouses
  useEffect(() => {
    if (!selectedCity) return;
    setWhLoading(true);
    fetch(`/api/np/warehouses?cityRef=${selectedCity.ref}&q=${encodeURIComponent(debouncedWh)}`)
      .then(r => r.json())
      .then((data: Warehouse[]) => { setWarehouses(data); })
      .finally(() => setWhLoading(false));
  }, [selectedCity, debouncedWh]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) setShowCities(false);
      if (whRef.current && !whRef.current.contains(e.target as Node)) setShowWh(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectCity = (city: City) => {
    setSelectedCity(city);
    setCityInput(city.name);
    setShowCities(false);
    setCities([]);
    setSelectedWh(null);
    setWhInput('');
    setWarehouses([]);
    onCityChange(city);
    onWarehouseChange(null);
  };

  const clearCity = () => {
    setSelectedCity(null);
    setCityInput('');
    setCities([]);
    setSelectedWh(null);
    setWhInput('');
    setWarehouses([]);
    onCityChange(null);
    onWarehouseChange(null);
  };

  const selectWh = (wh: Warehouse) => {
    setSelectedWh(wh);
    setWhInput(wh.name);
    setShowWh(false);
    onWarehouseChange(wh);
  };

  const clearWh = () => {
    setSelectedWh(null);
    setWhInput('');
    onWarehouseChange(null);
  };

  const getWhIcon = (type: string) => {
    if (type?.includes('Поштомат')) return '📦';
    return '🏪';
  };

  return (
    <div className="space-y-4">
      {/* City picker */}
      <div ref={cityRef} className="relative">
        <label className="block font-inter text-[#A0A0A0] text-sm mb-2">
          Місто або населений пункт *
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
          <input
            type="text"
            value={cityInput}
            onChange={e => { setCityInput(e.target.value); setSelectedCity(null); onCityChange(null); }}
            onFocus={() => cities.length > 0 && setShowCities(true)}
            required
            placeholder="Наприклад: Київ, Підгородне..."
            className="w-full bg-[#0F0F0F] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm pl-9 pr-9 py-3 rounded outline-none transition-colors placeholder:text-[#555]"
          />
          {cityLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] animate-spin" />}
          {selectedCity && !cityLoading && (
            <button type="button" onClick={clearCity} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>

        {/* City dropdown */}
        {showCities && cities.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl overflow-hidden shadow-2xl max-h-64 overflow-y-auto">
            {cities.map(city => (
              <button
                key={city.ref}
                type="button"
                onClick={() => selectCity(city)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#242424] transition-colors text-left border-b border-[#2E2E2E] last:border-0"
              >
                <MapPin size={16} className="text-[#E8232A] shrink-0 mt-0.5" />
                <div>
                  <p className="font-inter text-white text-sm font-medium">{city.name}</p>
                  <p className="font-inter text-[#A0A0A0] text-xs">{city.area} область · {city.type}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected city tag */}
        {selectedCity && (
          <div className="mt-2 inline-flex items-center gap-2 bg-[#E8232A]/10 border border-[#E8232A]/30 rounded-lg px-3 py-1.5">
            <MapPin size={12} className="text-[#E8232A]" />
            <span className="font-inter text-white text-xs font-medium">{selectedCity.name}, {selectedCity.area} обл.</span>
          </div>
        )}
      </div>

      {/* Warehouse or Address */}
      {selectedCity && deliveryType === 'nova-poshta' && (
        <div ref={whRef} className="relative">
          <label className="block font-inter text-[#A0A0A0] text-sm mb-2">
            Відділення або поштомат *
          </label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              type="text"
              value={whInput}
              onChange={e => { setWhInput(e.target.value); setSelectedWh(null); onWarehouseChange(null); }}
              onFocus={() => setShowWh(true)}
              required
              placeholder="Номер або адреса відділення..."
              className="w-full bg-[#0F0F0F] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm pl-9 pr-9 py-3 rounded outline-none transition-colors placeholder:text-[#555]"
            />
            {whLoading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] animate-spin" />}
            {selectedWh && !whLoading && (
              <button type="button" onClick={clearWh} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A0A0A0] hover:text-white">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Warehouse dropdown */}
          {showWh && warehouses.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl overflow-hidden shadow-2xl max-h-72 overflow-y-auto">
              {warehouses
                .filter(w => !whInput || w.name.toLowerCase().includes(whInput.toLowerCase()))
                .map(wh => (
                  <button
                    key={wh.ref}
                    type="button"
                    onClick={() => selectWh(wh)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#242424] transition-colors text-left border-b border-[#2E2E2E] last:border-0"
                  >
                    <span className="text-base shrink-0 mt-0.5">{getWhIcon(wh.type)}</span>
                    <div>
                      <p className="font-inter text-white text-sm font-medium leading-tight">{wh.name}</p>
                      <p className="font-inter text-[#A0A0A0] text-xs mt-0.5">{wh.type}</p>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Courier address */}
      {selectedCity && deliveryType === 'courier' && (
        <div>
          <label className="block font-inter text-[#A0A0A0] text-sm mb-2">Адреса доставки *</label>
          <input
            type="text"
            value={address}
            onChange={e => { setAddress(e.target.value); onAddressChange(e.target.value); }}
            required
            placeholder="вул. Центральна, 12, кв. 5"
            className="w-full bg-[#0F0F0F] border border-[#2E2E2E] focus:border-[#E8232A] text-white font-inter text-sm px-4 py-3 rounded outline-none transition-colors placeholder:text-[#555]"
          />
        </div>
      )}
    </div>
  );
}
