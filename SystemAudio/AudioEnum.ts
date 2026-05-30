/**
 * 音频枚举定义模块
 * 定义游戏中所有音频资源的名称枚举，包括音效和背景音乐。
 * 枚举值对应AudioAssets Bundle中音频资源的文件名，用于AudioSystem的播放调用。
 */

/** 音频名称枚举 */
export enum AudioEnum {
    /** 按钮点击音效 */
    BtnClick = 'BtnClick',
    /** 胜利音效 */
    Win = 'Win',
    /** 失败音效 */
    Lose = 'Lose',
    /** 主页背景音乐 */
    homeBgm = 'homeBgm',
    /** 关卡背景音乐 */
    lvBgm = 'lvBgm',
}
