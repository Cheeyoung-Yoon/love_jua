'use client'

import { useState, useRef, useMemo } from 'react'

type AppState = 'closed' | 'playing-video' | 'open'

export default function Page() {
  const [appState, setAppState] = useState<AppState>('closed')
  const [letterText, setLetterText] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleOpenClick = () => {
    setAppState('playing-video')
  }

  const handleVideoEnded = () => {
    setAppState('open')
  }

  const handleVideoError = () => {
    setAppState('open')
  }

  const displayed = useMemo(() => {
    const { w: cw, h: ch } = containerSize
    const { w: iw, h: ih } = imgNatural
    if (cw === 0 || ch === 0 || iw === 0 || ih === 0) return { x: 0, y: 0, w: 0, h: 0 }

    // FIT-HEIGHT math: image height == container height; width scales; horizontal centering
    const scale = ch / ih
    const w = iw * scale
    const h = ch
    const x = (cw - w) / 2
    const y = 0
    return { x, y, w, h }
  }, [containerSize, imgNatural])

  return (
    <main className="fixed inset-0 w-screen h-[100dvh] min-h-[100svh] bg-black overflow-hidden">
      <div ref={containerRef} className="relative w-full h-full">
        {/* Closed State */}
        {appState === 'closed' && (
          <div className="relative w-full h-full">
            <img
              src="/close_state.png"
              alt="Closed state"
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-auto select-none pointer-events-none"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget as HTMLImageElement
                setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <button
                onClick={handleOpenClick}
                className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              >
                Open
              </button>
            </div>
          </div>
        )}

        {/* Video Playing State */}
        {appState === 'playing-video' && (
          <div className="relative w-full h-full bg-black">
            <video
              ref={videoRef}
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-auto"
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
            <img
              src="/open_state.png"
              alt="Open state"
              className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 h-full w-auto select-none pointer-events-none"
              draggable={false}
              onLoad={(e) => {
                const img = e.currentTarget as HTMLImageElement
                setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
              }}
            />

            {/* Overlay Text Box */}
            <div className="absolute inset-0 animate-fadeIn">
              <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-[70%] h-[70%] px-4">
                <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-2xl h-full flex items-center justify-center">
                  <div className="w-full h-full overflow-y-auto">
                    {letterText ? (
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                        {letterText}
                      </p>
                    ) : (
                      <p className="text-gray-500 italic text-sm">
                        This is letter content that will be displayed here...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-fadeIn">
                <button
                  onClick={() => setAppState('closed')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 hover:scale-105 transition-all duration-300 shadow-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
