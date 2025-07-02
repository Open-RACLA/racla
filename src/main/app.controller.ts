import { IpcHandle } from '@doubleshot/nest-electron'
import { Controller } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @IpcHandle('app:restart')
  restartApp(): void {
    this.appService.restartApp()
  }

  @IpcHandle('app:focus-window')
  focusWindow(): void {
    this.appService.showAndFocusWindow()
  }
}
