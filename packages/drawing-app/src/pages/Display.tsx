import fscreen from 'fscreen'
import { useEffect, useMemo, useState } from 'react'
import 'swiper/css'
import 'swiper/css/effect-coverflow'
import 'swiper/css/free-mode'
import 'swiper/css/pagination'
import {
  Autoplay,
  EffectCoverflow,
  FreeMode,
  Mousewheel,
  Pagination,
} from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { TlDisplay } from '../parts/Tlremote'

const SPEED = 5000 // in ms

function rotateArr<T>(arr: T[], n: number) {
  n = n % arr.length
  return arr.slice(n, arr.length).concat(arr.slice(0, n))
}

export default function DisplayPage() {
  const [ids, setIds] = useState<string[]>([])
  const randStartIdx = useMemo(
    () => Math.floor(Math.random() * ids.length),
    [ids.length],
  )

  useEffect(() => {
    const fetchIds = async () => {
      const res = await fetch('/api/v1/list_doc')
      const { docs } = await res.json()
      setIds(docs)
    }
    fetchIds()
    const handle = setInterval(fetchIds, 1000)
    return () => clearInterval(handle)
  }, [])

  return (
    <>
      <Swiper
        modules={[Autoplay, Pagination, EffectCoverflow, Mousewheel, FreeMode]}
        className='fixed inset-0 overflow-clip bg-gray-50'
        pagination={{ type: 'fraction', verticalClass: 'fix-page-frac' }}
        autoplay={{
          disableOnInteraction: false,
          waitForTransition: false,
          delay: SPEED + 50,
        }}
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }}
        freeMode={{
          enabled: true,
          sticky: false,
          momentum: true,
          momentumRatio: 999999,
          momentumBounce: false,
        }}
        direction='vertical'
        effect='coverflow'
        slidesPerView='auto'
        spaceBetween={0}
        speed={SPEED}
        grabCursor
        centeredSlides
        loop
        mousewheel
      >
        {rotateArr(ids, randStartIdx).map((id) => (
          <SwiperSlide key={id} className='m-auto w-fit h-fit'>
            <p className='text-center text-black'>{id}</p>
            <TlDisplay docId={id} className='w-[100vmin] h-[100vmin]' />
          </SwiperSlide>
        ))}
      </Swiper>
      <button
        className='fixed top-0 left-0 m-2 w-10 h-10 bg-black opacity-20 z-50'
        onClick={() => fscreen.requestFullscreen(document.body)}
      ></button>
    </>
  )
}
