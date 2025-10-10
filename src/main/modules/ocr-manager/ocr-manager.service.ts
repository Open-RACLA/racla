import { GLOBAL_DICTONARY } from '@main/constants/GLOBAL_DICTONARY'
import { Injectable, Logger } from '@nestjs/common'
import { OcrPlayDataResponse } from '@src/types/dto/ocr/OcrPlayDataResponse'
import { ExtractedRegionsResult } from '@src/types/ocr/ExtractedRegionsResult'
import { OCRResultInfo } from '@src/types/ocr/OcrResultInfo'
import { SettingsData } from '@src/types/settings/SettingData'
import * as Tesseract from 'tesseract.js'
import { v4 as uuidv4 } from 'uuid'
import apiClient from '../../../libs/apiClient'
import { FileManagerService } from '../file-manager/file-manager.service'
import { ImageProcessorService } from '../image-processor/image-processor.service'
import { MainWindowService } from '../main-window/main-window.service'
import { OverlayWindowService } from '../overlay-window/overlay-window.service'

@Injectable()
export class OcrManagerService {
  private readonly logger = new Logger(OcrManagerService.name)
  private processingQueue: { image: Buffer; gameCode: string }[] = []
  private isProcessing = false

  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly fileManagerService: FileManagerService,
    private readonly overlayWindowService: OverlayWindowService,
    private readonly mainWindowService: MainWindowService,
  ) {}

  /**
   * 추출된 이미지에서 텍스트를 인식하는 메서드
   */
  async recognizeText(buffer: Buffer): Promise<string> {
    const worker = await Tesseract.createWorker('eng')
    try {
      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ',
      })

      const {
        data: { text },
      } = await worker.recognize(buffer)

      return text || ''
    } catch (error) {
      this.logger.error(`OCR 텍스트 인식 중 오류 발생: ${error.message}`)
      return ''
    } finally {
      if (worker) {
        try {
          await worker.terminate()
        } catch (error) {
          this.logger.error(`Tesseract 워커 종료 중 오류 발생: ${error.message}`)
        }
      }
    }
  }

  /**
   * 이미지에서 OCR 영역을 추출하고 텍스트를 인식하는 메서드
   */
  async extractRegions(
    gameCode: string,
    imageBuffer: Buffer,
    settings: SettingsData,
  ): Promise<ExtractedRegionsResult> {
    const regions: Record<string, Buffer> = {}
    const texts: Record<string, string> = {}

    if (gameCode.toLowerCase().includes('djmax')) {
      if (settings.autoCaptureDjmaxRespectVOcrResultRegion) {
        regions.result = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.djmax_respect_v.result,
        )
        texts.result = await this.recognizeText(regions.result)
      }

      // Versus 영역 추출 주석 처리, 구클라부터 문제가 잦게 발생하여 일시적으로 비활성화
      // if (settings.autoCaptureDjmaxRespectVOcrVersusRegion) {
      //   regions.versus = await this.imageProcessor.extractRegion(
      //     imageBuffer,
      //     this.ocrRegions.djmax_respect_v.versus,
      //   )
      //   texts.versus = await this.imageProcessor.recognizeText(regions.versus)
      // }

      if (settings.autoCaptureDjmaxRespectVOcrOpen3Region) {
        regions.open3 = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.djmax_respect_v.open3,
        )
        texts.open3 = await this.recognizeText(regions.open3)
      }

      if (settings.autoCaptureDjmaxRespectVOcrOpen2Region) {
        regions.open2 = await this.imageProcessor.extractRegion(
          imageBuffer,
          GLOBAL_DICTONARY.OCR_REGIONS.djmax_respect_v.open2,
        )
        texts.open2 = await this.recognizeText(regions.open2)
      }
    }
    // else if (gameCode.toLowerCase().includes('platina')) {
    //   if (settings.autoCapturePlatinaLabOcrResultRegion) {
    //     regions.result = await this.imageProcessor.extractRegion(
    //       imageBuffer,
    //       GLOBAL_DICTONARY.OCR_REGIONS.platina_lab.result,
    //     )
    //     texts.result = await this.recognizeText(regions.result)
    //   }
    // } else if (gameCode.toLowerCase().includes('ez2on')) {
    //   if (settings.autoCaptureEz2onOcrResultRegion) {
    //     regions.result = await this.imageProcessor.extractRegion(
    //       imageBuffer,
    //       GLOBAL_DICTONARY.OCR_REGIONS.ez2on.result,
    //     )
    //     texts.result = await this.recognizeText(regions.result)
    //   }
    // }

    return { regions, texts }
  }

  /**
   * 텍스트 분석을 통해 결과 화면인지 판단하는 메서드
   */
  determineResultScreen(
    gameCode: string,
    texts: Record<string, string>,
    settings: SettingsData,
  ): OCRResultInfo {
    const resultInfo: OCRResultInfo = {
      isResult: [],
      text: '',
      where: '',
      gameCode: '',
    }

    if (gameCode.toLowerCase().includes('djmax')) {
      if (settings.autoCaptureDjmaxRespectVOcrResultRegion && texts.result) {
        resultInfo.isResult = this.checkResultKeywords(
          texts.result,
          GLOBAL_DICTONARY.RESULT_KEYWORDS.djmax_respect_v.result,
        )
        if (resultInfo.isResult.length > 0) {
          resultInfo.where = 'result'
          resultInfo.text = texts.result
          resultInfo.gameCode = 'djmax_respect_v'
        }
      }

      // if (!resultInfo.where && settings.autoCaptureOcrVersusRegion && texts.versus) {
      //   if (texts.versus.trim().toUpperCase().replaceAll(' ', '') === 'RE') {
      //     resultInfo.where = 'versus'
      //     resultInfo.isResult = ['versus']
      //     resultInfo.text = texts.versus
      //   }
      // }

      if (!resultInfo.where && settings.autoCaptureDjmaxRespectVOcrOpen3Region && texts.open3) {
        const keywords = GLOBAL_DICTONARY.RESULT_KEYWORDS.djmax_respect_v.open3
        const normalizedText = texts.open3.trim().replaceAll(' ', '').toUpperCase()

        if (keywords.some((keyword) => normalizedText.includes(keyword))) {
          resultInfo.where = 'open3'
          resultInfo.isResult = ['open3']
          resultInfo.text = texts.open3
          resultInfo.gameCode = 'djmax_respect_v'
        }
      }

      if (!resultInfo.where && settings.autoCaptureDjmaxRespectVOcrOpen2Region && texts.open2) {
        const keywords = GLOBAL_DICTONARY.RESULT_KEYWORDS.djmax_respect_v.open2
        const normalizedText = texts.open2.trim().replaceAll(' ', '').toUpperCase()

        if (keywords.some((keyword) => normalizedText.includes(keyword))) {
          resultInfo.where = 'open2'
          resultInfo.isResult = ['open2']
          resultInfo.text = texts.open2
          resultInfo.gameCode = 'djmax_respect_v'
        }
      }
    }
    // else if (gameCode.toLowerCase().includes('platina')) {
    //   if (settings.autoCapturePlatinaLabOcrResultRegion && texts.result) {
    //     resultInfo.isResult = this.checkResultKeywords(
    //       texts.result,
    //       GLOBAL_DICTONARY.RESULT_KEYWORDS.platina_lab.result,
    //     )
    //     if (resultInfo.isResult.length > 0) {
    //       resultInfo.where = 'result'
    //       resultInfo.text = texts.result
    //       resultInfo.gameCode = 'platina_lab'
    //     }
    //   }
    // } else if (gameCode.toLowerCase().includes('ez2on')) {
    //   if (settings.autoCaptureEz2onOcrResultRegion && texts.result) {
    //     resultInfo.isResult = this.checkResultKeywords(
    //       texts.result,
    //       GLOBAL_DICTONARY.RESULT_KEYWORDS.ez2on.result,
    //     )
    //     if (resultInfo.isResult.length > 0) {
    //       resultInfo.where = 'result'
    //       resultInfo.text = texts.result
    //       resultInfo.gameCode = 'ez2on'
    //     }
    //   }
    // }

    return resultInfo
  }

  /**
   * 결과 화면 키워드 확인 메서드
   */
  private checkResultKeywords(text: string, keywords: string[]): string[] {
    return keywords.filter(
      (value) => text.toUpperCase().trim().includes(value) && text.length !== 0,
    )
  }

  public async getOcrResult(
    gameTitle: string,
    settingData: SettingsData,
  ): Promise<{
    resultInfo: OCRResultInfo
    extractedRegions: ExtractedRegionsResult
    image: Buffer
  }> {
    const image = await this.imageProcessor.captureGameWindow(gameTitle)
    const extractedRegions = await this.extractRegions(gameTitle, image, settingData)
    const resultInfo = this.determineResultScreen(gameTitle, extractedRegions.texts, settingData)

    return { resultInfo, extractedRegions, image }
  }

  public async getOcrResultServerWithoutGameWindow(): Promise<{
    image: Buffer
    result: OcrPlayDataResponse
  }> {
    const result = await this.imageProcessor.captureGameWindowWithoutGameWindow()
    if (result) {
      return {
        image: result.image,
        result: await this.getOcrResultServer(result.image, result.gameCode),
      }
    } else {
      this.logger.error('Menu Window Capture Error: Not Found Game Window or Not Focused')
    }
  }

  /**
   * 여러 이미지를 배치로 처리하는 메서드
   */
  public async processImagesBatch(
    images: Buffer[],
    gameCode: string,
  ): Promise<OcrPlayDataResponse[]> {
    this.logger.log(`OCR Batch Process Start: ${images.length} images`)

    const results: OcrPlayDataResponse[] = []

    // 이미지를 하나씩 처리
    for (const image of images) {
      try {
        const result = await this.getOcrResultServer(image, gameCode)
        results.push(result)

        // 결과를 오버레이 윈도우에 전송 (일반 윈도우에도 전송하려면 메인 IPC 서비스 통합 필요)
        this.mainWindowService.sendMessage(
          JSON.stringify({
            type: 'ocr-result',
            data: result,
          }),
        )

        // 처리 간격을 두어 서버 부하 방지
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        this.logger.error(`OCR Batch Process Error: ${error.message}`)
      }
    }

    this.logger.log(`OCR Batch Process End: ${results.length}/${images.length} images success`)
    return results
  }

  /**
   * 처리 큐를 순차적으로 처리하는 메서드
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue.length === 0 || this.isProcessing) {
      this.isProcessing = false
      return
    }

    this.isProcessing = true
    const { image, gameCode } = this.processingQueue[0]

    try {
      this.logger.log(`OCR Process Start (Remaining Queue: ${this.processingQueue.length})`)
      await this.getOcrResultServer(image, gameCode)
      this.logger.log('OCR Process End')
    } catch (error) {
      this.logger.error(`OCR Process Error: ${error.message}`)
    } finally {
      // 처리 완료된 항목 제거
      this.processingQueue.shift()
      // 다음 항목 처리
      setTimeout(() => {
        this.isProcessing = false
        this.processQueue()
      }, 1000) // 1초 간격으로 처리
    }
  }

  public async getOcrResultServer(image: Buffer, gameCode: string): Promise<OcrPlayDataResponse> {
    const resizedImage = await this.imageProcessor.postProcessImage(image)
    const formData = new FormData()
    const blob = new Blob([new Uint8Array(resizedImage)], { type: 'image/png' })
    formData.append('file', blob, uuidv4() + '.png')
    formData.append('where', formData.get('where') ?? 'server')

    return this.uploadForOCR(formData, gameCode)
  }

  public async uploadForOCR(formData: FormData, gameCode: string): Promise<OcrPlayDataResponse> {
    const session = this.fileManagerService.loadSession()

    try {
      if (!session.playerId && !session.playerToken) {
        throw new Error('Player ID or Player Token is not set')
      }

      const response = await apiClient.post<OcrPlayDataResponse>(
        `/v3/racla/ocr/${gameCode}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `${session.playerId}|${session.playerToken}`,
          },
          withCredentials: true,
        },
      )

      this.logger.debug(`Server Side OCR Upload Result: ${response.data.data}`)
      return response.data.data
    } catch (error) {
      this.overlayWindowService.sendMessage(
        JSON.stringify({
          type: 'notification',
          notificationType: 'error',
          message: 'failedParsePlayResult',
          mode: 'i18n',
        }),
      )
      this.logger.error(`Server Side OCR Upload Error: ${error}`)
      throw error
    }
  }
}
