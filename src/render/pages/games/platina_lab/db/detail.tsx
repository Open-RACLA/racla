import 'dayjs/locale/ko'

import * as R from 'ramda'

import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { Icon } from '@iconify/react/dist/iconify.js'
import Image from '@render/components/image/Image'
import ScoreEditComponent from '@render/components/score/ScoreEditModal'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setIsOpenExternalLink, setOpenExternalLink } from '@render/store/slices/uiSlice'
import { SongData } from '@src/types/games/SongData'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import apiClient from '../../../../../libs/apiClient'

dayjs.extend(utc)

const PlatinaLabDbDetailPage = () => {
  const { t } = useTranslation(['db'])
  const { showNotification } = useNotificationSystem()

  const params = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { songData, userData, selectedGame } = useSelector((state: RootState) => state.app)
  const { language } = useSelector((state: RootState) => state.app.settingData)

  const [baseSongData, setBaseSongData] = useState<SongData[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  useEffect(() => {
    const initializeData = async () => {
      const filteredData = songData[selectedGame].filter(
        (value) => String(value.title) == params.id,
      )

      if (filteredData.length === 0) {
        navigate(`/game/${selectedGame}/db`)
        return
      }

      // 로그인한 사용자의 경우 rating 정보를 포함한 데이터 가져오기
      if (userData.playerName) {
        try {
          const response = await apiClient.get<SongData>(
            `/v3/racla/songs/${selectedGame}/${params.id}/user/${userData.playerId}`,
            {
              headers: {
                Authorization: `${userData.playerId}|${userData.playerToken}`,
              },
              withCredentials: true,
            },
          )
          const { data } = response.data
          const { patterns } = data
          setBaseSongData([
            {
              ...data,
              patterns,
            },
          ])
          createLog('debug', 'fetchUserSongData', {
            ...data,
            patterns,
          })
        } catch (error) {
          createLog('error', 'Error in fetchUserSongData', error)
          setBaseSongData(filteredData)
        }
      } else {
        setBaseSongData(filteredData)
      }

      setIsScoredBaseSongData(false)
    }

    void initializeData()
  }, [userData])

  const [patternButton, setPatternButton] = useState<string>('')
  const [isPlusPattern, setIsPlusPattern] = useState<boolean>(false)
  const [patternDificulty, setPatternDificulty] = useState<string>('')
  const [patternMaxCombo, setPatternMaxCombo] = useState<boolean>(false)
  const [updateScore, setUpdateScore] = useState<number>(0)
  const [updateMax, setUpdateMax] = useState<number>(0)
  const [fetchingUpdateScore, setFetchingUpdateScore] = useState<boolean>(false)

  const fetchUpdateScore = async () => {
    if (updateScore <= 100 && updateMax <= 3000) {
      try {
        await apiClient
          .post(
            `/v3/racla/play/${selectedGame}/update`,
            {
              button: Number(String(patternButton).replace('B', '').replace('_PLUS', '')),
              pattern: patternDificulty,
              force: true,
              maxCombo: patternMaxCombo || updateScore == 100,
              score: updateScore,
              max: updateMax,
              title: Number(baseSongData[0].title),
              judgementType: isPlusPattern ? 1 : 0,
            },
            {
              headers: {
                Authorization: `${userData.playerId}|${userData.playerToken}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            },
          )
          .then(async (data) => {
            if (data.data.success) {
              // 곡 데이터를 다시 불러옴
              const response = await apiClient.get<SongData>(
                `/v3/racla/songs/${selectedGame}/${params.id}/user/${userData.playerId}`,
                {
                  headers: {
                    Authorization: `${userData.playerId}|${userData.playerToken}`,
                  },
                  withCredentials: true,
                },
              )
              const { data } = response.data
              const { patterns } = data
              setBaseSongData([
                {
                  ...data,
                  patterns,
                },
              ])
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
            createLog('error', 'Error in fetchUpdateScore', error)
            showNotification(
              {
                mode: 'i18n',
                ns: 'db',
                value: 'syncError',
              },
              'error',
            )
          })
      } catch (error) {
        createLog('error', 'Error in fetchUpdateScore', error)
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
    if (userData.playerName !== '') {
      try {
        const response = await apiClient.get<SongData>(
          `/v3/racla/songs/${selectedGame}/${title}/user/${userData.playerId}`,
          {
            headers: {
              Authorization: `${userData.playerId}|${userData.playerToken}`,
            },
            withCredentials: true,
          },
        )
        const { data } = response
        return data
      } catch (error) {
        createLog('error', 'Error in loadDataWithScore', error)
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
            const keysToRemove2 = ['DPC', 'SC', 'MX', 'HD', 'NM']
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

      if (userData.playerName !== '') {
        void updateArrayWithAPIData()
      } else {
        setIsScoredBaseSongData(true)
        setIsLoading(false)
      }
    }
  }, [isScoredBaseSongData])

  // 모달 상태 추가
  const [showScoreModal, setShowScoreModal] = useState(false)

  if (baseSongData.length > 0 && params.id) {
    return (
      <React.Fragment>
        <div className='tw:flex tw:gap-4 tw:h-[calc(100vh-106px)]'>
          {/* 곡 데이터 */}
          <div className={`tw:flex tw:flex-col tw:transition-all tw:w-full duration-300`}>
            <div
              className={
                'tw:flex tw:flex-col tw:gap-1 tw:relative tw:bg-opacity-10 tw:rounded-md tw:mb-4 tw:h-auto tw:border tw:border-slate-200 tw:dark:border-slate-700'
              }
            >
              {/* 배경 이미지 추가 */}
              <div className='tw:absolute tw:inset-0 tw:overflow-hidden tw:rounded-md'>
                <Image
                  src={`https://cdn.open-racla.app/${selectedGame}/jackets/cropped/${String(baseSongData[0].title)}.jpg`}
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
                    src={`${import.meta.env.VITE_CDN_URL}/${selectedGame}/jackets/resized/${String(baseSongData[0].title)}.jpg`}
                    height={80}
                    width={80}
                    alt=''
                    className='tw:animate-fadeInLeft tw:rounded-md tw:shadow-md'
                  />
                </div>
                <div className='tw:flex tw:flex-col tw:w-full tw:flex-1 tw:justify-end tw:leading-none tw:p-1'>
                  {/* 제목 */}
                  <span className='tw:text-xs tw:font-light tw:text-slate-500 tw:dark:text-slate-400'>
                    Open-RACLA : {baseSongData[0].title} /
                    {baseSongData[0].bpm == baseSongData[0].bpmLow
                      ? baseSongData[0].bpm
                      : baseSongData[0].bpmLow + '~' + baseSongData[0].bpm}{' '}
                    BPM
                  </span>
                  <span className='tw:flex tw:text-sm tw:font-light tw:text-slate-600 tw:dark:text-slate-300'>
                    {baseSongData[0].artist}
                  </span>
                  <span className='tw:text-lg tw:font-extrabold tw:tracking-tight'>
                    {baseSongData[0].name}
                  </span>
                </div>
                <div className='tw:absolute tw:flex tw:gap-1 tw:text-xs tw:top-2 tw:right-2'>
                  {String(baseSongData[0]?.officialCode).trim() !== '' &&
                    String(baseSongData[0]?.officialCode) !== 'null' && (
                      <span
                        className='tw:inline-flex tw:items-center tw:gap-1 tw:cursor-pointer tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:rounded-md hover:tw:bg-indigo-600 hover:tw:text-white hover:tw:dark:text-white tw:transition-colors tw:text-xs tw:py-1 tw:px-2'
                        onClick={() => {
                          dispatch(
                            setOpenExternalLink(
                              `https://platinalab.net/ranking/${baseSongData[0].officialCode}`,
                            ),
                          )
                          dispatch(setIsOpenExternalLink(true))
                        }}
                      >
                        <Icon icon='lucide:medal' />
                        <span>{t('rankingOfficial')}</span>
                      </span>
                    )}
                  <div
                    className={`tw:rounded-md tw:bg-slate-100 tw:border tw:dark:border-0 tw:border-slate-200 tw:dark:bg-slate-700 tw:text-slate-800 tw:dark:text-slate-300 tw:p-1 ${!String(baseSongData[0]?.officialCode).trim() || String(baseSongData[0]?.officialCode) === 'null' ? 'tw:ms-auto' : ''}`}
                  >
                    <span className='platina_lab_dlc_code_wrap'>
                      <span
                        className={`platina_lab_dlc_code platina_lab_dlc_code_${baseSongData[0].dlcCode}`}
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
                <div className='tw:flex tw:flex-col tw:gap-4 tw:h-full'>
                  {Object.keys(baseSongData[0].patterns)
                    .sort((a, b) => {
                      const numA = parseInt(a)
                      const numB = parseInt(b)
                      if (numA !== numB) return numA - numB
                      return a.includes('_PLUS') ? 1 : -1
                    })
                    .map((patternName) => (
                      <div key={String(patternName)} className='tw:flex tw:flex-col tw:flex-1'>
                        {/* 버튼 라벨 */}
                        <div className='tw:flex tw:items-center tw:gap-2 tw:mb-2'>
                          <div className='tw:inline-flex tw:items-center tw:gap-1 tw:text-sm tw:font-semibold tw:bg-indigo-100 tw:dark:bg-indigo-900/50 tw:text-indigo-700 tw:dark:text-indigo-200 tw:py-1 tw:px-3 tw:rounded-md'>
                            <span className='tw:font-bold'>
                              {String(patternName).replace('B', '').replace('_PLUS', '')}B
                              {String(patternName).includes('_PLUS') ? '+' : ''}
                            </span>
                          </div>
                          <div className='tw:h-px tw:flex-grow tw:bg-indigo-200 tw:dark:bg-indigo-800/50'></div>
                        </div>

                        {/* 첫 번째 행: EASY, HD, OVER */}
                        <div className={`tw:grid tw:grid-cols-3 tw:gap-4 tw:flex-1 tw:mb-4`}>
                          {['EASY', 'HD', 'OVER'].map((difficultyCode: string) =>
                            baseSongData[0].patterns[patternName][difficultyCode] !== undefined &&
                            baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                              <div
                                key={`${String(patternName)}_${difficultyCode}`}
                                className={`tw:relative tw:border tw:h-full tw:border-slate-200 tw:dark:border-slate-700 tw:flex tw:flex-col tw:justify-center tw:items-center tw:p-2 tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:shadow-sm ${
                                  userData.playerName !== ''
                                    ? 'tw:cursor-pointer hover:tw:bg-indigo-50 hover:tw:dark:bg-indigo-900/20 tw:transition-colors'
                                    : ''
                                } ${
                                  baseSongData[0].patterns[patternName][difficultyCode].score !==
                                    undefined &&
                                  Number(
                                    baseSongData[0].patterns[patternName][difficultyCode].score,
                                  ) <= 0
                                    ? 'tw:opacity-70'
                                    : ''
                                }`}
                                onClick={() => {
                                  if (userData.playerName !== '') {
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
                                    setUpdateMax(
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode]
                                          .max !== undefined &&
                                          baseSongData[0].patterns[patternName][difficultyCode]
                                            .max !== null
                                          ? Number(
                                              baseSongData[0].patterns[patternName][difficultyCode]
                                                .max,
                                            )
                                          : 0,
                                      ),
                                    )
                                    setIsPlusPattern(String(patternName).includes('_PLUS'))
                                    setShowScoreModal(true)
                                  }
                                }}
                              >
                                <div className='tw:flex tw:w-full tw:justify-center tw:items-center tw:rounded-lg tw:gap-3'>
                                  {/* 난이도 표시 */}
                                  <div className='tw:w-flex tw:flex-col tw:justify-center tw:items-center'>
                                    <span
                                      className={
                                        'tw:flex tw:justify-center tw:items-center tw:gap-2 tw:text-base tw:font-extrabold ' +
                                        (difficultyCode === 'EASY'
                                          ? 'tw:text-platina_lab-EASY'
                                          : difficultyCode === 'HD'
                                            ? 'tw:text-platina_lab-HD'
                                            : 'tw:text-platina_lab-OVER')
                                      }
                                    >
                                      Lv.
                                      {baseSongData[0].patterns[patternName][
                                        difficultyCode
                                      ].level.toFixed(0)}
                                    </span>
                                    {baseSongData[0].patterns[patternName][difficultyCode].floor &&
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode].floor,
                                      ) > 0 && (
                                        <span
                                          className={
                                            'tw:font-light tw:text-sm ' +
                                            (difficultyCode === 'EASY'
                                              ? 'tw:text-platina_lab-EASY'
                                              : difficultyCode === 'HD'
                                                ? 'tw:text-platina_lab-HD'
                                                : 'tw:text-platina_lab-OVER')
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
                                  {userData.playerName !== '' && (
                                    <div className='tw:flex tw:flex-col tw:items-start tw:justify-center tw:gap-1 tw:min-w-20'>
                                      {baseSongData[0].patterns[patternName][difficultyCode]
                                        .score &&
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode].score,
                                      ) > 0 ? (
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
                                              {Number(
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ]?.score,
                                              ) == 100 ? (
                                                <sup>
                                                  MAX
                                                  {baseSongData[0].patterns[patternName][
                                                    difficultyCode
                                                  ]?.max != 0
                                                    ? ' - ' +
                                                      baseSongData[0].patterns[patternName][
                                                        difficultyCode
                                                      ]?.max
                                                    : null}
                                                </sup>
                                              ) : null}
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
                                              %
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
                                            ({t('noRecord')})
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

                        {/* 두 번째 행: PLUS_1, PLUS_2, PLUS_3 */}
                        <div className={`tw:grid tw:grid-cols-3 tw:gap-4 tw:flex-1`}>
                          {['PLUS_1', 'PLUS_2', 'PLUS_3'].map((difficultyCode: string) =>
                            baseSongData[0].patterns[patternName][difficultyCode] !== undefined &&
                            baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                              <div
                                key={`${String(patternName)}_${difficultyCode}`}
                                className={`tw:relative tw:border tw:h-full tw:border-slate-200 tw:dark:border-slate-700 tw:flex tw:flex-col tw:justify-center tw:items-center tw:p-2 tw:bg-white tw:dark:bg-slate-800 tw:rounded-lg tw:shadow-sm ${
                                  userData.playerName !== ''
                                    ? 'tw:cursor-pointer hover:tw:bg-indigo-50 hover:tw:dark:bg-indigo-900/20 tw:transition-colors'
                                    : ''
                                } ${
                                  baseSongData[0].patterns[patternName][difficultyCode].score !==
                                    undefined &&
                                  Number(
                                    baseSongData[0].patterns[patternName][difficultyCode].score,
                                  ) <= 0
                                    ? 'tw:opacity-70'
                                    : ''
                                }`}
                                onClick={() => {
                                  if (userData.playerName !== '') {
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
                                    setUpdateMax(
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode]
                                          .max !== undefined &&
                                          baseSongData[0].patterns[patternName][difficultyCode]
                                            .max !== null
                                          ? Number(
                                              baseSongData[0].patterns[patternName][difficultyCode]
                                                .max,
                                            )
                                          : 0,
                                      ),
                                    )
                                    setIsPlusPattern(String(patternName).includes('_PLUS'))
                                    setShowScoreModal(true)
                                  }
                                }}
                              >
                                <div className='tw:flex tw:w-full tw:justify-center tw:items-center tw:rounded-lg tw:gap-3'>
                                  {/* 난이도 표시 */}
                                  <div className='tw:w-flex tw:flex-col tw:justify-center tw:items-center'>
                                    <span
                                      className={
                                        'tw:flex tw:justify-center tw:items-center tw:gap-2 tw:text-base tw:font-extrabold tw:text-platina_lab-PLUS-1'
                                      }
                                    >
                                      Lv.
                                      {baseSongData[0].patterns[patternName][
                                        difficultyCode
                                      ].level.toFixed(0)}
                                    </span>
                                    {baseSongData[0].patterns[patternName][difficultyCode].floor &&
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode].floor,
                                      ) > 0 && (
                                        <span className='tw:font-light tw:text-sm tw:text-platina_lab-PLUS-1'>
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
                                  {userData.playerName !== '' && (
                                    <div className='tw:flex tw:flex-col tw:items-start tw:justify-center tw:gap-1 tw:min-w-20'>
                                      {baseSongData[0].patterns[patternName][difficultyCode]
                                        .score &&
                                      Number(
                                        baseSongData[0].patterns[patternName][difficultyCode].score,
                                      ) > 0 ? (
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
                                              {Number(
                                                baseSongData[0].patterns[patternName][
                                                  difficultyCode
                                                ]?.score,
                                              ) == 100 ? (
                                                <sup>
                                                  MAX
                                                  {baseSongData[0].patterns[patternName][
                                                    difficultyCode
                                                  ]?.max != 0
                                                    ? ' - ' +
                                                      baseSongData[0].patterns[patternName][
                                                        difficultyCode
                                                      ]?.max
                                                    : null}
                                                </sup>
                                              ) : null}
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
                                              %
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
                                            ({t('noRecord')})
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
                    ))}
                </div>
              </div>
            )}
          </div>

          <ScoreEditComponent
            gameCode={'platina_lab'}
            show={showScoreModal}
            onHide={() => {
              setShowScoreModal(false)
            }}
            patternMaxCombo={patternMaxCombo}
            setPatternMaxCombo={setPatternMaxCombo}
            updateMax={updateMax}
            setUpdateMax={setUpdateMax}
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

export default PlatinaLabDbDetailPage
