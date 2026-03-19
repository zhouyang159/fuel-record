/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    supabaseUrl: String,
    supabaseAnonKey: String,
    
    userInfo?: WechatMiniprogram.UserInfo,
    env: String,

    openid: String,
    openidReadyCallback: WechatMiniprogram.GetOpenUserInfoSuccessCallback | null,
    carReadyCallback: Function | null,
    CAR_LIST_TABLE: String,
    FUEL_LIST_TABLE: String,
    currentCarId: String | null,
    cars: any[],
  },

  fetchCarListByOpenid: () => void,
  userInfoReadyCallback?: () => void,
}