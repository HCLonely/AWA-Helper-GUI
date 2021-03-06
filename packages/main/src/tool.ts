/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* global proxy */
import dayjs from 'dayjs';
import * as fs from 'fs';
import axios from 'axios';
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as tunnel from 'tunnel';
import { SocksProxyAgent } from 'socks-proxy-agent';
import type { SocksProxyAgentOptions } from 'socks-proxy-agent';
import { parse } from 'yaml';
import { format } from 'util';

const chalk = {
  green(text: any): string {
    return `<font style="color: green;">${text}</font>`;
  },
  red(text: any): string {
    return `<font style="color: red;">${text}</font>`;
  },
  blue(text: any): string {
    return `<font style="color: blue;">${text}</font>`;
  },
  yellow(text: any): string {
    return `<font style="color: #e6a23c;">${text}</font>`;
  },
  gray(text: any): string {
    return `<font style="color: gray;">${text}</font>`;
  },
};
const getSecertValue = (): string => {
  if (!fs.existsSync('config.yml')) {
    return '__________';
  }
  try {
    const {
      awaCookie = '__________',
      twitchCookie = '__________',
      asfPassword = '__________',
      proxy: {
        host = '__________',
        username = '__________',
        password = '__________',
      },
      asfHost = '__________',
    } = parse(fs.readFileSync('config.yml').toString());
    const secrets = [];
    secrets.push(...awaCookie.split(';').map((e: string) => e.split('=')[1]).filter((e: any) => e));
    secrets.push(...twitchCookie.split(';').map((e: string) => e.split('=')[1]).filter((e: any) => e));
    secrets.push(asfPassword, host, username, password, asfHost);
    return [...new Set(secrets)].join('|');
  } catch {
    return '__________';
  }
};

globalThis.secrets = getSecertValue();

const toJSON = (e: any): string => {
  if (typeof e === 'string') {
    // eslint-disable-next-line no-control-regex
    return e.replace(/\x1B\[[\d]*?m/g, '').replace(/<\/?font.*?>/g, '');
  }

  return format(e);
};

const log = (text: any, newLine = true): void => {
  fs.appendFileSync('log.txt', toJSON(text).replace(new RegExp(globalThis.secrets, 'gi'), '********')
    .replace(/(PHPSESSID|REMEMBERME|sc=)=[\w\d%.-]*/g, '********') + (newLine ? '\n' : ''));
};

const sleep = (time: number): Promise<true> => new Promise((resolve) => {
  const timeout = setTimeout(() => {
    clearTimeout(timeout);
    resolve(true);
  }, time * 1000);
});

const random = (minNum: number, maxNum: number): number => Math.floor((Math.random() * (maxNum - minNum + 1)) + minNum);
const time = (): string => chalk.gray(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] `);
// eslint-disable-next-line
const netError = (error: Error): string => {
  if (error.message.includes('ETIMEDOUT')) {
    return `: ${chalk.yellow('???????????????????????????????????????')}`;
  }
  if (error.message.includes('ECONNREFUSED')) {
    return `: ${chalk.yellow('??????????????????????????????????????????')}`;
  }
  if (error.message.includes('hang up') || error.message.includes('ECONNRESET')) {
    return `: ${chalk.yellow('??????????????????????????????????????????')}`;
  }
  if (error.message.includes('certificate') || error.message.includes('TLS') || error.message.includes('SSL')) {
    return `: ${chalk.yellow('???????????????????????????????????????')}`;
  }
  return '';
};

const formatProxy = (proxy: proxy): any => {
  let agent: any;
  const proxyOptions: tunnel.ProxyOptions & SocksProxyAgentOptions = {
    host: proxy.host,
    port: proxy.port,
  };
  if (proxy.protocol?.includes('socks')) {
    proxyOptions.hostname = proxy.host;
    if (proxy.username && proxy.password) {
      proxyOptions.userId = proxy.username;
      proxyOptions.password = proxy.password;
    }
    agent = new SocksProxyAgent(proxyOptions);
  } else if (proxy.protocol === 'http') {
    if (proxy.username && proxy.password) {
      proxyOptions.proxyAuth = `${proxy.username}:${proxy.password}`;
    }
    agent = tunnel.httpsOverHttp({
      proxy: proxyOptions,
    });
  } else if (proxy.protocol === 'https') {
    if (proxy.username && proxy.password) {
      proxyOptions.proxyAuth = `${proxy.username}:${proxy.password}`;
    }
    agent = tunnel.httpsOverHttps({
      proxy: proxyOptions,
    });
  }
  if (agent.options) {
    agent.options.rejectUnauthorized = false;
  }
  return agent;
};

interface retryAdapterOptions {
  times?: number
  delay?: number
}
interface myAxiosConfig extends AxiosRequestConfig {
  retryTimes?: number
  retryDelay?: number
}
const retryAdapterEnhancer = (adapter: AxiosAdapter, options: retryAdapterOptions): AxiosAdapter => {
  const { times = 0, delay = 300 } = options;

  return async (config: myAxiosConfig): Promise<AxiosResponse> => {
    const { retryTimes = times, retryDelay = delay } = config;
    let retryCount = 0;
    const request = async (): Promise<AxiosResponse> => {
      try {
        return await adapter(config);
      } catch (err) {
        if (!retryTimes || retryCount >= retryTimes) {
          return Promise.reject(err);
        }
        retryCount++;
        log(chalk.red('Error'));
        log(`${time()}${chalk.yellow(`??????????????? ${chalk.blue(retryCount)} ???...`)}`, false);
        const delay = new Promise((resolve) => {
          setTimeout(() => {
            resolve(true);
          }, retryDelay);
        });
        return delay.then(() => request());
      }
    };
    return request();
  };
};

const http = axios.create({
  adapter: retryAdapterEnhancer(axios.defaults.adapter as AxiosAdapter, {
    delay: 1000,
    times: 3,
  }),
});

const checkUpdate = async (version: string, log: any, proxy?: proxy):Promise<void> => {
  const logId = log(`${time()}??????????????????...`);
  const options: AxiosRequestConfig = {
    validateStatus: (status: number) => status === 302,
    maxRedirects: 0,
  };
  if (proxy?.enable?.includes('github') && proxy.host && proxy.port) {
    options.httpsAgent = formatProxy(proxy);
  }
  return await http.head('https://github.com/HCLonely/AWA-Helper-GUI/releases/latest', options)
    .then((response) => {
      globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
      const latestVersion = response.headers.location.match(/tag\/v([\d.]+)/)?.[1];
      if (latestVersion) {
        const currentVersionArr = version.replace('V', '').split('.').map((e) => parseInt(e, 10));
        const latestVersionArr = latestVersion.split('.').map((e) => parseInt(e, 10));
        if (
          latestVersionArr[0] > currentVersionArr[0] ||
          (latestVersionArr[0] === currentVersionArr[0] && latestVersionArr[1] > currentVersionArr[1]) ||
          (latestVersionArr[0] === currentVersionArr[0] && latestVersionArr[1] === currentVersionArr[1] && latestVersionArr[2] > currentVersionArr[2])
        ) {
          log(chalk.green('?????????????????? ') + chalk.yellow(`V${latestVersion}`), logId);
          log({
            type: 'updateNotice',
            data: {
              version: latestVersion,
              link: response.headers.location,
            },
          });
          return;
        }
        log(chalk.green('?????????????????????'), logId);
        return;
      }
      log(chalk.red('Failed'), logId);
      return;
    })
    .catch((error) => {
      log(chalk.red('Error') + netError(error), logId);
      globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
      log(error, false);
      return;
    });
};

const ask = (question: string, answers?: Array<string>): Promise<string> => new Promise((resolve) => {
  process.stdout.write(`${question}\n`);
  process.stdin.resume();
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', async (chunk) => {
    const answer = chunk.toString().trim();
    if (answers) {
      if (!answers.includes(answer)) {
        return resolve(await ask(question, answers));
      }
    }
    return resolve(answer);
  });
});

export { log, sleep, random, time, checkUpdate, netError, ask, http, formatProxy, chalk };
