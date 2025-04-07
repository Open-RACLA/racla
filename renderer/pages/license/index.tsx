import Head from 'next/head'
import React from 'react'
import { FaLink } from 'react-icons/fa6'

export default function LicensePage() {
  return (
    <React.Fragment>
      <Head>
        <title>라이선스 및 이용약관 - RACLA</title>
      </Head>

      <div className='tw-w-full tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4'>
        <div className='tw-w-full'>
          <div className='tw-flex tw-flex-col tw-gap-6 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-8'>
            {/* 헤더 */}
            <div className='tw-flex tw-w-full tw-mb-2'>
              <span className='tw-text-2xl tw-font-bold tw-text-white'>라이선스</span>
            </div>

            {/* 주요 라이선스 내용 */}
            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-6 tw-rounded-lg tw-space-y-4'>
              <p className='tw-leading-relaxed'>
                1. RACLA는 아래의 명시된 출처(게임)의 성과 관리 도구 애플리케이션(이하 팬
                애플리케이션)입니다. RACLA에서 제공되는 리소스는 각 저작권자의 2차 창작 가이드라인을
                준수하여 사용되고 있으며, 일부 리소스는 사전 허가를 받아 사용하고 있습니다.
                애플리케이션 내 사용된 모든 컨텐츠(이미지, 문구 등)의 저작권은 명시된 저작권자에게
                있습니다.
              </p>
              <p className='tw-leading-relaxed'>
                2. 명시된 콘텐츠 내부에 포함된 저작권 또한 각각의 콘텐츠의 저작권자에게 있습니다.
              </p>
              <p className='tw-leading-relaxed'>
                3. 해당 애플리케이션은 비상업적인 용도로 제공되며, RACLA를 통한 제3자의 직접적인
                상업적 행위(재배포, 판매 등)를 금지합니다. 다만, 게임 스트리밍 방송, 게임 플레이
                영상 제작, 게임 관련 콘텐츠 제작 등 일반적인 창작 활동에서 화면에 포함되는 경우는
                예외로 합니다.
              </p>
              <p className='tw-leading-relaxed'>
                4. 본 서비스의 유지를 위한 모든 비용은 공감대로0번길(GGDRN0 STUDIO)가 부담합니다.
                다만, 서비스 운영 및 유지 비용을 충당하기 위해 필요한 최소한의 광고가 저작권자와의
                협의하에 게재될 수 있습니다.
              </p>
            </div>

            {/* 저작권 출처 섹션 */}
            <div className='tw-space-y-4'>
              <h2 className='tw-text-lg tw-font-bold'>저작권 출처</h2>
              <div className='tw-bg-blue-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-blue-500'>
                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors'
                  onClick={() =>
                    window.ipc.send('openBrowser', 'https://store.steampowered.com/app/960170')
                  }
                >
                  <FaLink className='tw-text-sm' />
                  <span>DJMAX RESPECT V(디제이맥스 리스펙트 V, 게임)</span>
                  <span>-</span>
                  <span
                    className='hover:tw-text-blue-300'
                    onClick={(e) => {
                      e.stopPropagation()
                      window.ipc.send('openBrowser', 'https://www.neowiz.com/')
                    }}
                  >
                    네오위즈(NEOWIZ)
                  </span>
                </div>

                <hr className='tw-my-4 tw-border-blue-500 tw-border-opacity-50' />

                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors'
                  onClick={() => window.ipc.send('openBrowser', 'https://v-archive.net/')}
                >
                  <FaLink className='tw-text-sm' />
                  <span>V-ARCHIVE(DJMAX RESPECT V의 유저 제작 웹 성과 관리 도구)</span>
                  <span>-</span>
                  <span>V-ARCHIVE</span>
                </div>

                <hr className='tw-my-4 tw-border-blue-500 tw-border-opacity-50' />

                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-400 tw-transition-colors'
                  onClick={() =>
                    window.ipc.send('openBrowser', 'https://waktaverse.games/gameDetail/wjmax/')
                  }
                >
                  <FaLink className='tw-text-sm' />
                  <span>WJMAX(왁제이맥스, 게임)</span>
                  <span>-</span>
                  <span
                    className='hover:tw-text-blue-300'
                    onClick={(e) => {
                      e.stopPropagation()
                      window.ipc.send('openBrowser', 'https://waktaverse.games/')
                    }}
                  >
                    WJMAX STUDIO, WAKTAVERSE GAMES
                  </span>
                </div>
              </div>
            </div>

            {/* API 섹션 */}
            <div className='tw-space-y-4'>
              <h2 className='tw-text-lg tw-font-bold'>외부 연동 API 서비스</h2>
              <div className='tw-bg-green-900 tw-bg-opacity-20 tw-p-4 tw-rounded tw-border-l-4 tw-border-green-500'>
                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-green-400 tw-transition-colors'
                  onClick={() =>
                    window.ipc.send(
                      'openBrowser',
                      'https://github.com/djmax-in/openapi?tab=readme-ov-file',
                    )
                  }
                >
                  <FaLink className='tw-text-sm' />
                  <span>V-ARCHIVE API - V-ARCHIVE</span>
                </div>
                <hr className='tw-my-4 tw-border-green-500 tw-border-opacity-50' />
                <div
                  className='tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-green-400 tw-transition-colors'
                  onClick={() => window.ipc.send('openBrowser', 'https://hard-archive.com')}
                >
                  <FaLink className='tw-text-sm' />
                  <span>전일 아카이브 API - 전일 아카이브</span>
                </div>
              </div>
            </div>

            <div className='tw-space-y-4'>
              <h2 className='tw-text-lg tw-font-bold'>Special Thanks</h2>
              <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-6 tw-rounded-lg tw-space-y-4'>
                <p className='tw-leading-relaxed'>
                  1. 동기 부여를 해준 디제이맥스 리스펙트 V 마이너 갤러리
                </p>
                <p className='tw-leading-relaxed'>
                  2. 리소스 사용을 허락해주신 V-ARCHIVE 개발자님을 포함한 V-ARCHIVE 관계자분들
                </p>
                <p className='tw-leading-relaxed'>
                  3. 리소스 사용을 허락해주신 전일 아카이브 개발자님을 포함한 전일 아카이브
                  관계자분들
                </p>
                <p className='tw-leading-relaxed'>
                  4. 리소스 사용을 허락해주신 WJMAX 개발자님을 포함한 WJMAX STUDIO 관계자분들
                </p>
                <p className='tw-leading-relaxed'>
                  5. RACLA 서비스를 함께 만들어가는 공감대로0번길(GGDRN0 STUDIO)와 RACLA 팀원들
                </p>
                <p className='tw-leading-relaxed'>
                  6. RACLA 서비스에서 가장 많은 기여도를 주신 HanA 사용자님
                </p>
                <p className='tw-leading-relaxed'>
                  7. 매달 50 SGD 상당의 서버 자산을 정기적으로 후원해주시는 KIHARU 후원자님
                </p>

                <p className='tw-leading-relaxed'>
                  8. 마지막으로 RACLA를 사용해주시는 모든 사용자 여러분들께 감사합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className='tw-w-full'>
          <div className='tw-flex tw-flex-col tw-gap-6 tw-bg-gray-800 tw-bg-opacity-75 tw-rounded-lg tw-shadow-lg tw-p-8'>
            {/* 헤더 */}
            <div className='tw-flex tw-w-full tw-mb-2'>
              <span className='tw-text-2xl tw-font-bold tw-text-white'>이용약관</span>
            </div>
            {/* 주요 라이선스 내용 */}
            <div className='tw-bg-gray-700 tw-bg-opacity-30 tw-p-6 tw-rounded-lg tw-space-y-4'>
              <div className='tw-space-y-6'>
                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>제1조 (목적)</h3>
                  <p className='tw-leading-relaxed'>
                    본 약관은 공감대로0번길(이하 "GGDRN0 STUDIO" 또는 "개발팀")이 제공하는 RACLA
                    서비스(이하 "서비스")의 이용과 관련하여 개발팀과 이용자 간의 권리, 의무,
                    책임사항 및 기타 필요한 사항을 규정함을 목적으로 합니다.
                  </p>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>제2조 (정의)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      "서비스"란 공감대로0번길(GGDRN0 STUDIO)에 소속된 RACLA 팀이 개발하여 제공하는
                      디지털 콘텐츠 및 관련 서비스를 말합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      "이용자"란 본 약관에 동의하고 서비스를 이용하는 자를 의미합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      "비상업적 사용"이란 개인적이고 상업적 이익을 추구하지 않는 사용을 의미합니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>제3조 (약관의 효력 및 변경)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      본 약관은 이용자가 서비스에 접속하여 약관에 동의함으로써 효력이 발생합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      개발팀은 필요하다고 인정되는 경우 관련 법령을 위반하지 않는 범위에서 본 약관을
                      변경할 수 있습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      변경된 약관은 서비스 내 공지사항에 게시되며, 이용자가 변경된 약관에 동의하지
                      않을 경우 서비스 이용을 중단할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>
                    제4조 (서비스의 제공 및 제한)
                  </h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      본 서비스는 비상업적 사용으로만 제한되며, 상업적 목적으로 사용할 수 없습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      서비스의 일시적 중단, 수정 또는 종료는 개발팀의 재량에 따라 이루어질 수
                      있습니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>
                    제5조 (개인정보의 수집 및 이용)
                  </h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      개발팀은 서비스 제공 및 개선을 위해 최소한의 개인정보를 수집합니다. 수집
                      항목은 다음과 같습니다:
                    </p>
                    <ul className='tw-list-disc tw-ml-6 tw-space-y-1'>
                      <li>
                        아이디(서비스의 이용자 고유 번호 또는 제3자 연동 서비스의 이용자 고유 번호)
                      </li>
                      <li>
                        비밀번호(기본적인 서비스 이용에서는 미수집, 단 OwO Developer Hub 서비스를
                        이용하여 RACLA API 외부 활용 시 별도 동의하에 복호화 불가능한 방법으로
                        암호화된 데이터로 수집)
                      </li>
                      <li>
                        이메일(기본적인 서비스 이용에서는 미수집, 단 OwO Developer Hub 서비스를
                        이용하여 RACLA API 외부 활용 시 별도 동의하에 수집)
                      </li>
                      <li>
                        주소(기본적인 서비스 이용에서는 미수집, 단 OwO Developer Hub 서비스를
                        이용하여 RACLA API 외부 활용 시 별도 동의하에 수집)
                      </li>
                      <li>닉네임</li>
                      <li>
                        게임 플레이 데이터(텍스트 데이터만 수집, 이미지 데이터의 경우 OCR 처리 시
                        활용되어 텍스트 데이터 추출 후 즉시 폐기)
                      </li>
                      <li>
                        접속 환경(IP 주소, 접속 일시, 접속 URL와 브라우저에서 제공되는 브라우저
                        정보, 운영체제 정보, 접속 기기)
                      </li>
                      <li>
                        키 입력 데이터(서비스의 자동 캡쳐 모드와 상시 오버레이 표시 기능 활성화 후
                        지원하는 게임 창을 활성화(포커스)시에만 별도 동의 하에 수집)
                      </li>
                    </ul>
                    <p className='tw-leading-relaxed'>
                      수집된 개인정보는 서비스 제공 및 통계 분석 목적으로만 사용됩니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      개발팀은 이용자의 개인정보를 관련 법령에 따라 보호하며, 자세한 내용은
                      <span
                        className='hover:tw-text-blue-300 tw-text-blue-400 tw-cursor-pointer'
                        onClick={(e) => {
                          e.stopPropagation()
                          window.ipc.send('openBrowser', 'https://gongroin.com/policy/privacy')
                        }}
                      >
                        {' '}
                        공감대로0번길(GGDRN0 STUDIO)의 개인정보 처리방침
                      </span>
                      을 따릅니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>
                    제6조 (개인정보의 국외 이전)
                  </h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      개발팀은 서비스 이용자로부터 수집한 개인정보를 아래와 같이 국외에 위탁하고
                      있습니다. 서비스 제공을 위한 데이터 보관 및 인프라 운영을 위해 필수적으로
                      수반되는 업무에 대해 국외이전되고 있으므로 국외이전을 거부하실 경우
                      서비스이용이 불가능합니다. 국외 이전을 원치 않으실 경우 해당 되는 서비스에서
                      회원탈퇴를 진행 또는 고객센터에 문의 주시기 바랍니다. 서비스에서 별도로
                      명시되지 않은 경우 개발팀의 자산 또는 개인정보의 국외 이전에 해당하지 않는
                      자산을 활용하여 처리됩니다.
                    </p>
                    <p className='tw-leading-relaxed tw-font-bold'>
                      개인정보 처리업무 위탁현황(국외)
                    </p>
                    <div className='tw-overflow-x-auto'>
                      <table className='tw-min-w-full tw-border-collapse tw-border tw-border-gray-700'>
                        <thead>
                          <tr className='tw-bg-gray-800'>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              수탁업체
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              연락처
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              위탁업무
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              이전되는 개인정보 항목
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              이전되는 국가
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              이전일시 및 방법
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              이전목적
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              개인정보 보유 및 이용기간
                            </th>
                            <th className='tw-border tw-border-gray-700 tw-p-2 tw-text-left'>
                              관련근거
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              Amazon Web Services, Inc.
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              aws-korea-privacy@amazon.com
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              정보 보관, 인프라 운영
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              본 서비스 이용약관 제5조에 해당하는 정보와 이용자간 상호작용 정보를
                              포함하는 서비스 이용기록
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>미국</td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              서비스 이용시점에 암호화 통신을 통한 안전한 전송
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              서비스 제공을 위한 인프라 운영 및 데이터 보관
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              회원탈퇴 또는 위탁계약 종료 시
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              개인정보보호법 제28조의8 제1항 제3호(계약이행을 위한 처리 위탁/보관)
                            </td>
                          </tr>
                          <tr>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>IBM Corp.</td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              <span
                                className='hover:tw-text-blue-300 tw-text-blue-400 tw-cursor-pointer'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.ipc.send(
                                    'openBrowser',
                                    'https://www.ibm.com/privacy/requests/contact/kr-ko',
                                  )
                                }}
                              >
                                IBM Trust Center
                              </span>
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              정보 보관, 인프라 운영
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              본 서비스 이용약관 제5조에 해당하는 정보와 이용자간 상호작용 정보를
                              포함하는 서비스 이용기록
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>미국, 일본</td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              서비스 이용시점에 암호화 통신을 통한 안전한 전송
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              서비스 제공을 위한 인프라 운영 및 데이터 보관
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              회원탈퇴 또는 위탁계약 종료 시
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              개인정보보호법 제28조의8 제1항 제3호(계약이행을 위한 처리 위탁/보관)
                            </td>
                          </tr>
                          <tr>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>Oracle Corp.</td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              <span
                                className='hover:tw-text-blue-300 tw-text-blue-400 tw-cursor-pointer'
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.ipc.send(
                                    'openBrowser',
                                    'https://www.oracle.com/corporate/contact/',
                                  )
                                }}
                              >
                                Oracle Contacts
                              </span>
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              정보 보관, 인프라 운영
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              본 서비스 이용약관 제5조에 해당하는 정보와 이용자간 상호작용 정보를
                              포함하는 서비스 이용기록
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>미국</td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              서비스 이용시점에 암호화 통신을 통한 안전한 전송
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              서비스 제공을 위한 인프라 운영 및 데이터 보관
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              회원탈퇴 또는 위탁계약 종료 시
                            </td>
                            <td className='tw-border tw-border-zinc-700 tw-p-2'>
                              개인정보보호법 제28조의8 제1항 제3호(계약이행을 위한 처리 위탁/보관)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>제7조 (이용자의 의무)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      이용자는 서비스를 비상업적 용도로만 이용해야 하며, 상업적 이익을 위해 사용할
                      수 없습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      이용자는 서비스의 정상적인 운영을 방해하는 행위를 해서는 안 됩니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>제8조 (광고 게재)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      서비스 운영 및 유지 비용을 충당하기 위해 서비스 내에 광고가 게재될 수
                      있습니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      단 서비스외의 제3자의 리소스가 사용 중인 경우 광고는 저작권자의 허락을 받은
                      경우에만 게재됩니다.
                    </p>
                    {/* <p className="tw-leading-relaxed">광고는 서비스의 지속적인 제공을 위한 최소한의 조치로, 이용자는 이를 이해하고 수용합니다.</p> */}
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>제9조 (책임 제한)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      개발팀은 서비스 이용 중 발생한 손해에 대해 책임을 지지 않습니다. 단, 개발팀의
                      고의 또는 중대한 과실로 인한 경우는 예외로 합니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      이용자는 본인의 과실로 인해 발생한 손해에 대해 전적인 책임을 집니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>제10조 (분쟁 해결)</h3>
                  <div className='tw-space-y-2'>
                    <p className='tw-leading-relaxed'>
                      본 약관에 명시되지 않은 사항은 관련 법령 및 상관례에 따릅니다.
                    </p>
                    <p className='tw-leading-relaxed'>
                      서비스 이용과 관련하여 분쟁이 발생한 경우, 개발팀과 이용자는 성실히 협의하여
                      해결합니다.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className='tw-text-base tw-font-bold tw-mb-2'>부칙</h3>
                  <p className='tw-leading-relaxed'>본 약관은 2025년 4월 1일부터 적용됩니다.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}
