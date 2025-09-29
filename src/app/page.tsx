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
      top: y + LETTER_BBOX.y * h,
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
                top: `${letterRect.top + 30}px`,
                width: `${letterRect.width}px`,
                height: `${letterRect.height}px`,
              }}
            >
              <div className="h-full w-full bg-white/85 backdrop-blur-sm rounded-lg p-4 shadow-2xl flex flex-col ring-1 ring-white/30">
                <div className="w-full flex-1 p-3 bg-white/80 rounded-lg overflow-y-auto shadow-inner border border-gray-100">
                  {letterText ? (
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">{letterText}</p>
                  ) : (
                    <p className="text-gray-500 italic text-sm">
                        This is letter content that will be displayed here...
  {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
    {"\n"}
  And here is a new line.
  
                    </p>
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
