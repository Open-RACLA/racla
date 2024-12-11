import React, { useEffect, useRef, useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import * as R from 'ramda'
import { FaCircleInfo, FaHeart, FaPencil, FaRegHeart, FaRotate, FaTriangleExclamation, FaChevronLeft, FaYoutube, FaChartColumn, FaTable } from 'react-icons/fa6'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'
import { globalDictionary } from '@/libs/server/globalDictionary'
import { IconContext } from 'react-icons'
import moment from 'moment'
import { randomUUID } from 'crypto'

import 'moment/locale/ko'
import axios from 'axios'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/router'
import { useSelector } from 'react-redux'
import { RootState } from 'store'
import { setBackgroundBgaName, setIsDjCommentOpen } from 'store/slices/uiSlice'
import { useDispatch } from 'react-redux'
import { useNotificationSystem } from '@/libs/client/useNotifications'
import ScoreEditComponent from '@/components/score/ScoreEditComponent'
import { SyncLoader } from 'react-spinners'
import RaScorePopupComponent from '@/components/score/RaScorePopupComponent'
import WjmaxChartComponent from '@/components/chart/WjmaxChartComponent'

export default function VArchiveDbTitlePage() {
  const { showNotification } = useNotificationSystem()
  const fontFamily = useSelector((state: RootState) => state.ui.fontFamily)
  const backgroundBgaName = useSelector((state: RootState) => state.ui.backgroundBgaName)
  const selectedGame = useSelector((state: RootState) => state.app.selectedGame)

  const params = useParams()
  const router = useRouter()
  const dispatch = useDispatch()
  const { wjmaxSongData, userData } = useSelector((state: RootState) => state.app)

  const [keyMode, setKeyMode] = useState<string>('4')
  const [baseSongData, setBaseSongData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [isScoredBaseSongData, setIsScoredBaseSongData] = useState<boolean>(true)

  const [hoveredTitle, setHoveredTitle] = useState<string>(null)
  const [songItemData, setSongItemData] = useState<any>(null)

  const [isFetchingCommentData, setIsFetchingCommentData] = useState(false)
  const [commentData, setCommentData] = useState<any[]>([])
  const [commentPage, setCommentPage] = useState<number>(0)
  const [hasNextCommentData, setHasNextCommentData] = useState(true)

  const [searchName, setSearchName] = useState<string>('')

  const [commentRivalName, setCommentRivalName] = useState<string>('')
  const [commentRivalSongItemData, setCommentRivalSongItemData] = useState<any>(null)

  // URL 패턴을 정규식으로 정의
  const urlPattern = /https?:\/\/[^\s]+/g

  // 문자열에서 URL을 링크로 변환하고 줄바꿈을 처리하는 함수
  const parseText = (text) => {
    // 줄바꿈을 <br /> 태그 ��환
    const newText = text.replace(/\n/g, '<br>').replace(urlPattern, (url) => {
      // URL을 링크로 변환
      const splited = String(url).split('<br>')

      return `<a href="#" onclick="window.ipc.openBrowser('${splited.length > 1 ? String(url).split('<br>')[0] : String(url)}'); return false;">${
        splited.length > 1 ? String(url).split('<br>')[0] : String(url)
      }(<svg style="display: inline;" stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 640 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z"></path></svg>)</a>${
        splited.length > 1 ? '<br>' + splited.filter((v, index) => index != 0).join('<br>') : ''
      }`
    })

    return newText
  }

  useEffect(() => {
    const initializeData = async () => {
      const filteredData = wjmaxSongData.filter((value) => String(value.title) == params?.titleNo)

      if (filteredData.length === 0) {
        router.push(`/projectRa/${selectedGame}/db`)
        return
      }

      // 로그인한 사용자의 경우 rating 정보를 포함한 데이터 가져오기
      if (userData.userName) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${params?.titleNo}/user/${userData.userNo}`, {
            headers: {
              Authorization: `${userData.userNo}|${userData.userToken}`,
            },
            withCredentials: true,
          })
          const { data } = response
          const { patterns, plusPatterns } = data
          const newPatterns = Object.fromEntries(
            Object.entries({
              ...patterns,
              ...Object.fromEntries(Object.keys(plusPatterns).map((key) => [`${key}_PLUS`, plusPatterns[key]])),
            }).sort(([keyA], [keyB]) => {
              const numA = parseInt(keyA)
              const numB = parseInt(keyB)
              if (numA !== numB) return numA - numB
              return keyA.includes('_PLUS') ? 1 : -1
            }),
          )
          setBaseSongData([
            {
              ...data,
              patterns: newPatterns,
            },
          ])
          console.log({
            ...data,
            patterns: newPatterns,
          })
        } catch (error) {
          console.error('Error fetching user song data:', error)
          setBaseSongData(filteredData)
        }
      } else {
        setBaseSongData(filteredData)
      }

      setIsScoredBaseSongData(false)
    }

    initializeData()
  }, [userData])

  useEffect(() => {
    if (baseSongData.length > 0) {
      dispatch(setBackgroundBgaName(String(baseSongData[0].folderName) + '_preview'))
    }
  }, [baseSongData])

  useEffect(() => {
    if (backgroundBgaName !== '' && baseSongData.length > 0) {
      dispatch(setBackgroundBgaName(String(baseSongData[0].folderName) + '_preview'))
    }
  }, [backgroundBgaName])

  const [patternCode, setPatternCode] = useState<string>('')
  const [patternButton, setPatternButton] = useState<string>('')
  const [isPlusPattern, setIsPlusPattern] = useState<boolean>(false)
  const [patternDificulty, setPatternDificulty] = useState<string>('')
  const [patternMaxCombo, setPatternMaxCombo] = useState<boolean>(false)
  const [updateScore, setUpdateScore] = useState<number>(0)
  const [fetchingUpdateScore, setFetchingUpdateScore] = useState<boolean>(false)

  const fetchUpdateScore = async () => {
    if (updateScore <= 100) {
      try {
        const response = await axios
          .post(
            `${process.env.NEXT_PUBLIC_API_URL}/v2/play/${selectedGame}/update`,
            {
              button: Number(String(patternButton).replace('B', '').replace('_PLUS', '')),
              pattern: patternDificulty,
              force: true,
              maxCombo: patternMaxCombo ? Number(1) : Number(0),
              score: updateScore,
              title: Number(baseSongData[0].title),
              judgementType: isPlusPattern ? 1 : 0,
            },
            {
              headers: {
                Authorization: `${userData.userNo}|${userData.userToken}`,
                'Content-Type': 'application/json',
              },
              withCredentials: true,
            },
          )
          .then(async (data) => {
            if (data.data.success) {
              // 곡 데이터를 다시 불러옴
              const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${baseSongData[0].title}/user/${userData.userNo}`, {
                headers: {
                  Authorization: `${userData.userNo}|${userData.userToken}`,
                },
                withCredentials: true,
              })
              const { data } = response
              const { patterns, plusPatterns } = data
              const newPatterns = Object.fromEntries(
                Object.entries({
                  ...patterns,
                  ...Object.fromEntries(Object.keys(plusPatterns).map((key) => [`${key}_PLUS`, plusPatterns[key]])),
                }).sort(([keyA], [keyB]) => {
                  const numA = parseInt(keyA)
                  const numB = parseInt(keyB)
                  if (numA !== numB) return numA - numB
                  return keyA.includes('_PLUS') ? 1 : -1
                }),
              )
              setBaseSongData([
                {
                  ...data,
                  patterns: newPatterns,
                },
              ])
              setFetchingUpdateScore(false)
              setPatternCode('')
              showNotification('성과 기록을 정상적으로 저장하였습니다.', 'tw-bg-lime-600')
            }
          })
          .catch((error) => {
            showNotification('성과 기록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'tw-bg-red-600')
          })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    } else {
      setFetchingUpdateScore(false)
      showNotification('WJMAX 데이터베이스에 기록할 수 있는 최대 점수는 100점입니다. 입력한 값을 다시 한번 확인해주세요.', 'tw-bg-red-600')
    }
  }

  useEffect(() => {
    if (fetchingUpdateScore) {
      fetchUpdateScore()
    }
  }, [fetchingUpdateScore])

  useEffect(() => {
    dispatch(setBackgroundBgaName(''))
  }, [])

  const fetchSongItemData = async (title) => {
    try {
      if (userData.userName !== '') {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${title}/user/${userData.userNo}`, {
          headers: {
            Authorization: `${userData.userNo}|${userData.userToken}`,
          },
          withCredentials: true,
        })
        const { data } = response
        setSongItemData(data)
      } else {
        const response = baseSongData.filter((baseSongData) => String(baseSongData.title) == String(title))
        const result = response.length > 0 ? response[0] : []
        setSongItemData(result)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchCommentRivalSongItemData = async (title) => {
    try {
      if (commentRivalName !== '') {
        const response = await fetch(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/archive/${commentRivalName}/title/${hoveredTitle}`)
        const result = await response.json()
        setCommentRivalSongItemData(result)
      } else {
        const response = baseSongData.filter((baseSongData) => String(baseSongData.title) == String(title))
        const result = response.length > 0 ? response[0] : []
        setCommentRivalSongItemData(result)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const [voteComment, setVoteComment] = useState<number>(null)

  const updateCommentVote = async (title, cmtNo, cmd) => {
    try {
      const response = await axios
        .post(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/title/${title}/comment/${cmtNo}/vote`,
          {
            vote: 1,
            cmd,
          },
          {
            method: 'POST',
            headers: {
              Authorization: `${userData.userNo}|${userData.userToken}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          },
        )
        .then((data) => {
          if (data.data.success) {
            setVoteComment(cmtNo)
            setCommentData(
              commentData.map((commentItem) => {
                if (commentItem.cmtNo === cmtNo) {
                  return data.data.comment
                } else {
                  return commentItem
                }
              }),
            )
          }
        })
        .catch((error) => {
          // console.log(error)
        })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const [commentContent, setCommentContent] = useState<string>('')
  const [isCommentUpdateMode, setIsCommentUpdateMode] = useState<boolean>(false)

  const fetchCommentContent = async (comment, cmd) => {
    try {
      const response = await axios
        .post(
          `${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/title/${baseSongData[0].title}/comment`,
          cmd === 'POST'
            ? {
                cmd,
                comment,
              }
            : {
                cmd,
                comment: '',
                userNo: Number(userData.userNo),
              },
          {
            method: 'POST',
            headers: {
              Authorization: `${userData.userNo}|${userData.userToken}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          },
        )
        .then((data) => {
          if (data.data.success && cmd === 'POST') {
            setCommentData([data.data.myComment, ...commentData.filter((commentItem) => commentItem.nickname !== userData.userName)])
            showNotification(isCommentUpdateMode ? '코멘트가 정상적으로 수정되었습니다.' : '코멘트가 정상적으로 등록되었습니다.', 'tw-bg-lime-600')
          } else {
            setCommentData(commentData.filter((commentItem) => commentItem.nickname !== userData.userName))
            showNotification('코멘트가 정상적으로 삭제되었습니다.', 'tw-bg-lime-600')
          }
        })
        .catch((error) => {
          // console.log(error)
        })
        .finally(() => {
          setIsCommentUpdateMode(false)
        })
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  // DJ 코멘트 데이터 가져오기 함수
  const fetchCommentData = async () => {
    if (isFetchingCommentData) return // 이미 데이터를 가져오는 중이면 종료
    setIsFetchingCommentData(true)

    try {
      const response = await axios
        .get(`${process.env.NEXT_PUBLIC_PROXY_API_URL}?url=https://v-archive.net/api/db/title/${params?.titleNo}/comments?page=${commentPage}&order=ymdt`, {
          headers: {
            Authorization: `${userData.userNo}|${userData.userToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        })
        .then((result) => {
          if (result.data.success) {
            // console.log(result.data.commentList)
            setCommentData((prevData) => [...prevData, ...result.data.commentList])
            setCommentPage((prevPage) => prevPage + 1)
            setHasNextCommentData(result.data.hasNext)
          }
        })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsFetchingCommentData(false)
    }
  }

  // useEffect(() => {
  //   fetchCommentData()
  // }, [])

  useEffect(() => {
    let timer
    if (hoveredTitle) {
      timer = setTimeout(() => {
        fetchSongItemData(hoveredTitle)
        fetchCommentRivalSongItemData(hoveredTitle)
      }, 500)
    }

    return () => {
      if (timer) {
        clearTimeout(timer)
      }
    }
  }, [hoveredTitle])

  function getGrade(scoreStr) {
    // 문자열을 숫자로 변환
    const score = parseFloat(scoreStr)

    // 조건에 따라 등급을 반환
    if (score < 80.0) {
      return 'C'
    } else if (score < 90.0) {
      return 'B'
    } else if (score < 97.0) {
      return 'A'
    } else if (score < 99.0) {
      return 'S'
    } else if (score < 99.9) {
      return 'SS'
    } else if (score < 100.0) {
      return 'SSS'
    } else {
      return '' // 100.00 이상의 점수를 처리
    }
  }

  const loadDataWithScore = async (title) => {
    if (userData.userName !== '') {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/v2/songs/${selectedGame}/${title}/user/${userData.userNo}`, {
          headers: {
            Authorization: `${userData.userNo}|${userData.userToken}`,
          },
          withCredentials: true,
        })
        if (!response) {
          throw new Error('Network response was not ok')
        }
        const { data } = response
        return data
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error)
        return null
      }
    }
  }

  //   스코어 갱신
  useEffect(() => {
    if (baseSongData.length > 0 && !isScoredBaseSongData) {
      const updateArrayWithAPIData = async () => {
        // 배열의 각 항목에 대해 API 호출 및 데이터 업데이트
        const updatedArray = await Promise.all(
          baseSongData.map(async (item) => {
            const data = await loadDataWithScore(item.title)
            const keysToRemove1 = ['4B', '5B', '6B', '8B']
            const keysToRemove2 = ['SC', 'MX', 'HD', 'NM']
            const pathsToRemove = keysToRemove1.map((key1) => keysToRemove2.map((key2) => ['patterns', key1, key2, 'level']))
            const removeLevels = (paths, obj) => {
              return paths.reduce((acc, path) => R.dissocPath(path, acc), obj)
            }

            const newItem = removeLevels(pathsToRemove, data)

            return R.mergeDeepRight(newItem, item)
          }),
        )
          .then((value) => setBaseSongData(value))
          .finally(() => {
            setIsScoredBaseSongData(true)
            setIsLoading(false)
          })
      }

      if (userData.userName !== '') {
        updateArrayWithAPIData()
      } else {
        setIsScoredBaseSongData(true)
        setIsLoading(false)
      }
    }
  }, [isScoredBaseSongData])

  // 초성을 추출하는 함수
  const getChosung = (char) => {
    const baseCode = '가'.charCodeAt(0)
    const chosung = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

    const code = char.charCodeAt(0)
    if (code < baseCode) return ''

    const cho = Math.floor((code - baseCode) / (21 * 28))
    return chosung[cho]
  }

  // 초성을 추출하는 함수
  const extractChosung = (text) => {
    return [...text].map(getChosung).join('')
  }

  const isMatchingChosung = (text, searchTerm) => {
    const textChosung = extractChosung(text)
    const searchChosung = extractChosung(searchTerm)

    return textChosung.includes(searchChosung)
  }

  const searchSong = (songItem, searchName) => {
    const searchNameLower = searchName.toLowerCase().trim()
    const backspacedSearchNameLower = searchName.toLowerCase().trim().replace(' ', '')

    // 일반 문자열 검색
    const isStringMatch =
      String(songItem.composer).toLowerCase().includes(searchNameLower) ||
      String(songItem.name).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(searchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(searchNameLower)

    const isStringMatchBackspaced =
      String(songItem.composer).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.name).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlcCode).toLowerCase().includes(backspacedSearchNameLower) ||
      String(songItem.dlc).toLowerCase().includes(backspacedSearchNameLower)
    // 초성 색
    // const isChosungMatch = isMatchingChosung(songItem.composer, searchName) || isMatchingChosung(songItem.name, searchName)

    return isStringMatch || isStringMatchBackspaced
  }

  // 모달 상태 추가
  const [showScoreModal, setShowScoreModal] = useState(false)

  // 컴포넌트 상단에 state 추가
  const [editCommentContent, setEditCommentContent] = useState<string>('')

  // isCommentUpdateMode가 true로 변경될 때 기존 코멘트 내용을 editCommentContent에 설정
  useEffect(() => {
    if (isCommentUpdateMode && commentData.length > 0) {
      const myComment = commentData.find((commentItem) => commentItem.nickname === userData.userName)
      if (myComment) {
        setEditCommentContent(myComment.comment)
      }
    }
  }, [isCommentUpdateMode])

  const isDjCommentOpen = useSelector((state: RootState) => state.ui.isDjCommentOpen)

  const [patternViewerData, setPatternViewerData] = useState<any>(null)
  const [showPatternViewer, setShowPatternViewer] = useState<boolean>(false)

  // 패턴 데이터를 불러오는 함수
  const fetchPatternData = async (folderName: string, patternName: any, isKey6: boolean) => {
    try {
      const response = await fetch(
        `https://ribbon.r-archive.zip/${selectedGame}/music/${folderName}/${folderName} ${patternName?.en}${isKey6 ? ' Key6' : ''}.txt`,
      )

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const textData = await response.text()
      const jsonData = JSON.parse(textData)
      setPatternViewerData(jsonData)
      setShowPatternViewer(true)
    } catch (error) {
      console.error('Error fetching pattern data:', error)
      showNotification('패턴 데이터를 불러오는데 실패했습니다.', 'tw-bg-red-600')
    }
  }

  if (baseSongData.length > 0 && params?.titleNo) {
    return (
      <React.Fragment>
        <Head>
          <title>{baseSongData.length !== 0 ? baseSongData[0].name : '로딩중'} - 데이터베이스 - R-ARCHIVE</title>
        </Head>
        <div className="tw-flex tw-gap-4 vh-screen">
          {/* 곡 데이터 */}
          <div className={`tw-flex tw-flex-col tw-transition-all duration-300 ${isDjCommentOpen ? 'tw-w-8/12' : 'tw-w-full'}`}>
            <div
              className={
                'tw-flex tw-flex-col tw-gap-4 tw-bg-opacity-10 tw-rounded-md p-0 tw-mb-4 tw-h-auto tw-relative ' +
                ` wjmax${baseSongData[0].dlcCode}} wjmax_dlc_logo_${baseSongData[0].dlcCode} wjmax_dlc_logo_BG_${baseSongData[0].dlcCode}`
              }
              onClick={() => {
                setPatternCode('')
              }}
            >
              {/* 배경 이미지 추가 */}
              <div className="tw-absolute tw-inset-0 tw-overflow-hidden tw-rounded-md">
                <Image
                  src={`/images/${selectedGame}/jackets/${baseSongData[0].folderName}.jpg`}
                  layout="fill"
                  objectFit="cover"
                  alt=""
                  className="tw-opacity-30 tw-blur-xl"
                />
                <div className="tw-absolute tw-inset-0 tw-bg-black tw-bg-opacity-50" />
              </div>

              <div className="tw-flex tw-justify-between tw-gap-4 tw-animate-fadeInLeft p-4 flex-equal tw-bg-gray-900 tw-bg-opacity-30 tw-rounded-md">
                {/* 하단 */}
                <div className="tw-flex tw-gap-3 tw-mt-auto tw-items-end">
                  <Image
                    loading="lazy" // "lazy" | "eager"
                    blurDataURL={globalDictionary.blurDataURL}
                    src={`/images/${selectedGame}/jackets/${baseSongData[0].folderName}.jpg`}
                    height={74}
                    width={130}
                    alt=""
                    className="tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm"
                  />
                  <div className="tw-flex tw-flex-col tw-w-full">
                    {/* 제목 */}
                    <span className="tw-flex tw-font-light tw-text-gray-300">{baseSongData[0].composer}</span>
                    <span className="tw-text-lg tw-font-bold me-auto">
                      {baseSongData[0].name}
                      <sup className="tw-text-xs tw-font-light tw-text-gray-300">
                        {' '}
                        (R-ARCHIVE : {baseSongData[0].title} / 곡 길이 : {moment.utc(baseSongData[0].time * 1000).format('m분 s초')})
                      </sup>
                    </span>
                  </div>
                </div>
                <div>
                  <div className="tw-flex tw-gap-2">
                    {String(baseSongData[0].bgaUrl).trim() !== '' && (
                      <button
                        className="tw-inline-flex tw-items-center tw-gap-2 tw-animate-fadeInLeft p-1 px-2 tw-bg-gray-950 tw-bg-opacity-75 tw-rounded-md hover:tw-bg-gray-700 tw-transition-colors tw-text-sm"
                        onClick={() => window.ipc.openBrowser(baseSongData[0].bgaUrl)}
                      >
                        <FaYoutube className="tw-text-red-500 tw-mt-0.5" />
                        <span className="tw-text-gray-300">BGA 영상 바로가기</span>
                      </button>
                    )}
                    <div className="tw-animate-fadeInLeft tw-rounded-md p-1 tw-bg-gray-950 tw-bg-opacity-75">
                      <span className="wjmax_dlc_code_wrap ">
                        <span className={`wjmax_dlc_code wjmax_dlc_code_${baseSongData[0].dlcCode}`}>{baseSongData[0].dlc}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* <span>전 패턴을 퍼펙트플레이를 하면 DJ CLASS 만점(이론치)을 달성할 수 있는 리스트입니다.</span>
            <span>DJ CLASS 최상위 랭커를 노린다면 최소 BASIC 70패턴, NEW 30패턴을 플레이 해야합니다.</span> */}
            </div>

            {!isLoading && (
              <div className="tw-w-full tw-h-full tw-overflow-y-auto tw-p-4 tw-rounded-md tw-text-center tw-shadow-lg tw-bg-gray-800 tw-bg-opacity-50">
                <div className="tw-grid tw-grid-cols-5 tw-auto-rows-fr tw-gap-4 tw-h-full">
                  {baseSongData.length !== 0 && !isLoading ? (
                    Object.keys(baseSongData[0].patterns)
                      .sort((a, b) => {
                        const numA = parseInt(a)
                        const numB = parseInt(b)
                        if (numA !== numB) return numA - numB
                        return a.includes('_PLUS') ? 1 : -1
                      })
                      .map((patternName) => (
                        <React.Fragment key={String(patternName)}>
                          {/* Button Column */}
                          <div className="tw-border-gray-600  tw-border-opacity-25 tw-flex tw-flex-col tw-justify-center tw-items-center tw-overflow-hidden tw-bg-gray-900 tw-bg-opacity-20 tw-rounded-lg">
                            <div className="tw-relative tw-h-full tw-w-full tw-flex-1">
                              <div
                                className={`tw-absolute tw-inset-0 wjmax_db_button wjmax_bg_b${String(patternName)
                                  .replace('B', '')
                                  .toLowerCase()} tw-rounded-lg`}
                              />
                              <span className="tw-absolute tw-inset-0 tw-bg-gray-950 tw-bg-opacity-50 tw-rounded-lg tw-font-extrabold tw-text-4xl tw-flex tw-items-center tw-justify-center">
                                <span className="tw-text-lg tw-font-bold tw-relative">
                                  <span className="tw-text-4xl tw-font-bold">{String(patternName).replace('B', '').replace('_PLUS', '')}</span> Button
                                  <sup className="tw-text-2xl tw-absolute tw-top-[-2px]">{String(patternName).includes('_PLUS') ? '+' : ''}</sup>
                                </span>
                              </span>
                            </div>
                          </div>

                          {/* Difficulty Columns */}
                          {['NM', 'HD', 'MX', 'SC'].map((difficultyCode: string) =>
                            baseSongData[0].patterns[patternName][difficultyCode] !== undefined &&
                            baseSongData[0].patterns[patternName][difficultyCode] !== null ? (
                              <div className="tw-relative tw-h-full">
                                <button
                                  className="tw-absolute tw-right-2 tw-z-[100] tw-top-2 tw-flex-1 tw-px-2 tw-py-2 tw-bg-blue-600 tw-text-white tw-rounded-md hover:tw-bg-blue-500 tw-transition-all tw-text-sm"
                                  onClick={() =>
                                    fetchPatternData(
                                      baseSongData[0].folderName,
                                      baseSongData[0].patterns[patternName][difficultyCode].patternName,
                                      String(patternName).includes('6B'),
                                    )
                                  }
                                >
                                  <FaTable />
                                </button>
                                <div
                                  key={`${String(patternName)}_${difficultyCode}`}
                                  className={`tw-border-gray-600 tw-border-opacity-25 tw-flex tw-h-full tw-flex-col tw-justify-center tw-items-center tw-p-2 tw-bg-gray-700 tw-bg-opacity-20 tw-rounded-lg  ${
                                    userData.userName !== '' ? 'tw-cursor-pointer hover:tw-bg-gray-600 hover:tw-bg-opacity-30' : ''
                                  } ${
                                    baseSongData[0].patterns[patternName][difficultyCode].score !== undefined &&
                                    Number(baseSongData[0].patterns[patternName][difficultyCode].score) <= 0
                                      ? 'tw-opacity-70 tw-bg-gray-950'
                                      : ''
                                  }`}
                                  onClick={() => {
                                    if (userData.userName !== '') {
                                      setPatternCode(`patterns${String(patternName)}${difficultyCode}`)
                                      setPatternMaxCombo(baseSongData[0].patterns[patternName][difficultyCode].maxCombo)
                                      setPatternButton(String(patternName))
                                      setPatternDificulty(difficultyCode)
                                      setUpdateScore(
                                        Number(
                                          baseSongData[0].patterns[patternName][difficultyCode].score !== undefined &&
                                            baseSongData[0].patterns[patternName][difficultyCode].score !== null
                                            ? Number(baseSongData[0].patterns[patternName][difficultyCode].score)
                                            : 0,
                                        ),
                                      )
                                      setIsPlusPattern(String(patternName).includes('_PLUS'))
                                      setShowScoreModal(true)
                                    }
                                  }}
                                >
                                  <div className="tw-flex tw-w-full tw-justify-center tw-items-center tw-rounded-lg tw-gap-4 tw-p-2">
                                    {/* 난이도 표시 */}
                                    <div className="tw-w-flex tw-flex-col tw-justify-center tw-items-center">
                                      <span
                                        className={
                                          difficultyCode === 'NM'
                                            ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-nm'
                                            : difficultyCode === 'HD'
                                            ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-hd'
                                            : difficultyCode === 'MX'
                                            ? 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-mx'
                                            : 'tw-flex tw-justify-center tw-items-center tw-gap-2 tw-text-base tw-font-extrabold text-stroke-100 tw-text-wjmax-sc'
                                        }
                                      >
                                        <Image
                                          loading="lazy"
                                          blurDataURL={globalDictionary.blurDataURL}
                                          src={
                                            difficultyCode === 'NM'
                                              ? `/images/wjmax/nm_5_star.png`
                                              : difficultyCode === 'HD'
                                              ? `/images/wjmax/nm_10_star.png`
                                              : difficultyCode === 'MX'
                                              ? `/images/wjmax/nm_15_star.png`
                                              : `/images/wjmax/nm_20_star.png`
                                          }
                                          height={24}
                                          width={24}
                                          alt=""
                                          className="tw-drop-shadow-lg"
                                        />
                                        {baseSongData[0].patterns[patternName][difficultyCode].level.toFixed(1)}
                                      </span>
                                      {baseSongData[0].patterns[patternName][difficultyCode].floor &&
                                        Number(baseSongData[0].patterns[patternName][difficultyCode].floor) > 0 && (
                                          <span
                                            className={
                                              difficultyCode === 'NM'
                                                ? 'tw-font-light tw-text-sm tw-text-wjmax-nm'
                                                : difficultyCode === 'HD'
                                                ? 'tw-font-light tw-text-sm tw-text-wjmax-hd'
                                                : difficultyCode === 'MX'
                                                ? 'tw-font-light tw-text-sm tw-text-wjmax-mx'
                                                : 'tw-font-light tw-text-sm tw-text-wjmax-sc'
                                            }
                                          >
                                            ({baseSongData[0].patterns[patternName][difficultyCode].floor}F)
                                          </span>
                                        )}
                                    </div>

                                    {/* 점수 표시 (로그인한 경우에만) */}
                                    {userData.userName !== '' && (
                                      <div className="tw-flex tw-flex-col tw-items-start tw-justify-center tw-gap-1 tw-min-w-20">
                                        {baseSongData[0].patterns[patternName][difficultyCode].score &&
                                        Number(baseSongData[0].patterns[patternName][difficultyCode].score) > 0 ? (
                                          baseSongData[0].patterns[patternName][difficultyCode].score === '100.00' ? (
                                            <>
                                              {/* <span className="tw-font-bold tw-text-sm tw-text-yellow-400 tw-drop-shadow-lg">PERFECT</span> */}
                                              <span className="tw-font-light tw-text-sm tw-text-gray-300">
                                                {baseSongData[0].patterns[patternName][difficultyCode].score}%{' '}
                                                {/* <sup>{baseSongData[0].patterns[patternName][difficultyCode].rating}TP</sup> */}
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              {/* <span className="tw-font-bold tw-text-3xl tw-drop-shadow-lg">
                                            {getGrade(baseSongData[0].patterns[patternName][difficultyCode].score)}
                                          </span> */}
                                              <span className="tw-font-light tw-text-sm tw-text-gray-300">
                                                {baseSongData[0].patterns[patternName][difficultyCode].score}%{' '}
                                                {/* <sup>{baseSongData[0].patterns[patternName][difficultyCode].rating}TP</sup> */}
                                              </span>
                                            </>
                                          )
                                        ) : (
                                          <>
                                            <span className="tw-font-light tw-text-sm tw-text-gray-500">-</span>
                                            <span className="tw-font-light tw-text-xs tw-text-gray-400 tw-break-keep">(기록 미존재)</span>
                                          </>
                                        )}
                                        {baseSongData[0].patterns[patternName][difficultyCode].score !== undefined &&
                                        baseSongData[0].patterns[patternName][difficultyCode].score === '100.00' ? (
                                          <span className="tw-text-xs tw-font-light tw-text-yellow-400">MAX COMBO</span>
                                        ) : baseSongData[0].patterns[patternName][difficultyCode].maxCombo ? (
                                          <span className="tw-text-xs tw-font-light tw-text-yellow-400">MAX COMBO</span>
                                        ) : null}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div key={`${String(patternName)}_${difficultyCode}`}></div>
                            ),
                          )}
                        </React.Fragment>
                      ))
                  ) : (
                    <div className="tw-col-span-5">
                      <SyncLoader color="#ffffff" size={8} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <ScoreEditComponent
            show={showScoreModal}
            onHide={() => {
              setShowScoreModal(false)
              setPatternCode('')
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

          {false && (
            <>
              <button
                onClick={() => dispatch(setIsDjCommentOpen(!isDjCommentOpen))}
                className="tw-fixed tw-right-0 tw-top-1/2 tw-transform -tw-translate-y-1/2 tw-bg-gray-800 tw-bg-opacity-50 tw-p-2 tw-rounded-l-lg tw-z-50"
              >
                <FaChevronLeft className={`tw-transition-transform ${isDjCommentOpen ? 'tw-rotate-180' : ''}`} />
              </button>

              {/* DJ 코멘트 패널 */}
              <div
                className={`tw-fixed tw-top-16 tw-bottom-12 tw-w-[calc(33.3%-6rem)] tw-transition-transform tw-duration-300 tw-ease-in-out tw-transform
            ${isDjCommentOpen ? 'tw-translate-x-0 tw-right-4 ' : 'tw-translate-x-full tw-right-0'}`}
              >
                {!isLoading && !isFetchingCommentData ? (
                  <div className="tw-flex tw-flex-col tw-h-full tw-overflow-hidden">
                    {/* 전체 DJ 코멘트 섹션 */}
                    <div
                      className={
                        'tw-flex tw-flex-col tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg ' +
                        (userData.userName !== '' ? 'tw-h-[calc(70%)]' : 'tw-h-full')
                      }
                    >
                      <div className="tw-flex tw-items-center tw-justify-between tw-p-6 tw-pb-0">
                        <span className="tw-text-lg tw-font-bold tw-text-white">💬 DJ 코멘트</span>
                        <div className="tw-flex tw-gap-1">
                          {globalDictionary.wjmax.keyModeList.map((value) => (
                            <button
                              key={`keyModeSelector_${value}`}
                              onClick={() => setKeyMode(String(value))}
                              className={`tw-flex tw-items-center tw-justify-center tw-relative tw-px-3 tw-py-1 tw-border tw-border-opacity-50 tw-transition-all tw-duration-500 tw-rounded-md
                              ${
                                keyMode === String(value)
                                  ? 'tw-border-blue-500 tw-bg-blue-900 tw-bg-opacity-20 tw-brightness-150'
                                  : 'tw-border-gray-600 tw-opacity-50 hover:tw-border-blue-400 hover:tw-bg-gray-700 hover:tw-bg-opacity-30 hover:tw-opacity-100'
                              }`}
                              disabled={keyMode === String(value) || !isScoredBaseSongData}
                            >
                              <div className={`tw-absolute tw-w-full tw-h-full tw-opacity-30 wjmax_bg_b${value}`} />
                              <span className="tw-relative tw-text-base tw-font-bold">{`${value}B`}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="tw-flex tw-flex-col tw-gap-4 tw-p-6 tw-overflow-y-auto">
                        {commentData.length > 0 ? (
                          commentData
                            .filter((commentItem) => commentItem.nickname !== userData.userName)
                            .map((commentItem) => (
                              <div
                                key={commentItem.cmtNo}
                                className="tw-flex tw-w-full tw-gap-1 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-4 hover:tw-bg-opacity-40 tw-transition-all"
                                onMouseEnter={() => {
                                  setHoveredTitle(String(commentItem.title))
                                  setSongItemData(null)
                                }}
                                onMouseLeave={() => {
                                  setHoveredTitle(null)
                                  dispatch(setBackgroundBgaName(''))
                                }}
                              >
                                <RaScorePopupComponent
                                  songItemTitle={commentItem.title}
                                  keyMode={keyMode}
                                  rivalName={commentItem.nickname}
                                  delay={{ show: userData.userName !== '' ? 500 : 500, hide: 0 }}
                                />
                                <div className="tw-flex tw-flex-col tw-gap-2 flex-equal">
                                  <div className="tw-flex tw-gap-2 tw-items-center tw-animate-fadeInOnly">
                                    <span className="tw-font-extrabold tw-text-base">{commentItem.nickname}</span>
                                    <span className="tw-font-light tw-text-xs tw-text-gray-400">{moment(commentItem.ymdt).locale('ko').format('LL')}</span>
                                  </div>
                                  <span
                                    className="tw-animate-fadeInDown"
                                    dangerouslySetInnerHTML={{
                                      __html: `
                                        ${parseText(commentItem.comment)}
                                        `,
                                    }}
                                  />
                                  <div
                                    className={`tw-flex tw-items-center tw-justify-end tw-gap-2 tw-mt-2 tw-transition-all ${
                                      userData.userNo !== '' ? 'tw-cursor-pointer hover:tw-text-red-400' : ''
                                    }`}
                                    onClick={() => {
                                      if (userData.userNo !== '' && userData.userToken !== '' && userData.userName !== '') {
                                        if (commentItem.myVote === 1) {
                                          updateCommentVote(commentItem.title, commentItem.cmtNo, 'DELETE')
                                        } else {
                                          updateCommentVote(commentItem.title, commentItem.cmtNo, 'POST')
                                        }
                                      } else {
                                        showNotification('DJ 코멘트 좋아요 기능은 로그인 또는 V-ARCHIVE 계정 연동이 필요합니다.', 'tw-bg-red-600')
                                      }
                                    }}
                                  >
                                    <div
                                      className={`tw-flex tw-items-center tw-gap-1.5 tw-px-3 tw-py-1.5 tw-rounded-full tw-bg-gray-800 tw-bg-opacity-50 
                                    ${commentItem.myVote === 1 ? 'tw-text-red-400 tw-border-red-400' : 'tw-text-gray-400 tw-border-gray-600'} 
                                    tw-border tw-border-opacity-30 tw-transition-all
                                    ${userData.userNo !== '' ? 'hover:tw-border-opacity-50' : ''}`}
                                    >
                                      <span>
                                        <IconContext.Provider
                                          value={{
                                            className: `tw-text-sm ${
                                              voteComment === commentItem.cmtNo && commentItem.myVote === 1
                                                ? 'tw-animate-scaleUpAndScaleDown'
                                                : voteComment === commentItem.cmtNo && commentItem.myVote === 0
                                                ? 'tw-animate-scaleDownAndScaleUp'
                                                : ''
                                            }`,
                                          }}
                                        >
                                          {commentItem.myVote === 1 ? <FaHeart /> : <FaRegHeart />}
                                        </IconContext.Provider>
                                      </span>
                                      <span className={`tw-text-sm tw-font-medium ${commentItem.myVote === 1 ? 'tw-text-red-400' : 'tw-text-gray-400'}`}>
                                        {commentItem.vote}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : isFetchingCommentData ? (
                          <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
                            <SyncLoader color="#ffffff" size={8} />
                          </div>
                        ) : !hasNextCommentData ? (
                          <div className="tw-flex tw-justify-center tw-items-center tw-py-8 tw-text-gray-400">등록된 DJ 코멘트가 없습니다.</div>
                        ) : null}

                        {commentData.length > 0 && hasNextCommentData && (
                          <button
                            onClick={() => fetchCommentData()}
                            className="tw-mt-2 tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-3 tw-font-bold hover:tw-bg-opacity-40 tw-transition-all"
                          >
                            더보기
                          </button>
                        )}
                      </div>
                    </div>

                    {/* 내 코멘트 섹션 */}
                    {userData.userNo !== '' && userData.userToken !== '' && userData.userName !== '' ? (
                      <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-gray-800 tw-bg-opacity-50 tw-rounded-lg tw-shadow-lg tw-p-6 tw-mt-4 tw-h-[calc(30%-1rem)] tw-overflow-hidden">
                        <div className="tw-flex tw-items-center tw-justify-between">
                          <span className="tw-text-lg tw-font-bold tw-text-white">✏️ 내 코멘트</span>
                          {commentData.filter((commentItem) => commentItem.nickname === userData.userName).length === 1 && (
                            <div className="tw-flex tw-gap-4">
                              <button
                                className="tw-text-sm tw-text-blue-400 hover:tw-text-blue-300 tw-transition-colors"
                                onClick={() => {
                                  setIsCommentUpdateMode(!isCommentUpdateMode)
                                  if (!isCommentUpdateMode) {
                                    showNotification('참고 : 코멘트를 수정하면 추천수가 초기화됩니다.', 'tw-bg-orange-600')
                                  } else {
                                    showNotification('코멘트 수정을 취소하였습니다.', 'tw-bg-blue-600')
                                  }
                                }}
                              >
                                {!isCommentUpdateMode ? '수정' : '수정 취소'}
                              </button>
                              <button
                                className="tw-text-sm tw-text-red-400 hover:tw-text-red-300 tw-transition-colors"
                                onClick={() => fetchCommentContent('', 'DELETE')}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 코멘트 입력/표시 영역 */}
                        <div className="tw-bg-gray-700 tw-bg-opacity-30 tw-rounded-lg tw-p-4 tw-overflow-y-auto tw-flex-1">
                          {commentData.filter((commentItem) => commentItem.nickname === userData.userName).length === 0 ? (
                            <div className="tw-flex tw-gap-2">
                              <textarea
                                rows={3}
                                className="tw-w-full tw-bg-gray-900 tw-bg-opacity-50 tw-text-light tw-p-3 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all tw-resize-none"
                                placeholder="감상, 팁, 남기고 싶은 말을 자유롭게 입력해주세요"
                                onChange={(e) => setEditCommentContent(e.currentTarget.value)}
                                value={editCommentContent}
                              />
                              <button
                                onClick={(e) => fetchCommentContent(editCommentContent, 'POST')}
                                className="tw-flex tw-justify-center tw-items-center tw-w-24 tw-bg-blue-600 hover:tw-bg-blue-500 tw-transition-colors tw-rounded-lg tw-font-bold"
                              >
                                등록
                              </button>
                            </div>
                          ) : !isCommentUpdateMode ? (
                            <div className="tw-flex tw-w-full tw-gap-3">
                              <div className="tw-min-h-16 tw-h-16 tw-min-w-16 tw-w-16 tw-relative hover-scale-110 tw-cursor-pointer">
                                <Image
                                  loading="lazy" // "lazy" | "eager"
                                  blurDataURL={globalDictionary.blurDataURL}
                                  src={`/images/${selectedGame}/jackets/${
                                    commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].title
                                  }.jpg`}
                                  height={80}
                                  width={80}
                                  alt=""
                                  className="tw-animate-fadeInLeft tw-rounded-md tw-shadow-sm"
                                />
                              </div>
                              <div className="tw-flex tw-flex-col tw-gap-2 flex-equal">
                                <div className="tw-flex tw-gap-2 tw-items-center tw-animate-fadeInOnly">
                                  <span className="tw-font-extrabold">
                                    {commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].nickname}
                                  </span>
                                  <span className="tw-font-light tw-text-sm tw-text-gray-400">
                                    {moment(commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].ymdt)
                                      .locale('ko')
                                      .format('LL')}
                                  </span>
                                </div>
                                <span
                                  className="tw-animate-fadeInDown"
                                  dangerouslySetInnerHTML={{
                                    __html: `
                          ${parseText(commentData.filter((commentItem) => commentItem.nickname === userData.userName)[0].comment)}
                          `,
                                  }}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="tw-flex tw-gap-2">
                              <textarea
                                rows={3}
                                className="tw-w-full tw-bg-gray-900 tw-bg-opacity-50 tw-text-light tw-p-3 tw-rounded-lg tw-border tw-border-gray-600 tw-border-opacity-50 focus:tw-border-blue-400 focus:tw-ring-2 focus:tw-ring-blue-400 focus:tw-ring-opacity-20 tw-transition-all tw-resize-none"
                                placeholder="감상, 팁, 남기고 싶은 말을 자유롭게 입력해주세요"
                                onChange={(e) => setEditCommentContent(e.currentTarget.value)}
                                value={editCommentContent}
                              />
                              <button
                                onClick={(e) => fetchCommentContent(editCommentContent, 'POST')}
                                className="tw-flex tw-justify-center tw-items-center tw-w-24 tw-bg-blue-600 hover:tw-bg-blue-500 tw-transition-colors tw-rounded-lg tw-font-bold"
                              >
                                등록
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>
        {showPatternViewer && patternViewerData && (
          <WjmaxChartComponent chartData={patternViewerData} bpm={baseSongData[0].bpm} onClose={() => setShowPatternViewer(false)} />
        )}
      </React.Fragment>
    )
  } else {
    return <></>
  }
}
