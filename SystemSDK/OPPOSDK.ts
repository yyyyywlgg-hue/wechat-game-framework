/**
 * OPPO小游戏SDK模块
 * 继承SDK基类，实现OPPO小游戏平台的特定功能。
 * OPPO平台的Banner、插屏和自定义广告使用uniSdk统一管理，
 * 此处将对应方法置空。仅保留退出应用的平台特定实现。
 */

import SDK from "./SDK";

/** OPPO小游戏SDK类，继承自SDK基类 */
export class OPPOSDK extends SDK {
    /**
     * 设置OPPO平台的广告配置
     * 子类应在此方法中配置OPPO小游戏的广告ID和app_key
     */
    protected setAdCfg(): void {
        // this.adConfig.app_key = 'your_app_key';
        // this.adConfig.adBannerIdList = ["your_banner_id"];
        // this.adConfig.adVideoIdList = ["your_video_id"];
        // this.adConfig.adInterstitialId = "your_interstitial_id";
        // this.adConfig.adCustomIdList = ["your_custom_id"];
    }

    /** OPPO平台Banner广告显示（由uniSdk统一管理，此处置空） */
    protected showBanner() { }
    /** OPPO平台Banner广告隐藏（由uniSdk统一管理，此处置空） */
    protected hideBanner() { }

    /**
     * OPPO平台插屏广告显示（由uniSdk统一管理，此处直接执行关闭回调）
     * @param cb1 展示结果回调，可选
     * @param cb2 关闭回调，可选
     */
    protected showInterstitial(cb1?: Function, cb2?: Function) { cb2 && cb2(); }

    /**
     * OPPO平台自定义广告显示（由uniSdk统一管理，此处置空）
     * @param adIndex 广告索引
     */
    protected showCustomAd(adIndex: number) { }

    /**
     * OPPO平台自定义广告隐藏（由uniSdk统一管理，此处置空）
     * @param adIndex 广告索引
     */
    protected hideCustomAd(adIndex: number) { }

    /**
     * OPPO平台退出应用
     * 调用qg.exitApplication()退出OPPO小游戏
     */
    protected onExitApp() {
        if (window["qg"]) {
            window["qg"].exitApplication({});
        }
    }
}
