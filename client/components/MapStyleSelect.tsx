import { getMapStyles } from "@/api/map";
import { Select } from "@radix-ui/themes";
import type { ComponentProps } from "react";
import { useAsync } from "react-use";

export function MapStyleSelect({ disabled, ...props }: ComponentProps<typeof Select.Root>) {
  const mapStyles = useAsync(() => getMapStyles());
  return (
    <Select.Root disabled={disabled ?? (!!mapStyles.error || mapStyles.loading)} {...props}>
      <Select.Trigger />
      <Select.Content>
        {mapStyles.value?.map((mapStyle) => (
          <Select.Item value={mapStyle.value} key={mapStyle.value}>{mapStyle.name}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}