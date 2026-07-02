'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * Autocomplétion ville via geo.api.gouv.fr (C3 : jamais de texte libre sur les
 * champs structurants). Retourne INSEE + CP + département + région + lat/lng.
 * Combobox accessible : role, aria-expanded, navigation clavier.
 */
export interface CityValue {
  cityName: string;
  inseeCode: string;
  postalCode: string;
  department: string;
  region: string;
  lat: number;
  lng: number;
}

interface ApiCommune {
  nom: string;
  code: string;
  codesPostaux: string[];
  departement?: { nom: string };
  region?: { nom: string };
  centre?: { coordinates: [number, number] };
}

export function CityAutocomplete({
  value,
  onChange,
  invalid,
}: {
  value: CityValue | null;
  onChange: (v: CityValue | null) => void;
  invalid?: boolean;
}) {
  const [query, setQuery] = useState(value?.cityName ?? '');
  const [options, setOptions] = useState<ApiCommune[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const listId = useId();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2 || query === value?.cityName) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const url = `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,departement,region,centre&boost=population&limit=8`;
        const res = await fetch(url, { signal: ctrl.signal });
        if (res.ok) {
          const data = (await res.json()) as ApiCommune[];
          setOptions(data);
          setOpen(true);
          setActive(-1);
        }
      } catch {
        /* réseau : silencieux, l'utilisateur retape */
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, value?.cityName]);

  function select(c: ApiCommune) {
    const coords = c.centre?.coordinates;
    onChange({
      cityName: c.nom,
      inseeCode: c.code,
      postalCode: c.codesPostaux[0] ?? '',
      department: c.departement?.nom ?? '',
      region: c.region?.nom ?? '',
      lat: coords ? coords[1] : 0,
      lng: coords ? coords[0] : 0,
    });
    setQuery(c.nom);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Ex. : Lyon, Nantes, Lille…"
        value={query}
        invalid={invalid}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null); // toute frappe invalide la sélection normalisée
        }}
        onKeyDown={(e) => {
          if (!open || options.length === 0) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, options.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === 'Enter' && active >= 0) {
            e.preventDefault();
            select(options[active]!);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {value && (
        <p className="mt-1 flex items-center gap-1 text-caption text-teal">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {value.cityName} ({value.postalCode}) · {value.region} — INSEE {value.inseeCode}
        </p>
      )}
      {open && (options.length > 0 || loading) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-navy/10 bg-white shadow-lift-lg"
        >
          {loading && <li className="px-3 py-2 text-caption text-grey">Recherche…</li>}
          {options.map((c, i) => (
            <li
              key={c.code}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={cn(
                'cursor-pointer px-3 py-2.5 text-body',
                i === active ? 'bg-ice text-blue' : 'text-navy hover:bg-ice',
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                select(c);
              }}
              onMouseEnter={() => setActive(i)}
            >
              {c.nom}{' '}
              <span className="text-caption text-grey">
                {c.codesPostaux[0]} · {c.departement?.nom}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
