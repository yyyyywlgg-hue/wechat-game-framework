export class StorageTemp {
    userSetting: UserSetting;
    levelAssets: LevelAssets;
    constructor() {
        this.userSetting = new UserSetting();
        this.levelAssets = new LevelAssets();
    }
}

export class UserSetting {
    AudioSwith = true;
    ShakeSwith = true;
    showPrivacy = true;
}

export class LevelAssets {
    curLv = 1;
    maxLv = 1;
}
