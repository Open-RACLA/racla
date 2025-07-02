import { AppModule, winstonConfig } from './app.module'

import { ElectronIpcTransport } from '@doubleshot/nest-electron'
import { NestFactory } from '@nestjs/core'
import type { MicroserviceOptions } from '@nestjs/microservices'
import { app, BrowserWindow } from 'electron'
import { WinstonModule } from 'nest-winston'

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

async function electronAppInit() {
  const isDev = !app.isPackaged
  
  // 중복 실행 방지
  const gotTheLock = app.requestSingleInstanceLock()
  
  if (!gotTheLock) {
    app.quit()
    return false
  }
  
  app.on('second-instance', (_, __, ___) => {
    const windows = BrowserWindow.getAllWindows()
    if (windows.length > 0) {
      const mainWindow = windows[0]
      if (mainWindow.isMinimized()) mainWindow.restore()
      if (!mainWindow.isVisible()) mainWindow.show()
      mainWindow.focus()
    }
  })
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  if (isDev) {
    if (process.platform === 'win32') {
      process.on('message', (data) => {
        if (data === 'graceful-exit') app.quit()
      })
    } else {
      process.on('SIGTERM', () => {
        app.quit()
      })
    }
  }

  await app.whenReady()
  return true
}

async function bootstrap() {
  try {
    const shouldContinue = await electronAppInit()
    if (!shouldContinue) return

    const nestApp = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
      strategy: new ElectronIpcTransport('IpcTransport'),
      logger: WinstonModule.createLogger(winstonConfig),
    })

    await nestApp.listen()
  } catch (error) {
    console.error('Bootstrap error:', error)
    app.quit()
  }
}

void bootstrap()
