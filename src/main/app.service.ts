import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common'
import dayjs from 'dayjs'
import { BrowserWindow, app, globalShortcut } from 'electron'
import { FileManagerService } from './modules/file-manager/file-manager.service'
import { ImageProcessorService } from './modules/image-processor/image-processor.service'
import { MainWindowService } from './modules/main-window/main-window.service'
import { OcrManagerService } from './modules/ocr-manager/ocr-manager.service'
import { OverlayWindowService } from './modules/overlay-window/overlay-window.service'

@Injectable()
export class AppService implements OnApplicationBootstrap {
  private mainWindow: BrowserWindow
  private readonly logger = new Logger(AppService.name)

  constructor(
    private readonly overlayWindowService: OverlayWindowService,
    private readonly ocrManagerService: OcrManagerService,
    private readonly imageProcessorService: ImageProcessorService,
    private readonly fileManagerService: FileManagerService,
    private readonly mainWindowService: MainWindowService,
  ) {
    // ElectronModule에서 생성된 window 참조 가져오기
    this.mainWindow = BrowserWindow.getAllWindows()[0]
  }

  async onApplicationBootstrap() {
    this.logger.log('Application bootstrapped')

    // 앱 ID 설정
    app.setAppUserModelId('Open-RACLA')

    // 글로벌 단축키 등록
    const isRegistered = globalShortcut.register('Alt+Insert', async () => {
      this.logger.debug('Alt+Insert shortcut pressed')
      const session = this.fileManagerService.loadSession()
      const settings = this.fileManagerService.loadSettings()

      if (!session.playerId || !session.playerToken) {
        this.logger.error('Player ID or Player Name is not set')
        return
      }

      this.overlayWindowService.sendMessage(
        JSON.stringify({
          type: 'notification',
          notificationType: 'info',
          mode: 'i18n',
          message: 'pressedAltInsert',
        }),
      )

      const response = await this.ocrManagerService.getOcrResultServerWithoutGameWindow()
      this.logger.debug(`OCR Result: ${response.result}`)

      if (response.result.isVerified) {
        const overlayWindow = await this.overlayWindowService.getOverlayWindow()
        if (overlayWindow) {
          overlayWindow.webContents.send('overlay-ocr-result', response.result)
        }

        const mainWindow = this.mainWindowService.getWindow()
        if (mainWindow) {
          mainWindow.webContents.send('main-window-ocr-result', response.result)
        }

        if (settings.saveImageWhenCapture) {
          const maskingRegions = this.imageProcessorService.getMaskingRegions(
            response.result.gameCode,
            response.result.screenType,
          )

          const maskedImage = await this.imageProcessorService.applyProfileMask(
            response.image,
            maskingRegions,
            settings.saveImageBlurMode,
          )
          const filePath = this.fileManagerService.saveImage(
            maskedImage,
            `${String(
              `${String(response.result.gameCode).toUpperCase()} - ${response.result.songData.name} - ${response.result.button}B - ${response.result.pattern} - ${response.result.score} - ${dayjs().format('YYYY-MM-DD-HH-mm-ss')}`,
            )
              .replaceAll(':', '_')
              .replaceAll('\n', '')
              .replaceAll('\\', '_')
              .replaceAll('/', '_')
              .replaceAll('?', '_')
              .replaceAll('*', '_')
              .replaceAll('"', '_')
              .replaceAll('<', '_')
              .replaceAll('>', '_')
              .replaceAll('|', '_')}.png`,
          )

          this.overlayWindowService.sendMessage(
            JSON.stringify({
              type: 'notification',
              notificationType: 'success',
              message: 'successSavedImage',
              props: {
                filePath,
              },
              mode: 'i18n',
            }),
          )
        }
      } else {
        this.logger.error('OCR Result is not verified')
      }
    })

    if (!isRegistered) {
      this.logger.error('Global shortcut registration failed')
    } else {
      this.logger.log('Global shortcut registered successfully')
    }

    // 메인 윈도우가 닫히기 직전에 오버레이 제거
    this.mainWindow?.on('close', () => {
      try {
        this.overlayWindowService.destroyOverlay()
      } catch (error) {
        console.error('오버레이 제거 중 오류 발생:', error)
      }
    })
  }

  /**
   * 애플리케이션을 재시작합니다.
   */
  restartApp(): void {
    app.relaunch()
    app.exit(0)
  }

  /**
   * 메인 윈도우를 표시하고 포커스합니다.
   */
  showAndFocusWindow(): void {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore()
      }
      if (!this.mainWindow.isVisible()) {
        this.mainWindow.show()
      }
      this.mainWindow.focus()
      this.logger.log('Main window focused')
    } else {
      this.logger.error('Main window not found')
    }
  }

  getHello(): string {
    return `Hello World! App version: ${app.getVersion()}`
  }
}
