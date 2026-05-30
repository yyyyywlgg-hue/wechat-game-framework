import { Node } from "cc";
import { BasicSystem } from "../Basic/BasicSystem";
import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { PlatformType, SDKSystem } from "../SystemSDK/SDKSystem";
import { StorageSystem } from "../SystemStorage/StorageSystem";
import { clog } from "../Tools/ColorLog";

export interface AdUIConfig {
    [uiName: string]: {
        banner?: boolean;
        customAd?: number[];
    };
}

export class AdvertSystem extends BasicSystem {
    private static uiLayer: Node = null;
    private static _adUIConfig: { [platform: number]: AdUIConfig } = {};
    public static startLv = 0;

    public static init(uiLayer?: any): void {
        this.uiLayer = uiLayer;
        if (this.isInit) return;
        this.isInit = true;
        this.onEvents();
        this.isInitFinished = true;
    }

    public static setAdUIConfig(platform: PlatformType, config: AdUIConfig) {
        this._adUIConfig[platform] = config;
    }

    public static onEvents() {
        EventManager.on(EventTypes.GameEvents.UIChanged, this.onUIChanged, this);
    }

    public static onUIChanged() {
        let data = StorageSystem.getData();
        if (!data || !data.levelAssets) return;
        if (data.levelAssets.curLv <= this.startLv) return;

        let cfg = this._adUIConfig[SDKSystem._curPlatform];
        if (!cfg) return;

        let adCfg = this.getTopActiveUI(cfg);
        if (!adCfg) return;

        if (adCfg.banner !== undefined) {
            if (adCfg.banner) {
                EventManager.emit(EventTypes.SDKEvents.ShowBanner);
            } else {
                EventManager.emit(EventTypes.SDKEvents.HideBanner);
            }
        }
    }

    public static getTopActiveUI(adCfg: AdUIConfig) {
        if (!this.uiLayer) return null;
        for (let i = this.uiLayer.children.length - 1; i >= 0; i--) {
            const node = this.uiLayer.children[i];
            if (node) {
                const ui = node.children[0];
                if (ui && ui.active && adCfg[ui.name]) {
                    clog.mark('TopUI: ', ui.name);
                    return adCfg[ui.name];
                }
            }
        }
        return null;
    }
}
