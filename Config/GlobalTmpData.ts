export class GlobalTmpData {
    public static timeScale = 1.0;

    public static Game = {
        isGameRun: false,
        isPause: false,
        isGameOver: false,
        isGuideLv: false,
        isGuideFinish: false,
        startTime: 0,
        totalTime: 0,
        gameTime: 0,
        endTime: 0,
    }

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
