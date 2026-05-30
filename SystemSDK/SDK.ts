import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { AudioSystem } from "../SystemAudio/AudioSystem";

export interface AdConfig {
    app_key?: string;
    adBannerIdList?: string[];
    adVideoIdList?: string[];
    adInterstitialId?: string;
    adCustomIdList?: string[];
    shareInfoArr?: { title: string; img: string }[];
    isExportWxGameAd?: boolean;
    adBoxPortalId?: string;
    adBoxBannerId?: string;
}

export default class SDK {
    protected api = null;
    protected adConfig: any = null;

    public init(callback?: Function, target?: any) {
        this.onEvents();
        this.adConfig = {};
        this.setAdCfg();
        this.initSdk(callback, target);
    }

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

    protected setAdCfg() { }

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

    protected showMessage(msg: string) {
        EventManager.emit(EventTypes.GameEvents.ShowTips, msg);
    }

    protected showBanner() {
        if (typeof uniSdk !== 'undefined') uniSdk.showBanner();
    }

    protected hideBanner() {
        if (typeof uniSdk !== 'undefined') uniSdk.hideBanner();
    }

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

    protected showCustomAd(adIndex: number) {
        if (typeof uniSdk !== 'undefined' && uniSdk.showCustomAd) {
            uniSdk.showCustomAd(adIndex, (showed: boolean) => {
                if (!showed && uniSdk.showInterstitial) uniSdk.showInterstitial();
            }, () => { }, this);
        }
    }

    protected hideCustomAd(adIndex: number) {
        if (typeof uniSdk !== 'undefined' && uniSdk.hideCustomAd) {
            uniSdk.hideCustomAd(adIndex);
        }
    }

    protected share() {
        if (typeof uniSdk !== 'undefined') uniSdk.share();
    }

    protected onExitApp() { }
}
