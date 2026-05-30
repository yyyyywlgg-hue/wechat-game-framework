/**
 * 全局临时数据管理器
 * 用于存储游戏运行期间的临时状态数据，如游戏运行状态、时间信息等。
 * 这些数据在游戏重置时需要被清空，不进行持久化存储。
 */

/** 全局临时数据类，使用静态属性和方法管理游戏运行时的临时状态 */
export class GlobalTmpData {
    /** 时间缩放因子，1.0 为正常速度，可用于慢动作或加速效果 */
    public static timeScale = 1.0;

    /** 游戏运行状态数据对象 */
    public static Game = {
        /** 游戏是否正在运行 */
        isGameRun: false,
        /** 游戏是否暂停 */
        isPause: false,
        /** 游戏是否结束 */
        isGameOver: false,
        /** 当前是否为引导关卡 */
        isGuideLv: false,
        /** 引导是否已完成 */
        isGuideFinish: false,
        /** 游戏开始时间戳 */
        startTime: 0,
        /** 游戏总时长（秒） */
        totalTime: 0,
        /** 当前游戏时长（秒） */
        gameTime: 0,
        /** 游戏结束时间戳 */
        endTime: 0,
    }

    /**
     * 重置所有临时数据为初始值
     * 将时间缩放、游戏状态和时间信息全部恢复为默认值，
     * 通常在游戏重新开始或切换场景时调用
     */
    public static reset() {
        this.timeScale = 1.0;
        this.Game.isGameRun = false;
        this.Game.isGameOver = false;
        this.Game.isGuideLv = false;
        this.Game.isGuideFinish = false;
        this.Game.isPause = false;
        this.Game.startTime = 0;
        this.Game.totalTime = 0;
        this.Game.gameTime = 0;
        this.Game.endTime = 0;
    }
}
