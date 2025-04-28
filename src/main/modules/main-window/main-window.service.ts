import { Injectable, Logger } from '@nestjs/common'
import { BrowserWindow, Menu, Tray, app, nativeImage } from 'electron'
import * as path from 'path'
import { FileManagerService } from '../file-manager/file-manager.service'

@Injectable()
export class MainWindowService {
  private readonly mainWindow: BrowserWindow
  private tray: Tray | null = null
  private readonly logger = new Logger(MainWindowService.name)

  constructor(private readonly fileManagerService: FileManagerService) {
    this.mainWindow = BrowserWindow.getAllWindows()[0]
    this.setupTray()
  }

  onClosed(callback: () => void | Promise<void>) {
    this.mainWindow.on('closed', callback)
  }

  getWindow() {
    return this.mainWindow
  }

  private setupTray() {
    try {
      // 앱이 패키징되었는지 확인
      const iconPath = app.isPackaged
        ? path.join(__dirname + '/../../resources/', 'icon-tray.ico')
        : path.join(__dirname + '/../../resources/', 'icon-tray.ico')

      // 아이콘 생성
      const trayIcon = nativeImage.createFromPath(iconPath)

      // 트레이 생성
      this.tray = new Tray(trayIcon)

      // 툴팁 설정
      const settings = this.fileManagerService.loadSettings()
      this.tray.setToolTip(
        settings.language === 'ko_KR' ? 'RACLA 데스크톱 앱' : 'RACLA for Desktop',
      )

      // 컨텍스트 메뉴 설정
      const contextMenu = Menu.buildFromTemplate([
        {
          label: settings.language === 'ko_KR' ? 'RACLA 데스크톱 앱' : 'RACLA for Desktop',
          enabled: false, // 클릭 불가능한 텍스트로 설정
        },
        { type: 'separator' }, // 구분선 추가
        {
          label: settings.language === 'ko_KR' ? '앱 열기' : 'Open App',
          click: () => {
            if (!this.mainWindow.isVisible()) {
              this.mainWindow.show()
            }
          },
        },
        {
          label: settings.language === 'ko_KR' ? '종료' : 'Exit',
          click: () => {
            if (this.mainWindow) {
              // 트레이에서 종료 시 hideToTray 설정 무시하고 완전히 종료
              this.mainWindow.destroy()
              app.quit()
            }
          },
        },
      ])

      this.tray.setContextMenu(contextMenu)

      // 트레이 아이콘 클릭 시 창 표시/숨김 토글
      this.tray.on('click', () => {
        if (this.mainWindow) {
          if (this.mainWindow.isVisible()) {
            this.mainWindow.hide()
          } else {
            this.mainWindow.show()
          }
        }
      })
    } catch (error) {
      this.logger.error('트레이 설정 중 오류 발생:', error)
    }
  }

  // 창이 트레이로 최소화될 때 호출
  minimizeToTray() {
    if (this.mainWindow) {
      this.mainWindow.hide()
    }
  }

  // 트레이에서 창을 복원
  restoreFromTray() {
    if (this.mainWindow) {
      this.mainWindow.show()
    }
  }
}
