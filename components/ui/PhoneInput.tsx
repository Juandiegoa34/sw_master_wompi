"use client";

import { useState } from "react";

interface Country {
  flag: string;
  name: string;
  dialCode: string;
}

const COUNTRIES: Country[] = [
  { flag: "🇨🇴", name: "Colombia", dialCode: "+57" },
  { flag: "🇲🇽", name: "México", dialCode: "+52" },
  { flag: "🇻🇪", name: "Venezuela", dialCode: "+58" },
  { flag: "🇦🇷", name: "Argentina", dialCode: "+54" },
  { flag: "🇨🇱", name: "Chile", dialCode: "+56" },
  { flag: "🇵🇪", name: "Perú", dialCode: "+51" },
  { flag: "🇪🇨", name: "Ecuador", dialCode: "+593" },
  { flag: "🇧🇴", name: "Bolivia", dialCode: "+591" },
  { flag: "🇵🇾", name: "Paraguay", dialCode: "+595" },
  { flag: "🇺🇾", name: "Uruguay", dialCode: "+598" },
  { flag: "🇵🇦", name: "Panamá", dialCode: "+507" },
  { flag: "🇨🇷", name: "Costa Rica", dialCode: "+506" },
  { flag: "🇬🇹", name: "Guatemala", dialCode: "+502" },
  { flag: "🇭🇳", name: "Honduras", dialCode: "+504" },
  { flag: "🇸🇻", name: "El Salvador", dialCode: "+503" },
  { flag: "🇳🇮", name: "Nicaragua", dialCode: "+505" },
  { flag: "🇺🇸", name: "Estados Unidos", dialCode: "+1" },
  { flag: "🇩🇴", name: "Rep. Dominicana", dialCode: "+1" },
  { flag: "🇨🇺", name: "Cuba", dialCode: "+53" },
  { flag: "🇪🇸", name: "España", dialCode: "+34" },
];

const DEFAULT_COUNTRY = COUNTRIES[0];

function getOptionValue(country: Country): string {
  return `${country.dialCode}|${country.name}`;
}

function findCountryByOptionValue(optionValue: string): Country {
  const found = COUNTRIES.find((c) => getOptionValue(c) === optionValue);
  return found ?? DEFAULT_COUNTRY;
}

function detectCountryFromValue(fullValue: string): Country {
  // Try to find the longest matching dialCode prefix
  const sorted = [...COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );
  return sorted.find((c) => fullValue.startsWith(c.dialCode)) ?? DEFAULT_COUNTRY;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  error?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  placeholder = "300 123 4567",
  id,
  error = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(() =>
    value ? detectCountryFromValue(value) : DEFAULT_COUNTRY
  );

  const activeCountry = value ? selectedCountry : DEFAULT_COUNTRY;

  const digits = value.startsWith(activeCountry.dialCode)
    ? value.slice(activeCountry.dialCode.length)
    : "";

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newCountry = findCountryByOptionValue(e.target.value);
    setSelectedCountry(newCountry);
    onChange(newCountry.dialCode + digits);
  }

  function handleDigitsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    onChange(activeCountry.dialCode + raw);
  }

  const borderClass = error
    ? "border-sw-burgundy focus-within:border-sw-burgundy"
    : "border-[--sw-line-strong] focus-within:border-[--accent]";

  return (
    <div
      className={`flex items-center rounded-lg border overflow-hidden transition-colors ${borderClass}`}
    >
      {/* Country selector */}
      <div className="relative flex-shrink-0">
        <select
          value={getOptionValue(activeCountry)}
          onChange={handleCountryChange}
          aria-label="Código de país"
          className="appearance-none bg-gray-50 border-r border-[--sw-line-strong] pl-3 pr-7 py-2.5 text-sm text-gray-700 cursor-pointer focus:outline-none"
        >
          {COUNTRIES.map((country) => (
            <option key={getOptionValue(country)} value={getOptionValue(country)}>
              {country.flag} {country.dialCode}
            </option>
          ))}
        </select>
        {/* Caret overlay */}
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-500 text-xs">
          ▾
        </span>
      </div>

      {/* Number input */}
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        value={digits}
        onChange={handleDigitsChange}
        placeholder={placeholder}
        className="flex-1 px-3 py-2.5 text-sm focus:outline-none bg-transparent"
      />
    </div>
  );
}

export default PhoneInput;
