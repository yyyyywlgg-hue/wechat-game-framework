/**
 * 存档数据模板模块
 * 定义游戏存档的数据结构模板，作为存档数据的默认值和类型约束。
 * 新增存档字段时需要在此模板中添加默认值，存储系统会自动将新字段合并到旧存档中。
 */

/** 存档数据根结构 */
export class StorageTemp {
    /** 用户设置数据 */
    userSetting: UserSetting;
    /** 关卡进度数据 */
    levelAssets: LevelAssets;
    constructor() {
        this.userSetting = new UserSetting();
        this.levelAssets = new LevelAssets();
    }
}

/** 用户设置数据 */
export class UserSetting {
    /** 音频开关（true=开启，false=关闭） */
    AudioSwith = true;
    /** 震动开关（true=开启，false=关闭） */
    ShakeSwith = true;
    /** 是否需要显示隐私政策（true=需要显示，false=已同意不再显示） */
    showPrivacy = true;
}

/** 关卡进度数据 */
export class LevelAssets {
    /** 当前关卡编号，默认为1 */
    curLv = 1;
    /** 已解锁的最大关卡编号，默认为1 */
    maxLv = 1;
}
