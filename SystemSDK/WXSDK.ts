import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { AudioSystem } from "../SystemAudio/AudioSystem";
import SDK from "./SDK";

export class WXSDK extends SDK {
    onEvents() {
        super.onEvents();
        EventManager.on(EventTypes.GameEvents.GameRun, this.onGameRun, this);
        EventManager.on(EventTypes.GameEvents.GameOver, this.onGameOver, this);
    }

    protected setAdCfg(): void {
        // 在子类中配置广告ID
        // this.adConfig.adBannerIdList = ["your_banner_id"];
        // this.adConfig.adVideoIdList = ["your_video_id"];
        // this.adConfig.adInterstitialId = "your_interstitial_id";
        // this.adConfig.adCustomIdList = ["your_custom_id"];
        // this.adConfig.shareInfoArr = [{ title: "一起来玩吧!", img: '' }];
    }

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

    protected onGameRun() { }
    protected onGameOver(isWin?: boolean) { }
}
