/**
 * SDK基类模块
 * 提供各平台SDK的通用实现，包括广告（Banner、激励视频、插屏、自定义广告）、
 * 分享、退出应用等功能。各平台SDK继承此类并覆写特定方法以实现平台差异化逻辑。
 * 通过事件系统（EventManager）监听SDK相关事件，实现解耦调用。
 */

import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { AudioSystem } from "../SystemAudio/AudioSystem";

/** 广告配置接口 */
export interface AdConfig {
    /** 应用密钥（部分平台需要） */
    app_key?: string;
    /** Banner广告ID列表 */
    adBannerIdList?: string[];
    /** 激励视频广告ID列表 */
    adVideoIdList?: string[];
    /** 插屏广告ID */
    adInterstitialId?: string;
    /** 自定义广告ID列表 */
    adCustomIdList?: string[];
    /** 分享信息数组，包含标题和图片 */
    shareInfoArr?: { title: string; img: string }[];
    /** 是否导出微信小游戏广告 */
    isExportWxGameAd?: boolean;
    /** 广告盒子门户ID */
    adBoxPortalId?: string;
    /** 广告盒子Banner ID */
    adBoxBannerId?: string;
}

/** SDK基类，提供各平台通用的SDK功能实现 */
export default class SDK {
    /** 平台API引用（如wx、tt、qg等） */
    protected api = null;
    /** 广告配置对象 */
    protected adConfig: any = null;

    /**
     * 初始化SDK
     * 注册事件监听、设置广告配置、调用平台SDK初始化
     * @param callback 初始化完成回调函数，可选
     * @param target 回调函数的this指向，可选
     */
    public init(callback?: Function, target?: any) {
        this.onEvents();
        this.adConfig = {};
        this.setAdCfg();
        this.initSdk(callback, target);
    }

    /**
     * 注册SDK相关的事件监听
     * 子类可覆写此方法添加额外的事件监听
     */
    protected onEvents() {
        EventManager.on(EventTypes.SDKEvents.ShowBanner, this.showBanner, this);
        EventManager.on(EventTypes.SDKEvents.HideBanner, this.hideBanner, this);
        EventManager.on(EventTypes.SDKEvents.ShowVideo, this.showRewardedVideo, this);
        EventManager.on(EventTypes.SDKEvents.ShowInsertAd, this.showInterstitial, this);
        EventManager.on(EventTypes.SDKEvents.ShowCustomAd, this.showCustomAd, this);
        EventManager.on(EventTypes.SDKEvents.HideCustomAd, this.hideCustomAd, this);
        EventManager.on(EventTypes.SDKEvents.Share, this.share, this);
        EventManager.on(EventTypes.SDKEvents.ExitApp, this.onExitApp, this);
    }

    /**
     * 设置广告配置
     * 子类应覆写此方法，配置各平台对应的广告ID
     */
    protected setAdCfg() { }

    /**
     * 调用uniSdk进行平台SDK初始化
     * 如果uniSdk不可用，直接执行回调
     * @param callback 初始化完成回调函数，可选
     * @param target 回调函数的this指向，可选
     */
    private initSdk(callback?: Function, target?: any) {
        if (typeof uniSdk !== 'undefined' && uniSdk.init) {
            uniSdk.init(this.adConfig, (userInfo: any) => {
                if (userInfo && userInfo.uid) {
                    console.log('SDK初始化完成!', userInfo);
                }
                if (callback) callback.call(target);
            }, this);
        } else {
            if (callback) callback.call(target);
        }
    }

    /**
     * 显示提示消息
     * @param msg 消息内容
     */
    protected showMessage(msg: string) {
        EventManager.emit(EventTypes.GameEvents.ShowTips, msg);
    }

    /** 显示Banner广告，通过uniSdk调用 */
    protected showBanner() {
        if (typeof uniSdk !== 'undefined') uniSdk.showBanner();
    }

    /** 隐藏Banner广告，通过uniSdk调用 */
    protected hideBanner() {
        if (typeof uniSdk !== 'undefined') uniSdk.hideBanner();
    }

    /**
     * 显示激励视频广告
     * 播放前暂停游戏和BGM，播放结束后根据状态恢复
     * @param cb 回调函数，支持两种形式：
     *   - Function: 观看成功的回调
     *   - Object: { success: Function, fail: Function, cancel: Function } 分别对应成功、失败、取消
     */
    protected showRewardedVideo(cb: Function | { success: Function, fail: Function, cancel: Function }) {
        let success = null, fail = null, cancel = null;
        if (typeof cb === 'object') {
            success = cb.success; fail = cb.fail; cancel = cb.cancel;
        } else {
            success = cb;
        }
        EventManager.emit(EventTypes.GameEvents.GamePause);
        AudioSystem.pauseBGM();

        if (typeof uniSdk !== 'undefined' && uniSdk.showRewardedVideo) {
            uniSdk.showRewardedVideo(0, (status: number) => {
                if (status == 1) {
                    success && success();
                    EventManager.emit(EventTypes.GameEvents.GameResume);
                    AudioSystem.resumeBGM();
                } else if (status == 0) {
                    cancel && cancel();
                    EventManager.emit(EventTypes.GameEvents.GameResume);
                    AudioSystem.resumeBGM();
                } else {
                    fail && fail();
                    EventManager.emit(EventTypes.GameEvents.GameResume);
                    AudioSystem.resumeBGM();
                }
            }, this);
        } else {
            success && success();
            EventManager.emit(EventTypes.GameEvents.GameResume);
            AudioSystem.resumeBGM();
        }
    }

    /**
     * 显示插屏广告
     * 如果插屏广告未展示成功，则尝试展示自定义广告作为降级方案
     * @param cb1 插屏广告展示结果回调，参数为是否成功展示，可选
     * @param cb2 插屏广告关闭回调，可选
     */
    protected showInterstitial(cb1?: Function, cb2?: Function) {
        if (typeof uniSdk !== 'undefined' && uniSdk.showInterstitial) {
            uniSdk.showInterstitial((showed: boolean) => {
                if (!showed && uniSdk.showCustomAd) uniSdk.showCustomAd(0);
                cb1 && cb1(showed);
            }, () => {
                cb2 && cb2();
            }, this);
        }
    }

    /**
     * 显示自定义广告
     * 如果自定义广告未展示成功，则尝试展示插屏广告作为降级方案
     * @param adIndex 自定义广告索引
     */
    protected showCustomAd(adIndex: number) {
        if (typeof uniSdk !== 'undefined' && uniSdk.showCustomAd) {
            uniSdk.showCustomAd(adIndex, (showed: boolean) => {
                if (!showed && uniSdk.showInterstitial) uniSdk.showInterstitial();
            }, () => { }, this);
        }
    }

    /**
     * 隐藏自定义广告
     * @param adIndex 自定义广告索引
     */
    protected hideCustomAd(adIndex: number) {
        if (typeof uniSdk !== 'undefined' && uniSdk.hideCustomAd) {
            uniSdk.hideCustomAd(adIndex);
        }
    }

    /** 触发分享功能，通过uniSdk调用 */
    protected share() {
        if (typeof uniSdk !== 'undefined') uniSdk.share();
    }

    /** 退出应用事件处理，子类可覆写实现平台特定的退出逻辑 */
    protected onExitApp() { }
}
