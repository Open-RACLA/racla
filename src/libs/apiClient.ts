import { ApiResponse } from '@src/types/dto/common/ApiResponse'
import { ClientErrorLogRequest } from '@src/types/dto/log/ClientErrorLogReqeust'
import type { ProxyRequest } from '@src/types/dto/proxy/ProxyRequest'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 요청 우선순위 정의
export enum RequestPriority {
  HIGH = 0, // 중요한 시스템 요청 (헬스체크, 핑 등)
  NORMAL = 1, // 일반 요청
  LOW = 2, // 낮은 우선순위 요청
}

// 요청 타임아웃 설정
const DEFAULT_TIMEOUT = 30000 // 30초
const HEALTH_CHECK_TIMEOUT = 60000 // 60초
const HEALTH_CHECK_ID = 'health-check' // 헬스체크 요청 ID 상수
const ERROR_LOG_ID = 'error-log' // 에러 로그 요청 ID 상수

// 프록시 대상 URL 목록
const PROXY_TARGET_URLS = ['https://v-archive.net', 'https://hard-archive.com']

// 프록시 상태 인터페이스
interface ServerStatusResponse {
  version: string
  hard_archive_status: boolean
  v_archive_status: boolean
  last_checked_utc: string
}

// 요청 객체 인터페이스
interface RequestItem<T> {
  execute: () => Promise<AxiosResponse<ApiResponse<T>>>
  priority: RequestPriority
  requestId: string
}

class ApiClient {
  private client: AxiosInstance
  private targetUrlStatus: Map<string, boolean> = new Map() // 대상 URL 가용성 상태

  constructor(
    baseURL: string = process.env.NODE_ENV === 'development'
      ? 'https://api.open-racla.app/api'
      : 'https://api.open-racla.app/api',
  ) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: DEFAULT_TIMEOUT,
    })

    // 초기화 시 프록시 URL 상태를 true로 설정 (항상 가용하도록)
    PROXY_TARGET_URLS.forEach((url) => {
      this.targetUrlStatus.set(url, true)
    })
  }

  /**
   * 요청을 직접 실행합니다.
   * @param requestItem 요청 아이템
   * @returns 요청 결과를 포함한 Promise
   */
  private async executeRequest<T>(
    requestItem: RequestItem<T>,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    try {
      const response = await requestItem.execute()
      return response
    } catch (error) {
      throw error
    }
  }

  /**
   * 일반 GET 요청을 보냅니다.
   * @param url 요청할 URL
   * @param config Axios 요청 설정
   * @param requestId 요청 식별자 (선택사항)
   * @param priority 요청 우선순위
   * @returns axios 응답 객체를 포함한 Promise
   */
  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
    requestId?: string,
    priority: RequestPriority = RequestPriority.NORMAL,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    const effectiveRequestId = requestId || `get:${url}`

    return this.executeRequest<T>({
      requestId: effectiveRequestId,
      priority,
      execute: async () => {
        try {
          const response = await this.client.get<ApiResponse<T>>(url, {
            ...config,
          })
          return response
        } catch (error) {
          throw error
        }
      },
    })
  }

  /**
   * 일반 POST 요청을 보냅니다. 쿠키 정보를 항상 포함합니다.
   * @param url 요청할 URL
   * @param data 요청 바디 데이터
   * @param config Axios 요청 설정
   * @param requestId 요청 식별자 (선택사항)
   * @param priority 요청 우선순위
   * @returns axios 응답 객체를 포함한 Promise
   */
  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    requestId?: string,
    priority: RequestPriority = RequestPriority.NORMAL,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    const effectiveRequestId = requestId || `post:${url}`

    return this.executeRequest<T>({
      requestId: effectiveRequestId,
      priority,
      execute: async () => {
        try {
          const requestConfig: AxiosRequestConfig = {
            ...config,
            withCredentials: true,
          }

          const response = await this.client.post<ApiResponse<T>>(url, data, requestConfig)
          return response
        } catch (error) {
          throw error
        }
      },
    })
  }

  /**
   * 프록시 서비스를 통해 GET 요청을 보냅니다.
   * 대상 URL이 헬스체크를 통과하지 않은 경우 요청이 취소됩니다.
   * @param url 요청할 URL
   * @param params URL 쿼리 파라미터 (한글 파라미터 지원)
   * @param headers 요청 헤더
   * @param requestId 요청 식별자 (선택사항)
   * @param priority 요청 우선순위
   * @returns 응답 데이터를 포함한 Promise
   */
  async getProxy<T>(
    url: string,
    params: Record<string, any> = {},
    headers: Record<string, string> = {},
    requestId?: string,
    priority: RequestPriority = RequestPriority.NORMAL,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    const effectiveRequestId = requestId || `getProxy:${url}`

    // URL 가용성 확인
    if (!this.isTargetUrlAvailable(url)) {
      const error = new Error(`Target URL not available: ${url}`) as any
      error.isTargetUrlUnavailable = true
      throw error
    }

    const request: ProxyRequest = {
      url,
      method: 'GET',
      type: 'query',
      data: params,
      headers,
    }

    return await this.post<T>('/v3/racla/proxy', request, undefined, effectiveRequestId, priority)
  }

  /**
   * 프록시 서비스를 통해 POST 요청을 보냅니다.
   * 대상 URL이 헬스체크를 통과하지 않은 경우 요청이 취소됩니다.
   * @param url 요청할 URL
   * @param data 요청 바디 데이터
   * @param headers 요청 헤더
   * @param requestId 요청 식별자 (선택사항)
   * @param priority 요청 우선순위
   * @returns 응답 데이터를 포함한 Promise
   */
  async postProxy<T>(
    url: string,
    data: Record<string, any> = {},
    headers: Record<string, string> = {},
    requestId?: string,
    priority: RequestPriority = RequestPriority.NORMAL,
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    const effectiveRequestId = requestId || `postProxy:${url}`

    // URL 가용성 확인
    if (!this.isTargetUrlAvailable(url)) {
      const error = new Error(`Target URL not available: ${url}`) as any
      error.isTargetUrlUnavailable = true
      throw error
    }

    const request: ProxyRequest = {
      url,
      method: 'POST',
      type: 'body',
      data,
      headers,
    }

    return await this.post<T>('/v3/racla/proxy', request, undefined, effectiveRequestId, priority)
  }

  /**
   * 지정된 URL이 가용한지 확인합니다.
   * @param url 확인할 URL
   * @returns 가용 여부
   */
  public isTargetUrlAvailable(url: string): boolean {
    // URL에서 도메인 부분만 추출
    let targetDomain = ''
    try {
      const urlObj = new URL(url)
      targetDomain = `${urlObj.protocol}//${urlObj.hostname}`
    } catch (error) {
      return false
    }

    // 지원하는 대상 URL이 아니면 항상 false
    if (!PROXY_TARGET_URLS.includes(targetDomain)) {
      return false
    }

    return this.targetUrlStatus.get(targetDomain) || false
  }

  /**
   * 헬스체크 요청을 보냅니다. 항상 높은 우선순위로 처리되며 취소되지 않습니다.
   * @returns 응답 데이터를 포함한 Promise
   */
  async healthCheck(): Promise<AxiosResponse<ApiResponse<ServerStatusResponse>>> {
    const response = await this.get<ServerStatusResponse>(
      '/v4/racla/ping',
      { timeout: HEALTH_CHECK_TIMEOUT },
      HEALTH_CHECK_ID,
      RequestPriority.HIGH,
    )

    // 응답에서 프록시 서버 상태 업데이트
    if (response.data.success && response.data.data) {
      // V-Archive 상태 업데이트
      this.targetUrlStatus.set('https://v-archive.net', response.data.data.v_archive_status)

      // Hard-Archive 상태 업데이트
      this.targetUrlStatus.set('https://hard-archive.com', response.data.data.hard_archive_status)
    }

    return response
  }

  /**
   * 에러 로그를 전송합니다. 항상 높은 우선순위로 처리되며 취소되지 않습니다.
   * @param errorData 에러 로그 데이터
   * @returns 응답 데이터를 포함한 Promise
   */
  async sendErrorLog<T>(errorData: ClientErrorLogRequest): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.post<T>(
      '/v3/racla/log/client',
      errorData,
      { timeout: HEALTH_CHECK_TIMEOUT },
      ERROR_LOG_ID,
      RequestPriority.HIGH,
    )
  }

  /**
   * 프록시 대상 URL의 현재 가용성 상태를 반환합니다.
   * @returns 프록시 대상 URL의 가용성 상태 맵
   */
  public getTargetUrlStatus(): Map<string, boolean> {
    return this.targetUrlStatus
  }
}

// 싱글턴 인스턴스 생성
const apiClient = new ApiClient()
export default apiClient
