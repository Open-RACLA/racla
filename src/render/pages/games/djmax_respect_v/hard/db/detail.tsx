import { Icon } from '@iconify/react/dist/iconify.js'
import Image from '@render/components/image/Image'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import {
  HardArchiveRecordResponse,
  Pattern,
  PatternRecord,
} from '@src/types/dto/hard-archive/HardArchiveRecord'
import { SongData } from '@src/types/games/SongData'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import apiClint from '../../../../../../libs/apiClient'

const DmrvHardDbDetailPage = () => {
  const { showNotification } = useNotificationSystem()
  const { t } = useTranslation(['db'])
  const navigate = useNavigate()

  const params = useParams()
  const { songData, selectedGame } = useSelector((state: RootState) => state.app)

  const [baseSongData, setBaseSongData] = useState<SongData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [records, setRecords] = useState<Record<string, PatternRecord>>({})
  const [activeTab, setActiveTab] = useState<'4B' | '5B' | '6B' | '8B'>('4B')

  useEffect(() => {
    if (params.id) {
      setBaseSongData(
        songData[selectedGame].filter((songItem) => String(songItem.title) == String(params.id)),
      )
    }
  }, [params.id])

  useEffect(() => {
    if (baseSongData.length > 0) {
      setIsLoading(false)
    }
  }, [baseSongData])

  // 패턴 필터링 함수
  const getValidPatterns = (songData: SongData) => {
    const validPatterns: Pattern[] = []
    const buttons = ['4B', '5B', '6B', '8B']

    buttons.forEach((button) => {
      const patterns = songData.patterns[button]
      if (!patterns) return

      // SC 패턴 체크 (8 이상)
      if (patterns.SC?.level >= 8) {
        validPatterns.push({
          button,
          level: `SC${Math.floor(patterns.SC.level)}`,
          type: 'SC',
        })
      }

      // MX 패턴 체크 (15 이상)
      if (patterns.MX?.level >= 15) {
        validPatterns.push({
          button,
          level: `MX${Math.floor(patterns.MX.level)}`,
          type: 'MX',
        })
      }
    })

    // SC와 MX 패턴을 각각 그룹화
    const scPatterns = validPatterns.filter((p) => p.type === 'SC')
    const mxPatterns = validPatterns.filter((p) => p.type === 'MX')

    return { scPatterns, mxPatterns }
  }

  // 기록 가져오기
  const fetchRecords = async () => {
    try {
      const { scPatterns } = getValidPatterns(baseSongData[0])
      const allRecordPromises = []

      // SC 패턴 기록 가져오기
      if (scPatterns.length > 0) {
        const scPromises = scPatterns.map(async ({ button, level }) => {
          try {
            const [hardResponse, maxResponse] = await Promise.all([
              apiClint.getProxy<HardArchiveRecordResponse>(
                `https://hard-archive.com/api/v2/record?button=${button}&lv=${level}&song=${baseSongData[0].uuid}&judge=hard`,
              ),
              apiClint.getProxy<HardArchiveRecordResponse>(
                `https://hard-archive.com/api/v2/record?button=${button}&lv=${level}&song=${baseSongData[0].uuid}&judge=max`,
              ),
            ])

            return {
              key: `${button}_${level}`,
              data: {
                hard: hardResponse.data.data.data[0] || null,
                max: maxResponse.data.data.data[0] || null,
              },
            }
          } catch (error) {
            createLog('error', `Error fetching SC pattern records for ${button} ${level}:`, {
              error,
            })
            return {
              key: `${button}_${level}`,
              data: { hard: null, max: null },
            }
          }
        })
        allRecordPromises.push(...scPromises)
      }

      const records = await Promise.all(allRecordPromises)
      const recordMap = records.reduce((acc, { key, data }) => {
        acc[key] = data
        return acc
      }, {})

      setRecords(recordMap)
    } catch (error) {
      createLog('error', 'Error in fetchRecords:', error)
      showNotification(
        {
          ns: 'db',
          value: 'failedToFetchRecords',
          mode: 'i18n',
        },
        'error',
      )
    }
  }

  // 곡 데이터가 로드되면 기록 가져오기
  useEffect(() => {
    if (baseSongData.length > 0) {
      void fetchRecords()
    }
  }, [baseSongData])

  // 탭별 패턴 필터링
  const getPatternsByTab = (buttonType: string) => {
    return Object.entries(records).filter(([key]) => key.startsWith(buttonType))
  }

  if (params.id && baseSongData.length > 0) {
    return (
      <React.Fragment>
        <div className='tw:flex tw:flex-col tw:gap-4 tw:h-full'>
          {/* 곡 데이터 */}
          <div className='tw:w-full tw:h-full tw:flex tw:flex-col'>
            <div className='tw:flex tw:flex-col tw:gap-1 tw:relative tw:bg-opacity-10 tw:rounded-md tw:mb-4 tw:h-auto tw:border tw:border-slate-200 tw:dark:border-slate-700'>
              <div className='tw:absolute tw:inset-0 tw:overflow-hidden'>
                <Image
                  src={`${import.meta.env.VITE_CDN_URL}/djmax_respect_v/jackets/${params.id}.jpg`}
                  alt=''
                  className='tw:opacity-50 tw:blur-xl'
                  style={{
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                <div className='tw:absolute tw:inset-0 tw:bg-white/90 tw:dark:bg-slate-800/75' />
              </div>

              <div className='tw:flex tw:justify-between tw:animate-fadeInLeft tw:rounded-lg tw:backdrop-blur-sm tw:relative'>
                <div className='tw:flex tw:relative tw:p-2 tw:gap-2 tw:backdrop-blur-sm tw:rounded-md'>
                  <Image
                    loading='lazy'
                    src={`${import.meta.env.VITE_CDN_URL}/djmax_respect_v/jackets/${params.id}.jpg`}
                    height={80}
                    width={80}
                    alt=''
                    className='tw:rounded-md tw:shadow-md'
                  />
                  <div className='tw:flex tw:flex-col tw:w-full tw:flex-1 tw:justify-end tw:leading-none tw:p-1'>
                    {/* <span className='tw:text-xs tw:font-light tw:text-slate-500 tw:dark:text-slate-400'>
                      전일 아카이브: {baseSongData[0].uuid} / Open-RACLA: {baseSongData[0].title}
                    </span> */}
                    <span className='tw:flex tw:text-sm tw:font-light tw:text-slate-600 tw:dark:text-slate-300'>
                      {baseSongData[0].composer}
                    </span>
                    <span className='tw:text-lg tw:font-extrabold tw:tracking-tight'>
                      {baseSongData[0].name}
                    </span>
                  </div>
                </div>
                <div className='tw:flex tw:absolute tw:right-2 tw:text-xs tw:top-2 tw:gap-1'>
                  <Link
                    to={`/games/djmax_respect_v/db/${baseSongData[0].title}`}
                    className='tw:inline-flex tw:items-center tw:gap-2 tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:rounded-md hover:tw:bg-indigo-600 tw:transition-colors tw:text-xs tw:py-1 tw:px-2'
                  >
                    <Icon icon='lucide:database' />
                    <span>{t('myRecord')}</span>
                  </Link>
                  <div className='tw:rounded-md tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:p-1'>
                    <span className='djmax_respect_v_dlc_code_wrap'>
                      <span
                        className={`djmax_respect_v_dlc_code djmax_respect_v_dlc_code_${baseSongData[0].dlcCode}`}
                      >
                        {baseSongData[0].dlc}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className='tw:flex tw:justify-center tw:items-center tw:h-64'>
                <PuffLoader color='#6366f1' size={60} />
              </div>
            ) : (
              <div className='tw:w-full tw:h-[calc(100vh-220px)] tw:flex tw:flex-col tw:rounded-lg tw:bg-white tw:dark:bg-slate-800 tw:border tw:border-slate-200 tw:dark:border-slate-700 tw:overflow-hidden'>
                {/* 탭 네비게이션 */}
                <div className='tw:flex tw:bg-slate-50 tw:dark:bg-slate-700/40 tw:border-b tw:border-slate-200 tw:dark:border-slate-700'>
                  {['4B', '5B', '6B', '8B'].map((buttonType) => {
                    const hasPatterns = getPatternsByTab(buttonType).length > 0
                    return (
                      <button
                        key={buttonType}
                        onClick={() => {
                          setActiveTab(buttonType as '4B' | '5B' | '6B' | '8B')
                        }}
                        className={`tw:flex-1 tw:py-3 tw:px-4 tw:relative tw:transition-all ${
                          activeTab === buttonType
                            ? 'tw:text-indigo-600 tw:dark:text-indigo-300 tw:font-medium'
                            : 'tw:text-slate-600 tw:dark:text-slate-300 hover:tw:bg-slate-100 hover:tw:dark:bg-slate-700/60'
                        } ${!hasPatterns ? 'tw:opacity-50' : ''}`}
                        disabled={!hasPatterns}
                      >
                        <div className='tw:flex tw:items-center tw:justify-center tw:gap-2'>
                          <span className='tw:text-sm'>{buttonType}</span>
                        </div>
                        {activeTab === buttonType && (
                          <div className='tw:absolute tw:bottom-0 tw:left-0 tw:w-full tw:h-0.5 tw:bg-indigo-500 tw:dark:bg-indigo-400' />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* 패턴 컨텐츠 */}
                <div className='tw:p-4 tw:flex tw:flex-1 tw:overflow-auto tw:custom-scrollbar'>
                  <div className='tw:flex-1 tw:grid tw:grid-cols-1 sm:tw:grid-cols-2 lg:tw:grid-cols-3 tw:gap-4'>
                    {getPatternsByTab(activeTab).length > 0 ? (
                      getPatternsByTab(activeTab).map(([key, record]) => {
                        const [, level] = key.split('_')

                        return (
                          <div className='tw:tw:bg-white tw:dark:bg-slate-700/50 tw:flex-1 tw:rounded-lg tw:overflow-hidden tw:border tw:border-slate-200 tw:dark:border-slate-600'>
                            {/* 패턴 헤더 */}
                            <div
                              className={`tw:py-2 tw:px-4 tw:font-black tw:text-center ${
                                level.startsWith('SC')
                                  ? 'tw:bg-respect-sc-15/80'
                                  : 'tw:bg-respect-nm-15/80'
                              }`}
                            >
                              {level.replace('MX', 'MX ').replace('SC', 'SC ')}
                            </div>

                            {/* 판정별 기록 */}
                            <div className='tw:grid tw:h-full tw:grid-cols-2 tw:divide-x tw:divide-slate-200 tw:dark:divide-slate-600'>
                              {/* HARD 판정 */}
                              <div
                                className={`tw:p-3 tw:pb-24 tw:transition-colors tw:flex tw:flex-col tw:items-center tw:justify-center ${
                                  record.hard
                                    ? 'hover:tw:bg-indigo-50 hover:tw:dark:bg-indigo-900/20 tw:cursor-pointer'
                                    : ''
                                }`}
                                onClick={() => {
                                  if (record.hard) {
                                    navigate(
                                      `/games/djmax_respect_v/hard/db/${params.id}/${activeTab}-${level}-HARD`,
                                    )
                                  }
                                }}
                              >
                                <div className='tw:text-center'>
                                  <div className='tw:font-medium tw:text-slate-600 tw:dark:text-slate-300 tw:mb-2'>
                                    HARD
                                  </div>

                                  {record.hard ? (
                                    <div className='tw:flex tw:flex-col tw:gap-1'>
                                      <div className='tw:font-bold tw:text-indigo-600 tw:dark:text-indigo-300'>
                                        {record.hard.nickname}
                                      </div>
                                      <div className='tw:font-semibold'>
                                        {record.hard.score.toLocaleString()}
                                      </div>
                                      <div className='tw:text-sm tw:text-slate-600 tw:dark:text-slate-300'>
                                        {record.hard.rate.toFixed(2)}%
                                      </div>
                                      {record.hard.max_combo && (
                                        <div className='tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-yellow-500 tw:dark:text-yellow-400 tw:text-sm tw:font-medium'>
                                          <Icon icon='lucide:zap' className='tw:w-3 tw:h-3' />
                                          <span>MAX COMBO</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className='tw:text-slate-500 tw:dark:text-slate-400 tw:py-4 tw:h-[100px]'>
                                      {t('noRecord')}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* MAX 판정 */}
                              <div
                                className={`tw:p-3 tw:pb-24 tw:transition-colors tw:flex tw:flex-col tw:items-center tw:justify-center ${
                                  record.max
                                    ? 'hover:tw:bg-indigo-50 hover:tw:dark:bg-indigo-900/20 tw:cursor-pointer'
                                    : ''
                                }`}
                                onClick={() => {
                                  if (record.max) {
                                    navigate(
                                      `/games/djmax_respect_v/hard/db/${params.id}/${activeTab}-${level}-MAX`,
                                    )
                                  }
                                }}
                              >
                                <div className='tw:text-center'>
                                  <div className='tw:font-medium tw:text-slate-600 tw:dark:text-slate-300 tw:mb-2'>
                                    MAX
                                  </div>

                                  {record.max ? (
                                    <div className='tw:flex tw:flex-col tw:gap-1'>
                                      <div className='tw:font-bold tw:text-indigo-600 tw:dark:text-indigo-300'>
                                        {record.max.nickname}
                                      </div>
                                      <div className='tw:font-semibold'>
                                        {record.max.score.toLocaleString()}
                                      </div>
                                      <div className='tw:text-sm tw:text-slate-600 tw:dark:text-slate-300'>
                                        {record.max.rate.toFixed(2)}%
                                      </div>
                                      {record.max.max_combo && (
                                        <div className='tw:flex tw:items-center tw:justify-center tw:gap-1 tw:text-yellow-500 tw:dark:text-yellow-400 tw:text-sm tw:font-medium'>
                                          <Icon icon='lucide:zap' className='tw:w-3 tw:h-3' />
                                          <span>MAX COMBO</span>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div className='tw:text-slate-500 tw:dark:text-slate-400 tw:py-4 tw:h-[100px]'>
                                      {t('noRecord')}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className='tw:col-span-full tw:flex tw:flex-col tw:items-center tw:justify-center tw:text-center tw:text-slate-500 tw:dark:text-slate-400 tw:border tw:border-slate-200 tw:dark:border-slate-600 tw:bg-slate-50 tw:dark:bg-slate-700/20 tw:rounded-lg tw:p-8 tw:h-48'>
                        <Icon icon='lucide:info' className='tw:w-8 tw:h-8 tw:mb-2' />
                        <p>{t('noHardArchivePatternPattern', { props: { activeTab } })}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </React.Fragment>
    )
  } else {
    return (
      <div className='tw:flex tw:justify-center tw:items-center tw:h-full'>
        <PuffLoader color='#6366f1' size={60} />
      </div>
    )
  }
}

export default DmrvHardDbDetailPage
