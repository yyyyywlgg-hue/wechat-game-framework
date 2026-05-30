/**
 * 服务定位器（Service Locator）
 * 核心依赖注入容器，用于解耦业务代码与具体系统实现。
 * 
 * 设计目的：
 * 1. 业务代码通过接口调用服务，而非直接引用静态类
 * 2. 测试时可注入Mock实现，无需初始化真实引擎
 * 3. 支持运行时替换服务实现，便于扩展和切换
 * 
 * 使用方式：
 * // 注册服务（在Init.ts中）
 * ServiceLocator.register(IStorage, StorageSystem);
 * 
 * // 获取服务（在业务代码中）
 * let storage = ServiceLocator.get(IStorage);
 * storage.getData();
 * 
 * // 测试时注入Mock
 * ServiceLocator.register(IStorage, new MockStorage());
 */

/** 服务标识类型，可以是接口构造函数或字符串key */
export type ServiceKey = (new (...args: any[]) => any) | string;

export class ServiceLocator {
    /** 已注册的服务实例映射表 */
    private static services: Map<ServiceKey, any> = new Map();

    /**
     * 注册服务实现
     * 如果key已存在，将覆盖原有实现
     * @param key 服务标识（接口构造函数或字符串key）
     * @param implementation 服务实现实例
     */
    public static register<T>(key: ServiceKey, implementation: T): void {
        this.services.set(key, implementation);
    }

    /**
     * 获取服务实例
     * @param key 服务标识（接口构造函数或字符串key）
     * @returns 服务实现实例，未注册时返回null
     */
    public static get<T>(key: ServiceKey): T {
        let service = this.services.get(key);
        if (service === undefined) {
            console.error(`[ServiceLocator] 服务未注册: ${typeof key === 'string' ? key : key.name}`);
            return null;
        }
        return service as T;
    }

    /**
     * 检查服务是否已注册
     * @param key 服务标识
     * @returns 是否已注册
     */
    public static has(key: ServiceKey): boolean {
        return this.services.has(key);
    }

    /**
     * 重置单个服务（测试时替换Mock用）
     * @param key 服务标识
     */
    public static resetOne(key: ServiceKey): void {
        this.services.delete(key);
    }

    /**
     * 重置所有服务（测试清理用）
     * 清空所有已注册的服务实例
     */
    public static reset(): void {
        this.services.clear();
    }

    /**
     * 获取所有已注册的服务key列表（调试用）
     * @returns 服务key数组
     */
    public static getRegisteredKeys(): ServiceKey[] {
        return Array.from(this.services.keys());
    }
}
