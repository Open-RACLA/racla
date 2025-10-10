import { globalDictionary } from '@render/constants/globalDictionary'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { ApiArchiveNicknameBoard } from '@src/types/dto/v-archive/ApiArchiveNicknameBoard'
import { BoardPatternInfo, PatternInfo } from '@src/types/games/SongData'
import { DjmaxKeyModeData } from '@src/types/render/HomeKeyModeSongData'
import { ArcElement, Chart as ChartJS, Legend, Tooltip, TooltipItem } from 'chart.js'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../libs/apiClient'
import Image from '../image/Image'
import ScorePopupComponent from '../score/ScorePopup'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function DjmaxHomeComponent() {
  const { t } = useTranslation(['home'])
  const userData = useSelector((state: RootState) => state.app.userData)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)
  const songData = useSelector((state: RootState) => state.app.songData)
  const [keyModeData, setKeyModeData] = useState<DjmaxKeyModeData>({
    '4': [],
    '5': [],
    '6': [],
    '8': [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [totalStats, setTotalStats] = useState({
    perfect: 0,
    maxCombo: 0,
    clear: 0,
    totalPatterns: 0,
    over999: 0,
    over995: 0,
    over99: 0,
    over97: 0,
  })

  const [boards] = useState<string[]>([
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    'MX',
    'SC',
    'SC5',
    'SC10',
    'SC15',
  ])

  const [cutoffScores, setCutoffScores] = useState<
    Record<string, { new30: number; basic70: number; top50: number }>
  >({
    '4': { new30: 0, basic70: 0, top50: 0 },
    '5': { new30: 0, basic70: 0, top50: 0 },
    '6': { new30: 0, basic70: 0, top50: 0 },
    '8': { new30: 0, basic70: 0, top50: 0 },
  })

  const [selectedKeyMode, setSelectedKeyMode] = useState<string>('4')

  const KeyModeSelector = () =>
    selectedGame === 'djmax_respect_v' && (
      <div className='tw:flex tw:gap-2'>
        {globalDictionary.gameDictionary[selectedGame].keyModeList.map((mode) => (
          <button
            key={`mode_${mode}`}
            onClick={() => {
              setSelectedKeyMode(String(mode))
            }}
            className={`tw:flex tw:items-center tw:justify-center tw:relative tw:px-4 tw:py-0.5 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-md tw:flex-1 ${
              String(mode) === selectedKeyMode
                ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                : 'tw:border-gray-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-gray-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100'
            }`}
          >
            <div
              className={`tw:absolute tw:w-full tw:h-full tw:opacity-30 ${selectedGame === 'djmax_respect_v' ? 'respect' : ''}_bg_b${String(
                mode,
              ).replace('P', '')}`}
            />
            <span className='tw:relative tw:text-base tw:font-bold'>
              {String(mode).replace('P', '')}B{String(mode).includes('P') ? '+' : ''}
            </span>
          </button>
        ))}
      </div>
    )

  useEffect(() => {
    const fetchAllBoardData = async () => {
      if (!userData.varchiveUserInfo.isLinked) return
      setIsLoading(true)

      try {
        const keyModes = ['4', '5', '6', '8']
        const allKeyModeData: DjmaxKeyModeData = {}

        for (const keyMode of keyModes) {
          // 기본 곡 데이터 가져오기 (songData 활용)
          const baseSongData = songData[selectedGame].flatMap((track) => {
            const { title, name, composer, dlcCode, dlc, patterns } = track
            const patternButton = patterns[keyMode + 'B']

            if (patternButton) {
              return Object.entries(patternButton).map(([key, pattern]: [string, PatternInfo]) => ({
                title,
                name,
                composer,
                dlcCode,
                dlc,
                pattern: key,
                level: pattern.level,
                floor: null,
                rating: pattern.rating || null,
                score: null,
                maxCombo: null,
                djpower: null,
              }))
            }
            return []
          })

          // 모든 보드의 데이터 가져오기
          const allBoardResponses = await Promise.all(
            boards.map(async (boardType) => {
              try {
                const response = await apiClient.getProxy<ApiArchiveNicknameBoard>(
                  `https://v-archive.net/api/archive/${userData.varchiveUserInfo.nickname}/board/${keyMode}/${boardType}`,
                )
                return (
                  response.data.data.floors?.flatMap((floor) =>
                    floor.patterns.map((pattern) => ({
                      ...pattern,
                      floor: floor.floorNumber,
                    })),
                  ) || []
                )
              } catch (error) {
                createLog('error', 'Error fetching board data: ', error)
                return []
              }
            }),
          )

          // 중복 제거 및 데이터 병합
          allKeyModeData[keyMode] = Object.values(
            allBoardResponses.flat().reduce((acc, apiPattern) => {
              const key = `${apiPattern.title}_${apiPattern.pattern}`
              const basePattern = baseSongData.find(
                (bp) => bp.title === apiPattern.title && bp.pattern === apiPattern.pattern,
              )

              if (
                !acc[key] ||
                (apiPattern.djpower && apiPattern.djpower > (acc[key].djpower || 0))
              ) {
                // 먼저 기본 객체 구조 생성
                const mergedPattern = {
                  title: apiPattern.title,
                  name: basePattern?.name || apiPattern.name,
                  composer: basePattern?.composer || apiPattern.composer,
                  pattern: apiPattern.pattern,
                  dlcCode: basePattern?.dlcCode || apiPattern.dlcCode,
                  dlc: basePattern?.dlc || apiPattern.dlc,

                  // API 데이터 우선
                  floor: apiPattern.floor, // floor 값을 먼저 할당
                  score: apiPattern.score,
                  maxCombo: apiPattern.maxCombo,
                  djpower: apiPattern.djpower,
                  rating: apiPattern.rating,

                  // basePattern의 level은 별도로 유지
                  level: basePattern?.level || null,
                }

                acc[key] = mergedPattern
              }
              return acc
            }, {}),
          )
        }

        setKeyModeData(allKeyModeData)
      } catch (error) {
        createLog('error', 'Error fetching all data: ', error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchAllBoardData()
  }, [userData.varchiveUserInfo.nickname])

  useEffect(() => {
    createLog('debug', 'KeyMode Data:', keyModeData)
  }, [keyModeData])

  useEffect(() => {
    const stats = {
      perfect: 0,
      maxCombo: 0,
      clear: 0,
      totalPatterns: 0,
      over999: 0,
      over995: 0,
      over99: 0,
      over97: 0,
    }

    // 모든 키모드의 데이터를
    Object.values(keyModeData).forEach((patterns) => {
      patterns.forEach((pattern) => {
        stats.totalPatterns++

        // 점수를 숫자로 변환
        const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score

        if (pattern.maxCombo === 1 || score === 100.0) stats.maxCombo++

        // 점수 기준을 중첩되게 처리
        if (score === 100.0) {
          stats.perfect++
          stats.over999++
          stats.over995++
          stats.over99++
          stats.over97++
        } else if (score >= 99.9) {
          stats.over999++
          stats.over995++
          stats.over99++
          stats.over97++
        } else if (score >= 99.5) {
          stats.over995++
          stats.over99++
          stats.over97++
        } else if (score >= 99.0) {
          stats.over99++
          stats.over97++
        } else if (score >= 97.0) {
          stats.over97++
        }

        if (score !== null && score > 0) stats.clear++
      })
    })

    setTotalStats(stats)
  }, [keyModeData]) // keyModeData가 변경될 때마다 전체 통계 다시 계산

  const getTierByScore = (score: number) => {
    const tierInfo = {
      9950: { name: 'Grand Master', color: 'tw:text-indigo-600 tw:dark:text-indigo-400' },
      9900: { name: 'Master I', color: 'tw:text-indigo-500 tw:dark:text-indigo-300' },
      9800: { name: 'Master II', color: 'tw:text-indigo-500 tw:dark:text-indigo-300' },
      9700: { name: 'Master III', color: 'tw:text-indigo-500 tw:dark:text-indigo-300' },
      9600: { name: 'Diamond I', color: 'tw:text-blue-500 tw:dark:text-blue-300' },
      9400: { name: 'Diamond II', color: 'tw:text-blue-500 tw:dark:text-blue-300' },
      9200: { name: 'Diamond III', color: 'tw:text-blue-500 tw:dark:text-blue-300' },
      9000: { name: 'Diamond IV', color: 'tw:text-blue-500 tw:dark:text-blue-300' },
      8800: { name: 'Platinum I', color: 'tw:text-cyan-500 tw:dark:text-cyan-300' },
      8600: { name: 'Platinum II', color: 'tw:text-cyan-500 tw:dark:text-cyan-300' },
      8400: { name: 'Platinum III', color: 'tw:text-cyan-500 tw:dark:text-cyan-300' },
      8200: { name: 'Platinum IV', color: 'tw:text-cyan-500 tw:dark:text-cyan-300' },
      8000: { name: 'Gold I', color: 'tw:text-yellow-600 tw:dark:text-yellow-500' },
      7800: { name: 'Gold II', color: 'tw:text-yellow-600 tw:dark:text-yellow-500' },
      7600: { name: 'Gold III', color: 'tw:text-yellow-600 tw:dark:text-yellow-500' },
      7400: { name: 'Gold IV', color: 'tw:text-yellow-600 tw:dark:text-yellow-500' },
      7200: { name: 'Silver I', color: 'tw:text-gray-400 tw:dark:text-slate-300' },
      7000: { name: 'Silver II', color: 'tw:text-gray-400 tw:dark:text-slate-300' },
      6800: { name: 'Silver III', color: 'tw:text-gray-400 tw:dark:text-slate-300' },
      6600: { name: 'Silver IV', color: 'tw:text-gray-400 tw:dark:text-slate-300' },
      6300: { name: 'Bronze I', color: 'tw:text-amber-800 tw:dark:text-amber-600' },
      6000: { name: 'Bronze II', color: 'tw:text-amber-800 tw:dark:text-amber-600' },
      5650: { name: 'Bronze III', color: 'tw:text-amber-800 tw:dark:text-amber-600' },
      5300: { name: 'Bronze IV', color: 'tw:text-amber-800 tw:dark:text-amber-600' },
      4900: { name: 'Iron I', color: 'tw:text-gray-600 tw:dark:text-slate-400' },
      4600: { name: 'Iron II', color: 'tw:text-gray-600 tw:dark:text-slate-400' },
      4300: { name: 'Iron III', color: 'tw:text-gray-600 tw:dark:text-slate-400' },
      4000: { name: 'Iron IV', color: 'tw:text-gray-600 tw:dark:text-slate-400' },
      3000: { name: 'Amateur I', color: 'tw:text-gray-500 tw:dark:text-zinc-400' },
      2000: { name: 'Amateur II', color: 'tw:text-gray-500 tw:dark:text-zinc-400' },
      1000: { name: 'Amateur III', color: 'tw:text-gray-500 tw:dark:text-zinc-400' },
      500: { name: 'Amateur IV', color: 'tw:text-gray-500 tw:dark:text-zinc-400' },
      0: { name: 'Beginner', color: 'tw:text-gray-600 tw:dark:text-zinc-500' },
    }

    if (score < 0) return tierInfo[0]
    if (score >= 9950) return tierInfo[9950]

    const tierScores = Object.keys(tierInfo)
      .map(Number)
      .sort((a, b) => b - a)

    const nearestTierScore = tierScores.find((tierScore) => score >= tierScore) ?? 0

    return tierInfo[nearestTierScore]
  }

  // 키모드별 만점 점수 설정
  const KEY_MODE_MAX_SCORES = {
    '4': 9696,
    '5': 9732,
    '6': 9700,
    '8': 9741,
  }

  const getLevelDisplay = (pattern: BoardPatternInfo) => {
    if (pattern.level) {
      if (pattern.pattern === 'SC') {
        return (
          <span
            className={`tw:flex tw:gap-2 tw:font-extrabold tw:items-center tw:text-respect-sc-15`}
          >
            <Image
              src={`https://cdn.open-racla.app/djmax_respect_v/sc_15_star.png`}
              alt='difficulty'
              width={16}
              height={16}
              className='tw:w-4 tw:h-4'
            />
            <span className='tw:font-extrabold tw:mb-0.5'>
              {pattern.floor !== 0 ? pattern.floor + 'F' : pattern.level}
            </span>
          </span>
        )
      }

      const difficultyClass =
        pattern.pattern === 'HD' ? 'nm-10' : pattern.pattern === 'MX' ? 'nm-15' : 'nm-5' // 기본값

      return (
        <span
          className={`tw:flex tw:gap-2 tw:font-extrabold tw:items-center tw:text-respect-${difficultyClass}`}
        >
          <Image
            src={`https://cdn.open-racla.app/djmax_respect_v/nm_${difficultyClass.split('-')[1]}_star.png`}
            alt='difficulty'
            width={16}
            height={16}
            className='tw:w-4 tw:h-4'
          />
          <span className='tw:font-extrabold tw:mb-0.5'>{`${pattern.floor !== 0 ? pattern.floor + 'F' : pattern.level}`}</span>
        </span>
      )
    }

    return t('noDifficultyInfo')
  }

  const getHighestLevelInfo = (
    patterns: BoardPatternInfo[],
    condition: (pattern: BoardPatternInfo) => boolean,
  ) => {
    // 조건에 맞는 패턴들만 터
    const filteredPatterns = patterns.filter(condition)

    // songData에서 올바른 floor 값을 가져와서 패턴 정보 업데이트
    const updatedPatterns = filteredPatterns.map((pattern) => {
      // songData에서 해당 곡 찾기
      const song = songData[selectedGame].find((s) => s.title === pattern.title)
      if (!song) return { ...pattern, floor: 0 }

      // 해당 키모드의 패턴 정보 찾기
      const keyModePatterns = song.patterns[`${selectedKeyMode}B`]
      if (!keyModePatterns) return { ...pattern, floor: 0 }

      // pattern key에 해당하는 floor 값 찾기
      const patternInfo = keyModePatterns[pattern.pattern]
      if (!patternInfo) return { ...pattern, floor: 0 }

      // floor 값이 있으면 사용, 없으면 0
      return {
        ...pattern,
        floor: patternInfo.floor || 0,
      }
    })

    // 패턴의 난이도를 비교하는 함수
    const compareDifficulty = (a: BoardPatternInfo, b: BoardPatternInfo) => {
      // SC 패턴 (floor가 있는 경우)
      const aFloor = Number(a.floor) || -1
      const bFloor = Number(b.floor) || -1

      // 둘 다 SC 패턴인 경우 floor로 비교
      if (aFloor >= 0 && bFloor >= 0) {
        return bFloor - aFloor
      }

      // SC 패턴이 있는 경우 SC 패턴 우선
      if (aFloor >= 0) return -1
      if (bFloor >= 0) return 1

      // 둘 다 일반 패턴인 경우 level로 비교
      const aLevel = a.level ?? 0
      const bLevel = b.level ?? 0
      return bLevel - aLevel
    }

    // 난이도 순으로 정렬하고 가장 높은 난이도의 패턴 반환
    return updatedPatterns.sort(compareDifficulty)[0]
  }

  // board 페이지의 통계 계산 함수와 동일한 로직
  const calculateStats = (patterns: BoardPatternInfo[]) => {
    const stats = {
      maxCombo: 0,
      perfect: 0,
      over999: 0,
      over995: 0,
      over99: 0,
      over97: 0,
      clear: 0,
      total: patterns.length,
    }

    patterns.forEach((pattern) => {
      // 점수를 숫자로 변환
      const score = typeof pattern.score === 'string' ? parseFloat(pattern.score) : pattern.score

      if (pattern.maxCombo === 1 || score === 100.0) stats.maxCombo++

      // 점수 기준을 중첩되게 처리
      if (score === 100.0) {
        stats.perfect++
        stats.over999++
        stats.over995++
        stats.over99++
        stats.over97++
      } else if (score >= 99.9) {
        stats.over999++
        stats.over995++
        stats.over99++
        stats.over97++
      } else if (score >= 99.5) {
        stats.over995++
        stats.over99++
        stats.over97++
      } else if (score >= 99.0) {
        stats.over99++
        stats.over97++
      } else if (score >= 97.0) {
        stats.over97++
      }

      if (score !== null && score > 0) stats.clear++
    })

    return stats
  }

  // 티어 점수를 저장할 state 추가
  const [tierScores, setTierScores] = useState<Record<string, { tierScore: number; tier: string }>>(
    {
      '4': { tierScore: 0, tier: 'Beginner' },
      '5': { tierScore: 0, tier: 'Beginner' },
      '6': { tierScore: 0, tier: 'Beginner' },
      '8': { tierScore: 0, tier: 'Beginner' },
    },
  )

  // keyModeData가 업데이트될 때마다 티어 점수 계산
  useEffect(() => {
    const newTierScores = { ...tierScores }

    Object.entries(keyModeData).forEach(([keyMode, patterns]) => {
      // rating 기준으로 정렬하고 상위 50개 선택
      const top50 = [...patterns].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 50)

      // rating 합계 계산
      const totalRating = top50.reduce((sum, pattern) => sum + (pattern.rating || 0), 0)

      // 티어 점수 계산
      const tierScore = (totalRating / KEY_MODE_MAX_SCORES[keyMode]) * 10000

      newTierScores[keyMode] = {
        tierScore,
        tier: getTierByScore(tierScore).name,
      }
    })

    setTierScores(newTierScores)
  }, [keyModeData])

  // cutoff 점수 계산 로직 수정
  useEffect(() => {
    const newCutoffScores = { ...cutoffScores }

    Object.entries(keyModeData).forEach(([keyMode, patterns]) => {
      // 모든 패턴을 하나의 배열로 합치고 중복 제거
      const allPatterns = Object.values(
        patterns.reduce((acc, pattern) => {
          const key = `${pattern.title}_${pattern.pattern}`
          if (!acc[key] || acc[key].djpower < pattern.djpower) {
            acc[key] = pattern
          }
          return acc
        }, {}),
      )

      // NEW 30 턴 필터링 및 정렬 (VL, TEK DLC와 Insane Drift)
      const newPatterns = allPatterns
        .filter(
          (pattern: BoardPatternInfo) =>
            pattern.dlcCode === 'VL3' ||
            pattern.dlcCode === 'BA' ||
            pattern.dlcCode === 'PLI1' ||
            pattern.name === 'Kill Trap' ||
            pattern.name === 'Diomedes ~Extended Mix~' ||
            pattern.name === 'Phoenix Virus' ||
            pattern.name === 'alliance',
        )
        .sort((a: BoardPatternInfo, b: BoardPatternInfo) => (b.djpower ?? 0) - (a.djpower ?? 0))

      // BASIC 70 패턴 필터링 및 정렬 (VL, TEK DLC와 Insane Drift 제외)
      const basicPatterns = allPatterns
        .filter(
          (pattern: BoardPatternInfo) =>
            pattern.dlcCode !== 'VL3' &&
            pattern.dlcCode !== 'BA' &&
            pattern.dlcCode !== 'PLI1' &&
            pattern.name !== 'Kill Trap' &&
            pattern.name !== 'Diomedes ~Extended Mix~' &&
            pattern.name !== 'Phoenix Virus' &&
            pattern.name !== 'alliance',
        )
        .sort((a: BoardPatternInfo, b: BoardPatternInfo) => (b.djpower ?? 0) - (a.djpower ?? 0))

      // TOP 50 렬 (rating 기준)
      const top50Patterns = [...allPatterns]
        .sort((a: BoardPatternInfo, b: BoardPatternInfo) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 50)

      newCutoffScores[keyMode] = {
        new30: (newPatterns[29] as BoardPatternInfo)?.djpower ?? 0,
        basic70: (basicPatterns[69] as BoardPatternInfo)?.djpower ?? 0,
        top50: (top50Patterns[49] as BoardPatternInfo)?.rating ?? 0,
      }
    })

    setCutoffScores(newCutoffScores)
  }, [keyModeData])

  return (
    <>
      {selectedGame === 'djmax_respect_v' && (
        <>
          {isLoading ? (
            <div className='tw:flex tw:items-center tw:w-full tw:h-[calc(100vh-106px)] tw:justify-center tw:flex-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:border tw:border-gray-200 tw:dark:border-slate-700'>
              <PuffLoader color='#6366f1' size={32} />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <div id='ContentHeader' />
              {/* 헤더 섹션 */}
              <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-4 tw:mb-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                <div className='tw:flex tw:justify-between tw:items-center'>
                  <span className='tw:flex tw:w-full tw:items-center tw:gap-1'>
                    <span className='tw:text-xl tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                      {selectedKeyMode}B {t('stats')}
                    </span>
                    (
                    <span
                      className={`tw:text-lg tw:font-bold ${getTierByScore(tierScores[selectedKeyMode].tierScore).color}`}
                    >
                      {String(tierScores[selectedKeyMode].tier).toUpperCase()}
                    </span>
                    )
                  </span>
                  <span className='tw:text-lg'>
                    <KeyModeSelector />
                  </span>
                </div>
              </div>

              {/* 패널들 - 래퍼 제거하고 직접 배치 */}
              <div className='tw:flex tw:gap-4 stats-section'>
                <div className='tw:flex tw:flex-col tw:gap-4 tw:w-3/5'>
                  {/* Button Mode Panel */}
                  <div className='tw:flex tw:flex-col tw:gap-4'>
                    {/* 통계 정보 */}
                    <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                      {/* 상단 통계 요약 */}
                      <div className='tw:grid tw:grid-cols-7 tw:gap-2 tw:mb-8'>
                        {[
                          {
                            key: 'clear',
                            label: t('clear'),
                            color: 'tw:text-blue-600 tw:dark:text-blue-500',
                            bg: 'tw:bg-blue-50 tw:dark:bg-blue-500/20',
                          },
                          {
                            key: 'perfect',
                            label: t('perfect'),
                            color: 'tw:text-red-600 tw:dark:text-red-500',
                            bg: 'tw:bg-red-50 tw:dark:bg-red-500/20',
                          },
                          {
                            key: 'over999',
                            label: t('over999.name'),
                            color: 'tw:text-yellow-600 tw:dark:text-yellow-500',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-500/20',
                          },
                          {
                            key: 'over995',
                            label: t('over995.name'),
                            color: 'tw:text-yellow-500 tw:dark:text-yellow-400',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-400/20',
                          },
                          {
                            key: 'over99',
                            label: t('over99.name'),
                            color: 'tw:text-yellow-400 tw:dark:text-yellow-300',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-300/20',
                          },
                          {
                            key: 'over97',
                            label: t('over97.name'),
                            color: 'tw:text-yellow-300 tw:dark:text-yellow-200',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-200/20',
                          },
                          {
                            key: 'maxCombo',
                            label: t('maxCombo'),
                            color: 'tw:text-green-600 tw:dark:text-green-500',
                            bg: 'tw:bg-green-50 tw:dark:bg-green-500/20',
                          },
                        ].map(({ key, label, color, bg }) => (
                          <div
                            key={key}
                            className={`tw:text-center tw:p-3 ${bg} tw:rounded-lg tw:transition-all tw:duration-300 hover:tw:shadow-md`}
                          >
                            <div className={`tw:text-lg tw:font-bold ${color}`}>
                              {calculateStats(keyModeData[selectedKeyMode])[key]}
                            </div>
                            <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 도넛 차트 */}
                      <div className='tw:relative tw:w-full tw:h-44 tw:flex tw:items-center tw:justify-center'>
                        <div className='tw:flex tw:justify-between tw:w-full tw:h-full'>
                          {/* 차트 1: 클리어 / 미클리어 */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {calculateStats(keyModeData[selectedKeyMode]).total}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('all')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('clear'), t('noRecord')],
                                  datasets: [
                                    {
                                      data: [
                                        calculateStats(keyModeData[selectedKeyMode]).clear,
                                        calculateStats(keyModeData[selectedKeyMode]).total -
                                          calculateStats(keyModeData[selectedKeyMode]).clear,
                                      ],
                                      backgroundColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],

                                      borderColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 3: 퍼펙트 점수 구간 (클리어한 것만) */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {calculateStats(keyModeData[selectedKeyMode]).clear}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('clear')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [
                                    t('perfect'),
                                    t('over999.fullName'),
                                    t('over995.fullName'),
                                    t('over99.fullName'),
                                    t('over97.fullName'),
                                    t('under97.fullName'),
                                  ],
                                  datasets: [
                                    {
                                      data: [
                                        calculateStats(keyModeData[selectedKeyMode]).perfect,
                                        calculateStats(keyModeData[selectedKeyMode]).over999,
                                        calculateStats(keyModeData[selectedKeyMode]).over995,
                                        calculateStats(keyModeData[selectedKeyMode]).over99,
                                        calculateStats(keyModeData[selectedKeyMode]).over97,
                                        calculateStats(keyModeData[selectedKeyMode]).clear -
                                          calculateStats(keyModeData[selectedKeyMode]).over97,
                                      ],
                                      backgroundColor: [
                                        'rgba(239, 68, 68, 0.8)',
                                        'rgba(234, 179, 8, 0.8)',
                                        'rgba(234, 179, 8, 0.6)',
                                        'rgba(234, 179, 8, 0.4)',
                                        'rgba(234, 179, 8, 0.2)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(239, 68, 68, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234,179,8,1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 2: 퍼펙트 or 풀콤보 / 해당되지 않는 것 (클리어한 것만) */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {calculateStats(keyModeData[selectedKeyMode]).maxCombo}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('maxCombo')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('maxCombo'), t('withoutMaxCombo')],
                                  datasets: [
                                    {
                                      data: [
                                        calculateStats(keyModeData[selectedKeyMode]).maxCombo,
                                        calculateStats(keyModeData[selectedKeyMode]).clear -
                                          calculateStats(keyModeData[selectedKeyMode]).maxCombo,
                                      ],
                                      backgroundColor: [
                                        'rgba(34, 197, 94, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(34, 197, 94, 1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='tw:flex tw:flex-col tw:justify-center tw:items-center tw:gap-1 tw:text-xs tw:rounded-lg tw:mt-8 tw:text-center'>
                        <div className='tw:flex tw:justify-center tw:gap-1 tw:w-full'>
                          <span className='tw:p-1 tw:px-4 tw:bg-green-50 tw:dark:bg-green-500/20 tw:rounded-md tw:font-extrabold tw:text-green-600 tw:dark:text-green-500'>
                            NEW 30
                          </span>
                          <span className='tw:p-1 tw:px-4 tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-md tw:text-gray-900 tw:dark:text-white'>
                            {cutoffScores[selectedKeyMode].new30.toFixed(3)} DP
                          </span>
                          <span className='tw:p-1 tw:px-4 tw:bg-yellow-50 tw:dark:bg-yellow-500/20 tw:rounded-md tw:font-extrabold tw:text-yellow-600 tw:dark:text-yellow-500'>
                            BASIC 70
                          </span>
                          <span className='tw:p-1 tw:px-4 tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-md tw:text-gray-900 tw:dark:text-white'>
                            {cutoffScores[selectedKeyMode].basic70.toFixed(3)} DP
                          </span>
                          <span className='tw:p-1 tw:px-4 tw:bg-red-50 tw:dark:bg-red-500/20 tw:rounded-md tw:font-extrabold tw:text-red-600 tw:dark:text-red-500'>
                            TOP 50
                          </span>
                          <span className='tw:p-1 tw:px-4 tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-md tw:text-gray-900 tw:dark:text-white'>
                            {cutoffScores[selectedKeyMode].top50.toFixed(3)} TP
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Overall Panel */}
                  <div className='tw:flex tw:flex-col tw:gap-4'>
                    <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:flex tw:justify-between tw:items-end tw:rounded-lg tw:p-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                      <div className='tw:flex tw:flex-col'>
                        <span className='tw:text-xl tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                          {t('all')} {t('stats')}
                        </span>
                      </div>
                    </div>

                    <div className='tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-4 tw:pb-8 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                      {/* 상단 통계 요약 */}
                      <div className='tw:grid tw:grid-cols-7 tw:gap-2 tw:mb-8'>
                        {[
                          {
                            key: 'clear',
                            label: t('clear'),
                            color: 'tw:text-blue-600 tw:dark:text-blue-500',
                            bg: 'tw:bg-blue-50 tw:dark:bg-blue-500/20',
                          },
                          {
                            key: 'perfect',
                            label: t('perfect'),
                            color: 'tw:text-red-600 tw:dark:text-red-500',
                            bg: 'tw:bg-red-50 tw:dark:bg-red-500/20',
                          },
                          {
                            key: 'over999',
                            label: t('over999.name'),
                            color: 'tw:text-yellow-600 tw:dark:text-yellow-500',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-500/20',
                          },
                          {
                            key: 'over995',
                            label: t('over995.name'),
                            color: 'tw:text-yellow-500 tw:dark:text-yellow-400',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-400/20',
                          },
                          {
                            key: 'over99',
                            label: t('over99.name'),
                            color: 'tw:text-yellow-400 tw:dark:text-yellow-300',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-300/20',
                          },
                          {
                            key: 'over97',
                            label: t('over97.name'),
                            color: 'tw:text-yellow-300 tw:dark:text-yellow-200',
                            bg: 'tw:bg-yellow-50 tw:dark:bg-yellow-200/20',
                          },
                          {
                            key: 'maxCombo',
                            label: t('maxCombo'),
                            color: 'tw:text-green-600 tw:dark:text-green-500',
                            bg: 'tw:bg-green-50 tw:dark:bg-green-500/20',
                          },
                        ].map(({ key, label, color, bg }) => (
                          <div
                            key={key}
                            className={`tw:text-center tw:p-3 ${bg} tw:rounded-lg tw:transition-all tw:duration-300 hover:tw:shadow-md`}
                          >
                            <div className={`tw:text-lg tw:font-bold ${color}`}>
                              {totalStats[key]}
                            </div>
                            <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* 도넛 차트 */}
                      <div className='tw:relative tw:w-full tw:h-44 tw:flex tw:items-center tw:justify-center'>
                        <div className='tw:flex tw:justify-between tw:w-full tw:h-full'>
                          {/* 차트 1: 클리어 / 미클리어 */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {totalStats.totalPatterns}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('all')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('clear'), t('noRecord')],
                                  datasets: [
                                    {
                                      data: [
                                        totalStats.clear,
                                        totalStats.totalPatterns - totalStats.clear,
                                      ],
                                      backgroundColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],

                                      borderColor: [
                                        'rgba(59, 130, 246, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 3: 퍼펙트 점수 구간 (클리어한 것만) */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {totalStats.clear}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('clear')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [
                                    t('perfect'),
                                    t('over999.fullName'),
                                    t('over995.fullName'),
                                    t('over99.fullName'),
                                    t('over97.fullName'),
                                    t('under97.fullName'),
                                  ],
                                  datasets: [
                                    {
                                      data: [
                                        totalStats.perfect,
                                        totalStats.over999,
                                        totalStats.over995,
                                        totalStats.over99,
                                        totalStats.over97,
                                        totalStats.clear - totalStats.over97,
                                      ],
                                      backgroundColor: [
                                        'rgba(239, 68, 68, 0.8)',
                                        'rgba(234, 179, 8, 0.8)',
                                        'rgba(234, 179, 8, 0.6)',
                                        'rgba(234, 179, 8, 0.4)',
                                        'rgba(234, 179, 8, 0.2)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(239, 68, 68, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234, 179, 8, 1)',
                                        'rgba(234,179,8,1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>

                          {/* 차트 2: 퍼펙트 or 풀콤보 / 해당되지 않는 것 (클리어한 것만) */}
                          <div className='tw:relative tw:w-1/3 tw:flex tw:items-center tw:justify-center'>
                            {/* 도넛 차트 안에 정보 표시 */}
                            <div className='tw:absolute tw:text-center tw:w-[88px] tw:h-[88px] tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-full tw:flex tw:flex-col tw:justify-center tw:items-center tw:z-0 tw:shadow-inner'>
                              <div className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                {totalStats.maxCombo}
                              </div>
                              <div className='tw:text-xs tw:text-gray-500 tw:dark:text-slate-300'>
                                {t('maxCombo')}
                              </div>
                            </div>
                            <div className='tw:relative tw:z-1'>
                              <Doughnut
                                data={{
                                  labels: [t('maxCombo'), t('withoutMaxCombo')],
                                  datasets: [
                                    {
                                      data: [
                                        totalStats.maxCombo,
                                        totalStats.clear - totalStats.maxCombo,
                                      ],
                                      backgroundColor: [
                                        'rgba(34, 197, 94, 0.8)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderColor: [
                                        'rgba(34, 197, 94, 1)',
                                        'rgba(39, 39, 42, 0.75)',
                                      ],
                                      borderWidth: 1,
                                    },
                                  ],
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  cutout: '60%',
                                  plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                      titleFont: {
                                        family: 'SUITE Variable',
                                      },
                                      bodyFont: {
                                        family: 'SUITE Variable',
                                      },
                                      callbacks: {
                                        label: (context: TooltipItem<'doughnut'>) => {
                                          const label = context.label || ''
                                          const value = context.raw || 0
                                          return `${label}: ${value}`
                                        },
                                      },
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 최고 성과 패널 */}
                <div className='tw:w-2/5'>
                  <div className='tw:flex tw:flex-col tw:gap-4 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:p-4 tw:border tw:border-gray-200 tw:dark:border-slate-700'>
                    <span className='tw:text-lg tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                      {selectedKeyMode}B {t('best')} {t('achievement')}
                    </span>
                    <motion.div
                      key={`achievements_${selectedKeyMode}`}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className='tw:flex tw:flex-col tw:gap-2'
                    >
                      {Object.entries({
                        maxCombo: t('maxCombo'),
                        perfect: t('perfect'),
                        over999: t('over999.fullName'),
                        over995: t('over995.fullName'),
                        over99: t('over99.fullName'),
                        over97: t('over97.fullName'),
                        clear: t('clear'),
                      }).map(([key, label]) => {
                        const patterns = keyModeData[selectedKeyMode]
                        const condition = (pattern: BoardPatternInfo) => {
                          const score =
                            typeof pattern.score === 'string'
                              ? parseFloat(pattern.score)
                              : pattern.score
                          if (score === null) return false

                          // perfect, maxCombo, clear는 독립적으로 체크
                          if (key === 'perfect') {
                            return Math.abs(score - 100.0) < 0.001
                          }
                          if (key === 'maxCombo') {
                            return pattern.maxCombo === 1
                          }
                          if (key === 'clear') {
                            return score > 0
                          }

                          // over 카테고리들은 서로 겹치지 않도록 체크
                          switch (key) {
                            case 'over999':
                              return score >= 99.9 && score < 100
                            case 'over995':
                              return score >= 99.5 && score < 99.9
                            case 'over99':
                              return score >= 99.0 && score < 99.5
                            case 'over97':
                              return score >= 97.0 && score < 99.0
                            default:
                              return false
                          }
                        }

                        const highestPattern = getHighestLevelInfo(patterns, condition)

                        if (!highestPattern) return null

                        return (
                          <div key={`${key}_${selectedKeyMode}`} className='tw:flex tw:gap-2'>
                            <ScorePopupComponent
                              songTitle={highestPattern.title}
                              keyMode={selectedKeyMode}
                            />
                            <div className='tw:flex tw:flex-col tw:gap-1 tw:bg-gray-100 tw:dark:bg-slate-700/50 tw:rounded-md tw:p-3 tw:flex-1 tw:border tw:border-gray-200 tw:dark:border-slate-600'>
                              <div className='tw:flex tw:justify-between tw:items-center'>
                                <span className='tw:text-sm tw:font-bold tw:text-gray-900 tw:dark:text-white'>
                                  {label}
                                </span>
                                <span className='tw:text-sm tw:font-extrabold'>
                                  {getLevelDisplay(highestPattern)}
                                </span>
                              </div>
                              <p className='tw:text-sm tw:text-gray-500 tw:dark:text-slate-300 tw:max-w-full text-one-line'>
                                {highestPattern.name}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </motion.div>
                  </div>
                </div>
              </div>

              <div id='ContentFooter' />
            </motion.div>
          )}
        </>
      )}
    </>
  )
}
