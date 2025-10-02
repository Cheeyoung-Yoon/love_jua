// app/page.tsx
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type AppState = 'closed' | 'playing-video' | 'open'
type Size = { w: number; h: number }
type BBox = { x: number; y: number; w: number; h: number }
type Anchor = 'center' | 'top' | 'bottom'

export default function Page() {
  const [appState, setAppState] = useState<AppState>('closed')
  const [letterText, setLetterText] = useState('')

  // container & image metrics
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<Size>({ w: 0, h: 0 })
  const [imgNatural, setImgNatural] = useState<Size>({ w: 0, h: 0 })

  // ---- letter area (in ORIGINAL image coords; tune x/y/w/h as needed)
  const BASE_BBOX: BBox = useMemo(() => ({ x: 0.25, y: 0.20, w: 0.5, h: 0.44 }), [])
  const TARGET_H = 0.7 // expand ONLY height to 70% of the image
  const ANCHOR: Anchor = 'center'

  const LETTER_BBOX: BBox = useMemo(() => {
    const h = Math.min(TARGET_H, 1)
    if (ANCHOR === 'center') {
      const cy = BASE_BBOX.y + BASE_BBOX.h / 2
      const y = Math.max(0, Math.min(1 - h, cy - h / 2))
      return { x: BASE_BBOX.x, y, w: BASE_BBOX.w, h }
    }
    if (ANCHOR === 'top') {
      const y = Math.min(BASE_BBOX.y, 1 - h)
      return { x: BASE_BBOX.x, y, w: BASE_BBOX.w, h }
    }
    const bottom = BASE_BBOX.y + BASE_BBOX.h
    const y = Math.max(0, bottom - h)
    return { x: BASE_BBOX.x, y, w: BASE_BBOX.w, h }
  }, [BASE_BBOX])

  // observe container size (for responsive math)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    // set initial immediately
    setContainerSize({ w: el.clientWidth, h: el.clientHeight })
    const ro = new ResizeObserver(([entry]) => {
      const cr = entry.contentRect
      setContainerSize({ w: cr.width, h: cr.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // === FIT-HEIGHT math (image height == container height; width scales; center horizontally)
  const displayed = useMemo(() => {
    const { w: cw, h: ch } = containerSize
    const { w: iw, h: ih } = imgNatural
    if (cw === 0 || ch === 0 || iw === 0 || ih === 0) return { x: 0, y: 0, w: 0, h: 0 }

    const scale = ch / ih
    const w = iw * scale
    const h = ch
    const x = (cw - w) / 2
    const y = 0
    return { x, y, w, h }
  }, [containerSize, imgNatural])

  // map normalized bbox -> absolute pixels in container, using FIT-HEIGHT math
  const letterRect = useMemo(() => {
    const { x, y, w, h } = displayed
    if (w === 0 || h === 0) return { left: 0, top: 0, width: 0, height: 0 }
    return {
      left: x + LETTER_BBOX.x * w,
      top: y + LETTER_BBOX.y * h * 2,
      width: LETTER_BBOX.w * w,
      height: LETTER_BBOX.h * h,
    }
  }, [displayed, LETTER_BBOX])

  // actions
  const handleOpenClick = () => setAppState('playing-video')
  const handleVideoEnded = () => setAppState('open')
  const handleVideoError = () => setAppState('open')

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] min-h-[100svh] bg-black overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        {/* Closed State */}
        {appState === 'closed' && (
          <div className="relative w-full h-full">
            <img
              src="/close_state.png"
              alt="Closed state"
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-auto select-none pointer-events-none z-0"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget as HTMLImageElement
                setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />

            <div
              className="absolute left-1/2 -translate-x-1/2 z-30"
              style={{ bottom: `calc(1rem + env(safe-area-inset-bottom))` }}
            >
              <button
                onClick={handleOpenClick}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-300"
              >
                ✨ Open
              </button>
            </div>
          </div>
        )}

        {/* Video Playing State */}
        {appState === 'playing-video' && (
          <div className="relative w-full h-full bg-black">
            <video
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-auto z-0"
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              onError={handleVideoError}
            >
              <source src="/process.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* Open State */}
        {appState === 'open' && (
          <div className="relative w-full h-full">
            {/* background image */}
            <img
              src="/open_state.png"
              alt="Open state"
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-auto select-none pointer-events-none z-0"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget as HTMLImageElement
                setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />

            {/* letter overlay */}
            <div
              className="absolute z-20"
              style={{
                left: `${letterRect.left}px`,
                top: `${letterRect.top }px`,
                width: `${letterRect.width}px`,
                height: `${letterRect.height}px`,
              }}
            >
              <div className="h-full w-full bg-white/85 backdrop-blur-sm rounded-lg p-4 shadow-2xl flex flex-col ring-1 ring-white/30">
                <div className="w-full flex-1 p-3 bg-white/80 rounded-lg overflow-y-auto shadow-inner border border-gray-100">
                  {letterText ? (
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{letterText}</p>
                  ) : (
                    <div className="text-gray-500 italic text-sm space-y-3">
 <p>어느덧 사귄 지 1년이 된 나의 사랑, 주아에게.</p>

<p>
  우리 이쁘고 귀여운 아가 공주님, 주아.<br />
  우리가 손을 잡고 걸어온 시간이 어느새 1년이 되었구나.<br />
  그 사이 우리는 웃기도 했고, 다투기도 했고, 내가 주아를 마음 아프게 한 순간도 있었지만,<br />
  그 모든 시간을 지나 이렇게 365일을 채워왔어.<br />
  짧다면 짧고, 길다면 긴 1년, 그 속에서 우리 둘은 서로의 세상에 깊이 뿌리내렸어.
</p>

<p>
  나는 서툴지만 정성을 다해 작은 선물을 준비했어.<br />
  최대한 내 마음만큼은 담으려 했어.<br />
  주아의 미소에 닿을 수 있다면, 그걸로 충분하다고 생각해.
</p>

<p>
  2024년 개천절, 하늘이 열린 날.<br />
  그 날은 내게도 또 다른 하늘이 열린 날이었지.<br />
  주아와 내가 하나의 사랑으로 엮이던 순간, 세상은 더 넓고 환해졌어.<br />
  오늘은 그날로부터 365번째 날, 우리가 만든 또 하나의 기념일.
</p>

<p>
  사당에서 처음 마주한 주아의 눈빛,<br />
  내 인생 첫 전시를 함께 바라보던 설렘,<br />
  지하철 속 눈치보다 터져 나온 고백의 떨림.<br />
  그리고 역삼 알타코치나 by 녘에서,<br />
  웹페이지 속 편지로 서로의 마음이 이어지고 연인이 된 그날로부터 시작된 이야기.<br />
  그 모든 날들이 쌓이고 쌓여, 오늘의 우리를 만들었어.
</p>

<p>
  그 속에서 나는 주아와 나의 <strong>결이 같음</strong>을 느꼈어.<br />
  말하지 않아도 통하는 순간들, 마음의 물결이 같은 방향으로 흐르는 듯한 시간들.<br />
  함께 있을 때의 편안함은 오래 전부터 알고 지냈던 사람처럼 자연스러웠어.
</p>

<p>
  그러나 또 한편으로는, 서로 다른 세월을 살아온 덕분에 우리는 다르기도 했지.<br />
  그 다름이 충돌이 아니라 빛이 되어 나를 바꾸고 성장하게 만들었어.<br />
  주아의 세계가 내 안에 스며들어 내가 더 깊고 넓어진 것처럼 말이야.
</p>

<p>
  내가 최대한 노력할게.<br />
  주아를 실망시키지 않게,<br />
  주아에 어울리는 멋진 사람이 되도록 노력하고,<br />
  주아를 항상 사랑할게.
</p>

<p>
  힘들고 지쳐 흔들리던 순간마다 내 손을 붙잡아준 건 언제나 주아였어.<br />
  내가 나조차 믿기 어려울 때조차 주아는 곁에서 괜찮다고, 함께 가자고 말해주었지.<br />
  그 한마디가 얼마나 큰 위로와 힘이 되었는지 몰라.<br />
  주아는 직업으로는 초등학교 선생님이지만, 내게는 언제나 <strong>사랑의 선생님</strong>이야.<br />
  사랑을 가르쳐주고, 기다림을 가르쳐주고, 함께한다는 것의 소중함을 일깨워주는, 내 마음의 스승.
</p>

<p>
  주아의 마음이 커질수록, 내가 받는 사랑이 깊어질수록,<br />
  나는 점점 주아의 하늘이 되어가는 것 같아.<br />
  주아를 더 잘 지켜주고, 더 따뜻하게 품을 수 있는 안정적인 버팀목이 되려 해.<br />
  주아가 안심하고 기댈 수 있는 그늘이자 빛이 되고 싶어.
</p>

<p>
  내가 표현이 서툴러서 사랑을 온전히 다 말하지 못하는 게 늘 아쉽다.<br />
  마음은 이렇게 벅차고 큰데, 언어는 그 마음을 다 담지 못하네.<br />
  그래도 주아, 알아주길 바라.<br />
  말보다 더 큰 마음이 늘 주아를 향해 있다는 걸.
</p>

<p>
  큰 선물을 주진 못했지만, 내 마음만큼은 세상 어디에도 견줄 수 없을 만큼 크고 깊어.<br />
  더 좋은 것을 해주지 못해 미안하고,<br />
  그럼에도 곁에 있어 주는 주아가 너무 고마워.<br />
  사랑한다, 주아야. 정말, 진심으로 사랑해.
</p>

<p>
  앞으로도 우리는 다투기도 하고, 다른 점에 부딪히기도 하겠지.<br />
  하지만 그조차도 우리를 더 단단하게 하고,<br />
  우리 사랑을 더 깊게 할 거라 믿어.<br />
  주아와 함께라면 어떤 순간도 두렵지 않아.<br />
  모든 시간이 결국 빛나는 추억이 될 테니까.
</p>

<p>
  1년을 지나온 지금, 앞으로의 1년, 그 다음의 10년, 그리고 그 너머의 시간까지도 나는 주아와 함께 걷고 싶어.<br />
  내 세상에 찾아와 준 주아, 우리 공<strong>주아</strong>가.<br />
  사랑해, 주아야. 영원히. 💕
</p>

<p>— 많이 사랑하는 치영이</p>

                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* close */}
            <div
              className="absolute left-1/2 -translate-x-1/2 z-30"
              style={{ bottom: `calc(1rem + env(safe-area-inset-bottom))` }}
            >
              <button
                onClick={() => setAppState('closed')}
                className="bg-gradient-to-r from-pink-500 to-rose-600 text-white px-8 py-3 rounded-xl text-md font-semibold shadow-lg hover:from-pink-600 hover:to-rose-700 focus:outline-none focus:ring-4 focus:ring-pink-300 transition-all duration-300"
              >
                ❌ Close
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
