# screeps-simple-api

对 screeps 的 api 的简单封装，并提供**完善的类型声明**。

> 注意：我们只封装部分常用的接口，如发现部分接口未封装，欢迎提 PR

## 用法

1. 安装

```bash
npm install screeps-simple-api
```

2. 使用

```javascript
// 先导入 ScreepsApi，传入 token。如果是私服没有 token，可以传 username 和 password
const api = new ScreepsApi({
  token: "your token",
});

// 调用 api 的方法，具有完善的类型提示！api 上的接口返回值均为 promise 对象，可以使用 async/await 或者 .then() 来处理
api.getMyInfo().then((res) => console.log(res));
```
