import { getMapStyles } from "@/api/map";
import { Select } from "@radix-ui/themes";
import { useEffect, type ComponentProps } from "react";
import { useAsync } from "react-use";

export function MapStyleSelect({ disabled, ...props }: ComponentProps<typeof Select.Root>) {
  const mapStyles = useAsync(() => getMapStyles());
  useEffect(() => {
    if (!props.value && mapStyles.value?.[0].value) {
      props.onValueChange?.(mapStyles.value?.[0].value);
    }
  }, [mapStyles.value, props, props.value]);

  return (
    <Select.Root disabled={disabled ?? (!!mapStyles.error || mapStyles.loading)} defaultValue={mapStyles.value?.[0].value} {...props}>
      <Select.Trigger />
      <Select.Content>
        {mapStyles.value?.map((mapStyle) => (
          <Select.Item value={mapStyle.value} key={mapStyle.value}>{mapStyle.name}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  )
}