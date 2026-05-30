import SDK from "./SDK";

export class OPPOSDK extends SDK {
    protected setAdCfg(): void {
        // this.adConfig.app_key = 'your_app_key';
        // this.adConfig.adBannerIdList = ["your_banner_id"];
        // this.adConfig.adVideoIdList = ["your_video_id"];
        // this.adConfig.adInterstitialId = "your_interstitial_id";
        // this.adConfig.adCustomIdList = ["your_custom_id"];
    }

    protected showBanner() { }
    protected hideBanner() { }
    protected showInterstitial(cb1?: Function, cb2?: Function) { cb2 && cb2(); }
    protected showCustomAd(adIndex: number) { }
    protected hideCustomAd(adIndex: number) { }

    protected onExitApp() {
        if (window["qg"]) {
            window["qg"].exitApplication({});
        }
    }
}
