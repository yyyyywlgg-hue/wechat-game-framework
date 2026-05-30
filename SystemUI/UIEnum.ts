/**
 * UI枚举定义模块
 * 定义游戏中所有UI界面的名称枚举，确保UI名称在整个项目中统一且类型安全。
 * 每个枚举值对应一个UI预制体的名称，用于UISystem的showUI/hideUI调用。
 */

/** UI界面名称枚举 */
export enum UIEnum {
    /** 主界面 */
    HomeUI = 'HomeUI',
    /** 设置界面 */
    SettingUI = 'SettingUI',
    /** 隐私政策界面 */
    PrivacyUI = 'PrivacyUI',
    /** 提示弹窗界面 */
    TipUI = 'TipUI',
    /** 自定义广告界面 */
    CustomAdUI = 'CustomAdUI',
}
