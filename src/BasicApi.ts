import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosError,
  AxiosResponse,
} from "axios";
import { inflate, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { IConfig, IMyInfo, IRateLimit, IScreepsResData } from "./types/api";
import { debug, defaultLimit, sleep } from "./utils";

const inflateAsync = promisify(inflate);
const gunzipAsync = promisify(gunzip);

export default class BasicApi {
  /**
   * 配置信息
   */
  public config: IConfig;
  /**
   * 最新的 token
   */
  protected token = "";
  /**
   * axios 的实例，设置了 baseURL
   */
  public request: AxiosInstance;
  /**
   * 是否正在 auth
   */
  private __isAuthing = false;
  /**
   * 玩家 id
   */
  protected userId = "";
  /**
   * 请求限制
   */
  protected rateLimits: {
    global: IRateLimit;
    GET: { [key: string]: IRateLimit };
    POST: { [key: string]: IRateLimit };
  } = {
    global: defaultLimit(120, "minute"),
    GET: {
      "/game/room-terrain": defaultLimit(360, "hour"),
      "/user/code": defaultLimit(60, "hour"),
      "/user/memory": defaultLimit(1440, "day"),
      "/user/memory-segment": defaultLimit(360, "hour"),
      "/game/market/orders-index": defaultLimit(60, "hour"),
      "/game/market/orders": defaultLimit(60, "hour"),
      "/game/market/my-orders": defaultLimit(60, "hour"),
      "/game/market/stats": defaultLimit(60, "hour"),
      "/game/user/money-history": defaultLimit(60, "hour"),
    },
    POST: {
      "/user/console": defaultLimit(360, "hour"),
      "/game/map-stats": defaultLimit(60, "hour"),
      "/user/code": defaultLimit(240, "day"),
      "/user/set-active-branch": defaultLimit(240, "day"),
      "/user/memory": defaultLimit(240, "day"),
      "/user/memory-segment": defaultLimit(60, "hour"),
    },
  };

  /**
   * 构造函数
   * @param config
   */
  constructor(config: IConfig) {
    this.config = { host: "screeps.com", secure: true, ...config };
    this.auth();
    this.request = axios.create({
      baseURL: this.getBaseURL(),
      timeout: config.timeout || 7000,
    });
    this.addRequestInterceptor();
  }

  /**
   * 获取请求路径前缀
   */
  public getBaseURL() {
    const { host, secure } = this.config;
    return `${secure ? "https" : "http"}://${host}/api`;
  }

  /**
   * 获取 token
   */
  public getToken() {
    return this.token;
  }

  /**
   * 获取请求限制
   */
  public getRateLimit(method: "GET" | "POST", path: string) {
    return this.rateLimits[method][path] || this.rateLimits.global;
  }

  /**
   * 登录获取 token
   */
  public async auth() {
    if (this.__isAuthing) return;
    this.__isAuthing = true;

    try {
      const { token, email, password } = this.config;
      if (token) {
        this.token = token;
        debug("auth success");
        return;
      }

      if (!email || !password) {
        debug("please set email and password");
        return;
      }

      const res = await axios.post(`${this.getBaseURL()}/auth/signin`, {
        email,
        password,
      });
      this.token = res.data.token;
      debug("auth success");
    } catch (error) {
      debug("auth fail");
    } finally {
      this.__isAuthing = false;
    }
  }

  /**
   * 添加请求拦截器
   */
  private addRequestInterceptor() {
    this.request.interceptors.request.use((config) => {
      if (this.token) {
        config.headers["X-Token"] = this.token;
        config.headers["X-Username"] = this.token;
      }
      return config;
    });
  }

  /**
   * 封装 get 请求和 post 请求
   */
  public async req<T = IScreepsResData>(
    method: "GET" | "POST",
    path: string,
    body: object = {}
  ): Promise<T> {
    const opt: AxiosRequestConfig = { method, url: path };
    if (method === "GET") {
      opt["params"] = body;
    } else {
      opt["data"] = body;
    }

    // 看一下速率是否有限制
    const rateLimit = this.getRateLimit(method, path);

    try {
      if (rateLimit.remaining <= 0) {
        const waitTime = rateLimit.reset * 1000 - Math.floor(Date.now());
        if (waitTime > 0) {
          await sleep(waitTime + Math.floor(Math.random() * 500));
        }
      }

      const res = await this.request(opt);
      const token = res.headers["x-token"];
      if (token) {
        // 更新 token
        this.token = token;
      }
      this.updateRateLimit(method, path, res);

      if (
        typeof res.data.data === "string" &&
        res.data.data.slice(0, 3) === "gz:"
      ) {
        res.data.data = await this.gunzip(res.data.data);
      }

      return res.data;
    } catch (error) {
      const res = (error as AxiosError).response;
      if (res) {
        this.updateRateLimit(method, path, res);
        if (res.status === 401) {
          if (this.__isAuthing) {
            await sleep(2000);
            return this.req(method, path, body);
          }

          // 重新登录
          await this.auth();
          return this.req(method, path, body);
        }

        // 速率受限
        if (res.status === 429) {
          const waitTime = rateLimit.reset * 1000 - Math.floor(Date.now());
          await sleep(
            Math.max(waitTime, 0) + Math.floor(Math.random() * 500 + 200)
          );
          return this.req(method, path, body);
        }

        if (res) {
          throw new Error(res.data as string);
        }
      }

      return this.req(method, path, body);
    }
  }

  /**
   * 更新速率限制
   */
  protected updateRateLimit(
    method: "GET" | "POST",
    path: string,
    res: AxiosResponse
  ) {
    if (!res.headers["x-ratelimit-limit"]) return;

    const limit = res.headers["x-ratelimit-limit"] as string;
    const remaining = res.headers["x-ratelimit-remaining"] as string;
    const reset = res.headers["x-ratelimit-reset"] as string;

    if (this.rateLimits[method][path]) {
      this.rateLimits[method][path].limit = +limit;
      this.rateLimits[method][path].remaining = +remaining;
      this.rateLimits[method][path].reset = +reset;
    } else {
      this.rateLimits.global.limit = +limit;
      this.rateLimits.global.remaining = +remaining;
      this.rateLimits.global.reset = +reset;
    }
  }

  /**
   * 解压数据
   */
  public async inflate(data: string) {
    const buffer = Buffer.from(data.slice(3), "base64");
    const result = await inflateAsync(buffer);
    return JSON.parse(result.toString());
  }

  /**
   * 解压数据
   */
  public async gunzip(data: string) {
    const buffer = Buffer.from(data.slice(3), "base64");
    const result = await gunzipAsync(buffer);
    return JSON.parse(result.toString());
  }

  /**
   * 获取我的 id
   */
  public async getUserId() {
    if (this.userId) return this.userId;

    const res = await this.req<IMyInfo>("GET", "/auth/me");
    this.userId = res._id;
    return this.userId;
  }
}
