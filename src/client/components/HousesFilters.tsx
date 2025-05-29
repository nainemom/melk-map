import { type FetchHousesFilters } from "@/client/api";
import { useEffect, useState } from "react";

type Filters = Omit<FetchHousesFilters, 'polygon'>;

export function HousesFilters({ value: _value, onChange }: { value: Filters, onChange?: (newValue: Filters) => void }) {
  const [value, setValue] = useState<Filters>(_value);

  useEffect(() => {
    console.log(value)
    onChange?.(value);
  }, [onChange, value]);
  return (
    <div className="flex flex-col justify-between items-stretch gap-6">

      <label className="input w-full">
        <span className="label">Minimum Size</span>
        <input type="number" min={10} max={value.size?.[1] ?? 400} value={value.size?.[0] ?? 30} onChange={e => setValue(p => ({ ...p, size: [(e.target.valueAsNumber ?? 0), p?.size?.[1] ?? (e.target.valueAsNumber ?? 0) + 10]}))} step="5" />
      </label>

      <label className="input w-full">
        <span className="label">Maximum Size</span>
        <input type="number" min={value.size?.[0] ?? 10} max={400} value={value.size?.[1] ?? 120} onChange={e => setValue(p => ({ ...p, size: [p?.size?.[0] ?? (e.target.valueAsNumber ?? 0) - 10, (e.target.valueAsNumber ?? 0)]}))} step="5" />
      </label>

      <div className="flex items-center gap-2 flex-nowrap w-full justify-between">
        <label className="label">
          <input type="checkbox" defaultChecked={value.parking} onChange={e => setValue(p => ({ ...p, parking: e.target.checked || undefined }))} className="toggle" />
          Parking
        </label>
        <label className="label">
          <input type="checkbox" defaultChecked={value.elevator} onChange={e => setValue(p => ({ ...p, elevator: e.target.checked || undefined }))} className="toggle" />
          Elevator
        </label>
        <label className="label">
          <input type="checkbox" defaultChecked={value.balcony} onChange={e => setValue(p => ({ ...p, balcony: e.target.checked || undefined }))} className="toggle" />
          Balcony
        </label>
      </div>

      <label className="w-full select">
        <span className="label">Advertizer</span>
        <select value={value.advertizer ?? ''} onChange={e => setValue(p => ({ ...p, advertizer: (e.target.value || undefined) as never }))}>
          <option value="">All</option>
          <option value="person">Normal Person</option>
          <option value="business">Amlakee</option>
        </select>
      </label>
    </div>
  )
}