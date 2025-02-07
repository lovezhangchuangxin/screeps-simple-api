import WebSocket from "ws";
import { URL } from "url";
import BasicApi from "./BasicApi";
import EventEmitter from "events";
import { sleep } from "./utils";

const DEFAULTS = {
  reconnect: true,
  resubscribe: true,
  keepAlive: true,
  maxRetries: 10,
  maxRetryDelay: 60 * 1000,
};

export default class Socket extends EventEmitter {
  /**
   * 选项
   */
  public opts = Object.assign({}, DEFAULTS);
  /**
   * api 实例
   */
  public api: BasicApi;
  /**
   * websocket 实例
   */
  public ws?: WebSocket;
  /**
   * ws 是否连接
   */
  public connected = false;
  /**
   * ws 是否正在重连
   */
  public reconnecting = false;
  /**
   * 是否已经 auth
   */
  public authed = false;
  /**
   * 保活定时器
   */
  public keepAliveTimer?: NodeJS.Timeout;
  /**
   * 消息队列
   */
  private __queue: string[] = [];
  /**
   * 订阅队列
   */
  private __subQueue: string[] = [];
  /**
   * 订阅数量
   */
  private __subs: { [key: string]: number } = {};

  /**
   * Socket 构造函数
   * @param api BasicApi 实例
   */
  public constructor(api: BasicApi) {
    super();
    this.api = api;
    this.reset();
    this.on("auth", (ev) => {
      if (ev.data.status === "ok") {
        while (this.__queue.length) {
          this.emit(this.__queue.shift()!);
        }

        clearInterval(this.keepAliveTimer);

        if (this.opts.keepAlive) {
          this.keepAliveTimer = setInterval(() => this.ws?.ping(1), 10000);
        }
      }
    });
  }

  protected reset() {
    this.authed = false;
    this.connected = false;
    this.reconnecting = false;
    clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = undefined;
    this.__queue = [];
    this.__subQueue = [];
    this.__subs = {};
  }

  public async connect(opts = {}) {
    Object.assign(this.opts, opts);
    if (!this.api.getToken()) {
      throw new Error(
        "No token! Call api.auth() before connecting the socket!"
      );
    }

    return new Promise((resolve, reject) => {
      const baseURL = this.api.getBaseURL().replace("http", "ws");
      const wsurl = new URL("socket/websocket", baseURL);
      this.ws = new WebSocket(wsurl);
      this.ws.on("open", () => {
        this.connected = true;
        this.reconnecting = false;
        if (this.opts.resubscribe) {
          this.__subQueue.push(...Object.keys(this.__subs));
        }
        this.emit("connected");
        resolve(this.auth(this.api.getToken()));
      });

      this.ws.on("close", () => {
        clearInterval(this.keepAliveTimer);
        this.authed = false;
        this.connected = false;
        this.emit("disconnected");
        if (this.opts.reconnect) {
          this.reconnect().catch(() => {});
        }
      });

      this.ws.on("error", (err) => {
        this.ws?.terminate();
        this.emit("error", err);
        if (!this.connected) {
          reject(err);
        }
      });

      this.ws.on("unexpected-response", (req, res) => {
        const err = new Error(
          `WS Unexpected Response: ${res.statusCode} ${res.statusMessage}`
        );
        this.emit("error", err);
        reject(err);
      });

      this.ws.on("message", (data) => this.handleMessage(data.toString()));
    });
  }

  public async reconnect() {
    if (this.reconnecting) {
      return;
    }
    this.reconnecting = true;
    let retries = 0;
    let retry;
    do {
      let time = Math.pow(2, retries) * 100;
      if (time > this.opts.maxRetryDelay) time = this.opts.maxRetryDelay;
      await sleep(time);
      if (!this.reconnecting) return; // reset() called in-between
      try {
        await this.connect();
        retry = false;
      } catch (err) {
        retry = true;
      }
      retries++;
    } while (retry && retries < this.opts.maxRetries);
    if (retry) {
      const err = new Error(
        `Reconnection failed after ${this.opts.maxRetries} retries`
      );
      this.reconnecting = false;
      this.emit("error", err);
      throw err;
    } else {
      // Resume existing subscriptions on the new socket
      Object.keys(this.__subs).forEach((sub) => this.subscribe(sub));
    }
  }

  public disconnect() {
    clearInterval(this.keepAliveTimer);
    this.ws?.removeAllListeners();
    this.ws?.terminate();
    this.reset();
    this.emit("disconnected");
  }

  protected async handleMessage(message: string | { data: string }) {
    let msg = typeof message === "string" ? message : message.data; // Handle ws/browser difference
    if (msg.slice(0, 3) === "gz:") {
      msg = await this.api.inflate(msg);
    }

    if (msg[0] === "[") {
      msg = JSON.parse(msg);
      // @ts-ignore
      let [, type, id, channel] = msg[0].match(/^(.+):(.+?)(?:\/(.+))?$/);
      channel = channel || type;
      const event = { channel, id, type, data: msg[1] };
      this.emit(msg[0], event);
      this.emit(event.channel, event);
      this.emit("message", event);
    } else {
      const [channel, ...data] = msg.split(" ");
      const event = { type: "server", channel, data } as any;
      if (channel === "auth") {
        event.data = { status: data[0], token: data[1] };
      }
      if (["protocol", "time", "package"].includes(channel)) {
        event.data = { [channel]: data[0] };
      }
      this.emit(channel, event);
      this.emit("message", event);
    }
  }

  public async send(data: string) {
    if (!this.connected) {
      this.__queue.push(data);
    } else {
      this.ws?.send(data);
    }
  }

  public async gzip(bool: boolean) {
    this.send(`gzip ${bool ? "on" : "off"}`);
  }

  public auth(token: string) {
    return new Promise((resolve, reject) => {
      this.send(`auth ${token}`);
      this.once("auth", (ev) => {
        const { data } = ev;
        if (data.status === "ok") {
          this.authed = true;
          this.emit("authed");
          while (this.__subQueue.length) {
            this.send(this.__subQueue.shift()!);
          }
          resolve("ok");
        } else {
          reject(new Error("socket auth failed"));
        }
      });
    });
  }

  public async subscribe(path: string, cb?: any) {
    if (!path) return;
    const userID = await this.api.getUserId();
    if (!path.match(/^(\w+):(.+?)$/)) {
      path = `user:${userID}/${path}`;
    }

    if (this.authed) {
      this.send(`subscribe ${path}`);
    } else {
      this.__subQueue.push(`subscribe ${path}`);
    }

    this.emit("subscribe", path);
    this.__subs[path] = this.__subs[path] || 0;
    this.__subs[path]++;
    if (cb) this.on(path, cb);
  }

  public async unsubscribe(path: string) {
    if (!path) return;
    const userID = await this.api.getUserId();
    if (!path.match(/^(\w+):(.+?)$/)) {
      path = `user:${userID}/${path}`;
    }

    this.send(`unsubscribe ${path}`);
    this.emit("unsubscribe", path);
    if (this.__subs[path]) this.__subs[path]--;
  }
}
