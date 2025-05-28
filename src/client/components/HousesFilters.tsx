import { getCities, type GetAllHousesFilters } from "@/client/api";
import { useEffect, useState } from "react";
import { useAsync } from "react-use";

export function HousesFilters({ value: _value, onChange }: { value: GetAllHousesFilters, onChange?: (newValue: GetAllHousesFilters) => void }) {
  const [value, setValue] = useState<GetAllHousesFilters>(_value);

  const cities = useAsync(() => getCities());

  useEffect(() => {
    onChange?.(value);
  }, [onChange, value]);
  return (
    <div className="flex flex-col justify-between items-stretch gap-6">
      <label className="select w-full">
        <span className="label">City</span>
        <select value={value.cityId} onChange={e => setValue(p => ({ ...p, cityId: e.target.value}))}>
          { cities.value?.map((opt) => (
            <option key={opt.id} value={opt.id}>{opt.name}</option>
          ))}
        </select>
      </label>

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

      <label className="label w-full">
        <input type="checkbox" defaultChecked={!value.exact} onChange={e => setValue(p => ({ ...p, exact: e.target.checked}))} className="checkbox" />
        Approximate Search
      </label>
    </div>
  )
}