import React from "react";

interface ToggleProps {
  label: string;
  name: string;
  checked: boolean;
  onChange: (name: string, checked: boolean) => void;
  disabled?: boolean;
}

const Toggle: React.FC<ToggleProps> = ({
  label,
  name,
  checked,
  onChange,
  disabled = false,
}) => {
  return (
    <label className="flex items-center cursor-pointer">
      <div className="mr-3 text-gray-300">{label}</div>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(name, e.target.checked)}
          disabled={disabled}
        />
        <div
          className={`block w-10 h-6 rounded-full ${
            checked ? "bg-yellow-300" : "bg-gray-600"
          }`}
        ></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${
            checked ? "transform translate-x-4" : ""
          }`}
        ></div>
      </div>
    </label>
  );
};

export default Toggle;
