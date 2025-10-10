import '@render/App.css'

import { useEffect, useState } from 'react'

import Image from '@render/components/image/Image'
import { createLog } from '@render/libs/logger'
import type { LogLevel } from '@src/types/dto/log/LogLevel'
import { Buffer } from 'buffer'

const {
  sendMsg: sendMsgToMainProcess,
  getActiveWindows,
  createOverlay,
  closeOverlay,
  sendToOverlay,
  getProcessList,
  captureGameWindow,
} = window.electron

const electronActions = {
  captureGame: async () => {
    const image = await captureGameWindow('DJMAX RESPECT V')
    return image
  },

  createLog: (type: LogLevel, message: string) => {
    createLog(type, message)
  },
}

function CheatsheetPage() {
  const [activeCategory, setActiveCategory] = useState('process')
  const [searchTerm, setSearchTerm] = useState('')
  const [image, setImage] = useState<Buffer | null>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    if (image) {
      setImage(null)
    }
  }, [text])

  const electronCheatSheet = {
    process: [
      {
        title: 'getProcessList()',
        description: '실행 중인 프로세스 목록을 가져옵니다',
        example: 'const processes = await getProcessList()',
        usage: async () => {
          try {
            const processes = await getProcessList()
            setText(JSON.stringify(processes))
          } catch (error) {
            createLog('error', '프로세스 목록 가져오기 실패:', error.message)
          }
        },
      },
      {
        title: 'getActiveWindows()',
        description: '현재 활성화된 윈도우 목록을 가져옵니다',
        example: 'const activeWindows = await getActiveWindows()',
        usage: async () => {
          try {
            const activeWindows = await getActiveWindows()
            setText(JSON.stringify(activeWindows))
          } catch (error) {
            createLog('error', '활성 윈도우 가져오기 실패:', error.message)
          }
        },
      },
    ],
    overlay: [
      {
        title: 'createOverlay()',
        description: '새로운 오버레이 윈도우를 생성합니다',
        example: 'await createOverlay()',
        usage: async () => {
          try {
            await createOverlay()
            createLog('debug', '오버레이가 생성되었습니다')
          } catch (error) {
            createLog('error', '오버레이 생성 실패:', error.message)
          }
        },
      },
      {
        title: 'closeOverlay()',
        description: '오버레이 윈도우를 닫습니다',
        example: 'await closeOverlay()',
        usage: async () => {
          await closeOverlay()
          createLog('debug', '오버레이가 닫혔습니다')
        },
      },
      {
        title: 'sendToOverlay()',
        description: '오버레이 윈도우로 메시지를 전송합니다',
        example: `await sendToOverlay(JSON.stringify({
        type: 'message',
        data: 'test message'
      }))`,
        usage: async () => {
          try {
            await sendToOverlay(
              JSON.stringify({
                type: 'message',
                data: 'test message',
              }),
            )
            createLog('debug', '오버레이로 메시지 전송됨')
          } catch (error) {
            createLog('error', '오버레이 메시지 전송 실패:', error.message)
          }
        },
      },
    ],
    communication: [
      {
        title: 'sendMsgToMainProcess()',
        description: '메인 프로세스로 메시지를 전송합니다',
        example: 'const response = await sendMsgToMainProcess("Hello")',
        usage: async () => {
          try {
            const response = await sendMsgToMainProcess('테스트 메시지')
            setText(response)
          } catch (error) {
            createLog('error', '메시지 전송 실패:', error.message)
          }
        },
      },
      {
        title: 'createLog()',
        description: '로그를 생성합니다',
        example: 'createLog("info", "로그 메시지")',
        usage: () => {
          electronActions.createLog('info', '로그 메시지')
        },
      },
      {
        title: 'createLog() - Error',
        description: '에러 로그를 생성합니다',
        example: 'createLog("error", "에러 메시지")',
        usage: () => {
          electronActions.createLog('error', '에러 메시지')
        },
      },
    ],
    capture: [
      {
        title: 'captureGameWindow()',
        description: '게임 윈도우를 캡처합니다',
        example: 'const image = await captureGameWindow("DJMAX RESPECT V")',
        usage: async () => {
          const image = await electronActions.captureGame()
          setImage(image)
          createLog('debug', '게임 윈도우 캡처 완료')
        },
      },
    ],
  }

  const categories = Object.keys(electronCheatSheet)

  const filteredFunctions = electronCheatSheet[
    activeCategory as keyof typeof electronCheatSheet
  ].filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className='tw:container tw:mx-auto tw:p-8'>
      <div className='tw:flex tw:items-center tw:gap-4 tw:mb-8'>
        <h1 className='tw:text-3xl tw:font-bold'>Open-RACLA API Cheat Sheet</h1>
      </div>

      <div className='tw:mb-6'>
        <input
          type='text'
          placeholder='함수나 설명 검색...'
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
          }}
          className='tw:w-full tw:px-4 tw:py-2 tw:rounded-lg tw:border tw:border-gray-300 tw:focus:ring-2 tw:focus:ring-blue-500'
        />
      </div>

      <div className='tw:flex tw:gap-4'>
        <div>
          {image && (
            <Image
              src={`data:image/png;base64,${Buffer.from(image).toString('base64')}`}
              alt='게임 윈도우 캡처'
              className='tw:w-full tw:h-auto'
            />
          )}
          <pre className='tw:text-sm tw:font-mono tw:whitespace-pre-wrap'>{text}</pre>
        </div>
        <div className='tw:container tw:mx-auto'>
          <div className='tw:flex tw:gap-2 tw:mb-6'>
            {categories.map((category) => (
              <button
                type='button'
                key={category}
                onClick={() => {
                  setActiveCategory(category)
                }}
                className={`tw:px-4 tw:py-2 tw:rounded-lg ${
                  activeCategory === category
                    ? 'tw:bg-blue-500 tw:text-white'
                    : 'tw:bg-gray-200 tw:text-gray-700 tw:hover:bg-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          <div className='tw:grid tw:gap-6'>
            {filteredFunctions.map((item) => (
              <div
                key={item.title}
                className='tw:bg-white tw:dark:bg-gray-800 tw:rounded-lg tw:shadow-lg tw:p-6 tw:space-y-4'
              >
                <div className='tw:flex tw:justify-between tw:items-center'>
                  <h3 className='tw:text-xl tw:font-bold tw:text-blue-600'>{item.title}</h3>
                  <button
                    type='button'
                    onClick={() => {
                      item.usage()
                    }}
                    className='tw:px-4 tw:py-2 tw:bg-green-500 tw:text-white tw:rounded-lg tw:hover:bg-green-600'
                  >
                    실행하기
                  </button>
                </div>
                <p>{item.description}</p>
                <div className='tw:bg-gray-100 tw:dark:bg-gray-900 tw:p-4 tw:rounded-lg'>
                  <pre className='tw:text-sm tw:font-mono tw:whitespace-pre-wrap'>
                    {item.example}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheatsheetPage
