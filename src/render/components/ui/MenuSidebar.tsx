import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { useAuth } from '@render/hooks/useAuth'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { RootState } from '@render/store'
import { setRefresh } from '@render/store/slices/appSlice'
import { setIsOpenExternalLink, setOpenExternalLink } from '@render/store/slices/uiSlice'
import type { MenuItem } from '@src/types/menu/MenuItem'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaCircleUser } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import Tooltip from './Tooltip'

const MenuSidebar: React.FC = () => {
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui)
  const { selectedGame, refresh } = useSelector((state: RootState) => state.app)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isLoggedIn, userData, logout } = useAuth()
  const { showNotification } = useNotificationSystem()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)
  const location = useLocation()
  const { t } = useTranslation(['menu'])

  // 화면 크기 감지
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 1280)
    }

    // 초기 로드 시 확인
    handleResize()

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize)

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 드롭다운 토글 핸들러
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // 외부 링크 열기 핸들러
  const handleOpenExternalLink = (url: string) => {
    dispatch(setOpenExternalLink(url))
    dispatch(setIsOpenExternalLink(true))
    setIsDropdownOpen(false)
  }

  // 로그아웃 핸들러
  const handleLogout = async () => {
    const success = await logout()
    if (success) {
      showNotification({
        mode: 'i18n',
        value: 'auth.logoutSuccess',
      })
      navigate('/home')
    }
    setIsDropdownOpen(false)
    dispatch(setRefresh(!refresh))
  }

  // 현재 선택된 게임에 따른 메뉴 구성 가져오기
  const getMenuItems = () => {
    // 선택된 게임에 따른 메뉴 네비게이션 가져오기
    let navItems = []
    switch (selectedGame) {
      case 'djmax_respect_v':
        if (globalDictionary.navDictionary.djmax_respect_v) {
          // DJMAX RESPECT V 네비게이션
          Object.values(globalDictionary.navDictionary.djmax_respect_v).forEach((category) => {
            if (category.isDisplay) {
              // 카테고리 내 각 페이지를 메뉴 아이템으로 변환
              const menuItems = category.pages
                .filter((page) => page.isDisplay)
                .map((page) => ({
                  id: page.id,
                  icon: page.icon, // 이미 lucide 아이콘 ID가 들어 있음
                  path: page.link,
                  isExternal: page.isOpenBrowser,
                }))

              // 카테고리가 있는 경우 추가
              if (menuItems.length > 0) {
                navItems.push({
                  id: category.id,
                  icon: 'lucide:folder',
                  path: category.link || '/',
                  subItems: menuItems,
                })
              }
            }
          })
        }
        break

      // case 'platina_lab':
      //   if (globalDictionary.navDictionary.platina_lab) {
      //     // PLATINA :: LAB 네비게이션
      //     Object.values(globalDictionary.navDictionary.platina_lab).forEach((category) => {
      //       if (category.isDisplay) {
      //         const menuItems = category.pages
      //           .filter((page) => page.isDisplay)
      //           .map((page) => ({
      //             id: page.id,
      //             icon: page.icon, // 이미 lucide 아이콘 ID가 들어 있음
      //             path: page.link,
      //             isExternal: page.isOpenBrowser,
      //           }))

      //         if (menuItems.length > 0) {
      //           navItems.push({
      //             id: category.id,
      //             icon: 'lucide:folder',
      //             path: category.link || '/',
      //             subItems: menuItems,
      //           })
      //         }
      //       }
      //     })
      //   }
      //   break

      default:
        null
    }
    return navItems
  }

  const menuItems = getMenuItems()

  // 항목 클릭 핸들러
  const handleItemClick = (item: MenuItem, subItem?: MenuItem) => {
    if (subItem) {
      if (subItem.isExternal && subItem.path) {
        // 외부 링크는 requestOpenExternalLink 사용하여 모달 확인 과정 거치도록 변경
        dispatch(setOpenExternalLink(subItem.path))
        dispatch(setIsOpenExternalLink(true))
      } else if (subItem.path) {
        // 내부 경로는 라우터로 이동
        navigate(item.path + subItem.path)
      }
    } else {
      if (item.isExternal && item.path) {
        // 외부 링크는 requestOpenExternalLink 사용하여 모달 확인 과정 거치도록 변경
        dispatch(setOpenExternalLink(item.path))
        dispatch(setIsOpenExternalLink(true))
      } else if (item.path) {
        // 내부 경로는 라우터로 이동
        navigate(item.path)
      }
    }
  }

  // 애니메이션 변수
  const sidebarAnimation = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut' as const,
        when: 'beforeChildren',
        staggerChildren: 0.05,
      },
    },
  }

  const categoryAnimation = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: 'easeOut' as const,
        when: 'beforeChildren',
        staggerChildren: 0.03,
      },
    },
  }

  const itemAnimation = {
    hidden: { opacity: 0, x: -10 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut' as const,
      },
    },
  }

  // 사용자 정보 드롭다운 렌더링
  const renderUserDropdown = () => {
    return (
      <div
        className={`tw:absolute tw:bottom-[68px] tw:left-0 tw:right-0 tw:z-50 tw:transition-all tw:duration-200 tw:overflow-hidden tw:dark:bg-slate-800 tw:dark:border-slate-700 tw:bg-white tw:border-gray-200 ${isDropdownOpen ? 'tw:max-h-64 tw:border-y' : 'tw:max-h-0 tw:overflow-hidden'}`}
      >
        <ul className='tw:text-xs tw:p-0'>
          <li className={`tw:border-b tw:dark:border-slate-700 tw:border-gray-200`}>
            <div className='tw:flex tw:items-center tw:justify-between tw:py-2 tw:px-4'>
              <span className='tw:font-bold'>{t('quickMenu.quickMenuNavTitle')}</span>
              <span
                onClick={() => {
                  setIsDropdownOpen(false)
                }}
                className={`tw:flex tw:p-1 tw:rounded-md tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-white tw:hover:shadow-md`}
              >
                <Tooltip position='left' content={t('quickMenu.close')}>
                  <Icon icon='lucide:x' className='tw:w-4 tw:h-4' />
                </Tooltip>
              </span>
            </div>
          </li>
          <li>
            <span
              className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
              onClick={() => {
                handleOpenExternalLink('https://open-racla.app/')
              }}
            >
              <Icon icon='lucide:home' className='tw:w-4 tw:h-4 tw:mr-2' />
              {t('quickMenu.raclaHome')}
            </span>
          </li>
          <li className={`tw:border-t tw:dark:border-slate-700 tw:border-gray-200`}></li>
          {userData.varchiveUserInfo.isLinked && userData.varchiveUserInfo.nickname !== '' ? (
            <li>
              <span
                className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                onClick={() => {
                  handleOpenExternalLink(
                    `https://v-archive.net/archive/${userData.varchiveUserInfo.nickname}/board`,
                  )
                  setIsDropdownOpen(false)
                }}
              >
                <Icon icon='lucide:archive' className='tw:w-4 tw:h-4 tw:mr-2' />
                {t('quickMenu.vArchiveHome')}
              </span>
            </li>
          ) : (
            <li>
              <span
                className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                onClick={() => {
                  handleOpenExternalLink('https://v-archive.net/')
                  setIsDropdownOpen(false)
                }}
              >
                <Icon icon='lucide:archive' className='tw:w-4 tw:h-4 tw:mr-2' />
                {t('quickMenu.vArchiveHome')}
              </span>
            </li>
          )}
          <li className={`tw:border-t tw:dark:border-slate-700 tw:border-gray-200`}></li>
          <li>
            <span
              className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
              onClick={() => {
                handleOpenExternalLink('https://hard-archive.com')
                setIsDropdownOpen(false)
              }}
            >
              <Icon icon='lucide:hard-drive' className='tw:w-4 tw:h-4 tw:mr-2' />
              {t('quickMenu.hardArchiveHome')}
            </span>
          </li>
          <li className={`tw:border-t tw:dark:border-slate-700 tw:border-gray-200`}></li>
          {isLoggedIn ? (
            <li>
              <span
                className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:text-red-500 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                onClick={() => {
                  void handleLogout()
                  setIsDropdownOpen(false)
                }}
              >
                <Icon icon='lucide:log-out' className='tw:w-4 tw:h-4 tw:mr-2' />
                {t('quickMenu.logout')}
              </span>
            </li>
          ) : (
            <li>
              <span
                className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                onClick={() => {
                  navigate('/auth/login')
                  setIsDropdownOpen(false)
                }}
              >
                <Icon icon='lucide:log-in' className='tw:w-4 tw:h-4 tw:mr-2' />
                {t('quickMenu.login')}
              </span>
            </li>
          )}
        </ul>
      </div>
    )
  }

  return (
    <>
      <motion.div
        initial='hidden'
        animate='visible'
        variants={sidebarAnimation}
        className={`tw:flex tw:flex-col tw:h-full tw:pt-2 tw:transition-all tw:duration-300 tw:ease-in-out tw:overflow-x-hidden tw:bg-transparent tw:dark:text-slate-200 tw:text-gray-800 ${isSmallScreen ? 'tw:fixed tw:top-0 tw:bottom-0 tw:z-50 tw:bg-white tw:dark:bg-slate-800' : ''} ${
          sidebarCollapsed
            ? `tw:w-0 tw:transition-[width] tw:duration-300 tw:delay-150 ${isSmallScreen ? 'tw:left-[-100%] tw:fixed' : 'tw:relative'}`
            : `tw:w-64 tw:transition-[width] tw:duration-300 tw:border-gray-200 tw:dark:border-slate-700 ${isSmallScreen ? 'tw:opacity-100 tw:left-0 tw:fixed tw:border-r' : 'tw:relative'}`
        }`}
      >
        <div
          className={`tw:flex tw:transition-all tw:duration-200 tw:absolute tw:top-0 tw:z-40 tw:left-0 tw:right-0 tw:h-[calc(100%-68px)] tw:w-full tw:bg-white/50 tw:dark:bg-slate-800/50 ${
            isDropdownOpen
              ? 'tw:opacity-100 tw:backdrop-blur-sm'
              : 'tw:opacity-0 tw:pointer-events-none'
          }`}
          onClick={() => {
            setIsDropdownOpen(false)
          }}
        />
        <motion.div
          className={`tw:flex-1 tw:overflow-x-hidden tw:text-sm tw:custom-scrollbar tw:pr-2 ${
            isDropdownOpen ? 'tw:overflow-hidden' : 'tw:overflow-y-auto'
          } ${sidebarCollapsed ? 'tw:opacity-0 tw:transition-opacity tw:duration-100' : 'tw:opacity-100 tw:transition-opacity tw:duration-200 tw:delay-150'}`}
        >
          <motion.ul className='tw:px-4 tw:space-y-2 tw:relative tw:z-20'>
            {menuItems.map((item) => (
              <motion.li key={item.id} variants={categoryAnimation}>
                {item.subItems ? (
                  // 서브메뉴가 있는 경우 (카테고리)
                  <motion.div className='tw:mb-3'>
                    <motion.div className='tw:flex tw:items-center tw:p-2 tw:mb-2'>
                      <Icon icon={item.icon} className='tw:w-4 tw:h-4 tw:mr-2 tw:text-indigo-500' />
                      <span className='tw:font-semibold tw:text-sm tw:uppercase tw:tracking-wider'>
                        {t(`${selectedGame}.${item.id}`)}
                      </span>
                    </motion.div>
                    <motion.ul className='tw:pl-3 tw:space-y-1'>
                      {item.subItems.map((subItem) => (
                        <motion.li key={subItem.id} variants={itemAnimation} whileHover={{ x: 4 }}>
                          <Tooltip
                            content={t(`${selectedGame}.${subItem.id}.description`)}
                            className='tw:w-full'
                          >
                            <motion.div
                              onClick={() => {
                                handleItemClick(item, subItem)
                              }}
                              className={`tw:flex tw:items-center tw:p-2 tw:rounded-md tw:cursor-pointer tw:transition-colors ${
                                !location.pathname.includes(item.path + subItem.path)
                                  ? 'tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50'
                                  : ''
                              } ${
                                location.pathname.includes(item.path + subItem.path)
                                  ? 'tw:bg-indigo-500 tw:hover:bg-indigo-600 tw:text-white'
                                  : ''
                              }`}
                            >
                              <Icon icon={subItem.icon} className='tw:w-4 tw:h-4 tw:mr-2' />
                              <span>{t(`${selectedGame}.${subItem.id}.name.base`)}</span>
                              {subItem.isExternal && (
                                <Icon
                                  icon='lucide:external-link'
                                  className='tw:w-3.5 tw:h-3.5 tw:ml-auto tw:opacity-70'
                                />
                              )}
                            </motion.div>
                          </Tooltip>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </motion.div>
                ) : (
                  // 서브메뉴가 없는 단일 메뉴 항목
                  <motion.div
                    variants={itemAnimation}
                    whileHover={{ x: 4 }}
                    onClick={() => {
                      handleItemClick(null, item)
                    }}
                    className={`tw:flex tw:items-center tw:p-2.5 tw:rounded-md tw:cursor-pointer tw:transition-colors tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                  >
                    <Icon icon={item.icon} className='tw:w-5 tw:h-5 tw:mr-3' />
                    <span>{t(`${selectedGame}.${item.id}`)}</span>
                    {item.isExternal && (
                      <Icon
                        icon='lucide:external-link'
                        className='tw:w-4 tw:h-4 tw:ml-auto tw:opacity-70'
                      />
                    )}
                  </motion.div>
                )}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* 사용자 정보 영역 - 접힌 상태에서는 표시하지 않음 */}
        <div
          className={`tw:border-t tw:dark:border-slate-700 tw:border-gray-200 tw:mt-4 tw:relative tw:z-50 ${
            sidebarCollapsed
              ? 'tw:opacity-0 tw:transition-opacity tw:duration-100'
              : 'tw:opacity-100 tw:transition-opacity tw:duration-200 tw:delay-150'
          }`}
        >
          {renderUserDropdown()}
          <div
            onClick={toggleDropdown}
            className={`tw:flex tw:items-center tw:p-4 tw:cursor-pointer tw:transition-colors tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
          >
            <div className='tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-indigo-500'>
              <FaCircleUser className='tw:text-white' />
            </div>
            <div className='tw:ml-3 tw:overflow-hidden'>
              <p className='tw:text-sm tw:font-medium tw:truncate'>
                {isLoggedIn
                  ? userData.playerNickname || t('common.user')
                  : t('common.loginRequired')}
              </p>
              <p className='tw:text-xs tw:text-slate-400 tw:truncate'>
                {isLoggedIn ? userData.playerName : t('common.loginRequired')}
              </p>
            </div>
            <Icon
              icon={isDropdownOpen ? 'lucide:chevron-down' : 'lucide:chevron-up'}
              className='tw:w-4 tw:h-4 tw:ml-auto'
            />
          </div>
        </div>
      </motion.div>

      {/* 축소 모드에서의 사용자 정보 버튼 */}
      <div
        className={`tw:fixed tw:bottom-0 tw:left-0 tw:w-screen tw:h-screen tw:z-50 tw:transition-all tw:duration-300 tw:p-2 tw:bg-white/50 tw:dark:bg-slate-800/50 ${
          isDropdownOpen && sidebarCollapsed
            ? 'tw:opacity-100 tw:backdrop-blur-sm'
            : 'tw:opacity-0 tw:pointer-events-none'
        }`}
        onClick={() => {
          setIsDropdownOpen(false)
        }}
      />

      <div
        className={`tw:fixed tw:bottom-0 tw:left-0 tw:w-[256px] tw:z-50 tw:transition-all tw:duration-300 tw:p-2 tw:dark:text-slate-200 tw:text-gray-800 ${!sidebarCollapsed ? 'tw:opacity-0 tw:pointer-events-none' : 'tw:opacity-100'}`}
      >
        <div
          onClick={toggleDropdown}
          className='tw:flex tw:items-center tw:bg-white tw:dark:bg-slate-800 tw:rounded-md tw:shadow-lg tw:cursor-pointer tw:transition-all tw:duration-200 tw:hover:bg-indigo-50 tw:dark:hover:bg-slate-700 tw:p-2 tw:border tw:dark:border-slate-700 tw:border-gray-200'
        >
          <div className='tw:w-8 tw:h-8 tw:rounded-full tw:flex tw:items-center tw:justify-center tw:bg-indigo-500'>
            <FaCircleUser className='tw:text-white' />
          </div>
          <div className='tw:ml-3 tw:overflow-hidden tw:max-w-[100px] tw:mr-auto'>
            <p className='tw:text-sm tw:font-medium tw:truncate'>
              {isLoggedIn ? userData.playerNickname || t('common.user') : t('common.loginRequired')}
            </p>
            <p className='tw:text-xs tw:text-slate-400 tw:truncate'>
              {isLoggedIn ? userData.playerName : t('common.loginRequired')}
            </p>
          </div>
          <Icon
            icon={isDropdownOpen ? 'lucide:chevron-down' : 'lucide:chevron-up'}
            className='tw:w-4 tw:h-4 tw:ml-2'
          />
        </div>

        {/* 축소 모드에서의 사용자 드롭다운 */}
        <div
          className={`tw:absolute tw:w-[240px] tw:bottom-[70px] tw:mx-2 tw:left-0 tw:z-50 tw:transition-all tw:duration-200 tw:overflow-hidden tw:dark:bg-slate-800 tw:dark:border-slate-700 tw:bg-white tw:border-gray-200 tw:rounded-md tw:shadow-lg ${
            isDropdownOpen
              ? 'tw:opacity-100 tw:max-h-64 tw:border'
              : 'tw:opacity-0 tw:max-h-0 tw:overflow-hidden'
          }`}
        >
          <ul className='tw:text-xs tw:p-0'>
            <li className={`tw:border-b tw:dark:border-slate-700 tw:border-gray-200`}>
              <div className='tw:flex tw:items-center tw:justify-between tw:py-2 tw:px-4'>
                <span className='tw:font-bold'>{t('quickMenu.quickMenuNavTitle')}</span>
                <span
                  onClick={() => {
                    setIsDropdownOpen(false)
                  }}
                  className={`tw:flex tw:p-1 tw:rounded-md tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-white tw:hover:shadow-md`}
                >
                  <Tooltip position='left' content={t('quickMenu.close')}>
                    <Icon icon='lucide:x' className='tw:w-4 tw:h-4' />
                  </Tooltip>
                </span>
              </div>
            </li>
            <li>
              <span
                className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                onClick={() => {
                  handleOpenExternalLink('https://open-racla.app/')
                }}
              >
                <Icon icon='lucide:home' className='tw:w-4 tw:h-4 tw:mr-2' />
                {t('quickMenu.raclaHome')}
              </span>
            </li>
            <li className={`tw:border-t tw:dark:border-slate-700 tw:border-gray-200`}></li>
            {userData.varchiveUserInfo.isLinked && userData.varchiveUserInfo.nickname !== '' ? (
              <li>
                <span
                  className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                  onClick={() => {
                    handleOpenExternalLink(
                      `https://v-archive.net/archive/${userData.varchiveUserInfo.nickname}/board`,
                    )
                    setIsDropdownOpen(false)
                  }}
                >
                  <Icon icon='lucide:archive' className='tw:w-4 tw:h-4 tw:mr-2' />
                  {t('quickMenu.vArchiveHome')}
                </span>
              </li>
            ) : (
              <li>
                <span
                  className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                  onClick={() => {
                    handleOpenExternalLink('https://v-archive.net/')
                    setIsDropdownOpen(false)
                  }}
                >
                  <Icon icon='lucide:archive' className='tw:w-4 tw:h-4 tw:mr-2' />
                  {t('quickMenu.vArchiveHome')}
                </span>
              </li>
            )}
            <li className={`tw:border-t tw:dark:border-slate-700 tw:border-gray-200`}></li>
            <li>
              <span
                className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                onClick={() => {
                  handleOpenExternalLink('https://hard-archive.com')
                  setIsDropdownOpen(false)
                }}
              >
                <Icon icon='lucide:hard-drive' className='tw:w-4 tw:h-4 tw:mr-2' />
                {t('quickMenu.hardArchiveHome')}
              </span>
            </li>
            <li className={`tw:border-t tw:dark:border-slate-700 tw:border-gray-200`}></li>
            {isLoggedIn ? (
              <li>
                <span
                  className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:text-red-500 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                  onClick={() => {
                    void handleLogout()
                    setIsDropdownOpen(false)
                  }}
                >
                  <Icon icon='lucide:log-out' className='tw:w-4 tw:h-4 tw:mr-2' />
                  {t('quickMenu.logout')}
                </span>
              </li>
            ) : (
              <li>
                <span
                  className={`tw:flex tw:w-full tw:text-left tw:py-2 tw:px-4 tw:transition-colors tw:cursor-pointer tw:dark:hover:bg-slate-700 tw:hover:bg-indigo-50`}
                  onClick={() => {
                    navigate('/auth/login')
                    setIsDropdownOpen(false)
                  }}
                >
                  <Icon icon='lucide:log-in' className='tw:w-4 tw:h-4 tw:mr-2' />
                  {t('quickMenu.login')}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </>
  )
}

export default MenuSidebar
