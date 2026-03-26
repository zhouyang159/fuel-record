/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    supabaseUrl: string,
    supabaseFunctionsUrl: string,
    wechatOpenIdFunctionName: string,
    supabaseAnonKey: string,
    
    userInfo?: WechatMiniprogram.UserInfo,
    env: string,

    openid: string,
    openidReadyCallback: (() => void) | null,
    carReadyCallback: (() => void) | null,
    CAR_LIST_TABLE: string,
    FUEL_LIST_TABLE: string,
    currentCarId: string | null,
    cars: any[],
  },

  getWechatOpenId: () => Promise<string>,
  fetchCarListByOpenid: () => void,
  userInfoReadyCallback?: (res?: WechatMiniprogram.GetUserInfoSuccessCallbackResult) => void,
}