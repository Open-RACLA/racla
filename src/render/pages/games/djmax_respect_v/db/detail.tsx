import 'dayjs/locale/ko'

import * as R from 'ramda'

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

import { Icon } from '@iconify/react/dist/iconify.js'
import Image from '@render/components/image/Image'
import ScoreEditComponent from '@render/components/score/ScoreEditModal'
import { globalDictionary } from '@render/constants/globalDictionary'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { SongData } from '@src/types/games/SongData'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../../../libs/apiClient'

const DmrvDbDetailPage = () => {
  const { showNotification } = useNotificationSystem()
  const { t } = useTranslation(['db'])
  const { songData, userData, selectedGame } = useSelector((state: RootState) => state.app)
  const { language } = useSelector((state: RootState) => state.app.settingData)
  const [baseSongData, setBaseSongData] = useState<SongData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)
  const [showScoreModal, setShowScoreModal] = useState(false)
  const [patternButton, setPatternButton] = useState<string>('')
  const [patternDificulty, setPatternDificulty] = useState<string>('')
  const [patternMaxCombo, setPatternMaxCombo] = useState<boolean>(false)
  const [updateScore, setUpdateScore] = useState<number>(0)
  const [fetchingUpdateScore, setFetchingUpdateScore] = useState<boolean>(false)

  const navigate = useNavigate()
  const params = useParams()

  useEffect(() => {
    const initializeData = async () => {
      const filteredData = songData[selectedGame].filter(
        (value) => String(value.title) == params.id,
      )

      if (filteredData.length === 0) {
        navigate('/games/djmax_respect_v/db')
        return
      }

      // 로그인한 사용자의 경우 rating 정보를 포함한 데이터 가져오기
      if (userData.varchiveUserInfo.isLinked) {
        try {
          await apiClient
            .getProxy<SongData>(
              `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/title/${params.id}`,
            )
            .then((response) => {
              const data = response.data.data
              setBaseSongData([
                {
                  ...songData[selectedGame].filter((value) => value.title == Number(params.id))[0],
                  ...data,
                },
              ])
            })
            .catch((error: unknown) => {
              createLog('error', 'Error in fetchUserSongData', { ...userData }, error)
              showNotification(
                {
                  mode: 'i18n',
                  ns: 'db',
                  value: 'syncError',
                },
                'error',
              )
              createLog('error', 'Error fetching user song data:', { ...userData })
              setBaseSongData(filteredData)
            })
        } catch (error) {
          createLog('error', 'Error in fetchUserSongData', { ...userData })
          showNotification(
            {
              mode: 'i18n',
              ns: 'db',
              value: 'syncError',
            },
            'error',
          )
          createLog('error', 'Error fetching user song data:', { ...userData })
          setBaseSongData(filteredData)
        }
      } else {
        setBaseSongData(filteredData)
      }

      setIsScoredBaseSongData(false)
    }

    void initializeData()
  }, [])

  const fetchUpdateScore = async () => {
    if (updateScore <= 100) {
      try {
        await apiClient
          .postProxy<{
            success: boolean
          }>(
            `https://v-archive.net/api/archive/userRecord`,
            {
              button: Number(String(patternButton).replace('B', '')),
              pattern: patternDificulty,
              force: true,
              maxCombo: patternMaxCombo ? Number(1) : Number(0),
              score: updateScore,
              title: Number(baseSongData[0].title),
            },
            {
              Authorization: `${userData.varchiveUserInfo.userNo}|${userData.varchiveUserInfo.token}`,
              Cookie: `Authorization=${userData.varchiveUserInfo.userNo}|${userData.varchiveUserInfo.token}`,
              'Content-Type': 'application/json',
            },
          )
          .then(async (data) => {
            if (data.data.data.success) {
              // 곡 데이터를 다시 불러옴
              const response = await apiClient.getProxy<SongData>(
                `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/title/${params.id}`,
              )
              const result = response.data.data

              setBaseSongData([{ ...baseSongData[0], ...result }])
              setFetchingUpdateScore(false)
              showNotification(
                {
                  mode: 'i18n',
                  ns: 'db',
                  value: 'syncSuccess',
                },
                'success',
              )
            }
          })
          .catch((error: unknown) => {
            createLog('error', 'Error in fetchUpdateScore', { ...userData }, error)
          })
      } catch (error) {
        createLog('error', 'Error in fetchUpdateScore', { ...userData }, error)
      }
    } else {
      setFetchingUpdateScore(false)
      showNotification(
        {
          mode: 'i18n',
          ns: 'db',
          value: 'syncMaxScoreError',
        },
        'error',
      )
    }
  }

  useEffect(() => {
    if (fetchingUpdateScore) {
      void fetchUpdateScore()
    }
  }, [fetchingUpdateScore])

  const loadDataWithScore = async (title) => {
    if (userData.varchiveUserInfo.isLinked) {
      try {
        const response = await apiClient.getProxy<SongData>(
          `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/title/${title}`,
        )
        const data = response.data.data
        return data
      } catch (error) {
        createLog('error', 'Error in loadDataWithScore', { ...userData }, error)
        return null
      }
    }
  }

  //   스코어 갱신
  useEffect(() => {
    if (baseSongData.length > 0 && !isScoredBaseSongData) {
      const updateArrayWithAPIData = async () => {
        // 배열의 각 항목에 대해 API 호출 및 데이터 업데이트
        await Promise.all(
          baseSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)
            const keysToRemove1 = ['4B', '5B', '6B', '8B']
            const keysToRemove2 = ['SC', 'MX', 'HD', 'NM']
            const pathsToRemove = keysToRemove1.map((key1) =>
              keysToRemove2.map((key2) => ['patterns', key1, key2, 'level']),
            )
            const removeLevels = (paths, obj) => {
              return paths.reduce((acc, path) => R.dissocPath(path, acc), obj)
            }

            const newItem = removeLevels(pathsToRemove, data)

            return R.mergeDeepRight(newItem, item)
          }),
        )
          .then((value) => {
            setBaseSongData(value as SongData[])
          })
          .finally(() => {
            setIsScoredBaseSongData(true)
            setIsLoading(false)
          })
      }

      if (userData.varchiveUserInfo.isLinked) {
        void updateArrayWithAPIData()
      } else {
        setIsScoredBaseSongData(true)
        setIsLoading(false)
      }
    }
  }, [isScoredBaseSongData])

  if (baseSongData.length > 0 && params.id) {
    return (
      <React.Fragment>
        <div className='tw:flex tw:gap-4 vh-screen'>
          {/* 곡 데이터 */}
          <div className={`tw:flex tw:flex-col tw:transition-all tw:w-full duration-300`}>
            <div
              className={
                'tw:flex tw:flex-col tw:gap-1 tw:relative tw:bg-opacity-10 tw:rounded-md tw:mb-4 tw:h-auto tw:border tw:border-slate-200 tw:dark:border-slate-700'
              }
            >
              <div className='tw:absolute tw:inset-0 tw:overflow-hidden tw:rounded-md'>
                <Image
                  src={`${import.meta.env.VITE_CDN_URL}/djmax_respect_v/jackets/${baseSongData[0].title}.jpg`}
                  alt=''
                  className='tw:opacity-50 tw:blur-xl'
                  style={{
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
                <div className='tw:absolute tw:inset-0 tw:bg-white/90 tw:dark:bg-slate-800/90' />
              </div>

              <div className='tw:flex tw:relative tw:p-2 tw:gap-2 tw:backdrop-blur-sm tw:rounded-md'>
                {/* 하단 */}
                <div className='tw:flex tw:mt-auto tw:items-end'>
                  <Image
                    loading='lazy' // "lazy" | "eager"
                    src={`${import.meta.env.VITE_CDN_URL}/djmax_respect_v/jackets/${baseSongData[0].title}.jpg`}
                    height={80}
                    width={80}
                    alt=''
                    className='tw:animate-fadeInLeft tw:rounded-md tw:shadow-md'
                  />
                </div>
                <div className='tw:flex tw:flex-col tw:w-full tw:flex-1 tw:justify-end tw:leading-none tw:p-1'>
                  {/* 제목 */}
                  <span className='tw:text-xs tw:font-light tw:text-slate-500 tw:dark:text-slate-400'>
                    V-ARCHIVE : {baseSongData[0].title} / Open-RACLA : {baseSongData[0].title}
                  </span>
                  <span className='tw:flex tw:text-sm tw:font-light tw:text-slate-600 tw:dark:text-slate-300'>
                    {baseSongData[0].composer}
                  </span>
                  <span className='tw:text-lg tw:font-extrabold tw:tracking-tight'>
                    {baseSongData[0].name}
                  </span>
                </div>
                <div className='tw:absolute tw:flex tw:gap-1 tw:text-xs tw:top-2 tw:right-2'>
                  {baseSongData[0]?.uuid && (
                    <Link
                      to={`/games/djmax_respect_v/hard/db/${baseSongData[0].title}`}
                      className='tw:inline-flex tw:items-center tw:gap-2 tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:rounded-md hover:tw:bg-indigo-600 tw:transition-colors tw:text-xs tw:py-1 tw:px-2'
                    >
                      <Icon icon='lucide:database' />
                      <span>{t('hardArchiveRecord')}</span>
                    </Link>
                  )}
                  <div
                    className={`tw:rounded-md tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:p-1 ${!baseSongData[0]?.hardArchiveTitle ? 'tw:ms-auto' : ''}`}
                  >
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

            {!isLoading && (
              <div className='tw:w-full tw:h-full tw:text-center tw:flex tw:flex-col tw:flex-1 tw:gap-4'>
                {baseSongData.length !== 0 ? (
                  R.keys(baseSongData[0].patterns).map((patternName) => (
                    <div key={String(patternName)} className='tw:flex tw:flex-col tw:flex-1'>
                      {/* 버튼 라벨 */}
                      <div className='tw:flex tw:items-center tw:gap-2 tw:mb-2'>
                        <div className='tw:inline-flex tw:items-center tw:gap-1 tw:text-sm tw:font-semibold tw:bg-indigo-100 tw:dark:bg-indigo-900/50 tw:text-indigo-700 tw:dark:text-indigo-200 tw:py-1 tw:px-3 tw:rounded-md'>
                          <span className='tw:tex tw:font-bold'>{String(patternName)}</span>
                        </div>
                        <div className='tw:h-px tw:flex-grow tw:bg-indigo-200 tw:dark:bg-indigo-800/50'></div>
                      </div>

                      {/* 난이도 그리드 */}
                      <div className={`tw:grid tw:grid-cols-4 tw:gap-4 tw:flex-1`}>
                        {R.keys(globalDictionary.gameDictionary[selectedGame].difficulty).map(
                          (difficultyCode: string) =>
                            baseSongData[0].patterns[patternName][difficultyCode] !== undefined &&
                            baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                              <div
                                key={`${String(patternName)}_${difficultyCode}`}
                                className={`tw:border tw:h-full tw:border-slate-200 tw:dark:border-slate-700 tw:flex tw:flex-col tw:justify-center tw:items-center tw:p-2 tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:shadow-sm ${
                                  userData.varchiveUserInfo.nickname !== '' &&
                                  userData.varchiveUserInfo.isLinked
                                    ? 'tw:cursor-pointer hover:tw:bg-indigo-50 hover:tw:dark:bg-indigo-900/20 tw:transition-colors'
                                    : ''
                                }`}
                                onClick={() => {
                                  if (
                                    userData.varchiveUserInfo.nickname !== '' &&
                                    userData.varchiveUserInfo.isLinked
                                  ) {
                                    setPatternMaxCombo(
                                      baseSongData[0].patterns[patternName][difficultyCode]
                                        .maxCombo,
                                    )
                                    setPatternButton(String(patternName))
                                    setPatternDificulty(difficultyCode)
                                    setUpdateScore(
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode]
                                          .score !== undefined &&
                                          baseSongData[0].patterns[patternName][difficultyCode]
                                            .score !== null
                                          ? Number(
                                              baseSongData[0].patterns[patternName][difficultyCode]
                                                .score,
                                            )
                                          : 0,
                                      ),
                                    )
                                    setShowScoreModal(true)
                                  }
                                }}
                              >
                                <div className='tw:flex tw:w-full tw:justify-center tw:items-center tw:rounded-lg tw:gap-3'>
                                  {/* 난이도 표시 */}
                                  <div className='tw:w-flex tw:flex-col tw:justify-center tw:items-center'>
                                    <span
                                      className={
                                        'tw:flex tw:justify-center tw:items-center tw:gap-2 tw:text-base tw:font-extrabold text-stroke-100 ' +
                                        (difficultyCode === 'SC'
                                          ? 'tw:text-djmax_respect_v-SC'
                                          : difficultyCode === 'HD'
                                            ? 'tw:text-djmax_respect_v-HD'
                                            : difficultyCode === 'MX'
                                              ? 'tw:text-djmax_respect_v-MX'
                                              : 'tw:text-djmax_respect_v-NM') // 기본값
                                      }
                                    >
                                      <Image
                                        loading='lazy'
                                        src={
                                          difficultyCode === 'SC'
                                            ? `${import.meta.env.VITE_CDN_URL}/djmax_respect_v/sc_15_star.png`
                                            : difficultyCode === 'HD'
                                              ? `${import.meta.env.VITE_CDN_URL}/djmax_respect_v/nm_10_star.png`
                                              : difficultyCode === 'MX'
                                                ? `${import.meta.env.VITE_CDN_URL}/djmax_respect_v/nm_15_star.png`
                                                : `${import.meta.env.VITE_CDN_URL}/djmax_respect_v/nm_5_star.png` // 기본값
                                        }
                                        height={16}
                                        width={16}
                                        alt=''
                                        className='tw:drop-shadow-lg'
                                      />
                                      {baseSongData[0].patterns[patternName][difficultyCode].level}
                                    </span>
                                    {baseSongData[0].patterns[patternName][difficultyCode].floor &&
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode].floor,
                                      ) > 0 && (
                                        <span
                                          className={
                                            'tw:font-light tw:text-sm ' +
                                            (difficultyCode === 'SC'
                                              ? 'tw:text-djmax_respect_v-SC'
                                              : difficultyCode === 'HD'
                                                ? 'tw:text-djmax_respect_v-HD'
                                                : difficultyCode === 'MX'
                                                  ? 'tw:text-djmax_respect_v-MX'
                                                  : 'tw:text-djmax_respect_v-NM') // 기본값
                                          }
                                        >
                                          (
                                          {
                                            baseSongData[0].patterns[patternName][difficultyCode]
                                              .floor
                                          }
                                          F)
                                        </span>
                                      )}
                                  </div>

                                  {/* 점수 표시 (로그인한 경우에만) */}
                                  {userData.varchiveUserInfo.isLinked && (
                                    <div className='tw:flex tw:flex-col tw:items-start tw:justify-center tw:gap-1 tw:min-w-20'>
                                      {baseSongData[0].patterns[patternName][difficultyCode]
                                        .score ? (
                                        baseSongData[0].patterns[patternName][difficultyCode]
                                          .score === '100.00' ? (
                                          <>
                                            <span className='tw:font-light tw:text-sm tw:text-slate-600 tw:dark:text-slate-300'>
                                              {
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score
                                              }
                                              %{' '}
                                              <sup>
                                                {
                                                  baseSongData[0].patterns[patternName][
                                                    difficultyCode
                                                  ].rating
                                                }
                                                TP
                                              </sup>
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <span className='tw:font-light tw:text-sm tw:text-slate-600 tw:dark:text-slate-300'>
                                              {
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ].score
                                              }
                                              %{' '}
                                              <sup>
                                                {
                                                  baseSongData[0].patterns[patternName][
                                                    difficultyCode
                                                  ].rating
                                                }
                                                TP
                                              </sup>
                                            </span>
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <span className='tw:font-light tw:text-sm tw:text-slate-500 tw:dark:text-slate-400'>
                                            -
                                          </span>
                                          <span
                                            className={`tw:font-light tw:text-xs tw:text-slate-400 tw:dark:text-slate-500 ${
                                              language !== 'ja_JP' ? 'tw:break-keep' : ''
                                            }`}
                                          >
                                            {t('noRecord')}
                                          </span>
                                        </>
                                      )}
                                      {baseSongData[0].patterns[patternName][difficultyCode]
                                        .score !== undefined &&
                                      baseSongData[0].patterns[patternName][difficultyCode]
                                        .score === '100.00' ? (
                                        <span className='tw:text-xs tw:font-light tw:text-yellow-500 tw:dark:text-yellow-400'>
                                          MAX COMBO
                                        </span>
                                      ) : baseSongData[0].patterns[patternName][difficultyCode]
                                          .maxCombo ? (
                                        <span className='tw:text-xs tw:font-light tw:text-yellow-500 tw:dark:text-yellow-400'>
                                          MAX COMBO
                                        </span>
                                      ) : null}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div key={`${String(patternName)}_${difficultyCode}`}></div>
                            ),
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='tw:flex tw:justify-center tw:items-center tw:h-[calc(100vh-338px)]'>
                    <PuffLoader color='#6366f1' size={32} />
                  </div>
                )}
              </div>
            )}
          </div>

          <ScoreEditComponent
            show={showScoreModal}
            onHide={() => {
              setShowScoreModal(false)
            }}
            patternMaxCombo={patternMaxCombo}
            setPatternMaxCombo={setPatternMaxCombo}
            updateScore={updateScore}
            setUpdateScore={setUpdateScore}
            onSave={() => {
              setFetchingUpdateScore(true)
              setShowScoreModal(false)
            }}
          />
        </div>
      </React.Fragment>
    )
  } else {
    return <></>
  }
}

export default DmrvDbDetailPage
