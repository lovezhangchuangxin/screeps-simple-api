import BasicApi from "./BasicApi";
import Socket from "./Socket";
import {
  CreepLostType,
  IAllRooms,
  IAllShardInfo,
  IConfig,
  IConsole,
  IMapStats,
  IMarketOrdersIndex,
  IMessageIndex,
  IMessageList,
  IMessageUnRead,
  IMoneyHistory,
  IMyInfo,
  IMyOrders,
  Interval,
  INukesData,
  IOrders,
  IPvpData,
  IRankList,
  IRoomObjects,
  IRoomOverview,
  IRoomStatus,
  IRoomTerrain,
  IRoomTerrainEncoded,
  ISeasons,
  IServers,
  IUserInfo,
  Owner,
  Shard,
} from "./types/api";

/**
 * ScreepsApi
 */
export default class ScreepsApi extends BasicApi {
  /**
   * socket
   */
  public socket: Socket;

  constructor(config: IConfig) {
    super(config);
    this.socket = new Socket(this);
  }

  /**
   * 获取所有消息
   */
  public async getMessage() {
    return await this.req<IMessageIndex>("GET", "/user/messages/index");
  }

  /**
   * 获取指定 respondent 的消息
   * @param respondent 会话 id
   */
  public async getMessageByRespondent(respondent: string) {
    return await this.req<IMessageList>("GET", "/user/messages/list", {
      respondent,
    });
  }

  /**
   * 获取未读消息数量
   */
  public async getUnreadMessageCount() {
    return await this.req<IMessageUnRead>("GET", "/user/messages/unread-count");
  }

  /**
   * 发送消息
   * @param respondent 会话 id
   * @param text 消息内容
   */
  public async sendMessage(respondent: string, text: string) {
    return await this.req("POST", "/user/messages/send", {
      respondent,
      text,
    });
  }

  /**
   * 标记消息为已读
   * @param id 消息 id
   */
  public async markMessageAsRead(id: string) {
    return await this.req("POST", "/user/messages/mark-read", {
      id,
    });
  }

  /**
   * 获取房间概览
   * @param room 房间名
   * @param shard 分片名
   * @param interval 8, 180, 1440 (8 for 1h, 180 for 24h and 1440 for 7 days)
   */
  public async getRoomOverview(
    room: string,
    shard: Shard,
    interval: Interval = 8
  ) {
    return await this.req<IRoomOverview>("GET", "/game/room-overview", {
      room,
      shard,
      interval,
    });
  }

  /**
   * 获取房间地形
   * @param room 房间名
   * @param shard 分片名
   */
  public async getRoomTerrain(
    room: string,
    shard: Shard
  ): Promise<IRoomTerrain>;

  /**
   * 获取房间地形
   * @param room 房间名
   * @param shard 分片名
   * @param encoded 是否编码
   */
  public async getRoomTerrain(
    room: string,
    shard: Shard,
    encoded: unknown
  ): Promise<IRoomTerrainEncoded>;
  public async getRoomTerrain(room: string, shard: Shard, encoded?: unknown) {
    return await this.req("GET", "/game/room-terrain", {
      room,
      shard,
      encoded,
    });
  }

  /**
   * 获取房间状态
   * @param room 房间名
   * @param shard 分片名
   */
  public async getRoomStatus(room: string, shard: Shard) {
    return await this.req<IRoomStatus>("GET", "/game/room-status", {
      room,
      shard,
    });
  }

  /**
   * 获取房间对象
   * @param room 房间名
   * @param shard 分片名
   */
  public async getRoomObject(room: string, shard: Shard) {
    return await this.req<IRoomObjects>("GET", "/game/room-objects", {
      room,
      shard,
    });
  }

  /**
   * 获取 pvp 数据
   * @param interval 时间间隔
   */
  public async getPvp(interval = 100) {
    return await this.req<IPvpData>("GET", "/experimental/pvp", {
      interval,
    });
  }

  /**
   * 获取 nuker 数据
   */
  public async getNukes() {
    return await this.req<INukesData>("GET", "/experimental/nukes");
  }

  /**
   * 获取市场资源信息
   */
  public async getMarketOrdersIndex(shard: Shard) {
    return await this.req<IMarketOrdersIndex>(
      "GET",
      "/game/market/orders-index",
      { shard }
    );
  }

  /**
   * 获取我的订单
   */
  public async getMyOrders() {
    return await this.req<IMyOrders>("GET", "/game/market/my-orders");
  }

  /**
   * 获取指定资源的订单，全局资源不用加 shard 参数
   * @param resourceType 资源类型
   * @param shard 分片名
   */
  public async getOrdersByResourceType(
    resourceType: ResourceConstant,
    shard?: Shard
  ) {
    return await this.req<IOrders>("GET", "/game/market/orders", {
      resourceType,
      shard,
    });
  }

  /**
   * 获取交易记录
   */
  public async getMoneyHistory() {
    return await this.req<IMoneyHistory>("GET", "/user/money-history");
  }

  /**
   * 获取 seasons 数据
   */
  public async getSeasons() {
    return await this.req<ISeasons>("GET", "/leaderboard/seasons");
  }

  /**
   * 获取某人某赛季排名
   * @param username 用户名
   * @param mode 模式，world or power
   */
  public async getRank(
    username: string,
    mode: "world" | "power"
  ): Promise<IRankList>;
  /**
   * 获取某人某赛季排名
   * @param username 用户名
   * @param mode 模式，world or power
   * @param season 赛季
   */
  public async getRank(
    username: string,
    mode: "world" | "power",
    season: string
  ): Promise<IRankList>;
  public async getRank(
    username: string,
    mode: "world" | "power",
    season?: string
  ) {
    return await this.req("GET", "/leaderboard/find", {
      username,
      mode,
      season,
    });
  }

  /**
   * 获取我的信息
   */
  public async getMyInfo() {
    return await this.req<IMyInfo>("GET", "/auth/me");
  }

  /**
   * 获取我的名字
   */
  public async getMyName() {
    return await this.req<{ username: string }>("GET", "/user/name");
  }

  /**
   * 获取指定用户的所有房间（包括预定房间）
   * @param id 用户 id
   */
  public async getRooms(id: string) {
    return await this.req<IAllRooms>("GET", "/user/rooms", {
      id,
    });
  }

  /**
   * 查找指定 id 的用户信息
   * @param userId 用户 id
   */
  public async getUserInfoByUseId(userId: string) {
    return await this.req<IUserInfo>("GET", "/user/find", {
      userId,
    });
  }

  /**
   * 查找指定用户名的用户信息
   * @param username 用户名
   */
  public async getUserInfoByUserName(username: string) {
    return await this.req<IUserInfo>("GET", "/user/find", {
      username,
    });
  }

  /**
   * 提交代码到控制台
   * @param expression 代码
   */
  public async console(expression: string, shard: Shard) {
    return await this.req<IConsole>("POST", "/user/console", {
      expression,
      shard,
    });
  }

  /**
   * 获取服务器列表
   */
  public async getServers() {
    return await this.req<IServers & { likes: unknown[] }>(
      "POST",
      "/servers/list"
    );
  }

  /**
   * 获取各 shard 信息
   */
  public async getShards() {
    return await this.req<IAllShardInfo>("GET", "/game/shards/info");
  }

  /**
   * 获取游戏时间
   * @param shard 分片名
   */
  public async getGameTime(shard: Shard) {
    return await this.req<{ time: number }>("GET", "/game/time", {
      shard,
    });
  }

  /**
   * 查询地图数据
   */
  public async getMapStats(
    rooms: string[],
    shard: Shard,
    statName: CreepLostType | Owner
  ) {
    return await this.req<IMapStats>("POST", "/game/map-stats", {
      rooms,
      shard,
      statName,
    });
  }
}
