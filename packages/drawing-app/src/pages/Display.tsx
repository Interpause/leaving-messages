import fscreen from 'fscreen'
import { useEffect, useMemo, useState } from 'react'
import 'swiper/css'
import 'swiper/css/effect-fade'
// import 'swiper/css/effect-coverflow'
// import 'swiper/css/free-mode'
import 'swiper/css/pagination'
import { Autoplay, EffectFade, Mousewheel, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import { TlDisplay } from '../parts/Tlremote'

const SPEED = 5000 // in ms

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

  if (!ids.length)
    return (
      <div className='fixed inset-0 from-orange-400 to-yellow-300 from-40% bg-gradient-to-b flex items-center justify-center'>
        <h3 className='text-4xl text-black'>Waiting for drawings...</h3>
      </div>
    )

  return (
    <div className='fixed inset-0 from-orange-400 to-yellow-300 from-40% bg-gradient-to-b'>
      <Swiper
        modules={[Autoplay, Pagination, EffectFade, Mousewheel]}
        className='absolute inset-0 overflow-clip bg-white mix-blend-multiply'
        pagination={{ type: 'fraction', verticalClass: 'fix-page-frac' }}
        autoplay={{
          disableOnInteraction: false,
          waitForTransition: true,
          delay: SPEED,
        }}
        /*
        coverflowEffect={{
          rotate: 50,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: false,
        }}
        */
        /*
        freeMode={{
          enabled: true,
          sticky: false,
          momentum: true,
          momentumRatio: 999999,
          momentumBounce: false,
        }}
        */
        direction='vertical'
        effect='fade'
        fadeEffect={{ crossFade: true }} // This transparents other slides
        slidesPerView={1}
        spaceBetween={0}
        speed={1000}
        grabCursor
        centeredSlides
        loop
        loopAddBlankSlides
        mousewheel
        initialSlide={randStartIdx}
      >
        {ids.map((id) => (
          <SwiperSlide key={id} className='flex flex-col justify-center'>
            <TlDisplay docId={id} className='self-stretch' />
            <p className='fixed bottom-2 w-full text-center text-black'>{id}</p>
          </SwiperSlide>
        ))}
      </Swiper>
      <button
        className='fixed bottom-4 inset-x-0 mx-auto w-10 h-10 bg-black opacity-0 z-50'
        onClick={() => fscreen.requestFullscreen(document.body)}
      />
    </div>
  )
}
