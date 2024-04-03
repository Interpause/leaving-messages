import 'tldraw/tldraw.css'
import { TlDisplay } from '../parts/Tlremote'

const subList = ['room1', 'room2', 'room3']

export default function DisplayPage() {
  return (
    <div className='fixed inset-0 overflow-hidden flex flex-col'>
      <div className='absolute flex flex-wrap inset-0 overflow-auto'>
        {subList.map((id, i) => (
          <div key={i}>
            <p>{id}</p>
            <TlDisplay
              docId={id}
              className='flex items-center justify-center'
            />
          </div>
        ))}
      </div>
    </div>
  )
}
