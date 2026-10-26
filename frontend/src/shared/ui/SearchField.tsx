import { useRef } from "react";
import { useTranslation } from "react-i18next";

import { FIELD_BOX } from "./fieldParts";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

interface SearchFieldProps {
  /** Spoken name of the box; the placeholder shows an example instead of a visible label. */
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

/** A search box with «Очистить»; clearing keeps the focus for the next word. */
export function SearchField({ label, placeholder, value, onChange }: SearchFieldProps) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className={`${FIELD_BOX} border-line-control pr-1`}>
      <Icon name="search" className="size-5 shrink-0 text-muted" />
      <input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent py-3 outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
      />
      {value !== "" && (
        <IconButton
          icon="close"
          label={t("ui.clear")}
          onClick={() => {
            onChange("");
            input.current?.focus();
          }}
        />
      )}
    </div>
  );
}
