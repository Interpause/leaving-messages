import fscreen from 'fscreen'
import { useLayoutEffect, useMemo, useState } from 'react'
import 'swiper/css'
import 'swiper/css/effect-fade'
// import 'swiper/css/effect-coverflow'
// import 'swiper/css/free-mode'
import 'swiper/css/pagination'
import { Autoplay, EffectFade, Mousewheel, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'
import api from '../api'
import { TlDisplay } from '../parts/Tlremote'

const SPEED = 5000 // in ms

function Gradient({ children }: { children?: React.ReactNode }) {
  return (
    <div className='fixed inset-0 from-orange-400 to-yellow-300 from-40% bg-gradient-to-b'>
      {children}
    </div>
  )
}

export default function DisplayPage() {
  const [ids, setIds] = useState<string[]>([])
  const [event, { displayOn }] = api.useServerState()

  const randStartIdx = useMemo(
    () => Math.floor(Math.random() * ids.length),
    [ids.length],
  )

  useLayoutEffect(() => {
    if (event !== 'list_update') return
    ;(async () => {
      const { docs } = await api.listDocs()
      setIds(docs.map((doc) => doc.id))
    })()
  }, [event])

  // NOTE: Prevent Swiper from initializing with empty slides, causing NaN glitch.
  if (ids.length < 1)
    return (
      <Gradient>
        <h3 className='fixed inset-0 m-auto w-fit h-fit text-4xl text-black'>
          Waiting for drawings...
        </h3>
      </Gradient>
    )

  // NOTE: We don't unmount Swiper even when display is off to prevent reconnecting.
  return (
    <Gradient>
      <Swiper
        modules={[Autoplay, Pagination, EffectFade, Mousewheel]}
        className={`absolute inset-0 overflow-clip bg-white mix-blend-multiply ${displayOn === false ? 'hidden' : ''}`}
        pagination={{ type: 'fraction', verticalClass: 'fix-page-frac' }}
        autoplay={{
          disableOnInteraction: false,
          // NOTE: WaitForTransition must be false else autoplay will stop working on remount
          waitForTransition: false,
          // NOTE: delay must be greater than speed by at least ~100ms else autoplay might break
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
        onSlidesLengthChange={(swiper) => swiper.autoplay.start()}
        initialSlide={randStartIdx}
      >
        {ids.map((id) => (
          <SwiperSlide key={id} className='flex flex-col justify-center'>
            <TlDisplay
              docId={id}
              className='w-[100vmin] h-[100vmin] self-center'
            />
            <p className='fixed bottom-2 w-full text-center text-black'>{id}</p>
          </SwiperSlide>
        ))}
      </Swiper>
      <button
        className='fixed bottom-4 inset-x-0 mx-auto w-10 h-10 bg-black opacity-0 z-50'
        onClick={() => fscreen.requestFullscreen(document.body)}
      />
      <div
        className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center ${displayOn === false ? '' : 'hidden'}`}
      >
        <h3 className='text-4xl text-white'>Display is off...</h3>
      </div>
    </Gradient>
  )
}
