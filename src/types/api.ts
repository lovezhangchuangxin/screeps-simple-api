import { RoomObject } from "./object";

/**
 * 配置对象
 */
export interface IConfig {
  /**
   * 官服可以生成 token，私服不一定有 token 则可以填写用户名和密码
   */
  token?: string;
  /**
   * 邮箱
   */
  email?: string;
  /**
   * 密码
   */
  password?: string;
  /**
   * 域名+端口
   */
  host?: string;
  /**
   * 是否使用 https
   */
  secure?: boolean;
  /**
   * 超时时间
   */
  timeout?: number;
}

/**
 * 请求限制
 */
export interface IRateLimit {
  /**
   * 限制次数
   */
  limit: number;
  period: "minute" | "hour" | "day";
  /**
   * 剩余次数
   */
  remaining: number;
  /**
   * 重置时间（s）
   */
  reset: number;
}

/**
 * screeps 通用接口
 */
export interface IScreepsResData {
  ok?: number;
  error?: string;
  [key: string]: unknown;
}

/**
 * 普通消息
 */
export interface IMessage {
  _id: string;
  date: string;
  type: "in" | "out";
  text: string;
  unread: boolean;
}

/**
 * 详细消息对象
 */
export interface IDetailedMessage extends IMessage {
  respondent: string;
  user: string;
  outMessage: string;
}

/**
 * 8 for 1h, 180 for 24h and 1440 for 7 days
 */
export type Interval = 8 | 180 | 1440;
/**
 * 分片名
 */
export type Shard = "shard0" | "shard1" | "shard2" | "shard3";
/**
 * 地形
 */
export type Terrain = "plain" | "swamp" | "wall";

export type CreepLostType = "creepsLost8" | "creepsLost180" | "creepsLost1440";
export type Owner = "owner0";

export type CreepLost = {
  [key in CreepLostType]: {
    user: string;
    value: number;
  }[];
};

/**
 * 房间统计类型
 */
export type RoomStats =
  | "energyHarvested"
  | "energyConstruction"
  | "energyCreeps"
  | "energyControl"
  | "creepsProduced"
  | "creepsLost"
  | "powerProcessed";
/**
 * 房间一段时间的统计类型
 */
export type RoomStatsMax =
  | "creepsProduced180"
  | "power1440"
  | "powerProcessed1440"
  | "energy180"
  | "energyCreeps180"
  | "energyConstruction180"
  | "energy1440"
  | "energyControl1440"
  | "energyCreeps1440"
  | "energyHarvested180"
  | "energy8"
  | "energyControl8"
  | "power8"
  | "powerProcessed8"
  | "creepsProduced8"
  | "energyConstruction8"
  | "creepsProduced1440"
  | "creepsLost8"
  | "creepsLost180"
  | "power180"
  | "powerProcessed180"
  | "energyControl180"
  | "energyHarvested8"
  | "energyCreeps8"
  | "energyConstruction1440"
  | "energyHarvested1440"
  | "creepsLost1440";

/**
 * 头像
 */
export interface IBadge {
  type: number;
  color1: number;
  color2: number;
  color3: number;
  param: number;
  flip: boolean;
}

/**
 * 用户对象
 */
export interface IUser {
  username: string;
  /**
   * 头像，invader 和 sourcekeeper 没有
   */
  badge?: IBadge;
}

/**
 * 订单
 */
export interface IOrder {
  _id: string;
  type: "buy" | "sell";
  amount: number;
  remainingAmount: number;
  price: number;
  roomName: string;
}

/**
 * 我的订单
 */
export interface IMyOrder extends IOrder {
  createdTimestamp: number;
  user: string;
  active: boolean;
  resourceType: MarketResourceConstant;
  totalAmount: number;
  created: number;
}

/**
 * 所有消息
 */
export interface IMessageIndex extends IScreepsResData {
  messages: {
    _id: string;
    message: IDetailedMessage;
  }[];
  users: {
    [userId: string]: { _id: string } & IUser;
  };
}

/**
 * 指定会话的消息列表
 */
export interface IMessageList extends IScreepsResData {
  messages: IMessage[];
}

/**
 * 未读消息
 */
export interface IMessageUnRead extends IScreepsResData {
  count: number;
}

/**
 * 房间概览
 */
export interface IRoomOverview extends IScreepsResData {
  owner: IUser;
  stats: {
    [type in RoomStats]: { value: number; endTime: number }[];
  };
  statsMax: {
    [type in RoomStatsMax]: number;
  };
  totals: object;
}

/**
 * 房间地形
 */
export interface IRoomTerrain extends IScreepsResData {
  terrain: { room: string; x: number; y: number; type: "swamp" | "wall" }[];
}

/**
 * 房间地形（编码后）
 */
export interface IRoomTerrainEncoded extends IScreepsResData {
  terrain: {
    _id: string;
    room: string;
    /**
     * terrain is a string of digits, giving the terrain left-to-right and top-to-bottom.
     * 0: plain, 1: wall, 2: swamp, 3: also wall
     */
    terrain: string;
    type: "terrain";
  }[];
}

/**
 * 房间状态
 */
export interface IRoomStatus extends IScreepsResData {
  rooms: {
    _id: string;
    status: "normal" | "out of borders";
    respawnArea?: number;
    novice?: number;
  } | null;
}

/**
 * 房间对象
 */
export interface IRoomObjects extends IScreepsResData {
  objects: RoomObject[];
  users: {
    [userId: string]: { _id: string } & IUser;
  };
}

/**
 * pvp数据
 */
export interface IPvpData extends IScreepsResData {
  pvp: {
    [shard in Shard]: {
      time: number;
      rooms: {
        _id: string;
        lastPvpTime: number;
      }[];
    };
  };
}

/**
 * 核弹数据
 */
export interface INukesData extends IScreepsResData {
  nukes: {
    [shard in Shard]: {
      _id: string;
      type: string;
      room: string;
      x: number;
      y: number;
      landTime: number;
      launchRoomName: string;
    }[];
  };
}

/**
 * 市场资源信息
 */
export interface IMarketOrdersIndex extends IScreepsResData {
  list: {
    _id: MarketResourceConstant;
    count: number;
    avgPrice: number;
    stddevPrice: number;
  }[];
}

/**
 * 订单列表
 */
export interface IOrders extends IScreepsResData {
  list: IOrder[];
}

/**
 * 我的订单
 */
export interface IMyOrders extends IScreepsResData {
  shards: {
    [shard in Shard]: IMyOrder[];
  };
}

/**
 * 交易记录
 */
export type IMoneyHistory = IScreepsResData;

/**
 * seasons数据
 */
export interface ISeasons extends IScreepsResData {
  seasons: {
    _id: string;
    name: string;
    date: string;
  }[];
}

/**
 * 排名数据
 */
export interface IRank extends IScreepsResData {
  _id: string;
  season: string;
  user: string;
  score: number;
  rank: number;
}

/**
 * 排名列表
 */
export interface IRankList extends IScreepsResData {
  list: IRank[];
}

/**
 * 我的信息
 */
export interface IMyInfo extends IScreepsResData {
  _id: string;
  email: string;
  username: string;
  cpu: number;
  badge: IBadge;
  password: boolean;
  notifyPrefs: {
    sendOnline: boolean;
    disabledOnMessages: boolean;
  };
  gcl: number;
  credits: number;
  power: number;
  money: number;
  subscriptionTokens: number;
  cpuShard: {
    [shard in Shard]?: number;
  };
  cpuShardUpdatedTime: number;
  runtime: object;
  powerExperimentations: number;
  powerExperimentationTime: number;
  resources: {
    accessKey: number;
    pixel: number;
    cpuUnlock: number;
  };
  playerColor: null;
  promoPixels: null;
  steam: {
    id: string;
    displayName: string;
    ownership: number[];
  };
}

/**
 * 所有房间，包括预定房间
 */
export interface IAllRooms extends IScreepsResData {
  /**
   * 占有的房间
   */
  shards: {
    [shard in Shard]: string[];
  };
  /**
   * 预定的房间
   */
  reservations: {
    [shard in Shard]: string[];
  };
}

/**
 * 用户信息
 */
export interface IUserInfo extends IScreepsResData {
  user: {
    _id: string;
    steam: {
      id: string;
    };
    username: "keqing";
    /**
     * 注意，gcl是指控制器的总升级点数，不是GCL
     */
    gcl: number;
    power: number;
  } & IUser;
}

/**
 * 提交代码到控制台
 */
export interface IConsole extends IScreepsResData {
  result: {
    ok: number;
    n: number;
  };
  ops: {
    user: string;
    expression: string;
    shard: Shard;
    _id: string;
  }[];
  insertedCount: number;
  insertedIds: string[];
}

export interface IServer {
  _id: string;
  settings: {
    host: string;
    port: string;
    pass: string;
  };
  name: string;
  status: string;
  likeCount: number;
}

export interface IServers extends IScreepsResData {
  servers: IServer[];
}

export interface IAllShardInfo extends IScreepsResData {
  shards: {
    name: Shard;
    lastTicks: number[];
    cpuLimit: number;
    rooms: number;
    users: number;
    tick: number;
  }[];
}

export interface IMapStats extends IScreepsResData {
  decorations: unknown;
  gameTime: number;
  stats: {
    [roomName: string]: {
      novice?: number;
      own?: {
        user: string;
        level: number;
      };
      respawnArea?: number;
      sign: {
        user: string;
        text: string;
        time: number;
        datetime: number;
      };
      status: string;
    } & CreepLost;
  };
  statsMax: {
    [key in CreepLostType]: number;
  };
  users: {
    [userId: string]: {
      _id: string;
    } & IUser;
  };
}
