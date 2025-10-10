import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setIsOpenExternalLink, setOpenExternalLink } from '@render/store/slices/uiSlice'
import { ProxyStatus } from '@src/types/render/ProxyStatus'
import dayjs from 'dayjs'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import apiClient from '../../../libs/apiClient'
import Tooltip from './Tooltip'
// 서버 상태 열거형
enum ServerStatus {
  ALL_ONLINE = 'ALL_ONLINE', // 모든 서버 정상
  PARTIAL_PROXY_OFFLINE = 'PARTIAL_PROXY_OFFLINE', // 일부 프록시 서버 오프라인
  ALL_PROXY_OFFLINE = 'ALL_PROXY_OFFLINE', // 모든 프록시 서버 오프라인
  MAIN_OFFLINE = 'MAIN_OFFLINE', // 메인 서버 오프라인
}

// 서버 상태 체크 간격 (밀리초)
const SERVER_STATUS_CHECK_INTERVAL = 30000 // 30초

const Footer: React.FC = () => {
  const { selectedGame, isTrackMaker } = useSelector((state: RootState) => state.app)
  const [serverVersion, setServerVersion] = useState<string>('')
  const [isMainServerOnline, setIsMainServerOnline] = useState<boolean>(false)
  const [lastChecked, setLastChecked] = useState<string>('')
  const [proxyStatuses, setProxyStatuses] = useState<ProxyStatus[]>([
    { url: 'https://v-archive.net', isOnline: false, displayName: 'V-ARCHIVE' },
    { url: 'https://hard-archive.com', isOnline: false, displayName: 'HARD-ARCHIVE' },
  ])
  const [serverStatus, setServerStatus] = useState<ServerStatus>(ServerStatus.MAIN_OFFLINE)
  const [isChecking, setIsChecking] = useState<boolean>(false) // 체크 중인지 여부
  const intervalRef = useRef<NodeJS.Timeout | null>(null) // 인터벌 참조 저장

  const dispatch = useDispatch()
  const { t } = useTranslation(['menu'])

  // 서버 상태에 따른 색상 반환
  const getStatusColor = () => {
    switch (serverStatus) {
      case ServerStatus.ALL_ONLINE:
        return 'tw:text-green-500'
      case ServerStatus.PARTIAL_PROXY_OFFLINE:
        return 'tw:text-yellow-500'
      case ServerStatus.ALL_PROXY_OFFLINE:
        return 'tw:text-orange-500'
      case ServerStatus.MAIN_OFFLINE:
      default:
        return 'tw:text-red-500'
    }
  }

  // 서버 상태에 따른 배경색 반환
  const getStatusBgColor = () => {
    switch (serverStatus) {
      case ServerStatus.ALL_ONLINE:
        return 'tw:bg-green-500'
      case ServerStatus.PARTIAL_PROXY_OFFLINE:
        return 'tw:bg-yellow-500'
      case ServerStatus.ALL_PROXY_OFFLINE:
        return 'tw:bg-orange-500'
      case ServerStatus.MAIN_OFFLINE:
      default:
        return 'tw:bg-red-500'
    }
  }

  // 서버 상태 메시지 반환
  const getStatusMessage = () => {
    switch (serverStatus) {
      case ServerStatus.ALL_ONLINE:
        return 'All Services Online'
      case ServerStatus.PARTIAL_PROXY_OFFLINE:
        return 'Some Proxy Services Offline'
      case ServerStatus.ALL_PROXY_OFFLINE:
        return 'Proxy Services Offline'
      case ServerStatus.MAIN_OFFLINE:
      default:
        return 'Server Disconnected'
    }
  }

  // 서버 상태 툴팁 내용 생성
  const getStatusTooltipContent = () => {
    let content = `Open-RACLA: ${isMainServerOnline ? 'Online (' + serverVersion + ')' : 'Offline'}\n`

    // 게임이 DJMAX인 경우에만 프록시 서버 상태 표시
    if (selectedGame === 'djmax_respect_v') {
      proxyStatuses.forEach((proxy) => {
        content += `${proxy.displayName.toUpperCase()}: ${proxy.isOnline ? 'Online' : 'Offline'}\n`
      })
    }

    if (lastChecked) {
      content += `Last Check: ${dayjs(lastChecked).format('YYYY-MM-DD HH:mm:ss')}\n`
    }

    return content
  }

  // 전체 서버 상태 업데이트
  const updateServerStatus = () => {
    if (!isMainServerOnline) {
      setServerStatus(ServerStatus.MAIN_OFFLINE)
      return
    }

    if (selectedGame !== 'djmax_respect_v') {
      setServerStatus(ServerStatus.ALL_ONLINE)
      return
    }

    const onlineProxies = proxyStatuses.filter((proxy) => proxy.isOnline)

    if (onlineProxies.length === proxyStatuses.length) {
      setServerStatus(ServerStatus.ALL_ONLINE)
    } else if (onlineProxies.length > 0) {
      setServerStatus(ServerStatus.PARTIAL_PROXY_OFFLINE)
    } else {
      setServerStatus(ServerStatus.ALL_PROXY_OFFLINE)
    }
  }

  // 서버 상태 확인 함수
  const checkServerStatus = async () => {
    // 이미 체크 중이면 리턴
    if (isChecking) return

    try {
      setIsChecking(true)
      createLog('debug', 'Checking server status...', `/v4/ping`)

      // 메인 서버 및 프록시 서버 상태 확인 (v4/ping API)
      const response = await apiClient.healthCheck()

      if (response.status === 200 && response.data.success) {
        createLog('debug', 'Server response:', response.data)

        // 서버 버전 저장
        const serverData = response.data.data
        setServerVersion(serverData.version || '')
        setIsMainServerOnline(true)
        setLastChecked(serverData.last_checked_utc || '')

        // 프록시 서버 상태 업데이트
        if (selectedGame === 'djmax_respect_v') {
          setProxyStatuses([
            {
              url: 'https://v-archive.net',
              isOnline: serverData.v_archive_status,
              displayName: 'V-ARCHIVE',
            },
            {
              url: 'https://hard-archive.com',
              isOnline: serverData.hard_archive_status,
              displayName: 'HARD-ARCHIVE',
            },
          ])
        }
      } else {
        createLog('debug', 'Server error status:', response.status)
        setIsMainServerOnline(false)
      }
    } catch (error) {
      createLog('error', 'Server connection error:', error.message)
      setIsMainServerOnline(false)
    } finally {
      setIsChecking(false)
    }
  }

  // 컴포넌트 마운트/언마운트 시 실행
  useEffect(() => {
    // 초기 상태 확인
    checkServerStatus()

    // 인터벌 설정
    intervalRef.current = setInterval(() => {
      checkServerStatus()
    }, SERVER_STATUS_CHECK_INTERVAL)

    // 클린업 함수
    return () => {
      if (intervalRef.current) {
        createLog('debug', 'Cleaning up interval')
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    // 빈 의존성 배열: 컴포넌트 마운트/언마운트 시에만 실행
  }, [])

  // 서버 상태나 게임 선택이 변경될 때마다 전체 상태 업데이트
  useEffect(() => {
    updateServerStatus()
  }, [isMainServerOnline, proxyStatuses, selectedGame])

  const handleOpenExternalLink = (url: string) => {
    if (url) {
      // 외부 링크는 requestOpenExternalLink 사용하여 모달 확인 과정 거치도록 변경
      dispatch(setOpenExternalLink(url))
      dispatch(setIsOpenExternalLink(true))
    }
  }

  const renderGameSpecificContent = () => {
    if (isTrackMaker) {
      return <></>
    } else {
      switch (selectedGame) {
        case 'djmax_respect_v':
          return (
            <>
              <div>
                <Tooltip position='top' content='https://store.steampowered.com/app/960170'>
                  <span
                    className='tw:cursor-pointer'
                    onClick={() => {
                      handleOpenExternalLink('https://store.steampowered.com/app/960170')
                    }}
                  >
                    Resources from DJMAX RESPECT V
                  </span>
                </Tooltip>
                <Tooltip position='top' content='https://www.neowiz.com/'>
                  <span
                    className='tw:cursor-pointer'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenExternalLink('https://www.neowiz.com/')
                    }}
                  >
                    (©NEOWIZ)
                  </span>
                </Tooltip>
              </div>
              <span> · </span>
            </>
          )
        case 'platina_lab':
          return (
            <>
              <Tooltip position='top' content='https://platinalab.net/'>
                <span
                  className='tw:cursor-pointer'
                  onClick={() => {
                    handleOpenExternalLink('https://platinalab.net/')
                  }}
                >
                  Resources from PLATiNA :: LAB(HIGH-END Games)
                </span>
              </Tooltip>
              <span> · </span>
            </>
          )
        case 'ez2on':
          return (
            <>
              <Tooltip position='top' content='https://store.steampowered.com/app/1477590'>
                <span
                  className='tw:cursor-pointer'
                  onClick={() => {
                    handleOpenExternalLink('https://store.steampowered.com/app/1477590')
                  }}
                >
                  Resources from EZ2ON REBOOT : R
                </span>
              </Tooltip>
              <span> · </span>
            </>
          )
        default:
          return null
      }
    }
  }

  return (
    <div
      className={`tw:flex tw:fixed tw:w-full tw:h-8 tw:items-center tw:bottom-0 tw:left-0 tw:px-2 tw:z-50 tw:dark:border-slate-700/50 tw:dark:text-slate-200 tw:text-gray-800 tw:border-indigo-100/50`}
    >
      <div className='tw:flex tw:justify-center tw:items-center tw:gap-1 tw:pl-1 tw:h-8 tw:me-auto'>
        <span className='tw:text-xs tw:flex tw:items-center'>
          <span className='tw:flex tw:items-center tw:gap-1'>
            <Tooltip position='top' content={getStatusTooltipContent()}>
              <span
                onClick={() => {
                  handleOpenExternalLink('https://status.racla.app')
                }}
                className='tw:cursor-pointer tw:flex tw:items-center tw:gap-1'
              >
                <div className='tw:relative tw:flex tw:items-center tw:justify-center tw:mr-1'>
                  <span
                    className={`tw:text-xs ${getStatusColor()} tw:relative tw:z-10 tw:align-middle`}
                  >
                    <Icon icon='lucide:circle' width='10' height='10' />
                  </span>
                  <div
                    className={`tw:absolute tw:w-3 tw:h-3 tw:rounded-full tw:animate-custom-ping tw:opacity-40 ${getStatusBgColor()}`}
                  />
                </div>
                <span className='tw:leading-none tw:flex tw:items-center'>
                  {isMainServerOnline
                    ? `${getStatusMessage()} · ${globalDictionary.version}`
                    : `${getStatusMessage()} · ${globalDictionary.version}`}
                </span>
              </span>
            </Tooltip>
          </span>
        </span>
      </div>
      <div className='tw:flex tw:text-xs tw:justify-center tw:items-center tw:gap-1 tw:h-8 tw:pr-1'>
        <>
          {selectedGame === 'djmax_respect_v' && !isTrackMaker && (
            <>
              <span>Powered by </span>
              <Tooltip position='top' content={`https://v-archive.net`}>
                <span
                  className={`tw:text-xs tw:cursor-pointer`}
                  onClick={() => {
                    handleOpenExternalLink('https://v-archive.net')
                  }}
                >
                  {t('djmax_respect_v.vArchiveNavTitle')}
                </span>
              </Tooltip>
              <span> & </span>
              <Tooltip position='top' content={`https://hard-archive.com'`}>
                <span
                  className={`tw:text-xs tw:cursor-pointer`}
                  onClick={() => {
                    handleOpenExternalLink('https://hard-archive.com')
                  }}
                >
                  {t('djmax_respect_v.hardArchiveNavTitle')}
                </span>
              </Tooltip>
              <span> · </span>
            </>
          )}

          {selectedGame === 'ez2on' && !isTrackMaker && (
            <>
              <span>Powered by </span>
              <Tooltip position='top' content={`https://ez2pattern.kr/`}>
                <span
                  className='tw:text-xs tw:cursor-pointer'
                  onClick={() => {
                    handleOpenExternalLink('https://ez2pattern.kr/')
                  }}
                >
                  EZ2PATTERN
                </span>
              </Tooltip>
              <span> · </span>
            </>
          )}

          {selectedGame && renderGameSpecificContent()}
        </>
        <Tooltip position='left' content={t('racla.raclaLicense')}>
          <Link className='tw:text-xs tw:cursor-pointer' to='/license'>
            {t('racla.raclaLicense')}
          </Link>
        </Tooltip>
      </div>
    </div>
  )
}

export default Footer
