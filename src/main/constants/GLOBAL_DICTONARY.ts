// 메인 프로세스에서 사용하는 상수
export const GLOBAL_DICTONARY = {
  SUPPORTED_GAME_PROCESS_NAME_LIST: [
    // 왜 하나가 더 많지?
    'DJMAX RESPECT V.exe', // GOAT
    // 'PLATiNA LAB.exe', // 플라티나 랩은 프로세스는 PLATiNA LAB으로 나오고...
    // 'PLATiNA :: LAB.exe', // 또 앱(프로그램) 명으로는 PLATiNA :: LAB으로 나오기 때문에...
  ],

  NOT_SUPPORTED_GAME_PROCESS_NAME_LIST: [
    // 지원하지 않지만 게임 중일때 라클라가 켜져있다면 사용자 환경 최적화를 위해서
    'DivaMegaMix.exe', // 미쿠미쿠빔
    'MuseDash.exe', // 우리부로
    'osu!.exe', // 저작권 주작은 뭐야
  ],

  STANDARD_RESOLUTIONS: [
    { width: 640, height: 360 },
    { width: 720, height: 405 },
    { width: 800, height: 450 },
    { width: 1024, height: 576 },
    { width: 1128, height: 635 },
    { width: 1280, height: 720 },
    { width: 1366, height: 768 },
    { width: 1600, height: 900 },
    { width: 1680, height: 945 },
    { width: 1760, height: 990 },
    { width: 1920, height: 1080 },
    { width: 2048, height: 1152 },
    { width: 2288, height: 1287 },
    { width: 2560, height: 1440 },
    { width: 3072, height: 1728 },
    { width: 3200, height: 1800 },
    { width: 3840, height: 2160 },
    { width: 5120, height: 2880 },
  ],

  // 프로필 마스킹 영역 정의 (개인정보 보호)
  PROFILE_REGIONS: {
    djmax_respect_v: {
      result: {
        myProfile: { left: 1542, top: 26, width: 320, height: 68 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
        chat: { left: 1, top: 1, width: 1, height: 1 },
      },
      select: {
        myProfile: { left: 1522, top: 22, width: 320, height: 68 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
        chat: { left: 1, top: 1, width: 1, height: 1 },
      },
      open3: {
        myProfile: { left: 211, top: 177, width: 320, height: 68 },
        otherProfile: { left: 777, top: 116, width: 1106, height: 852 },
        chat: { left: 1, top: 1, width: 1, height: 1 },
      },
      open2: {
        myProfile: { left: 310, top: 176, width: 321, height: 69 },
        otherProfile: { left: 1290, top: 176, width: 321, height: 69 },
        chat: { left: 1, top: 1, width: 1, height: 1 },
      },
      versus: {
        myProfile: { left: 201, top: 867, width: 320, height: 68 },
        otherProfile: { left: 1401, top: 867, width: 320, height: 68 },
        chat: { left: 1, top: 1, width: 1, height: 1 },
      },
      collection: {
        myProfile: { left: 1512, top: 22, width: 320, height: 68 },
        otherProfile: { left: 1, top: 1, width: 1, height: 1 },
        chat: { left: 1, top: 1, width: 1, height: 1 },
      },
      openSelect: {
        myProfile: { left: 1361, top: 216, width: 320, height: 68 },
        otherProfile: { left: 1363, top: 318, width: 316, height: 464 },
        chat: { left: 58, top: 687, width: 524, height: 256 },
      },
    },
    // platina_lab: {
    //   result: {
    //     myProfile: { left: 1452, top: 14, width: 422, height: 88 },
    //     otherProfile: { left: 1, top: 1, width: 1, height: 1 },
    //     chat: { left: 1, top: 1, width: 1, height: 1 },
    //   },
    // },
    // ez2on: {
    //   result: {
    //     myProfile: { left: 1, top: 1, width: 1, height: 1 },
    //     otherProfile: { left: 1, top: 1, width: 1, height: 1 },
    //     chat: { left: 1, top: 1, width: 1, height: 1 },
    //   },
    // },
  },

  // OCR 인식 영역 정의 (화면 타입 구분을 위한 영역)
  OCR_REGIONS: {
    djmax_respect_v: {
      result: { width: 230, height: 24, left: 100, top: 236 },
      versus: { width: 151, height: 106, left: 748, top: 45 },
      open3: { width: 78, height: 24, left: 236, top: 724 },
      open2: { width: 80, height: 26, left: 335, top: 723 },
    },
    // platina_lab: {
    //   result: { width: 100, height: 26, left: 694, top: 864 },
    // },
    // ez2on: {
    //   result: { width: 1, height: 1, left: 1, top: 1 },
    // },
  },

  // 결과 화면 키워드 (각 영역별로 다른 키워드 지정)
  RESULT_KEYWORDS: {
    djmax_respect_v: {
      result: ['JUDGEMENT', 'DETAILS', 'DETAIL', 'JUDGE', 'JUDGEMENT DETAILS'],
      versus: ['RE'],
      open3: ['SCORE', 'ORE'],
      open2: ['SCORE', 'ORE'],
    },
    // platina_lab: {
    //   result: ['COMBO', 'COM', 'MBO'],
    // },
    // ez2on: {
    //   result: ['NOT_AVAILABLE'],
    // },
  },
}
