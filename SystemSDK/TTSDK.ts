/**
 * 抖音小游戏SDK模块
 * 继承SDK基类，实现抖音小游戏平台的特定功能。
 * 在基类基础上增加了录屏相关功能（开始、暂停、恢复、停止录屏，分享录屏视频），
 * 以及游戏运行时自动开始录屏、游戏结束时自动停止录屏的逻辑。
 */

import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import SDK from "./SDK";

/** 抖音小游戏SDK类，继承自SDK基类，增加录屏和分享功能 */
export class TTSDK extends SDK {
    /**
     * 注册抖音平台特有的事件监听
     * 在基类事件基础上增加游戏运行/结束和录屏控制事件
     */
    protected onEvents() {
        super.onEvents();
        EventManager.on(EventTypes.GameEvents.GameRun, this.onGameRun, this);
        EventManager.on(EventTypes.GameEvents.GameOver, this.onGameOver, this);
        EventManager.on(EventTypes.SDKEvents.StartRecord, this.onStartRecord, this);
        EventManager.on(EventTypes.SDKEvents.PauseRecord, this.onPauseRecord, this);
        EventManager.on(EventTypes.SDKEvents.ResumeRecord, this.onResumeRecord, this);
        EventManager.on(EventTypes.SDKEvents.StopRecord, this.onStopRecord, this);
        EventManager.on(EventTypes.SDKEvents.ShareRecord, this.onShareRecord, this);
    }

    /**
     * 设置抖音平台的广告配置，并注册分享监听
     * 子类应在此方法中配置抖音小游戏的广告ID
     */
    protected setAdCfg(): void {
        // this.adConfig.adBannerIdList = ["your_banner_id"];
        // this.adConfig.adVideoIdList = ["your_video_id"];
        // this.adConfig.adInterstitialId = "your_interstitial_id"];
        // this.adConfig.shareInfoArr = [{ title: "一起来玩吧!", img: "" }];
        this.onShareAppMessage();
    }

    /**
     * 注册抖音平台的被动分享监听
     * 当用户点击分享按钮时，自动使用配置的标题和图片进行分享
     */
    protected onShareAppMessage() {
        if (typeof window['tt'] !== 'undefined') {
            window['tt'].onShareAppMessage(() => ({
                title: '',
                imageUrl: '',
            }));
        }
    }

    /** 游戏运行时自动开始录屏 */
    protected onGameRun() { this.onStartRecord(); }
    /** 游戏结束时自动停止录屏 */
    protected onGameOver() { this.onStopRecord(); }

    /** 开始录屏，通过uniSdk的AdPlat调用 */
    protected onStartRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.startRecord();
        }
    }
    /** 暂停录屏 */
    protected onPauseRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.pauseRecord();
        }
    }
    /** 恢复录屏 */
    protected onResumeRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.resumeRecord();
        }
    }
    /** 停止录屏 */
    protected onStopRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.stopRecord();
        }
    }

    /**
     * 分享录屏视频
     * @param success 分享成功回调，可选
     * @param fail 分享失败回调，可选
     */
    protected onShareRecord(success?: Function, fail?: Function) {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.share({ channel: 'video' }, (isSuccess: boolean) => {
                if (isSuccess) { success && success(); }
                else { fail && fail(); }
            }, () => {
                this.showMessage('录屏时间少于3秒');
            });
        }
    }
}
