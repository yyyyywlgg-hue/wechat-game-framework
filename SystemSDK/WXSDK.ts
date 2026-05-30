/**
 * 微信小游戏SDK模块
 * 继承SDK基类，实现微信小游戏平台的特定功能。
 * 在基类基础上增加了游戏运行和游戏结束事件监听，
 * 并覆写激励视频播放方法以支持多广告位索引。
 */

import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { AudioSystem } from "../SystemAudio/AudioSystem";
import SDK from "./SDK";

/** 微信小游戏SDK类，继承自SDK基类 */
export class WXSDK extends SDK {
    /**
     * 注册微信平台特有的事件监听
     * 在基类事件基础上增加游戏运行和游戏结束事件
     */
    onEvents() {
        super.onEvents();
        EventManager.on(EventTypes.GameEvents.GameRun, this.onGameRun, this);
        EventManager.on(EventTypes.GameEvents.GameOver, this.onGameOver, this);
    }

    /**
     * 设置微信平台的广告配置
     * 子类应在此方法中配置微信小游戏的广告ID
     */
    protected setAdCfg(): void {
        // 在子类中配置广告ID
        // this.adConfig.adBannerIdList = ["your_banner_id"];
        // this.adConfig.adVideoIdList = ["your_video_id"];
        // this.adConfig.adInterstitialId = "your_interstitial_id"];
        // this.adConfig.adCustomIdList = ["your_custom_id"];
        // this.adConfig.shareInfoArr = [{ title: "一起来玩吧!", img: '' }];
    }

    /**
     * 显示微信平台激励视频广告
     * 在基类基础上增加了广告位索引参数，支持多个激励视频广告位
     * @param cb 回调函数，支持Function或{success, fail, cancel}对象形式
     * @param idx 激励视频广告位索引，默认为0
     */
    protected showRewardedVideo(cb: Function | { success: Function, fail: Function, cancel: Function }, idx = 0) {
        let success = null, fail = null, cancel = null;
        if (typeof cb === 'object') {
            success = cb.success; fail = cb.fail; cancel = cb.cancel;
        } else {
            success = cb;
        }
        EventManager.emit(EventTypes.GameEvents.GamePause);
        AudioSystem.pauseBGM();

        if (typeof uniSdk !== 'undefined' && uniSdk.showRewardedVideo) {
            uniSdk.showRewardedVideo(idx, (status: number) => {
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

    /** 游戏运行事件处理，子类可覆写实现具体逻辑 */
    protected onGameRun() { }
    /**
     * 游戏结束事件处理
     * @param isWin 是否胜利，可选
     */
    protected onGameOver(isWin?: boolean) { }
}
