/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    supabaseUrl: string,
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

  fetchCarListByOpenid: () => void,
  userInfoReadyCallback?: (res?: WechatMiniprogram.GetUserInfoSuccessCallbackResult) => void,
}