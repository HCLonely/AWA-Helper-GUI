/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import type { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { load } from 'cheerio';
import { log, sleep, time, netError, http as axios, formatProxy, chalk } from './tool';

class TwitchTrack {
  channelId!: string;
  clientId!: string;
  jwt!: string;
  extensionID!: string;
  trackError = 0;
  trackTimes = 0;
  formatedCookie: {
    [name: string]: string
  } = {};
  cookie: string;
  httpsAgent!: AxiosRequestConfig['httpsAgent'];
  headers: AxiosRequestHeaders;
  complete = false;
  awaHost: string;
  availableStreams!: Array<string>;
  availableStreamsInfo!: Array<string>;
  log: any = log;

  // eslint-disable-next-line no-undef
  constructor({ awaHost, cookie, proxy, log }: { awaHost: string, cookie: string, proxy?: proxy, log?: any }) {
    this.awaHost = awaHost || 'www.alienwarearena.com';
    this.cookie = cookie;
    cookie.split(';').map((e: string) => {
      const [name, value] = e.split('=');
      this.formatedCookie[name.trim()] = value?.trim();
      return e;
    });
    this.headers = {
      Authorization: `OAuth ${this.formatedCookie['auth-token']}`,
      'Content-Type': 'text/plain;charset=UTF-8',
      Host: 'gql.twitch.tv',
      Origin: 'https://www.twitch.tv',
      Referer: 'https://www.twitch.tv/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.44',
      'X-Device-Id': this.formatedCookie.unique_id,
    };
    if (proxy?.enable?.includes('twitch') && proxy.host && proxy.port) {
      this.httpsAgent = formatProxy(proxy);
    }
    if (log) {
      this.log = log;
    }
  }

  async init(): Promise<boolean> {
    const logId = this.log(`${time()}正在初始化TwitchTrack...`);
    const options: AxiosRequestConfig = {
      url: 'https://www.twitch.tv/',
      method: 'GET',
      headers: {
        Cookie: this.formatedCookie['auth-token'],
        Host: 'www.twitch.tv',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.44',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    const result = await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const $ = load(response.data);
          const optionScript = $('script').filter((i, e) => !!$(e).html()?.includes('clientId'));
          if (optionScript.length === 0) {
            this.log(chalk.red('Error: optionScript not found!'), logId);
            return false;
          }
          const clientId = optionScript.html()?.trim()?.match(/clientId="(.+?)"/)?.[1];
          if (!clientId) {
            this.log(chalk.red('Error: clientId not found!'), logId);
            return false;
          }
          this.clientId = clientId;
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red(`Error: ${response.status}`), logId);
        this.log(response, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
    if (!result) return false;
    return await this.checkLinkedExt();
  }
  async checkLinkedExt(): Promise<boolean> {
    const logId = this.log(`${time()}正在检测是否授权${chalk.yellow('Twitch')}扩展...`);
    const options: AxiosRequestConfig = {
      url: 'https://gql.twitch.tv/gql',
      method: 'POST',
      headers: {
        ...this.headers,
        'Client-Id': this.clientId,
      },
      data: '[{"operationName":"Settings_Connections_ExtensionConnectionsList","variables":{},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"7de55e735212a90752672f9baf33016fe1c7f2b4bfdad94a6d8031a1633deaeb"}}}]',
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then(async (response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        const linkedExtension = response.data?.[0]?.data?.currentUser?.linkedExtensions?.find((e: any) => e.name === 'Arena Rewards Tracker');
        if (linkedExtension) {
          this.log(chalk.green('已授权'), logId);
          return true;
        }
        this.log(chalk.red('未授权'), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  async getAvailableStreams(): Promise<boolean> {
    const logId = this.log(`${time()}正在获取可用直播信息...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.awaHost}/twitch/live`,
      method: 'GET',
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then(async (response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const $ = load(response.data);
          this.availableStreams = $('div.media a[href]').toArray().map((e) => $(e).attr('href')
            ?.match(/www\.twitch\.tv\/(.+)/)?.[1])
            .filter((e) => e) as Array<string>;
          if (this.availableStreams.length === 0) {
            this.log(chalk.blue('当前没有可用的直播！'), logId);
            this.log(time() + chalk.yellow('10 分钟后再次获取可用直播信息'));
            await sleep(60 * 10);
            return await this.getAvailableStreams();
          }
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red(`Net Error: ${response.status}`), logId);
        this.log(response, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  async getChannelInfo(index = 0): Promise<false | number> {
    if (index === 0 && !await this.getAvailableStreams()) return false;
    if (index >= this.availableStreams.length) return false;
    const twitchOptions: AxiosRequestConfig = {
      url: 'https://gql.twitch.tv/gql',
      method: 'POST',
      headers: { Authorization: `OAuth ${this.formatedCookie['auth-token']}`, 'Client-Id': this.clientId },
      data: `[{"operationName":"ActiveWatchParty","variables":{"channelLogin":"${this.availableStreams[index]}"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"4a8156c97b19e3a36e081cf6d6ddb5dbf9f9b02ae60e4d2ff26ed70aebc80a30"}}}]`,
    };
    if (this.httpsAgent) twitchOptions.httpsAgent = this.httpsAgent;
    const logId = this.log(`${time()}正在获取直播频道[${chalk.yellow(this.availableStreams[index])}]信息...`);
    return await axios(twitchOptions)
      .then(async (response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        const channelId = response.data?.[0]?.data?.user?.id;
        if (!channelId) {
          this.log(chalk.red('Error'), logId);
          return await this.getChannelInfo(index + 1);
        }
        this.channelId = channelId;
        this.log(chalk.green('OK'), logId);
        return index;
      })
      .catch(async (error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return await this.getChannelInfo(index + 1);
      });
  }
  async getExtInfo(index = 0): Promise<boolean> {
    const returnedIndex = await this.getChannelInfo(index);
    if (returnedIndex === false) {
      return false;
    }
    if (index >= this.availableStreams.length) return false;
    const logId = this.log(`${time()}正在获取ART扩展信息...`);
    const options: AxiosRequestConfig = {
      url: 'https://gql.twitch.tv/gql',
      method: 'POST',
      headers: {
        ...this.headers,
        'Client-Id': this.clientId,
      },
      data: `[{"operationName":"ExtensionsForChannel","variables":{"channelID":"${this.channelId}"},"extensions":{"persistedQuery":{"version":1,"sha256Hash":"37a5969f117f2f76bc8776a0b216799180c0ce722acb92505c794a9a4f9737e7"}}}]`,
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then(async (response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        const extensions = response.data?.[0]?.data?.user?.channel?.selfInstalledExtensions;
        if (!extensions?.length) {
          this.log(chalk.red('Error: 在此频道没有找到扩展！'), logId);
          return await this.getExtInfo((returnedIndex as number) + 1);
        }
        const [ART_EXT] = extensions.filter((ext: any) => ext?.installation?.extension?.name === 'Arena Rewards Tracker');
        if (!ART_EXT) {
          this.log(chalk.red('Error: 在此频道没有找到ART扩展！'), logId);
          return await this.getExtInfo((returnedIndex as number) + 1);
        }
        const { jwt } = ART_EXT.token;
        if (!ART_EXT) {
          this.log(chalk.red('Error: 获取jwt失败！'), logId);
          return await this.getExtInfo((returnedIndex as number) + 1);
        }
        this.jwt = jwt;
        this.log(chalk.green('OK'), logId);
        return true;
      })
      .catch(async (error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return await this.getExtInfo((returnedIndex as number) + 1);
      });
  }
  async sendTrack():Promise<void> {
    if (!this.channelId) {
      if (await this.getExtInfo() !== true) return;
    }
    const logId = this.log(`${time()}正在发送${chalk.yellow('Twitch')}在线心跳...`);
    const options: AxiosRequestConfig = {
      url: 'https://www.alienwarearena.com/twitch/extensions/track',
      method: 'GET',
      headers: {
        origin: `https://${this.extensionID}.ext-twitch.tv`,
        referer: `https://${this.extensionID}.ext-twitch.tv/`,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.44',
        'x-extension-channel': this.channelId,
        'x-extension-jwt': this.jwt,
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    const status = await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.success) {
          this.log(chalk.green('OK'), logId);
          this.trackError = 0;
          this.trackTimes++;
          let returnText: boolean | string = true;
          switch (response.data.state) {
          case 'daily_cap_reached':
            this.complete = true;
            this.log(time() + chalk.green(response.data.message || '今日ARP已获取！'));
            returnText = 'complete';
            break;
          case 'streamer_offline':
            this.log(time() + chalk.blue(`此直播间[${chalk.yellow(this.channelId)}]已停止直播！`));
            returnText = 'offline';
            break;
          case 'streamer_online':
            break;
          default:
            break;
          }
          return returnText;
        }
        this.log(chalk.red('Error'), logId);
        this.log(response.data?.message || response.statusText);
        this.trackError++;
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
    if (status === 'complete') {
      return;
    }
    if (status === 'offline') {
      this.channelId = '';
    }
    await sleep(60);
    this.sendTrack();
  }
}

export { TwitchTrack };
