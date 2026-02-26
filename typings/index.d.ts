/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    env: String,

    openid: String,
    openidReadyCallback: WechatMiniprogram.GetOpenUserInfoSuccessCallback | null,
    carReadyCallback: Function | null,
    CAR_LIST_TABLE: String,
    currentCarId: String | null,
    cars: any[],
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}