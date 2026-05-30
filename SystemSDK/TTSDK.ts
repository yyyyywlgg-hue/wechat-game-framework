import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import SDK from "./SDK";

export class TTSDK extends SDK {
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

    protected setAdCfg(): void {
        // this.adConfig.adBannerIdList = ["your_banner_id"];
        // this.adConfig.adVideoIdList = ["your_video_id"];
        // this.adConfig.adInterstitialId = "your_interstitial_id";
        // this.adConfig.shareInfoArr = [{ title: "一起来玩吧!", img: "" }];
        this.onShareAppMessage();
    }

    protected onShareAppMessage() {
        if (typeof window['tt'] !== 'undefined') {
            window['tt'].onShareAppMessage(() => ({
                title: '',
                imageUrl: '',
            }));
        }
    }

    protected onGameRun() { this.onStartRecord(); }
    protected onGameOver() { this.onStopRecord(); }

    protected onStartRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.startRecord();
        }
    }
    protected onPauseRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.pauseRecord();
        }
    }
    protected onResumeRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.resumeRecord();
        }
    }
    protected onStopRecord() {
        if (typeof uniSdk !== 'undefined' && uniSdk.AdPlat) {
            uniSdk.AdPlat.instance.stopRecord();
        }
    }
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
