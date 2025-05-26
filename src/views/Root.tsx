import { Badge, Button } from '@radix-ui/themes';
import { Map } from 'react-map-gl/maplibre';
import { useState } from 'react'
import { VscRunAbove, VscSettingsGear } from 'react-icons/vsc';

export function Root() {
  const [count, setCount] = useState(0);

  return (
    <div className='w-svw h-svh'>
      <Map
        initialViewState={{
          latitude: 35.7342253,
          longitude: 51.4834774,
          zoom: 14
        }}
        mapStyle="https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json"
      >
        <div className='absolute bottom-0 left-0 w-full p-3 flex items-center justify-center gap-2'>
          <Button onClick={() => setCount((count) => count + 1)} color='gray' size='3' variant='classic'>
            <VscSettingsGear />
            Options
            <Badge color='red' variant='solid' size='1'>{count}</Badge>
          </Button>
          <Button onClick={() => setCount(0)} color='blue' size='3' variant='classic'>
            <VscRunAbove />
            Start
          </Button>
        </div>

      </Map>
    </div>
  )
}
