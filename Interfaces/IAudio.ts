/**
 * 音频系统接口
 * 定义音频系统的公共API，用于依赖注入和解耦
 * 业务代码通过此接口访问音频功能，而非直接引用 AudioSystem 静态类
 */
export interface IAudio {
    /** 音效和背景音乐的开关状态 */
    audioSwitch: { Effects: boolean; Bgm: boolean };
    /** 初始化音频系统 */
    init(): void;
    /** 设置音频总开关 */
    setAudioState(isOpen: boolean): void;
    /** 设置音频暂停状态（游戏暂停时使用） */
    setPaused(v: boolean): void;
    /** 播放音效（限频，同一种音效间隔100ms） */
    playEffectLimit(clip: string, d?: { isLoop: boolean; volume?: number }): void;
    /** 播放音效 */
    playEffect(clip: string, d?: { isLoop: boolean; volume?: number }): void;
    /** 停止音效 */
    stopEffect(clip?: string): void;
    /** 播放背景音乐 */
    playBGM(clip: string): void;
    /** 停止背景音乐 */
    stopBGM(): void;
    /** 暂停背景音乐 */
    pauseBGM(): void;
    /** 恢复背景音乐 */
    resumeBGM(): void;
}
