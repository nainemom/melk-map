import { Badge, Button, Flex, Text } from '@radix-ui/themes';
import { useState } from 'react'
import { VscAdd, VscRefresh } from 'react-icons/vsc';

function App() {
  const [count, setCount] = useState(0);

  return (
    <Flex direction='column' align='center' justify='center' style={{ height: '100vh', width: '100vw' }}>
      <Text size="7" as='label' color='gold' weight="bold">Hello World</Text>
      <Flex direction='row' align='center' justify='center' gap='2'>
        <Button onClick={() => setCount((count) => count + 1)} color='blue' size='3' variant='classic'>
          <VscAdd />
          Add
          <Badge color='red' variant='solid' size='1'>{count}</Badge>
        </Button>
        <Button onClick={() => setCount(0)} color='gray' size='3' variant='classic'>
          <VscRefresh />
          Reset
        </Button>
      </Flex>
    </Flex>
  )
}

export default App
