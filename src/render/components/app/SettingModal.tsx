import { Icon } from '@iconify/react'
import { globalDictionary } from '@render/constants/globalDictionary'
import { useNotificationSystem } from '@render/hooks/useNotifications'
import { createLog } from '@render/libs/logger'
import { RootState } from '@render/store'
import { setIsSetting, setSettingData, setUserData } from '@render/store/slices/appSlice'
import { PlayerLinkExternalServiceResponse } from '@src/types/dto/player/PlayerLinkExternalService'
import {
  ApiArchiveUserNameRequest,
  ApiArchiveUserNameResponse,
} from '@src/types/dto/v-archive/ApiArchiveUserName'
import { ElectronFile } from '@src/types/file/ElectronFile'
import { SessionData } from '@src/types/sessions/SessionData'
import type { SettingsData } from '@src/types/settings/SettingData'
import type { SettingItem } from '@src/types/settings/SettingItem'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FaDiscord } from 'react-icons/fa6'
import { useDispatch, useSelector } from 'react-redux'
import { PuffLoader } from 'react-spinners'
import apiClient from '../../../libs/apiClient'

// 카테고리 정의
const settingCategories = {
  account: { id: 'account', name: '계정 정보', icon: 'lucide:user', needLogin: true },
  general: { id: 'general', name: '일반', icon: 'lucide:settings', needLogin: false },
  storage: { id: 'storage', name: '저장공간', icon: 'lucide:database', needLogin: false },
  games: { id: 'games', name: '게임 표시 설정', icon: 'lucide:gamepad-2', needLogin: false },
  autoStart: { id: 'autoStart', name: '게임 자동 실행', icon: 'lucide:play', needLogin: false },
  capture: { id: 'capture', name: '자동 캡처 모드', icon: 'lucide:camera', needLogin: false },
}

// 설정 항목이 특정 카테고리에 속하는지 확인하는 함수들
const isGeneralSetting = (settingId: string): boolean => {
  return (
    settingId.includes('hardwareAcceleration') ||
    settingId.includes('language') ||
    settingId.includes('autoUpdate') ||
    settingId.includes('visible') ||
    settingId.includes('hideToTray') ||
    settingId.includes('isNotificationSound')
  )
}

const isCaptureSetting = (settingId: string): boolean => {
  return (
    settingId.includes('autoCapture') &&
    !settingId.includes('autoCaptureDjmax') &&
    !settingId.includes('autoCapturePlatina')
  )
}

const isStorageSetting = (settingId: string): boolean => {
  return (
    settingId.includes('saveImage') ||
    settingId.includes('saveImageWhen') ||
    settingId.includes('saveImageWith') ||
    settingId.includes('saveImageWithout') ||
    settingId.includes('saveImageBlur')
  )
}

const isGameCaptureSetting = (settingId: string): boolean => {
  return settingId.includes('autoCaptureDjmax') || settingId.includes('autoCapturePlatina')
}

const isAutoStartSetting = (settingId: string): boolean => {
  return settingId.includes('autoStart') || settingId.includes('StartGame')
}

const isGameSetting = (settingId: string): boolean => {
  return settingId.includes('showGame')
}

// 설정 항목을 카테고리별로 분류
const categorizeSettings = () => {
  const { settingDictionary } = globalDictionary
  const categorized = {
    general: [] as SettingItem[],
    capture: [] as SettingItem[],
    storage: [] as SettingItem[],
    autoStart: [] as SettingItem[],
    games: [] as SettingItem[],
  }

  Object.entries(settingDictionary).forEach(([key, value]) => {
    const settingId = key
    const settingValue = value as SettingItem

    // isVisible이 false인 항목은 표시하지 않음
    if (settingValue.isVisible === false) {
      return
    }

    if (isGeneralSetting(settingId)) {
      categorized.general.push({ id: settingId, ...settingValue })
    } else if (isCaptureSetting(settingId)) {
      categorized.capture.push({ id: settingId, ...settingValue })
    } else if (isStorageSetting(settingId)) {
      categorized.storage.push({ id: settingId, ...settingValue })
    } else if (isGameCaptureSetting(settingId)) {
      categorized.capture.push({ id: settingId, ...settingValue })
    } else if (isAutoStartSetting(settingId)) {
      categorized.autoStart.push({ id: settingId, ...settingValue })
    } else if (isGameSetting(settingId)) {
      categorized.games.push({ id: settingId, ...settingValue })
    } else {
      categorized.general.push({ id: settingId, ...settingValue })
    }
  })

  return categorized
}

// 토글 스위치 컴포넌트
const ToggleSwitch = ({
  value,
  onChange,
  disabled = false,
  activeCategory,
}: {
  value: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  theme: string
  activeCategory: string
}) => {
  return (
    <div
      className={`tw:relative tw:w-10 tw:h-5 tw:rounded-full tw:transition-all tw:duration-300 tw:cursor-pointer ${
        disabled ? 'tw:opacity-50 tw:cursor-not-allowed' : ''
      } ${value ? 'tw:bg-indigo-600' : activeCategory === 'storage' ? 'tw:dark:bg-slate-800 tw:bg-gray-300' : 'tw:dark:bg-slate-700 tw:bg-gray-300'}`}
      onClick={() => {
        !disabled && onChange(!value)
      }}
    >
      <div
        className={`tw:absolute tw:w-4 tw:h-4 tw:rounded-full tw:transition-all tw:duration-300 tw:top-0.5 tw:bg-white tw:shadow-md ${
          value ? 'tw:translate-x-[22px]' : 'tw:translate-x-0.5'
        }`}
      />
    </div>
  )
}

// 파일 선택 컴포넌트
const FileSelector = ({
  value,
  onChange,
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  theme: string
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { language } = useSelector((state: RootState) => state.app.settingData)

  const getDialogConfig = () => {
    return {
      title: language === 'ko_KR' ? '파일 선택' : 'Select File',
      filters: [
        {
          name: language === 'ko_KR' ? '실행 파일' : 'Executable File',
          extensions: ['exe'],
        },
        { name: language === 'ko_KR' ? '모든 파일' : 'All Files', extensions: ['*'] },
      ],
    }
  }

  const handleElectronFileDialog = async () => {
    try {
      const filePath = await window.electron.openFileDialog(getDialogConfig())
      if (filePath) {
        onChange(filePath)
      }
    } catch (error) {
      createLog(
        'error',
        language === 'ko_KR' ? '파일 선택 오류:' : 'File selection error:',
        error.message,
      )
      // 오류 시 기존 방식으로 폴백
      fileInputRef.current?.click()
    }
  }

  const handleSelectFile = async () => {
    if (disabled) return

    if (window.electron?.openFileDialog) {
      await handleElectronFileDialog()
    } else {
      // 기존 파일 선택 방식으로 폴백
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] as ElectronFile
    onChange(file.path ?? file.name)
  }

  return (
    <div className='tw:flex tw:items-center tw:gap-3 tw:min-w-[250px]'>
      <input
        type='text'
        value={value}
        readOnly
        className={`tw:p-2 tw:text-sm tw:rounded-lg tw:flex-1 tw:border tw:dark:bg-slate-700 tw:dark:text-white tw:dark:border-slate-600 tw:bg-white tw:text-gray-800 tw:border-gray-300`}
      />
      <input ref={fileInputRef} type='file' onChange={handleFileChange} className='tw:hidden' />
      <button
        onClick={() => {
          void handleSelectFile()
        }}
        disabled={disabled}
        className={`tw:p-2 tw:rounded-lg tw:transition-colors tw:bg-indigo-600 tw:hover:bg-indigo-700 tw:text-white ${disabled ? 'tw:opacity-50 tw:cursor-not-allowed' : ''}`}
      >
        <Icon icon='lucide:folder' className='tw:w-4 tw:h-4' />
      </button>
    </div>
  )
}

// 셀렉트 박스 컴포넌트
const SelectBox = ({
  id,
  value,
  options,
  onChange,
  disabled = false,
}: {
  id: string
  value: string | number
  options: { id: string | number; name: string }[]
  onChange: (value: string) => void
  disabled?: boolean
  theme: string
}) => {
  const { t } = useTranslation(['settings'])
  return (
    <select
      value={value}
      onChange={(e) => {
        onChange(e.target.value)
      }}
      disabled={disabled}
      className={`tw:p-2 tw:min-w-[180px] tw:max-w-[180px] tw:w-[180px] tw:text-sm tw:rounded-lg tw:transition-colors tw:border tw:dark:bg-slate-700 tw:dark:text-white tw:dark:border-slate-600 tw:bg-white tw:text-gray-800 tw:border-gray-300 ${
        disabled ? 'tw:opacity-50 tw:cursor-not-allowed' : ''
      }`}
    >
      {options
        .filter((option) => {
          if (typeof option.id === 'number') {
            return true
          } else {
            return option.id
          }
        })
        .map((option) => (
          <option key={option.id} value={option.id}>
            {t(`${id}.${option.id}`)}
          </option>
        ))}
    </select>
  )
}

// 폴더 항목 컴포넌트
const FolderItem = ({
  title,
  path,
  size,
  folderType,
  formatBytes,
  openFolder,
  children,
}: {
  title: string
  path: string
  size: number
  folderType: 'documents' | 'pictures' | 'logs' | 'appData'
  theme: string
  formatBytes: (bytes: number) => string
  openFolder: (folderType: 'documents' | 'pictures' | 'logs' | 'appData') => Promise<void>
  children?: React.ReactNode
}) => (
  <div
    className={`tw:px-4 tw:pt-3 tw:pb-4 tw:rounded-lg tw:border tw:dark:bg-slate-700 tw:dark:border-slate-600 tw:bg-white tw:border-gray-200`}
  >
    <div className='tw:flex tw:justify-between tw:items-center'>
      <h1 className='tw:text-sm'>{title}</h1>
      <div className='tw:flex tw:items-center tw:gap-3'>
        <span className='tw:font-mono tw:text-sm'>{formatBytes(size)}</span>
        <button
          onClick={() => {
            void openFolder(folderType)
          }}
          className={`tw:p-2 tw:rounded-lg tw:cursor-pointer tw:dark:tw:hover:text-slate-600 tw:text-indigo-400`}
        >
          <Icon icon='lucide:folder-open' className='tw:w-4 tw:h-4' />
        </button>
      </div>
    </div>
    <div className='tw:text-sm tw:opacity-70 tw:truncate'>{path}</div>
    {children}
  </div>
)

const AccountInfo = () => {
  const dispatch = useDispatch()
  const { userData } = useSelector((state: RootState) => state.app)
  const { showNotification } = useNotificationSystem()
  const { language } = useSelector((state: RootState) => state.app.settingData)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const getUserName = async <T = ApiArchiveUserNameResponse, R = ApiArchiveUserNameRequest>(
    body: R,
  ): Promise<T> => {
    const { data } = await apiClient.postProxy<T>(`https://v-archive.net/client/login`, body)
    return data.data
  }
  const vArchiveFileInputRef = useRef<HTMLInputElement>(null)

  const handleVArchiveFileSelect = () => {
    vArchiveFileInputRef.current?.click()
  }

  const onVArchiveFileChange = (e) => {
    const file = e.target.files[0]
    const fileReader = new FileReader()
    fileReader.onload = () => {
      const text = fileReader.result.toString().trim()
      try {
        if (
          // account.txt 유효성 검증
          // 구분자(공백)이 존재하는지
          text.includes(' ') &&
          // 구분자(공백)으로 나눈 후 배열의 길이가 2 인지(userNo, token)
          text.split(' ').length === 2 &&
          // userNo로 추정되는 부분 인덱스(0)이 숫자로만 구성되어 있는지
          !Number.isNaN(Number(text.split(' ')[0])) &&
          // token(uuidv4)으로 추정되는 부분 인덱스(1)에 - 문자가 포함되는지
          text.split(' ')[1].includes('-') &&
          // uuid 구조상 첫 번째(time-low) 필드의 문자열 길이가 8인지
          text.split(' ')[1].split('-')[0].length === 8 &&
          // uuid 구조상 두 번째(time-mid) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[1].length === 4 &&
          // uuid 구조상 세 번째(time-hight-and-version) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[2].length === 4 &&
          // uuid 구조상 네 번째(clock-seq-hi-and-reserved & clock-seq-low) 필드의 문자열 길이가 4인지
          text.split(' ')[1].split('-')[3].length === 4 &&
          // uuid 구조상 다섯 번째(node) 필드의 문자열 길이가 12인지
          text.split(' ')[1].split('-')[4].length === 12
        ) {
          const data = getUserName({ userNo: text.split(' ')[0], token: text.split(' ')[1] })
          data
            .then(async (result) => {
              if (result.success) {
                await apiClient
                  .post<PlayerLinkExternalServiceResponse>(`/v3/racla/player/link/oauth/vArchive`, {
                    playerId: userData.playerId,
                    playerToken: userData.playerToken,
                    externalServiceUserNo: Number(text.split(' ')[0]),
                    externalServiceUserToken: text.split(' ')[1],
                    externalServiceType: 'V_ARCHIVE',
                  })
                  .then((data) => {
                    if (data.data.success && data.data.data.result == 'Success') {
                      showNotification({
                        mode: 'i18n',
                        ns: 'settings',
                        value: 'accountInfo.vArchive.Success',
                      })
                      const newUserData: SessionData = {
                        ...userData,
                        varchiveUserInfo: {
                          ...data.data.data.varchiveUserInfo,
                          isLinked: true,
                        },
                      }
                      dispatch(setUserData(newUserData))
                    } else if (!data.data.success && data.data.data.result === 'NotFound') {
                      showNotification(
                        {
                          mode: 'i18n',
                          ns: 'settings',
                          value: 'accountInfo.vArchive.NotFound',
                        },
                        'success',
                      )
                    } else if (!data.data.success && data.data.data.result === 'Already') {
                      showNotification(
                        {
                          mode: 'i18n',
                          ns: 'settings',
                          value: 'accountInfo.vArchive.Already',
                        },
                        'error',
                      )
                    } else {
                      showNotification(
                        {
                          mode: 'i18n',
                          ns: 'settings',
                          value: 'accountInfo.vArchive.Unknown',
                        },
                        'error',
                      )
                    }
                  })
                  .catch((error: unknown) => {
                    createLog('error', 'Error linking V-ARCHIVE account', String(error))
                    showNotification(
                      {
                        mode: 'i18n',
                        ns: 'settings',
                        value: 'accountInfo.vArchive.Unknown',
                      },
                      'error',
                    )
                  })
              } else {
                showNotification(
                  {
                    mode: 'i18n',
                    ns: 'settings',
                    value: 'accountInfo.vArchive.NotFound',
                  },
                  'error',
                )
              }
            })
            .catch((error: unknown) => {
              createLog('error', 'Error linking V-ARCHIVE account', String(error))
              showNotification(
                {
                  mode: 'i18n',
                  ns: 'settings',
                  value: 'accountInfo.vArchive.Unknown',
                },
                'error',
              )
            })
        } else {
          showNotification(
            {
              mode: 'i18n',
              ns: 'settings',
              value: 'accountInfo.vArchive.Invalid',
            },
            'error',
          )
        }
      } catch (error) {
        createLog('error', 'Error linking V-ARCHIVE account', String(error))
        showNotification(
          {
            mode: 'i18n',
            ns: 'settings',
            value: 'accountInfo.vArchive.Unknown',
          },
          'error',
        )
      }
    }
    try {
      fileReader.readAsText(file)
    } catch (error) {
      createLog('error', 'Error reading V-ARCHIVE account file', String(error))
      showNotification(
        {
          mode: 'i18n',
          ns: 'settings',
          value: 'accountInfo.vArchive.Unknown',
        },
        'error',
      )
    } finally {
      vArchiveFileInputRef.current.value = ''
    }
  }

  const handleDiscordLink = async () => {
    try {
      const code = await window.electron.openDiscordLogin()
      createLog('debug', 'Received Discord OAuth Code:', code)

      await apiClient
        .post<PlayerLinkExternalServiceResponse>(`/v3/racla/player/link/oauth/discord`, {
          playerId: userData.playerId,
          playerToken: userData.playerToken,
          externalServiceCode: code,
          externalServiceType: 'DISCORD',
        })
        .then((data) => {
          if (data.data.success && data.data.data.result === 'Success') {
            createLog('debug', 'handleDiscordLink', { data: data.data.data })
            showNotification(
              {
                mode: 'i18n',
                ns: 'settings',
                value: 'accountInfo.discord.Success',
              },
              'success',
            )
            const newUserData: SessionData = {
              ...userData,
              discordUserInfo: {
                ...data.data.data.discordUserInfo,
                isLinked: true,
              },
            }
            dispatch(setUserData(newUserData))
          } else if (!data.data.success && data.data.data.result === 'NotFound') {
            showNotification(
              {
                mode: 'i18n',
                ns: 'settings',
                value: 'accountInfo.discord.NotFound',
              },
              'error',
            )
          } else if (!data.data.success && data.data.data.result === 'Already') {
            showNotification(
              {
                mode: 'i18n',
                ns: 'settings',
                value: 'accountInfo.discord.Already',
              },
              'error',
            )
          } else {
            showNotification(
              {
                mode: 'i18n',
                ns: 'settings',
                value: 'accountInfo.discord.Unknown',
              },
              'error',
            )
          }
        })
        .catch((error: unknown) => {
          createLog('error', 'Error linking Discord account', String(error))
          showNotification(
            {
              mode: 'i18n',
              ns: 'settings',
              value: 'accountInfo.discord.Unknown',
            },
            'error',
          )
        })
    } catch (error) {
      createLog('error', 'Error linking Discord account', String(error))
      showNotification(
        {
          mode: 'i18n',
          ns: 'settings',
          value: 'accountInfo.discord.Unknown',
        },
        'error',
      )
    }
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopySuccess(field)
        setTimeout(() => {
          setCopySuccess(null), 2000
        })
      },
      () => {
        setCopySuccess('error')
        setTimeout(() => {
          setCopySuccess(null)
        }, 2000)
      },
    )
  }

  // 계정 정보 표시 컴포넌트
  const AccountField = ({
    label,
    value,
    fieldId,
    language,
  }: {
    label: string
    value: string | number
    fieldId: string
    language: string
  }) => (
    <div className={`tw:flex tw:items-center tw:justify-between tw:mb-2`}>
      <span className='tw:text-sm tw:font-medium'>{label}</span>
      <div className='tw:flex tw:items-center tw:gap-2'>
        <div className='tw:px-3 tw:py-1.5 tw:bg-gray-100 tw:dark:bg-slate-800 tw:blur-sm tw:hover:blur-none tw:transition-all tw:duration-300 tw:rounded-md tw:relative'>
          <span className='tw:text-sm tw:font-mono'>{value}</span>
        </div>
        <button
          onClick={() => {
            copyToClipboard(String(value), fieldId)
          }}
          className='tw:p-1.5 tw:rounded-full tw:bg-gray-100 tw:dark:bg-slate-700 tw:text-gray-600 tw:dark:text-gray-300 hover:tw:bg-indigo-100 hover:tw:dark:bg-indigo-900 tw:transition-colors'
        >
          {copySuccess === fieldId ? (
            <Icon icon='lucide:check' className='tw:w-4 tw:h-4 tw:text-green-500' />
          ) : (
            <Icon icon='lucide:copy' className='tw:w-4 tw:h-4' />
          )}
        </button>
      </div>
    </div>
  )

  const { t } = useTranslation(['settings'])

  return (
    <div className='tw:flex tw:flex-col tw:gap-6'>
      {/* Open-RACLA 계정 정보 */}
      <div className='tw:bg-white tw:dark:bg-slate-700 tw:rounded-xl tw:p-5 tw:border tw:border-gray-200 tw:dark:border-slate-600'>
        <div className='tw:flex tw:items-center tw:gap-3 tw:mb-4'>
          <div className='tw:p-2 tw:bg-indigo-100 tw:dark:bg-indigo-900/50 tw:rounded-lg'>
            <Icon
              icon='lucide:user'
              className='tw:w-5 tw:h-5 tw:text-indigo-600 tw:dark:text-indigo-400'
            />
          </div>
          <h3 className='tw:text-base tw:font-medium'>Open-RACLA {t('accountInfo.name')}</h3>
        </div>

        <div className='tw:space-y-4'>
          <div className='tw:space-y-2'>
            <AccountField
              label={t('accountInfo.playerId')}
              value={userData.playerId}
              fieldId='playerId'
              language={language}
            />
            <AccountField
              label={t('accountInfo.playerToken')}
              value={userData.playerToken}
              fieldId='playerToken'
              language={language}
            />
          </div>

          <div className='tw:mt-3 tw:p-3 tw:bg-red-50 tw:dark:bg-red-900/20 tw:rounded-lg tw:border tw:border-red-100 tw:dark:border-red-900/30'>
            <span className='tw:text-sm tw:font-light tw:text-red-600 tw:dark:text-red-400 tw:break-keep tw:flex tw:items-start tw:gap-2'>
              <Icon icon='lucide:alert-triangle' className='tw:w-4 tw:h-4 tw:shrink-0 tw:mt-0.5' />
              <span>{t('accountInfo.playerWarning')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* V-ARCHIVE 계정 정보 */}
      <div className='tw:bg-white tw:dark:bg-slate-700 tw:rounded-xl tw:p-5 tw:border tw:border-gray-200 tw:dark:border-slate-600'>
        <div className='tw:flex tw:items-center tw:gap-3 tw:mb-4'>
          <div className='tw:p-2 tw:bg-blue-100 tw:dark:bg-blue-900/50 tw:rounded-lg'>
            <Icon
              icon='lucide:link'
              className='tw:w-5 tw:h-5 tw:text-blue-600 tw:dark:text-blue-400'
            />
          </div>
          <h3 className='tw:text-base tw:font-medium'>V-ARCHIVE {t('accountInfo.linkInfo')}</h3>
        </div>

        <input
          ref={vArchiveFileInputRef}
          type='file'
          accept='.txt'
          onChange={(e) => {
            onVArchiveFileChange(e)
          }}
          className='tw:hidden'
        />

        {userData.varchiveUserInfo.isLinked ? (
          <div className='tw:space-y-4'>
            <div className='tw:space-y-2'>
              <AccountField
                label={t('accountInfo.vArchiveUserNo')}
                value={userData.varchiveUserInfo.userNo || ''}
                fieldId='vArchiveUserNo'
                language={language}
              />
              <AccountField
                label={t('accountInfo.vArchiveToken')}
                value={userData.varchiveUserInfo.token}
                fieldId='vArchiveToken'
                language={language}
              />
            </div>

            <div className='tw:mt-3 tw:p-3 tw:bg-red-50 tw:dark:bg-red-900/20 tw:rounded-lg tw:border tw:border-red-100 tw:dark:border-red-900/30'>
              <span
                className={`tw:text-sm tw:font-light tw:text-red-600 tw:dark:text-red-400 ${language !== 'ja_JP' ? 'tw:break-keep' : ''} tw:flex tw:items-start tw:gap-2`}
              >
                <Icon
                  icon='lucide:alert-triangle'
                  className='tw:w-4 tw:h-4 tw:shrink-0 tw:mt-0.5'
                />
                <span>{t('accountInfo.vArchiveWarning')}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className='tw:space-y-4'>
            <button
              onClick={handleVArchiveFileSelect}
              className='tw:flex tw:items-center tw:justify-center tw:gap-2 tw:px-4 tw:py-2.5 tw:bg-blue-600 hover:tw:bg-blue-700 tw:text-white tw:text-sm tw:font-medium tw:rounded-lg tw:w-full tw:transition-colors'
            >
              <Icon icon='lucide:file-plus' className='tw:w-4 tw:h-4' />
              {t('accountInfo.vArchive.Link')}
            </button>

            <div className='tw:flex tw:items-start tw:gap-3 tw:p-4 tw:bg-gray-50 tw:dark:bg-slate-800 tw:rounded-lg'>
              <Icon
                icon='lucide:info'
                className='tw:w-5 tw:h-5 tw:text-gray-400 tw:shrink-0 tw:mt-0.5'
              />
              <span
                className={`tw:text-sm tw:font-light tw:text-gray-600 tw:dark:text-gray-400 ${language !== 'ja_JP' ? 'tw:break-keep' : ''}`}
              >
                {t('accountInfo.vArchive.NotLinked')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Discord 연동 정보 */}
      <div className='tw:bg-white tw:dark:bg-slate-700 tw:rounded-xl tw:p-5 tw:border tw:border-gray-200 tw:dark:border-slate-600'>
        <div className='tw:flex tw:items-center tw:gap-3 tw:mb-4'>
          <div className='tw:p-2 tw:bg-[#5865F2]/10 tw:dark:bg-[#5865F2]/20 tw:rounded-lg'>
            <FaDiscord className='tw:w-5 tw:h-5 tw:text-[#5865F2]' />
          </div>
          <h3 className='tw:text-base tw:font-medium'>Discord {t('accountInfo.linkInfo')}</h3>
        </div>

        {userData.discordUserInfo.isLinked ? (
          <div className='tw:space-y-4'>
            <div className='tw:space-y-2'>
              <AccountField
                label={t('accountInfo.discordUid')}
                value={userData.discordUserInfo.uid}
                fieldId='discordUid'
                language={language}
              />
            </div>

            <div className='tw:mt-3 tw:p-3 tw:bg-red-50 tw:dark:bg-red-900/20 tw:rounded-lg tw:border tw:border-red-100 tw:dark:border-red-900/30'>
              <span
                className={`tw:text-sm tw:font-light tw:text-red-600 tw:dark:text-red-400 ${language !== 'ja_JP' ? 'tw:break-keep' : ''} tw:flex tw:items-start tw:gap-2`}
              >
                <Icon
                  icon='lucide:alert-triangle'
                  className='tw:w-4 tw:h-4 tw:shrink-0 tw:mt-0.5'
                />
                <span>{t('accountInfo.discordWarning')}</span>
              </span>
            </div>
          </div>
        ) : (
          <div className='tw:space-y-4'>
            <button
              onClick={() => {
                void handleDiscordLink()
              }}
              className='tw:flex tw:items-center tw:justify-center tw:gap-2 tw:px-4 tw:py-2.5 tw:bg-[#5865F2] hover:tw:bg-[#4752C4] tw:text-white tw:text-sm tw:font-medium tw:rounded-lg tw:w-full tw:transition-colors'
            >
              <FaDiscord className='tw:text-base' />
              {t('accountInfo.discord.Link')}
            </button>

            <div className='tw:flex tw:items-start tw:gap-3 tw:p-4 tw:bg-gray-50 tw:dark:bg-slate-800 tw:rounded-lg'>
              <Icon
                icon='lucide:info'
                className='tw:w-5 tw:h-5 tw:text-gray-400 tw:shrink-0 tw:mt-0.5'
              />
              <span
                className={`tw:text-sm tw:font-light tw:text-gray-600 tw:dark:text-gray-400 ${language !== 'ja_JP' ? 'tw:break-keep' : ''}`}
              >
                {t('accountInfo.discord.NotLinked')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const StorageInfo = ({
  theme,
  onSettingChange,
}: {
  theme: string
  onSettingChange: (id: string, value: string | number | boolean) => void
}) => {
  const dispatch = useDispatch()
  const { settingData } = useSelector((state: RootState) => state.app)
  const { language } = useSelector((state: RootState) => state.app.settingData)
  const { showNotification } = useNotificationSystem()
  const { t } = useTranslation(['settings'])
  const [storageInfo, setStorageInfo] = useState({
    total: 0,
    free: 0,
    used: 0,
    usedPercentage: 0,
    appDataSize: 0,
    imageDataSize: 0,
    logDataSize: 0,
  })

  const [folderPaths, setFolderPaths] = useState({
    documents: '',
    pictures: '',
    logs: '',
    appData: '',
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isCleaningLogs, setIsCleaningLogs] = useState(false)
  const [autoDeleteDays, setAutoDeleteDays] = useState(0)

  useEffect(() => {
    const fetchStorageInfo = async () => {
      try {
        if (window.electron) {
          const info = await window.electron.getStorageInfo()
          setStorageInfo(info)

          const paths = await window.electron.getFolderPaths()
          setFolderPaths(paths)

          if (settingData && settingData.autoDeleteCapturedImages !== undefined) {
            setAutoDeleteDays(settingData.autoDeleteCapturedImages)
          }
        }
      } catch (error) {
        createLog(
          'error',
          language === 'ko_KR' ? '스토리지 정보 로딩 실패:' : 'Storage information loading failed:',
          error.message,
        )
      } finally {
        setIsLoading(false)
      }
    }

    void fetchStorageInfo()
  }, [isCleaningLogs, settingData])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    // 인덱스가 유효한지 확인
    if (i >= 0 && i < sizes.length) {
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    return bytes + ' Bytes'
  }

  const openFolder = async (folderType: 'documents' | 'pictures' | 'logs' | 'appData') => {
    if (window.electron) {
      await window.electron.openFolder(folderType)
    }
  }

  const clearAllLogs = async () => {
    setIsCleaningLogs(true)
    try {
      if (window.electron) {
        const result = await window.electron.clearAllLogs()
        if (result) {
          showNotification(
            { mode: 'i18n', ns: 'settings', value: 'log.clearAllLogsSuccess' },
            'success',
          )
        } else {
          showNotification(
            { mode: 'i18n', ns: 'settings', value: 'log.clearAllLogsError' },
            'error',
          )
        }
      }
    } catch (error) {
      createLog('error', '로그 파일 삭제 실패:', error.message)
      showNotification({ mode: 'i18n', ns: 'settings', value: 'log.clearAllLogsError' }, 'error')
    } finally {
      setIsCleaningLogs(false)
    }
  }

  const handleAutoDeleteChange = (value: number) => {
    setAutoDeleteDays(value)

    const newSettings = {
      ...settingData,
      autoDeleteCapturedImages: value,
    }

    // 설정 저장
    dispatch(setSettingData(newSettings))

    // electron 설정 저장 호출
    if (window.electron?.saveSettings) {
      window.electron.saveSettings(newSettings)
    }
  }

  return (
    <div className='tw:space-y-6'>
      {isLoading ? (
        <div className='tw:flex tw:justify-center tw:py-8'>
          <PuffLoader color={theme === 'dark' ? '#fff' : '#000'} size={32} />
        </div>
      ) : (
        <>
          <div className='tw:space-y-4'>
            <FolderItem
              title={t('storageSettingFile')}
              path={folderPaths.documents}
              size={storageInfo.appDataSize}
              folderType='documents'
              theme={theme}
              formatBytes={formatBytes}
              openFolder={openFolder}
            />

            <FolderItem
              title={t('storageCaptureImage')}
              path={folderPaths.pictures}
              size={storageInfo.imageDataSize}
              folderType='pictures'
              theme={theme}
              formatBytes={formatBytes}
              openFolder={openFolder}
            >
              <div
                className={`tw:mt-3 tw:pt-3 tw:flex tw:justify-between tw:items-center tw:border-t tw:dark:border-slate-600 tw:border-gray-200`}
              >
                <div>
                  <h1 className='tw:text-sm'>{t('autoDeleteCapturedImages.name')}</h1>
                  <p className='tw:text-xs tw:mt-1 tw:dark:text-slate-400 tw:text-gray-600'>
                    {t('autoDeleteCapturedImages.description')}
                  </p>
                </div>
                <SelectBox
                  id='autoDeleteCapturedImages'
                  value={autoDeleteDays}
                  options={[
                    { id: 0, name: t('autoDeleteCapturedImages.0') },
                    { id: 7, name: t('autoDeleteCapturedImages.7') },
                    { id: 14, name: t('autoDeleteCapturedImages.14') },
                    { id: 30, name: t('autoDeleteCapturedImages.30') },
                    { id: 90, name: t('autoDeleteCapturedImages.90') },
                  ]}
                  onChange={(value) => {
                    handleAutoDeleteChange(Number(value))
                  }}
                  theme={theme}
                />
              </div>

              {/* 캡처 이미지 저장 옵션 */}
              <div
                className={`tw:mt-3 tw:pt-3 tw:border-t tw:dark:border-slate-600 tw:border-gray-200`}
              >
                <div className='tw:space-y-4'>
                  {/* 캡처 이미지 저장 여부 */}
                  <div className='tw:flex tw:justify-between tw:items-center'>
                    <div>
                      <h1 className='tw:text-sm'>{t('saveImageWhenCapture.name')}</h1>
                      <p className='tw:text-xs tw:mt-1 tw:dark:text-slate-400 tw:text-gray-600'>
                        {t('saveImageWhenCapture.description')}
                      </p>
                    </div>
                    <ToggleSwitch
                      value={settingData.saveImageWhenCapture ?? true}
                      onChange={(value) => {
                        onSettingChange('saveImageWhenCapture', value)
                      }}
                      theme={theme}
                      activeCategory={'storage'}
                    />
                  </div>

                  {/* 모든 프로필 정보 포함 */}
                  <div className='tw:flex tw:justify-between tw:items-center'>
                    <div>
                      <h1 className='tw:text-sm'>{t('saveImageWithAllProfileWhenCapture.name')}</h1>
                      <p className='tw:text-xs tw:mt-1 tw:dark:text-slate-400 tw:text-gray-600'>
                        {t('saveImageWithAllProfileWhenCapture.description')}
                      </p>
                    </div>
                    <ToggleSwitch
                      value={settingData.saveImageWithAllProfileWhenCapture ?? true}
                      onChange={(value) => {
                        if (!settingData.saveImageWithAllProfileWhenCapture) {
                          onSettingChange('saveImageWithAllProfileWhenCapture', value)
                        }
                      }}
                      disabled={!settingData.saveImageWhenCapture}
                      theme={theme}
                      activeCategory={'storage'}
                    />
                  </div>

                  {/* 다른 프로필 정보 제외 */}
                  <div className='tw:flex tw:justify-between tw:items-center'>
                    <div>
                      <h1 className='tw:text-sm'>
                        {t('saveImageWithoutOtherProfileWhenCapture.name')}
                      </h1>
                      <p className='tw:text-xs tw:mt-1 tw:dark:text-slate-400 tw:text-gray-600'>
                        {t('saveImageWithoutOtherProfileWhenCapture.description')}
                      </p>
                    </div>
                    <ToggleSwitch
                      value={settingData.saveImageWithoutOtherProfileWhenCapture ?? false}
                      onChange={(value) => {
                        if (!settingData.saveImageWithoutOtherProfileWhenCapture) {
                          onSettingChange('saveImageWithoutOtherProfileWhenCapture', value)
                        }
                      }}
                      disabled={!settingData.saveImageWhenCapture}
                      theme={theme}
                      activeCategory={'storage'}
                    />
                  </div>

                  {/* 모든 프로필 정보 제외 */}
                  <div className='tw:flex tw:justify-between tw:items-center'>
                    <div>
                      <h1 className='tw:text-sm'>
                        {t('saveImageWithoutAllProfileWhenCapture.name')}
                      </h1>
                      <p className='tw:text-xs tw:mt-1 tw:dark:text-slate-400 tw:text-gray-600'>
                        {t('saveImageWithoutAllProfileWhenCapture.description')}
                      </p>
                    </div>
                    <ToggleSwitch
                      value={settingData.saveImageWithoutAllProfileWhenCapture ?? false}
                      onChange={(value) => {
                        if (!settingData.saveImageWithoutAllProfileWhenCapture) {
                          onSettingChange('saveImageWithoutAllProfileWhenCapture', value)
                        }
                      }}
                      disabled={!settingData.saveImageWhenCapture}
                      theme={theme}
                      activeCategory={'storage'}
                    />
                  </div>

                  {/* 이미지 블러 모드 */}
                  <div className='tw:flex tw:justify-between tw:items-center'>
                    <div>
                      <h1 className='tw:text-sm'>{t('saveImageBlurMode.name')}</h1>
                      <p className='tw:text-xs tw:mt-1 tw:dark:text-slate-400 tw:text-gray-600'>
                        {t('saveImageBlurMode.description')}
                      </p>
                    </div>
                    <SelectBox
                      id='saveImageBlurMode'
                      value={settingData.saveImageBlurMode ?? 'blur'}
                      options={[
                        { id: 'blur', name: t('saveImageBlurMode.blur') },
                        { id: 'mask', name: t('saveImageBlurMode.mask') },
                      ]}
                      onChange={(value) => {
                        onSettingChange('saveImageBlurMode', value)
                      }}
                      disabled={!settingData.saveImageWhenCapture}
                      theme={theme}
                    />
                  </div>
                </div>
              </div>
            </FolderItem>

            <FolderItem
              title={t('storageLogs')}
              path={folderPaths.logs}
              size={storageInfo.logDataSize}
              folderType='logs'
              theme={theme}
              formatBytes={formatBytes}
              openFolder={openFolder}
            >
              <div className='tw:mt-2 tw:flex tw:justify-end'>
                <button
                  onClick={() => {
                    void clearAllLogs()
                  }}
                  disabled={isCleaningLogs || storageInfo.logDataSize === 0}
                  className={`tw:px-2 tw:py-1 tw:text-xs tw:rounded tw:transition-colors tw:flex tw:items-center tw:gap-1 tw:dark:bg-red-700 tw:dark:hover:bg-red-800 tw:bg-red-600 tw:hover:bg-red-700 tw:text-white ${isCleaningLogs || storageInfo.logDataSize === 0 ? 'tw:opacity-50 tw:cursor-not-allowed' : ''}`}
                >
                  {isCleaningLogs ? (
                    <>
                      <Icon icon='lucide:loader' className='tw:w-3 tw:h-3 tw:animate-spin' />
                      {t('storageLogsDeleting')}
                    </>
                  ) : (
                    <>
                      <Icon icon='lucide:trash-2' className='tw:w-3 tw:h-3' />
                      {t('storageLogsDeleteAll')}
                    </>
                  )}
                </button>
              </div>
            </FolderItem>
          </div>
        </>
      )}
    </div>
  )
}

export default function SettingModal() {
  const dispatch = useDispatch()
  const { theme } = useSelector((state: RootState) => state.ui)
  const { isLoggedIn } = useSelector((state: RootState) => state.app)
  const { isSetting, settingData } = useSelector((state: RootState) => state.app)
  const { font, language } = useSelector((state: RootState) => state.app.settingData)
  const [activeCategory, setActiveCategory] = useState<string>('general')
  const [localSettings, setLocalSettings] = useState<SettingsData>({} as SettingsData)
  const { t, i18n } = useTranslation(['settings'])
  const categorizedSettings = categorizeSettings()

  // 모달이 열릴 때 설정 데이터를 로컬 상태로 복사
  useEffect(() => {
    if (isSetting && settingData) {
      // 언어에 따라 폰트 설정 조정
      const settings = { ...settingData }
      if (
        globalDictionary.settingDictionary.font.getDefaultValue &&
        settings.language !== 'ko_KR' &&
        settings.font !== 'default'
      ) {
        settings.font = globalDictionary.settingDictionary.font.getDefaultValue(settings.language)
        // Redux 상태 업데이트
        dispatch(setSettingData(settings))
        // electron을 통해 설정 저장
        if (window.electron?.saveSettings) {
          window.electron.saveSettings(settings)
        }
      }
      setLocalSettings({ ...settings })
    }
  }, [isSetting, settingData, dispatch])

  // ESC 키 누름 감지
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSetting) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [isSetting])

  // 설정 값 변경 핸들러
  const handleSettingChange = (id: string, value: string | number | boolean) => {
    const updatedSettings = (prev: SettingsData) => {
      // Record를 사용해 타입 정의
      const newSettings = { ...prev } as SettingsData & Record<string, string | number | boolean>

      // 상호 배타적인 설정 처리 (예: 알림음)
      if (id.endsWith('Sound') && value === true) {
        const offItems = Object.keys(globalDictionary.settingDictionary).filter(
          (key) => key.endsWith('Sound') && key !== id,
        )

        // 안전하게 할당
        offItems.forEach((offItem) => {
          if (offItem && typeof offItem === 'string' && offItem in newSettings) {
            newSettings[offItem] = false
          }
        })
      }

      // 설정 항목의 offList 속성 처리
      if (value === true && globalDictionary.settingDictionary[id]?.offList) {
        const offList = globalDictionary.settingDictionary[id].offList || []

        // offList에 포함된 모든 항목을 false로 설정
        offList.forEach((offItem) => {
          if (offItem && typeof offItem === 'string' && offItem in newSettings) {
            newSettings[offItem] = false
          }
        })
      }

      // 설정 항목의 onList 속성 처리
      if (value === true && globalDictionary.settingDictionary[id]?.onList) {
        const onList = globalDictionary.settingDictionary[id].onList || []

        // onList에 포함된 모든 항목을 true로 설정
        onList.forEach((onItem) => {
          if (onItem && typeof onItem === 'string' && onItem in newSettings) {
            newSettings[onItem] = true
          }
        })
      }

      // 안전하게 설정 할당
      if (id && typeof id === 'string' && id in newSettings) {
        newSettings[id] = value
      }

      if (id === 'language') {
        void i18n.changeLanguage(value as string)
        // 언어가 변경될 때 font 기본값도 적절히 변경
        if (globalDictionary.settingDictionary.font.getDefaultValue) {
          newSettings['font'] = globalDictionary.settingDictionary.font.getDefaultValue(
            value as string,
          )
        }
      }

      return newSettings as SettingsData
    }

    // Redux 상태 업데이트
    const newSettings = updatedSettings(settingData)
    dispatch(setSettingData(newSettings))

    // electron을 통해 설정 저장
    if (window.electron?.saveSettings) {
      window.electron.saveSettings(newSettings)
    }
  }

  // 모달 닫기
  const closeModal = () => {
    dispatch(setIsSetting(false))
  }

  return (
    <div
      className={`tw:fixed ${font != 'default' ? 'tw:font-medium' : ''} tw:inset-0 ${language !== 'ja_JP' ? 'tw:break-keep' : ''} tw:z-50 tw:flex tw:items-center tw:justify-center tw:transition-all tw:duration-300 ${
        isSetting ? 'tw:opacity-100' : 'tw:opacity-0 tw:pointer-events-none'
      }`}
    >
      {/* 배경 오버레이 */}
      <div
        className={`tw:fixed tw:inset-0 tw:bg-black tw:transition-opacity tw:duration-300 ${
          isSetting ? 'tw:opacity-60' : 'tw:opacity-0'
        }`}
        onClick={closeModal}
      />

      {/* 모달 내용 */}
      <div
        className={`tw:relative tw:rounded-xl tw:shadow-2xl tw:w-full tw:max-w-4xl tw:max-h-[90vh] tw:flex tw:flex-col tw:transition-all tw:duration-300 tw:dark:bg-slate-800 tw:dark:text-slate-200 tw:bg-white tw:text-gray-800 ${isSetting ? 'tw:translate-y-0 tw:opacity-100' : 'tw:translate-y-4 tw:opacity-0'}`}
      >
        {/* 모달 헤더 */}
        <div className={`tw:py-3 tw:px-5 tw:border-b tw:dark:border-slate-700 tw:border-gray-200`}>
          <div className='tw:flex tw:justify-between tw:items-center'>
            <div className='tw:flex tw:items-center tw:gap-2'>
              <Icon icon='lucide:settings' className='tw:w-5 tw:h-5' />
              <h2 className='tw:text-lg tw:font-bold'>{t('settings')}</h2>
            </div>
            <button
              onClick={closeModal}
              className={`tw:p-2 tw:rounded-full tw:transition-colors tw:dark:hover:bg-slate-700 tw:hover:bg-gray-200`}
            >
              <Icon icon='lucide:x' className='tw:w-5 tw:h-5' />
            </button>
          </div>
        </div>

        {/* 모달 본문 */}
        <div className='tw:flex tw:flex-1 tw:overflow-hidden'>
          {/* 사이드바 - 카테고리 탭 */}
          <div
            className={`tw:w-48 tw:p-5 tw:border-r tw:flex tw:flex-col tw:gap-3 tw:dark:border-slate-700 tw:border-gray-200`}
          >
            {Object.entries(settingCategories).map(
              ([key, category]) =>
                (!category.needLogin || isLoggedIn) && (
                  <span
                    key={key}
                    onClick={() => {
                      setActiveCategory(key)
                    }}
                    className={`tw:flex tw:items-center tw:cursor-pointer tw:gap-3 tw:px-4 tw:py-3 tw:rounded-lg tw:transition-colors tw:text-left ${
                      activeCategory === key
                        ? 'tw:dark:bg-slate-700 tw:dark:text-white tw:bg-indigo-100 tw:text-indigo-800'
                        : 'tw:dark:hover:bg-slate-700 tw:dark:text-slate-300 tw:hover:bg-gray-100 tw:text-gray-700'
                    }`}
                  >
                    <span className='tw:text-sm'>{t(category.id)}</span>
                  </span>
                ),
            )}
          </div>

          {/* 설정 항목 */}
          <div className='tw:flex-1 tw:p-6 tw:overflow-y-auto tw:custom-scrollbar tw:h-[calc(100vh-10rem)]'>
            {activeCategory === 'storage' ? (
              <StorageInfo theme={theme} onSettingChange={handleSettingChange} />
            ) : activeCategory === 'account' && isLoggedIn ? (
              <AccountInfo />
            ) : (
              <>
                {categorizedSettings[activeCategory as keyof typeof categorizedSettings].map(
                  (setting, index) => (
                    <div
                      key={setting.id}
                      className={`tw:pb-8 ${
                        categorizedSettings[activeCategory as keyof typeof categorizedSettings]
                          .length -
                          1 !==
                        index
                          ? 'tw:border-b tw:mb-8'
                          : ''
                      } tw:dark:border-slate-700 tw:border-gray-200`}
                    >
                      <div className='tw:flex tw:justify-between tw:items-center tw:gap-8'>
                        <div className='tw:flex-1'>
                          <h3 className='tw:text-sm tw:mb-2'>{t(`${setting.id}.name`)}</h3>
                          <p
                            className={`tw:text-sm tw:mb-2 tw:dark:text-slate-400 tw:text-gray-600`}
                          >
                            {t(`${setting.id}.description`)}
                          </p>
                          {setting.requiresRestart && (
                            <p className='tw:text-sm tw:mt-2 tw:text-amber-500'>
                              {t('requiresRestart')}
                            </p>
                          )}
                          {!setting.isEditable && (
                            <p className='tw:text-sm tw:mt-2 tw:text-red-500'>{t('uneditable')}</p>
                          )}
                        </div>

                        <div className='tw:flex tw:items-center tw:ml-4'>
                          {setting.selectList ? (
                            <SelectBox
                              id={setting.id}
                              value={localSettings[setting.id] ?? setting.defaultValue}
                              options={setting.selectList}
                              onChange={(value) => {
                                handleSettingChange(setting.id, value)
                              }}
                              disabled={
                                !setting.isEditable ||
                                (activeCategory === 'capture' &&
                                  setting.id !== 'autoCaptureMode' &&
                                  !settingData.autoCaptureMode) ||
                                (activeCategory === 'autoStart' &&
                                  setting.id !== 'autoStartGame' &&
                                  !settingData.autoStartGame) ||
                                (setting.id === 'font' &&
                                  globalDictionary.settingDictionary.font.getEditableState &&
                                  !globalDictionary.settingDictionary.font.getEditableState(
                                    settingData.language,
                                  ))
                              }
                              theme={theme}
                            />
                          ) : setting.isFile ? (
                            <FileSelector
                              value={localSettings[setting.id] ?? setting.defaultValue}
                              onChange={(value) => {
                                handleSettingChange(setting.id, value)
                              }}
                              disabled={
                                !setting.isEditable ||
                                (activeCategory === 'capture' &&
                                  setting.id !== 'autoCaptureMode' &&
                                  !settingData.autoCaptureMode) ||
                                (activeCategory === 'autoStart' &&
                                  setting.id !== 'autoStartGame' &&
                                  !settingData.autoStartGame) ||
                                (setting.id === 'font' &&
                                  globalDictionary.settingDictionary.font.getEditableState &&
                                  !globalDictionary.settingDictionary.font.getEditableState(
                                    settingData.language,
                                  ))
                              }
                              theme={theme}
                            />
                          ) : (
                            <ToggleSwitch
                              value={localSettings[setting.id] ?? setting.defaultValue}
                              onChange={(value) => {
                                handleSettingChange(setting.id, value)
                              }}
                              activeCategory={activeCategory}
                              disabled={
                                !setting.isEditable ||
                                (activeCategory === 'capture' &&
                                  setting.id !== 'autoCaptureMode' &&
                                  !settingData.autoCaptureMode) ||
                                (activeCategory === 'autoStart' &&
                                  setting.id !== 'autoStartGame' &&
                                  !settingData.autoStartGame) ||
                                (setting.id === 'font' &&
                                  globalDictionary.settingDictionary.font.getEditableState &&
                                  !globalDictionary.settingDictionary.font.getEditableState(
                                    settingData.language,
                                  ))
                              }
                              theme={theme}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}

                {/* 앱 재시작 버튼 (일반 카테고리일 때만 표시) */}
                {activeCategory === 'general' && (
                  <div
                    className={`tw:pt-4 tw:border-t tw:dark:border-slate-700 tw:border-gray-200`}
                  >
                    <div className='tw:flex tw:flex-col tw:gap-4'>
                      <button
                        onClick={() => {
                          window.electron.restartApp()
                        }}
                        className={`tw:px-4 tw:py-2 tw:rounded-lg tw:transition-colors tw:font-medium tw:flex tw:justify-center tw:items-center tw:gap-2 tw:cursor-pointer tw:duration-300 tw:bg-indigo-600 tw:hover:bg-indigo-700 tw:text-white`}
                      >
                        <Icon icon='lucide:refresh-cw' className='tw:w-4 tw:h-4' />
                        {t('restartApp')}
                      </button>

                      <div className='tw:mt-4 tw:text-xs tw:opacity-70 tw:text-center'>
                        <p className='tw:mb-1'>{globalDictionary.version}</p>
                        <p className='tw:whitespace-pre-line'>{t('copyright')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
