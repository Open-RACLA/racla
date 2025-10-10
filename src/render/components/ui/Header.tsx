import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setRefresh, setSettingData } from '@render/store/slices/appSlice'
import { setSidebarCollapsed, toggleTheme } from '@render/store/slices/uiSlice'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import UpdateModal from '../app/UpdateModal'
import Tooltip from './Tooltip'

const { closeApp, minimizeApp, maximizeApp } = window.electron

const TitleBar: React.FC = () => {
  const { theme, sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const { selectedGame, isTrackMaker, refresh, settingData } = useSelector(
    (state: RootState) => state.app,
  )
  const dispatch = useDispatch()
  const [isMaximized, setIsMaximized] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const { t } = useTranslation(['common', 'menu'])
  const location = useLocation()
  const navigate = useNavigate()

  // 최대화 상태 이벤트 리스너 (실제로는 preload 파일에서 이벤트를 전달해야 함)
  useEffect(() => {
    const handleMaximizeChange = (e: CustomEvent<boolean>, maximized: boolean) => {
      createLog('debug', 'Maximize change:', maximized, e)
      setIsMaximized(maximized)
    }

    window.addEventListener('maximize-change', handleMaximizeChange as unknown as EventListener)

    return () => {
      window.removeEventListener(
        'maximize-change',
        handleMaximizeChange as unknown as EventListener,
      )
    }
  }, [])

  // 앱이 처음 실행될 때 업데이트 모달을 표시 (최초 실행 시 한번만)
  useEffect(() => {
    // settingData.isCheckedForUpdate가 false이거나 undefined일 경우 모달 표시
    if (settingData && settingData.isCheckedForUpdate === false) {
      setIsUpdateModalOpen(true)
    }
  }, [settingData])

  const handleToggleTheme = () => {
    dispatch(toggleTheme())
  }

  useEffect(() => {
    window.electron?.loadSettings().then((settings) => {
      dispatch(setSettingData({ ...settings, theme }))
      window.electron?.saveSettings({
        ...settings,
        theme,
      })
    })
  }, [theme])

  const handleMaximizeToggle = () => {
    maximizeApp()
    setIsMaximized(!isMaximized) // 실제로는 이벤트를 통해 설정해야 합니다
  }

  const handleOpenUpdateModal = () => {
    setIsUpdateModalOpen(true)
  }

  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false)
  }

  return (
    <>
      <div
        className={`tw:h-10 tw:flex tw:items-center tw:justify-between tw:mx-0.5 tw:px-4 tw:select-none tw:w-full tw:z-50 tw:relative webkit-app-region-drag tw:bg-transparent tw:dark:text-slate-200 tw:text-gray-800`}
      >
        {/* 왼쪽 영역 - 비워둠 */}
        {!isTrackMaker ? (
          <div className='tw:w-48 tw:flex tw:items-center webkit-app-region-no-drag'>
            <div
              className={`tw:transition-all tw:duration-300 tw:ease-in-out tw:overflow-hidden tw:flex ${
                !location.pathname.startsWith('/track-maker') &&
                !isTrackMaker &&
                !location.pathname.startsWith('/overlay') &&
                !location.pathname.startsWith('/feedback') &&
                !location.pathname.startsWith('/license') &&
                !location.pathname.startsWith('/auth/login')
                  ? 'tw:max-w-[40px] tw:opacity-100 tw:visible tw:translate-x-0 tw:mr-2'
                  : 'tw:max-w-0 tw:opacity-0 tw:invisible tw:-translate-x-8 tw:m-0 tw:p-0'
              }`}
            >
              <Tooltip
                position='right'
                content={t(sidebarCollapsed ? 'ui.sidebarExpand' : 'ui.sidebarCollapse', {
                  ns: 'common',
                })}
              >
                <button
                  onClick={() => {
                    dispatch(setSidebarCollapsed(!sidebarCollapsed))
                  }}
                  className='tw:p-1.5 tw:rounded tw:dark:hover:bg-slate-800 tw:dark:text-slate-300 tw:hover:bg-white tw:text-gray-600 tw:transition-all'
                >
                  <Icon icon='lucide:menu' width='16' height='16' />
                </button>
              </Tooltip>
            </div>

            <Tooltip
              position='bottom'
              content={t('ui.back', {
                ns: 'common',
              })}
            >
              <button
                onClick={() => {
                  navigate(-1)
                }}
                className='tw:p-1.5 tw:rounded tw:mr-2 tw:dark:hover:bg-slate-800 tw:dark:text-slate-300 tw:hover:bg-white tw:text-gray-600 tw:transition-all'
              >
                <Icon icon='lucide:arrow-left' width='16' height='16' />
              </button>
            </Tooltip>

            <Tooltip
              position='bottom'
              content={t('ui.refresh', {
                ns: 'common',
              })}
            >
              <button
                onClick={() => {
                  dispatch(setRefresh(!refresh))
                }}
                className='tw:p-1.5 tw:rounded tw:dark:hover:bg-slate-800 tw:dark:text-slate-300 tw:hover:bg-white tw:text-gray-600 tw:transition-all'
              >
                <Icon icon='lucide:refresh-cw' width='16' height='16' />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className='tw:w-48' />
        )}

        {/* 중앙 타이틀 - 선택된 게임 이름 표시 */}
        <div className='tw:flex-1 tw:text-[13px] tw:text-center tw:font-bold'>
          {isTrackMaker || location.pathname.startsWith('/track-maker')
            ? t('racla.raclaTrackMaker', { ns: 'menu' })
            : selectedGame &&
              globalDictionary.gameDictionary?.[
                selectedGame as keyof typeof globalDictionary.gameDictionary
              ]?.name}{' '}
          (Open-RACLA)
        </div>

        {/* 오른쪽 컨트롤 버튼 영역 */}
        <div className='tw:w-48 tw:flex tw:items-center tw:justify-end tw:space-x-2 webkit-app-region-no-drag'>
          <Tooltip
            position='bottom'
            content={
              theme === 'dark'
                ? t('theme.changeLight', { ns: 'common' })
                : t('theme.changeDark', { ns: 'common' })
            }
          >
            <button
              onClick={handleToggleTheme}
              className={`tw:p-1.5 tw:rounded-full tw:transition-all tw:dark:hover:bg-slate-800 tw:dark:text-slate-300 tw:hover:bg-white tw:text-gray-600 tw:hover:shadow-sm`}
            >
              <Icon icon={theme === 'dark' ? 'lucide:sun' : 'lucide:moon'} width='16' height='16' />
            </button>
          </Tooltip>

          {/* 업데이트 알림 버튼 */}
          <Tooltip position='bottom' content={t('update.checkUpdates', { ns: 'common' })}>
            <button
              onClick={handleOpenUpdateModal}
              className={`tw:p-1.5 tw:rounded-full tw:transition-all tw:dark:hover:bg-slate-800 tw:dark:text-slate-300 tw:hover:bg-white tw:text-gray-600 tw:hover:shadow-sm`}
            >
              <Icon icon='lucide:bell' width='16' height='16' />
            </button>
          </Tooltip>

          <Tooltip position='bottom' content={t('ui.minimize', { ns: 'common' })}>
            <button
              onClick={() => minimizeApp()}
              className={`tw:p-1.5 tw:rounded tw:transition-all tw:dark:hover:bg-slate-800 tw:dark:text-slate-300 tw:hover:bg-white tw:text-gray-600 tw:hover:shadow-sm`}
            >
              <Icon icon='lucide:minus' width='16' height='16' />
            </button>
          </Tooltip>

          <Tooltip
            position='bottom'
            content={
              isMaximized ? t('ui.restore', { ns: 'common' }) : t('ui.maximize', { ns: 'common' })
            }
          >
            <button
              onClick={handleMaximizeToggle}
              className={`tw:p-1.5 tw:rounded tw:transition-all tw:dark:hover:bg-slate-800 tw:dark:text-slate-300 tw:hover:bg-white tw:text-gray-600 tw:hover:shadow-sm`}
            >
              <Icon
                icon={isMaximized ? 'lucide:minimize-2' : 'lucide:maximize-2'}
                width='16'
                height='16'
              />
            </button>
          </Tooltip>

          <Tooltip position='left' content={t('ui.close', { ns: 'common' })}>
            <button
              onClick={() => closeApp()}
              className='tw:p-1.5 tw:rounded tw:text-red-500 tw:hover:bg-red-500 tw:hover:text-white tw:transition-all'
            >
              <Icon icon='lucide:x' width='16' height='16' />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* 업데이트 모달 */}
      <UpdateModal isOpen={isUpdateModalOpen} onClose={handleCloseUpdateModal} />
    </>
  )
}

export default TitleBar
