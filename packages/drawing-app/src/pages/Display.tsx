import { useEffect, useState } from 'react'
import 'tldraw/tldraw.css'
import { TlDisplay } from '../parts/Tlremote'

export default function DisplayPage() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    const fetchIds = async () => {
      const res = await fetch('/api/v1/list_doc')
      const { docs } = await res.json()
      setIds(docs)
    }
    const handle = setInterval(fetchIds, 500)
    fetchIds()
    return () => clearInterval(handle)
  }, [])

  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      <div className='absolute flex flex-wrap inset-0 overflow-auto'>
        {ids.map((id) => (
          <div key={id} className='w-full text-center'>
            <p>{id}</p>
            <TlDisplay
              docId={id}
              className='flex w-full items-center justify-center'
            />
          </div>
        ))}
      </div>
    </div>
  )
}
