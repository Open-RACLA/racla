import { Injectable, Logger } from '@nestjs/common'
import { AppUpdater, autoUpdater } from 'electron-updater'
import { FileManagerService } from '../file-manager/file-manager.service'
import { MainWindowService } from '../main-window/main-window.service'
@Injectable()
export class UpdateManagerService {
  private readonly logger = new Logger(UpdateManagerService.name)
  private readonly autoUpdater: AppUpdater
  private latestVersion: string

  constructor(
    private readonly mainWindowService: MainWindowService,
    private readonly fileManagerService: FileManagerService,
  ) {
    this.autoUpdater = autoUpdater
  }

  initialize(): void {
    this.logger.log('Initializing update manager...')

    const mainWindow = this.mainWindowService.getWindow()
    if (!mainWindow) {
      this.logger.error('메인 윈도우가 없어 업데이트 관리자 초기화를 건너뜁니다.')
      return
    }

    // 설정 불러오기
    const settings = this.fileManagerService.loadSettings()
    this.logger.log(`현재 autoUpdate 설정: ${settings.autoUpdate}`)

    // 이벤트 리스너가 이미 등록됐는지 확인하는 플래그
    let hasSetupEventListeners = false

    // 자동 업데이트가 활성화된 경우에만 업데이트 확인
    if (settings.autoUpdate) {
      try {
        // 안전하게 autoUpdater 이벤트 리스너를 설정하는 함수
        const setupEventListeners = () => {
          if (hasSetupEventListeners) {
            this.logger.warn('이벤트 리스너가 이미 등록되어 있습니다. 중복 등록 방지')
            return
          }

          // 에러 이벤트 핸들러 추가
          this.autoUpdater.on('error', (error) => {
            this.logger.error(`업데이트 오류: ${error?.message || '알 수 없는 오류'}`)
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('update-error', error?.message || '알 수 없는 오류')
            }
          })

          // 업데이트 가용 시 버전 정보를 렌더러 프로세스로 전송
          this.autoUpdater.on('update-available', (info) => {
            this.logger.log(`업데이트 가능: ${JSON.stringify(info)}`)

            // 버전 정보 저장
            const updateVersion = info.version
            this.logger.log(`업데이트 버전: ${updateVersion}`)

            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('update-available', updateVersion)

              // 다음 진행 상황 이벤트에 사용하기 위해 버전 정보 저장
              this.latestVersion = updateVersion
            } else {
              this.logger.warn(
                '메인 윈도우가 없거나 파괴되어 update-available 메시지를 보낼 수 없습니다.',
              )
            }
          })

          // 다운로드 진행 상황을 렌더러 프로세스로 전송
          this.autoUpdater.on('download-progress', (progress) => {
            this.logger.debug(`업데이트 다운로드 진행 상황: ${JSON.stringify(progress)}`)
            if (mainWindow && !mainWindow.isDestroyed()) {
              const progressData = {
                percent: progress.percent || 0,
                transferred: progress.transferred || 0,
                total: progress.total || 0,
                // 저장된 버전 정보 사용
                version: this.latestVersion,
              }
              mainWindow.webContents.send('download-progress', progressData)
            } else {
              this.logger.warn(
                '메인 윈도우가 없거나 파괴되어 download-progress 메시지를 보낼 수 없습니다.',
              )
            }
          })

          // 업데이트 다운로드 완료 시 렌더러 프로세스로 이벤트 전송
          this.autoUpdater.on('update-downloaded', (info) => {
            this.logger.log(`업데이트 다운로드 완료: ${JSON.stringify(info)}`)
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('update-downloaded', info.version)
              // 설정 업데이트
              const currentSettings = this.fileManagerService.loadSettings()
              this.fileManagerService.saveSettings({
                ...currentSettings,
                isCheckedForUpdate: false,
              })
              this.logger.log('업데이트 후 설정 저장 완료')
            } else {
              this.logger.warn(
                '메인 윈도우가 없거나 파괴되어 update-downloaded 메시지를 보낼 수 없습니다.',
              )
            }
          })

          // 이벤트 리스너 설정 완료 플래그
          hasSetupEventListeners = true
          this.logger.log('모든 업데이트 이벤트 리스너 등록 완료')
        }

        // 이벤트 리스너 설정
        setupEventListeners()

        // 업데이트 확인 및 알림 설정
        this.logger.log('업데이트 확인 시작...')
        this.autoUpdater.checkForUpdatesAndNotify({
          title: 'Open-RACLA 데스크톱 앱 업데이트가 준비되었습니다.',
          body: '업데이트를 적용하기 위해 앱을 종료하고 다시 실행해주세요.',
        })
        this.logger.log('업데이트 확인 요청 완료')
      } catch (error) {
        this.logger.error(`업데이트 매니저 초기화 중 오류 발생: ${error.message}`)
      }
    } else {
      this.logger.log('자동 업데이트가 설정에서 비활성화되어 있습니다.')
    }
  }

  // 업데이트 설치 및 앱 재시작
  quitAndInstall(): void {
    this.logger.log('Installing update and restarting app...')
    autoUpdater.quitAndInstall()
  }
}
