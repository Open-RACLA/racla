import { memo, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'

import { Icon } from '@iconify/react/dist/iconify.js'
import { globalDictionary } from '@render/constants/globalDictionary'
import {
  getDifficultyBgColor,
  getDifficultyClassName,
  getDifficultyTextClassName,
  getDifficultyTextColor,
  getScoreDisplayText,
} from '@render/libs/gameUtils'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { GameType } from '@src/types/games/GameType'
import { PatternInfo, SongData } from '@src/types/games/SongData'
import { ScorePopupComponentProps } from '@src/types/render/ScorePopupComponentProps'
import { AnimatePresence, motion } from 'framer-motion'
import * as R from 'ramda'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../libs/apiClient'
import Image from '../image/Image'
// 이미지 미리 가져오는 함수
const preloadImage = (src: string) => {
  return new Promise((resolve, reject) => {
    const img = new globalThis.Image()
    img.src = src
    img.onload = resolve
    img.onerror = reject
  })
}

const ScorePopupComponent = memo(
  ({
    songTitle,
    keyMode,
    judgementType,
    isVisibleCode = false,
    width = 80,
    height = 80,
    floor,
    isLink = true,
  }: ScorePopupComponentProps) => {
    const { songData, userData, isLoggedIn } = useSelector((state: RootState) => state.app)
    const { font, language } = useSelector((state: RootState) => state.app.settingData)
    const [songItem, setSongItem] = useState<SongData | null>(null)
    const [scoreData, setScoreData] = useState<SongData | null>(null)
    const [pattern, setPattern] = useState<string | null>(null)
    const [level, setLevel] = useState<number | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isHovered, setIsHovered] = useState<boolean>(false)
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
    const [game, setGame] = useState<GameType>(() => {
      // 초기 게임 타입 설정
      switch (true) {
        case songTitle !== undefined && songTitle !== null && songTitle < 1000000:
          return 'djmax_respect_v'
        case songTitle !== undefined &&
          songTitle !== null &&
          songTitle >= 40000000 &&
          songTitle < 50000000:
          return 'platina_lab'
        default:
          return 'djmax_respect_v'
      }
    })
    const tooltipRef = useRef<HTMLDivElement>(null)
    const triggerRef = useRef<HTMLDivElement>(null)
    const [imageLoaded, setImageLoaded] = useState(false)
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const { t } = useTranslation(['games'])

    // 툴팁 위치 계산
    useEffect(() => {
      if (isHovered && songItem && triggerRef.current) {
        // triggerRef의 위치 기반으로 고정 위치 계산
        const triggerRect = triggerRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const scrollY = window.scrollY || window.pageYOffset
        const scrollX = window.scrollX || window.pageXOffset

        // 고정 크기로 가정하여 툴팁 위치 계산 (툴팁 ref가 없어도 작동)
        const tooltipWidth = 400 // 대략적인 툴팁 너비
        const tooltipHeight = 560 // 대략적인 툴팁 높이

        // 기본 위치 (오른쪽)
        let posX = triggerRect.right + scrollX
        let posY = triggerRect.top + scrollY + triggerRect.height / 2 - tooltipHeight / 2

        // 오른쪽에 공간이 부족한 경우 왼쪽에 표시
        if (posX + tooltipWidth > viewportWidth + scrollX) {
          posX = triggerRect.left + scrollX - tooltipWidth - 10
        }

        // 상하단에 공간이 부족한 경우 조정
        if (posY < scrollY + 10) {
          posY = scrollY + 10
        } else if (posY + tooltipHeight > viewportHeight + scrollY - 10) {
          posY = viewportHeight + scrollY - tooltipHeight - 10
        }

        setTooltipPosition({ x: posX, y: posY })
      } else {
        setTooltipPosition(null)
      }
    }, [isHovered, songItem])

    useEffect(() => {
      const findSongItem = () => {
        if (songData && Object.keys(songData).length > 0) {
          const item = R.pipe(
            R.values,
            R.flatten,
          )(songData).find((item: SongData) => String(item.title) === String(songTitle)) as SongData

          setSongItem(item)
        }
      }

      findSongItem()
    }, [songTitle])

    useEffect(() => {
      const fetchData = async () => {
        const title = String(songTitle)

        setIsLoading(true)

        setGame(
          ((): GameType => {
            switch (true) {
              case songTitle !== undefined && songTitle !== null && songTitle < 1000000:
                return 'djmax_respect_v'
              case songTitle !== undefined &&
                songTitle !== null &&
                songTitle >= 40000000 &&
                songTitle < 50000000:
                return 'platina_lab'
              default:
                return 'djmax_respect_v'
            }
          })(),
        )

        if (!isLoggedIn || songTitle === undefined || songTitle === null) {
          setIsLoading(false)
          return
        }

        try {
          // 10000000 이상은 Open-RACLA 고유 번호로 사용
          if (game !== 'djmax_respect_v') {
            createLog('debug', 'fetching racla song data', { ...userData })
            const response = await apiClient.get<SongData>(
              `/v3/racla/songs/${game}/${title}/user/${userData.playerId}`,
              {
                headers: {
                  Authorization: `${userData.playerId}|${userData.playerToken}`,
                },
                withCredentials: true,
              },
            )
            if (response.status === 200) {
              const { data } = response.data
              setScoreData(data)
            }
          } else {
            createLog('debug', 'fetching varchive song data', { ...userData })
            if (userData.varchiveUserInfo.isLinked && userData.varchiveUserInfo.nickname !== '') {
              const response = await apiClient.getProxy<SongData>(
                `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/title/${title}`,
              )
              if (response.status === 200) {
                const { data } = response.data
                setScoreData(data)
              }
            }
          }
        } catch (error) {
          createLog('error', 'fetching song data', { ...userData })
        } finally {
          setIsLoading(false)
        }
      }

      if (isHovered) {
        void fetchData()
      } else {
        setScoreData(null)
      }
    }, [songTitle, isLoggedIn, userData, isHovered, game])

    useEffect(() => {
      if (floor && songItem) {
        setPattern(
          R.pipe(
            R.toPairs,
            R.find(([_, item]: [string, PatternInfo]) => item.floor === floor),
            R.head,
          )(songItem?.patterns[`${keyMode}B`]) as string,
        )
      }
    }, [songItem, floor, keyMode])

    useEffect(() => {
      if (pattern) {
        setLevel(songItem?.patterns[`${keyMode}B`][pattern]?.level)
      }
    }, [pattern, songItem, keyMode])

    // 이미지 URL 생성
    const imageUrl = songItem
      ? `${import.meta.env.VITE_CDN_URL}${
          globalDictionary.gameDictionary[game]?.jacketsUrl || ''
        }/${songTitle}.jpg`
      : ''

    // 미리 이미지 로드
    useEffect(() => {
      if (imageUrl) {
        preloadImage(imageUrl)
          .then(() => {
            setImageLoaded(true)
          })
          .catch(() => {
            setImageLoaded(true)
          }) // 로드 실패해도 표시는 해야 함
      }
    }, [imageUrl])

    const handleMouseEnter = () => {
      // 호버 시 지연 설정
      hoverTimeoutRef.current = setTimeout(() => {
        setIsHovered(true)
      }, 200)
    }

    const handleMouseLeave = () => {
      // 타임아웃 취소
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      setIsHovered(false)
    }

    // 컴포넌트 언마운트 시 타임아웃 클리어
    useEffect(() => {
      return () => {
        if (hoverTimeoutRef.current) {
          clearTimeout(hoverTimeoutRef.current)
        }
      }
    }, [])

    if (!songItem) return null

    return (
      <>
        <motion.div
          ref={triggerRef}
          className='tw:inline-flex tw:flex-col'
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0.3, scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {isLink ? (
            <Link
              to={`/games/${game}/db/${songTitle}`}
              className={`tw:relative tw:rounded-md hover-scale-110 tw:cursor-pointer djmax_respect_v_record`}
              style={{ width, height }}
            >
              <Image
                src={imageUrl}
                className='tw:absolute tw:rounded-md tw:shadow-lg tw:w-full tw:h-full'
                width={width}
                height={height}
                alt={songItem?.name || ''}
                fallbackSrc='https://cdn.open-racla.app/common/no-image.jpg'
                style={{ objectFit: 'cover' }}
                onLoad={() => {
                  setImageLoaded(true)
                }}
              />
              {isVisibleCode && imageLoaded && (
                <span className='tw:absolute tw:top-0 tw:left-0 djmax_respect_v_dlc_code_wrap tw:rounded-tl-md'>
                  <span
                    className={`djmax_respect_v_dlc_code ${game}_dlc_code_${songItem?.dlcCode ?? ''}`}
                  >
                    {songItem?.dlcCode ?? ''}
                  </span>
                </span>
              )}
              {floor && imageLoaded && (
                <span
                  className={`tw:absolute tw:flex tw:items-center tw:right-0 tw:bottom-0 pattern tw:rounded-br-md ${pattern}`}
                >
                  <span className={`tw:text-white`}>
                    {String(pattern)} {String(level)}
                  </span>
                </span>
              )}
            </Link>
          ) : (
            <div
              className='tw:relative tw:rounded-md hover-scale-110 tw:cursor-pointer'
              style={{ width, height }}
            >
              <Image
                src={imageUrl}
                className='tw:absolute tw:rounded-md tw:shadow-lg tw:w-full tw:h-full'
                width={width}
                height={height}
                alt={songItem?.name || ''}
                fallbackSrc='https://cdn.open-racla.app/common/no-image.jpg'
                style={{ objectFit: 'cover' }}
                onLoad={() => {
                  setImageLoaded(true)
                }}
              />
            </div>
          )}
          {/* {((game === 'djmax_respect_v' && userData.vArchiveUserInfo.nickname !== '') ||
          game != 'djmax_respect_v') &&
        scoreData ? (
          <span
            className={
              'tw:w-full tw:bg-gray-950 tw:text-center tw:rounded-md tw:text-xs tw:font-bold mt-2'
            }
          >
            {getSCPatternScoreDisplayText(game, scoreData?.patterns)}
          </span>
        ) : null} */}
        </motion.div>

        {/* 커스텀 툴팁 */}
        <AnimatePresence>
          {isHovered && tooltipPosition && (
            <motion.div
              ref={tooltipRef}
              className={`tw:fixed tw:z-50 tw:rounded-md tw:shadow-lg tw:border tw:backdrop-blur-sm tw:dark:bg-slate-800/95 tw:dark:border-slate-700/40 tw:bg-white/95 tw:border-indigo-100/40 ${
                font != 'default' ? 'tw:font-medium' : ''
              }`}
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y,
                maxWidth: '400px',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className='tw:flex tw:justify-center tw:items-center tw:p-4 tw:h-40 tw:w-80'>
                  <PuffLoader color='#6a9eff' size={30} />
                </div>
              ) : (
                <div className='tw:flex tw:gap-2 tw:p-2'>
                  <div className='tw:flex tw:flex-col'>
                    <div className='tw:flex tw:flex-col tw:w-80 tw:h-32 tw:relative tw:mb-2 tw:overflow-hidden tw:rounded-md'>
                      <Image
                        src={imageUrl}
                        className={`tw:absolute tw:w-full tw:h-full tw:blur-sm`}
                        alt=''
                        width={'100%'}
                        height={'100%'}
                        style={{ objectFit: 'cover' }}
                      />
                      <div className={`tw:absolute tw:inset-0 tw:bg-slate-800/75`} />
                      <span
                        className={`tw:absolute tw:left-0 tw:bottom-1 tw:px-2 tw:font-bold tw:text-left ${language !== 'ja_JP' ? 'tw:break-keep' : ''}`}
                      >
                        <span className={`tw:font-medium tw:text-xs tw:text-slate-200`}>
                          {songItem?.composer || songItem?.artist}
                        </span>
                        <br />
                        <span className={`tw:text-xl tw:text-white`}>{songItem?.name}</span>
                      </span>
                      <span
                        className={`tw:absolute tw:text-xs tw:p-1 tw:top-1 tw:right-1 ${game}_dlc_code_wrap tw:animate-fadeInLeft tw:rounded-md tw:bg-opacity-80 tw:bg-slate-900 } p-1`}
                      >
                        <span
                          className={`${game}_dlc_code ${game}_dlc_code_${songItem?.dlcCode ?? ''}`}
                        >
                          {songItem?.dlc ?? ''}
                        </span>
                      </span>
                    </div>
                    <motion.div
                      className={`tw:flex tw:flex-col tw:gap-2 tw:w-80 tw:p-2 tw:rounded-md tw:dark:bg-slate-700/25 tw:bg-indigo-100/25`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {[
                        'NM',
                        'HD',
                        'MX',
                        'SC',
                        'DPC',
                        'EASY',
                        'HARD',
                        'OVER',
                        'PLUS_1',
                        'PLUS_2',
                        'PLUS_3',
                      ].map(
                        (value, index) =>
                          songItem?.patterns[`${keyMode}B`]?.[value] !== undefined &&
                          songItem?.patterns[`${keyMode}B`]?.[value] !== null && (
                            <motion.div
                              className='tw:flex tw:flex-col tw:gap-2'
                              key={'songDataPack_item' + songItem.title + '_hover' + value}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + index * 0.05 }}
                            >
                              <div className='tw:flex tw:items-center tw:gap-1'>
                                <span className={getDifficultyTextClassName(game, value)}>
                                  {t(
                                    globalDictionary.gameDictionary[game].difficulty[value]
                                      .fullName,
                                  )}
                                </span>
                                <Icon
                                  icon='lucide:star'
                                  height={14}
                                  width={14}
                                  className={getDifficultyTextColor(game, value)}
                                />
                                <span className={getDifficultyClassName(game, value)}>
                                  {songItem?.patterns[`${keyMode}B`][value].level}{' '}
                                  <sup className='tw:text-xs'>
                                    {songItem?.patterns[`${keyMode}B`][value].floor !== undefined &&
                                    songItem?.patterns[`${keyMode}B`][value].floor !== null &&
                                    songItem?.patterns[`${keyMode}B`][value].floor > 0
                                      ? `(${songItem?.patterns[`${keyMode}B`][value].floor}F)`
                                      : null}
                                  </sup>
                                </span>
                              </div>
                              {scoreData &&
                              scoreData?.[judgementType == 1 ? 'plusPatterns' : 'patterns'][
                                `${keyMode}B`
                              ][value] !== undefined ? (
                                <div
                                  className={`tw:relative tw:w-full tw:h-6 tw:rounded-sm tw:overflow-hidden tw:dark:bg-slate-900 tw:bg-slate-400`}
                                >
                                  <motion.div
                                    className={`tw:h-full ${getDifficultyBgColor(game, value)}`}
                                    initial={{ width: '0%' }}
                                    animate={{
                                      width: `${scoreData?.[judgementType == 1 ? 'plusPatterns' : 'patterns'][`${keyMode}B`][value]?.score ? Number(scoreData?.[judgementType == 1 ? 'plusPatterns' : 'patterns'][`${keyMode}B`][value].score) : 0}%`,
                                    }}
                                    transition={{
                                      duration: 0.3,
                                      delay: 0.2 + index * 0.05,
                                      ease: 'easeOut',
                                    }}
                                  />
                                  <div className='tw:absolute tw:text-xs tw:inset-0 tw:flex tw:items-center tw:justify-center tw:font-bold tw:text-white'>
                                    {getScoreDisplayText(
                                      game,
                                      scoreData?.[judgementType == 1 ? 'plusPatterns' : 'patterns'][
                                        `${keyMode}B`
                                      ][value],
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </motion.div>
                          ),
                      )}
                    </motion.div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </>
    )
  },
)

export default ScorePopupComponent
