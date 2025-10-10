import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { Icon } from '@iconify/react'
import Image from '@render/components/image/Image'
import ScorePopupComponent from '@render/components/score/ScorePopup'
import { globalDictionary } from '@render/constants/globalDictionary'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { LazySongGridItemProps } from '@src/types/render/LazySongGridItemProps'
import { LazySongListItemProps } from '@src/types/render/LazySongListItemProps'
import { useTranslation } from 'react-i18next'

// 지연 로딩되는 그리드 아이템 컴포넌트
const LazyGridItem = ({ songItem, keyMode }: LazySongGridItemProps) => {
  const { ref, inView } = useInView({
    triggerOnce: false,
    threshold: 0.1,
    rootMargin: '200px',
  })

  return (
    <div ref={ref} className='tw:flex tw:items-center tw:justify-center tw:h-[80px] tw:w-[80px]'>
      {inView && (
        <ScorePopupComponent
          isVisibleCode={true}
          songTitle={songItem.title}
          keyMode={String(keyMode)}
        />
      )}
    </div>
  )
}

// 지연 로딩되는 리스트 아이템 컴포넌트
const LazyListItem = React.memo(
  ({
    songItem,
    keyMode,
    hoveredTitle,
    navigate,
    handleMouseEnter,
    handleMouseLeave,
  }: LazySongListItemProps) => {
    const { ref, inView } = useInView({
      triggerOnce: false,
      threshold: 0.1,
      rootMargin: '200px',
    })

    const handleClick = useCallback(() => {
      navigate(`/games/djmax_respect_v/db/${songItem.title}`)
    }, [songItem.title, navigate])

    if (!inView) {
      return <div ref={ref} className='tw:h-[84px]' /> // 플레이스홀더
    }

    return (
      <div
        ref={ref}
        data-song-title={songItem.title}
        className={`tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-200 tw:dark:border-slate-700 tw:relative tw:overflow-hidden tw:cursor-pointer ${
          hoveredTitle === String(songItem.title) ? 'tw:bg-slate-100 tw:dark:bg-slate-700/50' : ''
        } hover:tw:bg-slate-100 hover:tw:dark:bg-slate-700/50`}
        onMouseEnter={() => handleMouseEnter?.(songItem)}
        onMouseLeave={() => handleMouseLeave?.()}
        onClick={handleClick}
      >
        {/* 애니메이션 배경 레이어 */}
        <div
          className={`tw:absolute tw:inset-0 tw:opacity-0 tw:transition-opacity tw:duration-300 before:tw:content-[''] before:tw:absolute before:tw:inset-[-150%] before:tw:bg-[length:200%_200%] before:tw:animate-gradientSlide before:tw:bg-gradient-to-r before:tw:from-[#1d8975] before:tw:via-[#5276b4] before:tw:via-[#8432bd] before:tw:via-[#5276b4] before:tw:to-[#1d8975] ${
            hoveredTitle === String(songItem.title) ? 'tw:opacity-10' : ''
          } `}
        />

        {/* 곡 정보 */}
        <div className='tw:relative tw:w-full tw:flex tw:items-center tw:gap-4'>
          <div className='tw:w-[80px] tw:h-[80px]'>
            <ScorePopupComponent
              isVisibleCode={true}
              songTitle={songItem.title}
              keyMode={String(keyMode)}
              isLink={false}
            />
          </div>
          <div className='tw:flex tw:flex-1'>
            <div className='tw:flex tw:flex-col tw:flex-1'>
              <span className='tw:text-sm tw:text-slate-500 tw:dark:text-slate-400'>
                {songItem.composer}
              </span>
              <span className='tw:font-bold tw:text-slate-900 tw:dark:text-white'>
                {songItem.name}
              </span>
            </div>
            {/* 난이도별 고정 칸 */}
            <div className='tw:flex tw:gap-4 tw:items-center justify-center'>
              {['NM', 'HD', 'MX', 'SC'].map((diff) => (
                <div key={diff} className='tw:w-20 tw:text-center'>
                  {songItem.patterns[`${keyMode.replace('P', '')}B`]?.[diff] ? (
                    <div
                      className={`tw:flex tw:justify-center tw:items-center tw:gap-1 tw:font-extrabold ${
                        hoveredTitle === String(songItem.title) ? 'tw:opacity-100' : 'tw:opacity-90'
                      } ${diff === 'NM' && 'tw:text-respect-nm-5'} ${
                        diff === 'HD' && 'tw:text-respect-nm-10'
                      } ${diff === 'MX' && 'tw:text-respect-nm-15'} ${
                        diff === 'SC' && 'tw:text-respect-sc-15'
                      } `}
                    >
                      <Image
                        src={`https://cdn.open-racla.app/djmax_respect_v/nm_${diff}_star.png`}
                        width={16}
                        height={16}
                        alt={diff}
                      />
                      <div className='tw:text-base'>
                        {songItem.patterns[`${keyMode.replace('P', '')}B`][diff].level}
                      </div>
                    </div>
                  ) : (
                    <div key={diff} className='tw:opacity-30 tw:text-center'>
                      <div className='tw:text-base tw:font-extrabold'>-</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
)

const DmrvDbPage = () => {
  const { t } = useTranslation(['db'])
  const { songData } = useSelector((state: RootState) => state.app)
  const [keyMode, setKeyMode] = useState<string>('4')
  const [searchName, setSearchName] = useState<string>('')
  const { selectedGame } = useSelector((state: RootState) => state.app)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [difficulty, setDifficulty] = useState<'all' | 'sc'>('all')
  const navigate = useNavigate()
  const [hoveredTitle, setHoveredTitle] = useState<string | null>(null)

  const searchSong = useCallback((songItem, searchName) => {
    const searchNameLower = searchName.toLowerCase().trim()
    const backspacedSearchNameLower = searchName.toLowerCase().trim().replace(' ', '')

    // 일반 문자열 검색
    const isStringMatch =
      String(songItem.composer).toLowerCase().includes(searchNameLower) ||
      String(songItem.name).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(searchNameLower) ||
      String(songItem.title).includes(searchNameLower)

    const isStringMatchBackspaced =
      String(songItem.composer).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.name).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.title).includes(searchNameLower)
    // 초성 검색
    // const isChosungMatch = isMatchingChosung(songItem.composer, searchName) || isMatchingChosung(songItem.name, searchName)

    return isStringMatch || isStringMatchBackspaced
  }, [])

  const [visibleItems, setVisibleItems] = useState<number>(20) // 초기에 보여줄 아이템 수
  const { inView, ref: loadMoreRef } = useInView({
    threshold: 0.1,
    rootMargin: '400px 0px',
  })

  const [selectedDlcCode, setSelectedDlcCode] = useState<string>('R')
  const categoryScrollRef = useRef<HTMLDivElement>(null)

  const handleCategoryScroll = useCallback((direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const scrollAmount = 500
      const targetScroll =
        categoryScrollRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
      categoryScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      })
    }
  }, [])

  // 필터링된 곡 데이터 계산
  const filteredSongData = useMemo(() => {
    const filtered = songData[selectedGame].filter((songItem) => {
      // 검색어 필터
      const searchFilter = searchName === '' || searchSong(songItem, searchName)

      // 난이도 필터
      const levelFilter =
        difficulty === 'all'
          ? selectedLevel === 'all' ||
            ['NM', 'HD', 'MX', 'SC'].some(
              (diff) =>
                Math.floor(songItem.patterns[keyMode + 'B']?.[diff]?.level ?? 0) ===
                parseInt(selectedLevel),
            )
          : songItem.patterns[keyMode + 'B']?.SC?.level && // SC 난이도 존재 확인
            (selectedLevel === 'all' ||
              Math.floor(songItem.patterns[keyMode + 'B']?.SC?.level) === parseInt(selectedLevel))

      // DLC 필터 추가
      const dlcFilter = selectedDlcCode === 'all' || songItem.dlcCode === selectedDlcCode

      return searchFilter && levelFilter && dlcFilter
    })

    // 정렬 적용
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.name.localeCompare(b.name)
      } else {
        return b.name.localeCompare(a.name)
      }
    })
  }, [
    songData,
    searchName,
    selectedLevel,
    keyMode,
    sortOrder,
    selectedDlcCode,
    difficulty,
    searchSong,
  ])

  // 스크롤 시 더 많은 아이템 로드
  useEffect(() => {
    if (inView && visibleItems < filteredSongData.length) {
      setVisibleItems((prev) => Math.min(prev + 20, filteredSongData.length))
    }
  }, [inView, filteredSongData.length, visibleItems])

  // 현재 화면에 보여줄 곡 목록
  const visibleSongData = useMemo(() => {
    return filteredSongData.slice(0, visibleItems)
  }, [filteredSongData, visibleItems])

  return (
    selectedGame === 'djmax_respect_v' && (
      <React.Fragment>
        <div className='tw:flex tw:flex-col tw:gap-4 tw:h-[calc(100vh-106px)] tw:relative'>
          {/* 상단 영역 */}
          <div className='tw:flex tw:flex-col tw:gap-4 tw:transition-all tw:w-full duration-300'>
            <div className='tw:flex tw:w-full tw:gap-4'>
              <div className='tw:flex tw:w-full tw:flex-col tw:gap-4 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-lg tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                {/* 헤더 */}
                <div className='tw:flex tw:w-full tw:rounded tw:overflow-x-auto tw:scroll-smooth'>
                  <div className='tw:flex tw:flex-col tw:gap-4 tw:p-4 tw:w-full'>
                    <div className='tw:flex tw:w-full tw:items-center tw:gap-2'>
                      {/* 왼쪽 스크롤 버튼 */}
                      <button
                        onClick={() => {
                          handleCategoryScroll('left')
                        }}
                        className='tw:flex-none tw:p-2 tw:rounded-md tw:bg-slate-200 tw:dark:bg-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                      >
                        <Icon
                          icon='lucide:chevron-left'
                          className='tw:text-slate-700 tw:dark:text-slate-300'
                        />
                      </button>

                      {/* 스크롤 가능한 중앙 영역 */}
                      <div
                        ref={categoryScrollRef}
                        className='tw:flex-1 tw:flex tw:gap-2 tw:overflow-x-hidden tw:scroll-smooth tw:scrollbar-thin tw:scrollbar-thumb-slate-400 tw:dark:scrollbar-thumb-slate-500 tw:scrollbar-track-transparent'
                      >
                        <button
                          onClick={() => {
                            setSelectedDlcCode('all')
                          }}
                          className={`tw:flex-none tw:px-2 tw:py-2 tw:text-sm tw:rounded-md tw:transition-all tw:min-w-20 ${
                            selectedDlcCode === 'all'
                              ? 'tw:bg-indigo-500 tw:text-white'
                              : 'tw:bg-slate-200 tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                          }`}
                        >
                          {t('all')}
                        </button>
                        {globalDictionary.gameDictionary[selectedGame].dlcList.map((item) => (
                          <button
                            key={item}
                            onClick={() => {
                              setSelectedDlcCode(item)
                            }}
                            className={`tw:flex-none tw:px-2 tw:py-2 tw:text-sm tw:rounded-md tw:transition-all tw:min-w-12 ${
                              selectedDlcCode === item
                                ? 'tw:bg-indigo-500 tw:text-white'
                                : 'tw:bg-slate-200 tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>

                      {/* 오른쪽 스크롤 버튼 */}
                      <button
                        onClick={() => {
                          handleCategoryScroll('right')
                        }}
                        className='tw:flex-none tw:p-2 tw:rounded-md tw:bg-slate-200 tw:dark:bg-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                      >
                        <Icon
                          icon='lucide:chevron-right'
                          className='tw:text-slate-700 tw:dark:text-slate-300'
                        />
                      </button>
                    </div>
                    <div className='tw:flex tw:items-center tw:justify-between tw:gap-2'>
                      <div className='tw:flex tw:gap-2 tw:items-center'>
                        <button
                          onClick={() => {
                            setViewMode('list')
                          }}
                          className={`tw:p-2 tw:rounded-md tw:transition-all ${
                            viewMode === 'list'
                              ? 'tw:bg-indigo-500 tw:text-white'
                              : 'tw:bg-slate-200 tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                          }`}
                        >
                          <Icon icon='lucide:list' className='tw:w-5 tw:h-5' />
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('grid')
                          }}
                          className={`tw:p-2 tw:rounded-md tw:transition-all ${
                            viewMode === 'grid'
                              ? 'tw:bg-indigo-500 tw:text-white'
                              : 'tw:bg-slate-200 tw:dark:bg-slate-600 tw:text-slate-700 tw:dark:text-slate-300 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-500'
                          }`}
                        >
                          <Icon icon='lucide:grid' className='tw:w-5 tw:h-5' />
                        </button>
                      </div>
                      <div className='tw:flex tw:flex-1 tw:gap-2'>
                        <button
                          onClick={() => {
                            createLog('debug', 'Current difficulty:', difficulty)
                            setDifficulty(difficulty === 'all' ? 'sc' : 'all')
                            createLog(
                              'debug',
                              'New difficulty:',
                              difficulty === 'all' ? 'sc' : 'all',
                            )
                          }}
                          className={`tw:px-4 tw:text-sm tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 tw:transition-all ${
                            difficulty === 'sc'
                              ? 'tw:bg-indigo-500 tw:text-white hover:tw:bg-indigo-600'
                              : 'tw:bg-slate-200 tw:dark:bg-slate-700/50 tw:text-slate-700 tw:dark:text-white hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600'
                          }`}
                        >
                          SC
                        </button>
                        <select
                          value={selectedLevel}
                          onChange={(e) => {
                            setSelectedLevel(e.target.value)
                          }}
                          className='tw:p-1.5 tw:min-w-[120px] tw:max-w-[120px] tw:w-36 tw:text-sm tw:rounded-lg tw:border tw:dark:bg-slate-700 tw:dark:text-white tw:dark:border-slate-600 tw:bg-white tw:text-slate-700 tw:border-slate-300 focus:tw:border-indigo-400 focus:tw:ring-2 focus:tw:ring-indigo-400 focus:tw:ring-opacity-20 tw:transition-all'
                        >
                          <option value='all'>{t('allDifficulty')}</option>
                          {Array.from({ length: 15 }, (_, i) => i + 1).map((level) => (
                            <option key={level} value={level.toString()}>
                              Lv.{level}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => {
                            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                          }}
                          className='tw:text-sm tw:bg-slate-200 tw:dark:bg-slate-700/50 tw:text-slate-700 tw:dark:text-white tw:px-4 tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 hover:tw:bg-slate-300 hover:tw:dark:bg-slate-600 tw:transition-all'
                        >
                          {sortOrder === 'asc' ? t('nameAsc') : t('nameDesc')}
                        </button>
                        <div className='tw:relative tw:flex-1'>
                          <div className='tw:absolute tw:inset-y-0 tw:left-0 tw:pl-3 tw:flex tw:items-center tw:pointer-events-none'>
                            <svg
                              className='tw:h-5 tw:w-5 tw:text-slate-400'
                              xmlns='http://www.w3.org/2000/svg'
                              viewBox='0 0 20 20'
                              fill='currentColor'
                            >
                              <path
                                fillRule='evenodd'
                                d='M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z'
                                clipRule='evenodd'
                              />
                            </svg>
                          </div>

                          <input
                            ref={searchInputRef}
                            className='tw:w-full tw:text-sm tw:placeholder:text-slate-400 tw:bg-white tw:dark:bg-slate-700 tw:bg-opacity-25 tw:text-light tw:pl-10 tw:pr-4 tw:py-1.5 tw:rounded-lg tw:border tw:border-slate-300 tw:dark:border-slate-600 tw:border-opacity-50 focus:tw:border-blue-400 focus:tw:ring-2 focus:tw:ring-blue-400 focus:tw:ring-opacity-20 tw:transition-all'
                            onChange={(e) => {
                              setSearchName(e.currentTarget.value)
                            }}
                            type='text'
                            placeholder={t('searchPlaceholder')}
                          />
                        </div>
                      </div>
                      <div className='tw:flex tw:gap-2'>
                        <div className='tw:flex tw:gap-2'>
                          {globalDictionary.gameDictionary[selectedGame].keyModeList.map((mode) => (
                            <button
                              key={`mode_${mode}`}
                              onClick={() => {
                                setKeyMode(String(mode))
                              }}
                              className={`tw:flex tw:items-center tw:justify-center tw:relative tw:px-4 tw:py-0.5 tw:border tw:border-opacity-50 tw:transition-all tw:duration-500 tw:rounded-md tw:flex-1 ${
                                String(mode) === keyMode
                                  ? 'tw:border-indigo-500 tw:bg-indigo-600/20 tw:dark:bg-indigo-600/20 tw:brightness-150'
                                  : 'tw:border-slate-400 tw:dark:border-slate-600 tw:opacity-50 hover:tw:border-indigo-400 hover:tw:bg-slate-200 hover:tw:dark:bg-slate-700 hover:tw:bg-opacity-30 hover:tw:dark:bg-opacity-30 hover:tw:opacity-100'
                              }`}
                            >
                              <div
                                className={`tw:absolute tw:w-full tw:h-full tw:opacity-30 ${
                                  selectedGame === 'djmax_respect_v' ? 'respect' : selectedGame
                                }_bg_b${String(mode).replace('P', '')}`}
                              />
                              <span className='tw:relative tw:text-base tw:font-bold'>
                                {String(mode).replace('P', '')}B
                                {String(mode).includes('P') ? '+' : ''}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 영역 */}
          <div className='tw:flex-1 tw:overflow-hidden tw:transition-all tw:w-full duration-300'>
            <div className='tw:h-full tw:overflow-y-auto tw:scroll-smooth tw:custom-scrollbar custom-scrollbar-always'>
              <div className='tw:flex tw:mr-2 tw:flex-col tw:gap-1 tw:bg-white tw:dark:bg-slate-800 tw:bg-opacity-75 tw:dark:bg-opacity-75 tw:rounded-md tw:p-4 tw:border tw:border-slate-200 tw:dark:border-slate-700'>
                <div
                  className={`tw:w-full ${viewMode === 'grid' ? 'tw:grid tw:grid-cols-[repeat(auto-fill,80px)] tw:gap-3 tw:justify-center tw:content-center' : 'tw:flex tw:flex-col'}`}
                >
                  {viewMode === 'list' && (
                    <div className='tw:flex tw:items-center tw:gap-4 tw:p-2 tw:border-b tw:border-slate-300 tw:dark:border-slate-600 tw:text-slate-500 tw:dark:text-slate-300 tw:font-bold tw:text-sm'>
                      <div className='tw:w-[80px] tw:text-center'>{t('songImage')}</div>
                      <div className='tw:flex tw:flex-1'>
                        <div className='tw:flex-1'>{t('songInfo')}</div>
                        <div className='tw:w-96 tw:text-center'>{t('difficulty')}</div>
                      </div>
                    </div>
                  )}

                  {viewMode === 'grid' ? (
                    // 그리드 뷰
                    <>
                      {visibleSongData.map((songItem) => (
                        <LazyGridItem key={songItem.title} songItem={songItem} keyMode={keyMode} />
                      ))}
                      {/* 그리드 레이아웃을 안정화시키기 위한 고정 너비/높이의 더미 요소들 */}
                      {Array.from(Array(20)).map((_, index) => (
                        <div key={`dummy_${index}`} className='tw:h-[80px] tw:w-[80px]' />
                      ))}
                    </>
                  ) : (
                    // 리스트 뷰
                    visibleSongData.map((songItem) => (
                      <LazyListItem
                        key={songItem.title}
                        songItem={songItem}
                        keyMode={keyMode}
                        hoveredTitle={hoveredTitle}
                        navigate={navigate}
                        handleMouseEnter={(song) => setHoveredTitle(String(song.title))}
                        handleMouseLeave={() => setHoveredTitle(null)}
                      />
                    ))
                  )}

                  {/* 더 불러오기를 위한 관찰 요소 */}
                  {visibleItems < filteredSongData.length && (
                    <div
                      ref={loadMoreRef}
                      className={`tw:h-20 tw:w-full tw:flex tw:justify-center tw:items-center ${viewMode === 'grid' ? 'tw:col-span-full' : ''}`}
                    >
                      <div className='tw:text-sm tw:text-slate-500'>{t('loadingMore')}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  )
}

export default DmrvDbPage
