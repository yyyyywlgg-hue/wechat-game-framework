/**
 * 广告系统模块
 * 负责根据当前UI界面和平台配置，自动控制Banner广告的显示和隐藏。
 * 通过监听UI切换事件，查找当前最上层活跃UI对应的广告配置，
 * 按需显示或隐藏Banner广告。支持按平台配置不同UI的广告策略。
 */

import { Node } from "cc";
import { BasicSystem } from "../Basic/BasicSystem";
import EventManager from "../Managers/EventManager";
import { EventTypes } from "../Managers/EventTypes";
import { PlatformType, SDKSystem } from "../SystemSDK/SDKSystem";
import { StorageSystem } from "../SystemStorage/StorageSystem";
import { clog } from "../Tools/ColorLog";

/** 广告UI配置接口，定义每个UI界面的广告展示策略 */
export interface AdUIConfig {
    /** 键为UI名称，值为该UI的广告配置 */
    [uiName: string]: {
        /** 是否显示Banner广告，undefined表示不改变当前状态 */
        banner?: boolean;
        /** 需要显示的自定义广告索引列表 */
        customAd?: number[];
    };
}

/** 广告系统类，根据UI状态自动控制广告展示 */
export class AdvertSystem extends BasicSystem {
    /** UI层节点，用于遍历查找当前活跃的UI */
    private static uiLayer: Node = null;
    /** 各平台的广告UI配置，键为PlatformType枚举值 */
    private static _adUIConfig: { [platform: number]: AdUIConfig } = {};
    /** 开始展示广告的关卡编号，低于此关卡不展示广告，默认为0 */
    public static startLv = 0;

    /**
     * 初始化广告系统
     * @param uiLayer UI层节点，用于遍历查找活跃UI，可选
     */
    public static init(uiLayer?: any): void {
        this.uiLayer = uiLayer;
        if (this.isInit) return;
        this.isInit = true;
        this.onEvents();
        this.isInitFinished = true;
    }

    /**
     * 设置指定平台的广告UI配置
     * @param platform 平台类型
     * @param config 广告UI配置对象
     */
    public static setAdUIConfig(platform: PlatformType, config: AdUIConfig) {
        this._adUIConfig[platform] = config;
    }

    /** 注册UI切换事件监听 */
    public static onEvents() {
        EventManager.on(EventTypes.GameEvents.UIChanged, this.onUIChanged, this);
    }

    /**
     * UI切换事件处理
     * 根据当前关卡、平台和最上层活跃UI的广告配置，控制Banner广告的显示/隐藏
     * 逻辑：
     * 1. 检查当前关卡是否达到广告展示条件
     * 2. 获取当前平台的广告配置
     * 3. 查找最上层活跃UI对应的广告配置
     * 4. 根据配置显示或隐藏Banner广告
     */
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

    /**
     * 获取当前最上层活跃UI的广告配置
     * 从UI层的最上层子节点开始向下查找，返回第一个活跃UI对应的广告配置
     * @param adCfg 广告UI配置对象
     * @returns 最上层活跃UI的广告配置，未找到则返回null
     */
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
