import { Icon } from '@iconify/react'
import { RootState } from '@render/store'
import { setSettingData } from '@render/store/slices/appSlice'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

// 하드코딩된 업데이트 내역 데이터 (배열로 변경)
const UPDATE_NOTES = [
  {
    version: 'V0.8.5',
    date: '2025-05-05',
    notes: [
      {
        category: '추가',
        items: [
          '설정 (자동 저장) - 캡처 이미지 자동 저장 기능이 추가되었습니다.',
          '게임 (DJMAX RESPECT V) - 신규 DLC 곡 지원이 추가되었습니다.',
        ],
      },
      {
        category: '개선',
        items: ['UI 성능 - 대시보드 화면 로딩 속도 개선', '안정성 - 메모리 사용량 최적화'],
      },
      {
        category: '수정',
        items: ['CDN - 이미지 리소스 로딩에 실패하는 버그를 수정하였습니다.'],
      },
    ],
  },
  {
    version: 'V0.8.4',
    date: '2025-05-18',
    notes: [
      {
        category: '추가',
        items: [
          '설정 (테마 변경) - 라이트 모드가 추가되었습니다.',
          '설정 (다국어 지원) - Claude Sonnet 3.7 기반의 다국어 지원 기능이 추가되었습니다. (영어, 일본어)',
          '설정 (저장 공간) - RACLA를 이용하면서 저장된 캡처 이미지나 로그 파일을 효율적으로 관리할 수 있도록 기능이 추가되었습니다.',
          '설정 (자동 캡처 모드) - 일부 게임에서 결과창 표시까지 중간 애니메이션이 다수 포함되어 부정확하게 인식되는 문제를 해결하기 위해 캡처 대기 시간 옵션이 추가되었습니다.',
          '게임 (기록 등록) - 기록 등록 시 여러 장의 이미지를 순차적으로 등록할 수 있도록 기능이 추가되었습니다.',
          '게임 (기록 등록) - 자동 캡처 및 수동 캡처로 등록된 결과를 확인할 수 있도록 기능이 추가되었습니다.',
        ],
      },
      {
        category: '개선',
        items: [
          '성능 최적화 - Next.js 기반에서 Vite, NestJS 기반으로 변경하여 성능 최적화',
          '성능 최적화 - 자동 캡처 모드 알고리즘 개선',
          '사용자 환경 최적화 - 모든 화면의 UI/UX 개선 및 불필요한 화면 구성 요소 제거',
          '기능 개선 (DJMAX RESPECT V) - 자동 및 수동 캡처를 이용한 기록 등록 시 클라이언트에서 처리되던 V-ARCHIVE 기록 갱신 내용을 서버에서 처리하도록 변경',
        ],
      },
      {
        category: '수정',
        items: [
          '자동 캡처 모드 (DJMAX RESPECT V) - 래더 화면에서 발생하는 버그가 다수 존재하여 일시적으로 자동 캡처 모드 지원 목록에서 일시적으로 제거되었습니다.',
          '게임 (DJMAX RESPECT V) - 유틸리티 탭에 다른 창작자분들게서 운영/개발해주시는 유용한 도구 중 일부 내용을 수정하였습니다.',
          '게임 (PLATiNA :: LAB) - 데이터베이스 탭에서 수기로 기록을 추가할 때 저장되지 않는 버그를 수정하였습니다.',
          '(0.8.1 추가) 마이그레이션 - 기존 0.7.17 이하의 데스크톱 앱 사용자의 설정 파일을 불러오지 못해 언어 데이터가 누락되는 버그를 수정하였습니다.',
          '(0.8.2 추가) 자동 업데이트 - 업데이트 알림이 잘못 제공되는 버그를 수정하였습니다.',
          '(0.8.3 추가) CDN - 이미지 리소스 로딩에 실패하는 버그를 수정하였습니다.',
          '(0.8.4 추가) 자동 업데이트 - 업데이트 진행도 사항이 정확하게 제공되지 않는 버그를 수정하였습니다.',
        ],
      },
    ],
  },
]

interface UpdateModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UpdateModal({ isOpen, onClose }: UpdateModalProps) {
  const dispatch = useDispatch()
  const { settingData } = useSelector((state: RootState) => state.app)
  const { t } = useTranslation(['common'])
  const [isAnimating, setIsAnimating] = useState(false)

  // ESC 키를 누르면 모달을 닫음
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeModal()
      }
    }

    window.addEventListener('keydown', handleEscKey)
    return () => {
      window.removeEventListener('keydown', handleEscKey)
    }
  }, [isOpen])

  // 모달이 열릴 때 애니메이션 상태 설정
  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true)
      const timer = setTimeout(() => {
        setIsAnimating(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 모달 닫기 함수
  const closeModal = () => {
    // 업데이트 확인 상태를 true로 변경
    const newSettings = {
      ...settingData,
      isCheckedForUpdate: true,
    }

    // Redux 스토어 업데이트
    dispatch(setSettingData(newSettings))

    // 설정 저장
    if (window.electron?.saveSettings) {
      window.electron.saveSettings(newSettings)
    }

    // 모달 닫기
    onClose()
  }

  // 카테고리별 아이콘 매핑
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '추가':
        return 'lucide:plus-circle'
      case '개선':
        return 'lucide:arrow-up-right'
      case '수정':
        return 'lucide:check-circle'
      default:
        return 'lucide:info'
    }
  }

  // 카테고리별 색상 매핑
  const getCategoryColor = (category: string) => {
    switch (category) {
      case '추가':
        return 'tw:text-green-500 tw:dark:text-green-400'
      case '개선':
        return 'tw:text-blue-500 tw:dark:text-blue-400'
      case '수정':
        return 'tw:text-amber-500 tw:dark:text-amber-400'
      default:
        return 'tw:text-gray-500 tw:dark:text-gray-400'
    }
  }

  return (
    <div
      className={`tw:fixed tw:inset-0 tw:z-[99999999] tw:flex tw:items-center tw:justify-center tw:transition-all tw:duration-300 ${
        isOpen ? 'tw:opacity-100' : 'tw:opacity-0 tw:pointer-events-none'
      }`}
    >
      {/* 배경 오버레이 */}
      <div
        className={`tw:fixed tw:inset-0 tw:bg-black tw:transition-opacity tw:duration-300 ${
          isOpen ? 'tw:opacity-60' : 'tw:opacity-0'
        }`}
        onClick={closeModal}
      />

      {/* 모달 내용 */}
      <div
        className={`tw:relative tw:bg-white tw:dark:bg-slate-800 tw:rounded-xl tw:shadow-2xl tw:w-full tw:max-w-2xl tw:max-h-[90vh] tw:flex tw:flex-col tw:transition-all tw:duration-300 tw:dark:text-slate-200 tw:text-gray-800 ${
          isOpen && !isAnimating
            ? 'tw:translate-y-0 tw:opacity-100'
            : 'tw:translate-y-4 tw:opacity-0'
        }`}
      >
        {/* 모달 헤더 */}
        <div className='tw:py-4 tw:px-6 tw:border-b tw:dark:border-slate-700 tw:border-gray-200 tw:flex tw:justify-between tw:items-center'>
          <div className='tw:flex tw:items-center tw:gap-2'>
            <Icon icon='lucide:info' className='tw:w-5 tw:h-5 tw:text-indigo-500' />
            <h2 className='tw:text-lg tw:font-bold'>{t('update.newVersion')}</h2>
          </div>
          <button
            onClick={closeModal}
            className='tw:p-2 tw:rounded-full tw:transition-colors tw:dark:hover:bg-slate-700 tw:hover:bg-gray-200'
          >
            <Icon icon='lucide:x' className='tw:w-5 tw:h-5' />
          </button>
        </div>

        {/* 모달 본문 */}
        <div className='tw:flex-1 tw:p-6 tw:overflow-y-auto tw:custom-scrollbar'>
          {/* 업데이트 내역 반복 (버전별) */}
          <div className='tw:space-y-10'>
            {UPDATE_NOTES.map((updateNote, noteIndex) => (
              <div
                key={noteIndex}
                className='tw:pb-6 tw:border-b tw:border-gray-200 tw:dark:border-slate-700 last:tw:border-0 last:tw:pb-0'
              >
                {/* 버전 정보 */}
                <div className='tw:mb-6 tw:text-center'>
                  <h3 className='tw:text-2xl tw:font-bold tw:text-indigo-600 tw:dark:text-indigo-400 tw:mb-2'>
                    {updateNote.version}
                  </h3>
                  <p className='tw:text-sm tw:text-gray-500 tw:dark:text-gray-400'>
                    {updateNote.date}
                  </p>
                </div>

                {/* 카테고리별 업데이트 내역 */}
                <div className='tw:space-y-6'>
                  {updateNote.notes.map((section, sectionIndex) => (
                    <div
                      key={sectionIndex}
                      className='tw:bg-gray-50 tw:dark:bg-slate-700/50 tw:rounded-lg tw:p-4 tw:shadow-sm'
                    >
                      <div className='tw:flex tw:items-center tw:gap-2 tw:mb-3'>
                        <Icon
                          icon={getCategoryIcon(section.category)}
                          className={`tw:w-5 tw:h-5 ${getCategoryColor(section.category)}`}
                        />
                        <h4
                          className={`tw:font-medium tw:text-base ${getCategoryColor(section.category)}`}
                        >
                          {section.category}
                        </h4>
                      </div>
                      <ul className='tw:space-y-2 tw:ml-7'>
                        {section.items.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className='tw:text-sm tw:flex tw:items-start tw:gap-2 tw:dark:text-slate-300 tw:text-gray-700'
                          >
                            <span className='tw:inline-block tw:w-1.5 tw:h-1.5 tw:rounded-full tw:bg-indigo-500 tw:dark:bg-indigo-400 tw:mt-1.5 tw:flex-shrink-0'></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 모달 푸터 */}
        <div className='tw:p-4 tw:border-t tw:dark:border-slate-700 tw:border-gray-200 tw:flex tw:justify-center'>
          <button
            onClick={closeModal}
            className='tw:px-6 tw:py-2 tw:bg-indigo-600 tw:hover:bg-indigo-700 tw:text-white tw:rounded-lg tw:text-sm tw:font-medium tw:transition-colors tw:flex tw:items-center tw:gap-2'
          >
            <Icon icon='lucide:check' className='tw:w-4 tw:h-4' />
            {t('update.confirmAndDontShowAgain')}
          </button>
        </div>
      </div>
    </div>
  )
}
