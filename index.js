/**
 * @file main.js
 * @author liyubei@bytedance.com
 */

export class JSBridgeProxy {
  constructor(config) {
    this.config = config;
  }

  jsBridgeFetch(options) {
    // 从 FetchMethod.kt 的实现来看，其实只支持 GET 和 POST 两种方法
    // 另外，不支持自定义 request header 的功能
    // POST: url, params, data
    // GET:  url, params
    // 最大的返回内容貌似是 50K，超过了会怎么样呢??
    return new Promise((resolve, reject) => {
      window.ToutiaoJSBridge.call('fetch', options, result => {
        if (result.code !== 0 && result.response) {
          if (typeof result.response === 'string') {
            // proxy接口数据iOS和android不一致，需要做兼容处理;
            // 成功时添加兼容处理
            result.response = JSON.parse(result.response);
          }

          if (result.response.status_code !== 0) {
            reject(new Error(result.response.status_message));
            return;
          }

          // result.response 的格式可能是这个样子的
          // status_code: 0,
          // status_message: 'Success',
          // time: 1525826601153,
          // data: ...
          // TODO:(liyubei) 数据格式的转化 但是 axios 的 response 格式是
          // status: number,
          // statusText: string
          // config: Object
          // data: any
          // headers: Object
          // request: XMLHttpRequest
          result.response.status = result.response.status_code;
          result.response.statusText = result.response.status_message;
          resolve(result.response);
        } else {
          reject(new Error('网络异常，请稍后再试'));
        }
      });
    });
  }

  sendRequest(url, method, rest) {
    const { baseURL = '' } = this.config;
    const options = { ...rest, url: baseURL + url, method };
    return this.jsBridgeFetch(options);
  }

  // 提供跟 axios 一样的接口
  request({ url, method, ...rest }) {
    return this.sendRequest(url, method, rest);
  }
  get(url, config) {
    return this.sendRequest(url, 'GET', config);
  }
  put(url, data, config) {
    return this.sendRequest(url, 'PUT', { data, ...config });
  }
  post(url, data, config) {
    return this.sendRequest(url, 'POST', { data, ...config });
  }
  patch(url, data, config) {
    return this.sendRequest(url, 'PATCH', { data, ...config });
  }
  delete(url, config) {
    return this.sendRequest(url, 'DELETE', config);
  }
  head(url, config) {
    return this.sendRequest(url, 'HEAD', config);
  }
}
