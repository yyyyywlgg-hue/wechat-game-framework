/**
 * VIVO小游戏SDK模块
 * 继承SDK基类，实现VIVO小游戏平台的特定功能。
 * VIVO平台的Banner、插屏和自定义广告使用uniSdk统一管理，
 * 此处将对应方法置空。仅保留退出应用的平台特定实现。
 */

import SDK from "./SDK";

/** VIVO小游戏SDK类，继承自SDK基类 */
export class VIVOSDK extends SDK {
    /**
     * 设置VIVO平台的广告配置
     * 子类应在此方法中配置VIVO小游戏的广告ID和app_key
     */
    protected setAdCfg(): void {
        // this.adConfig.app_key = 'your_app_key';
        // this.adConfig.adBannerIdList = ["your_banner_id"];
        // this.adConfig.adVideoIdList = ["your_video_id"];
        // this.adConfig.adCustomIdList = ["your_custom_id"];
    }

    /** VIVO平台Banner广告显示（由uniSdk统一管理，此处置空） */
    protected showBanner() { }
    /** VIVO平台Banner广告隐藏（由uniSdk统一管理，此处置空） */
    protected hideBanner() { }

    /**
     * VIVO平台插屏广告显示（由uniSdk统一管理，此处直接执行关闭回调）
     * @param cb1 展示结果回调，可选
     * @param cb2 关闭回调，可选
     */
    protected showInterstitial(cb1?: Function, cb2?: Function) { cb2 && cb2(); }

    /**
     * VIVO平台自定义广告显示（由uniSdk统一管理，此处置空）
     * @param adIndex 广告索引
     */
    protected showCustomAd(adIndex: number) { }

    /**
     * VIVO平台自定义广告隐藏（由uniSdk统一管理，此处置空）
     * @param adIndex 广告索引
     */
    protected hideCustomAd(adIndex: number) { }

    /**
     * VIVO平台退出应用
     * 调用qg.exitApplication()退出VIVO小游戏
     */
    protected onExitApp() {
        if (window["qg"]) {
            window["qg"].exitApplication({});
        }
    }
}
