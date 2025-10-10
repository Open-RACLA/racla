import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { PlayData } from '@src/types/games/PlayData'
import { Client } from 'discord-rpc'
import dotenv from 'dotenv'
import { app } from 'electron'

@Injectable()
export class DiscordManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DiscordManagerService.name)
  private client: Client
  private isConnected = false
  private startTimestamp: number | null = null

  constructor() {
    this.client = new Client({ transport: 'ipc' })
    this.setupEventHandlers()
    dotenv.config({ path: !app.isPackaged ? '.env.development' : '.env.production' })
  }

  onModuleInit() {
    this.logger.log('Discord Manager module initialized')
  }

  onModuleDestroy() {
    this.destroy()
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      this.isConnected = true
      this.logger.log('Discord RPC Connected')
    })

    this.client.on('disconnected', () => {
      this.isConnected = false
      this.logger.log('Discord RPC Disconnected')
    })
  }

  async initialize(): Promise<void> {
    try {
      await this.client.login({ clientId: process.env.DISCORD_CLIENT_ID })
      this.startTimestamp = Date.now()
      await this.updatePresence()
    } catch (error) {
      this.logger.error('Discord RPC initialization failed:', error)
    }
  }

  async updatePresence(gameData?: PlayData): Promise<void> {
    if (!this.isConnected) return

    try {
      if (gameData) {
        await this.client.setActivity({
          details: `${
            gameData.gameCode === 'djmax_respect_v'
              ? 'DMRV'
              : gameData.gameCode === 'platina_lab'
                ? 'PLATiNA :: LAB'
                : gameData.gameCode === 'ez2on'
                  ? 'EZ2ON REBOOT : R'
                  : null
          } - ${gameData.songName}`,
          state: `${String(gameData.button).replace('B', '')}B | ${gameData.pattern}${gameData.level && gameData.gameCode === 'platina_lab' ? ` Lv.${gameData.level})` : ''} | ${gameData.score.toFixed(2)}% ${gameData.max && gameData.score == 100 ? (gameData.max == 0 ? 'MAX' : `MAX-${gameData.max}`) : ''} ${gameData.maxCombo && gameData.score !== 100 && gameData.gameCode != 'platina_lab' ? '(MAX COMBO)' : ''}`,
          largeImageKey: 'racla_char',
          largeImageText: 'Open-RACLA for Desktop (Vite)',
          startTimestamp: this.startTimestamp,
        })
      } else {
        await this.setDefaultPresence()
      }
    } catch (error) {
      this.logger.error('Failed to update Discord presence:', error)
    }
  }

  private async setDefaultPresence(): Promise<void> {
    await this.client.setActivity({
      details: 'Open-RACLA for Desktop (Vite)',
      largeImageKey: 'racla_char',
      largeImageText: 'Open-RACLA for Desktop (Vite)',
      startTimestamp: this.startTimestamp ?? Date.now(),
    })
  }

  destroy(): void {
    if (this.isConnected) {
      this.client.destroy()
      this.isConnected = false
    }
  }
}
