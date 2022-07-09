/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* global steamGameInfo, proxy */
import type { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { load } from 'cheerio';
import { log, netError, sleep, time, http as axios, formatProxy, chalk } from './tool';

class SteamQuest {
  awaCookie: string;
  asfUrl: string;
  httpsAgent!: AxiosRequestConfig['httpsAgent'];
  headers: AxiosRequestHeaders;
  botname!: string;
  ownedGames: Array<string> = [];
  maxPlayTimes = 2;
  gamesInfo: Array<steamGameInfo> = [];
  maxArp = 0;
  status = 'none';
  taskStatus!: Array<steamGameInfo>;
  awaHost: string;
  log: any = log;

  constructor({ awaCookie, awaHost, asfProtocol, asfHost, asfPort, asfPassword, asfBotname, proxy, log }: { awaCookie: string, awaHost: string, asfProtocol: string, asfHost: string, asfPort: number, asfPassword?: string, asfBotname: string, proxy?: proxy, log?: any }) {
    this.awaCookie = awaCookie;
    this.awaHost = awaHost || 'www.alienwarearena.com';
    this.botname = asfBotname;
    this.asfUrl = `${asfProtocol}://${asfHost}:${asfPort}/Api/Command`;
    this.headers = {
      accept: 'application/json',
      'Content-Type': 'application/json',
      Host: `${asfHost}:${asfPort}`,
      Origin: `${asfProtocol}://${asfHost}:${asfPort}`,
      Referer: `${asfProtocol}://${asfHost}:${asfPort}/page/commands`,
    };
    if (asfPassword) this.headers.Authentication = asfPassword;
    if (proxy?.enable?.includes('asf') && proxy.host && proxy.port) {
      this.httpsAgent = formatProxy(proxy);
    }
    if (log) {
      this.log = log;
    }
  }

  init(): Promise<boolean> {
    const logId = this.log(`${time()}正在初始化${chalk.yellow('ASF')}...`);
    const options: AxiosRequestConfig = {
      url: this.asfUrl,
      method: 'POST',
      headers: this.headers,
      data: '{"Command":"!stats"}',
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          if (response.data.Success === true && response.data.Message === 'OK' && response.data.Result) {
            this.log(chalk.green('OK'), logId);
            return true;
          }
          if (response.data.Message) {
            this.log(chalk.blue(response.data.Message), logId);
            return false;
          }
          this.log(chalk.blue('Error'), logId);
          this.log(response.data, false);
          return false;
        }
        this.log(chalk.red(`Error: ${response.status}`), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  async getSteamQuests(): Promise<boolean> {
    const logId = this.log(`${time()}正在获取${chalk.yellow('Steam')}任务信息...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.awaHost}/steam/quests`,
      method: 'GET',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.44',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then(async (response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const $ = load(response.data);
          const gamesInfo = [];
          for (const row of $('div.container>div.row').toArray()) {
            const $row = $(row);
            const id = $row.find('img[src*="cdn.cloudflare.steamstatic.com/steam/apps/"]').eq(0)
              .attr('src')
              ?.match(/steam\/apps\/([\d]+)/)?.[1];
            if (!id) continue;
            const questLink = new URL($row.find('a.btn-steam-quest[href]').attr('href') as string, `https://${this.awaHost}/`).href;
            const started = await this.getQuestInfo(questLink);
            if (!started) continue;
            const playTime = $row.find('.media-body p').text()
              .trim()
              .match(/([\d]+)[\s]*hour/i)?.[1];
            const arp = $row.find('.text-steam-light').text()
              .trim()
              .match(/([\d]+)[\s]*ARP/i)?.[1];
            gamesInfo.push({
              id,
              time: playTime ? parseInt(playTime, 10) : 0,
              arp: arp ? parseInt(arp, 10) : 0,
              link: questLink,
            });
          }
          this.gamesInfo = gamesInfo;
          this.log(chalk.green(`获取${chalk.yellow('Steam')}任务信息成功`), logId);
          return true;
        }
        this.log(chalk.red(`获取${chalk.yellow('Steam')}任务信息失败[Net Error]: ${response.status}`), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red(`获取${chalk.yellow('Steam')}任务信息失败`) + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  getQuestInfo(url: string) {
    const logId = this.log(`${time()}正在获取Steam任务[${chalk.yellow(url.match(/steam\/quests\/(.+)/)?.[1] || url)}]信息...`);
    const options: AxiosRequestConfig = {
      url,
      method: 'GET',
      responseType: 'text',
      headers: {
        cookie: this.awaCookie,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.44',
        referer: 'https://www.alienwarearena.com/steam/quests',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.includes('You have completed this quest')) {
          this.log(chalk.green('此任务已完成'), logId);
          return false;
        }
        if (response.data.includes('This quest requires that you own')) {
          this.log(chalk.yellow('未拥有此游戏，跳过'), logId);
          return false;
        }
        if (response.data.includes('Launch Game')) {
          this.log(chalk.green('此任务已开始'), logId);
          return true;
        }
        if (response.data.includes('Start Quest')) {
          this.log(chalk.green('OK'), logId);
          return this.startQuest(url);
        }
        this.log(chalk.red(`Error: ${response.status}`), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  startQuest(url: string) {
    const logId = this.log(`${time()}正在开始Steam任务[${chalk.yellow(url)}]...`);
    const options: AxiosRequestConfig = {
      url: url.replace('steam/quests', 'ajax/user/steam/quests/start'),
      method: 'GET',
      headers: {
        cookie: this.awaCookie,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.39',
        referer: url,
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.success) {
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red(`Error: ${response.data.message || response.status}`), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  async checkStatus(): Promise<boolean> {
    if (this.status === 'stopped') return true;
    for (const index in this.taskStatus) {
      const logId = this.log(`${time()}正在检测Steam任务[${chalk.yellow(this.taskStatus[index].link)}]进度...`);
      const options: AxiosRequestConfig = {
        url: this.taskStatus[index].link,
        method: 'GET',
        responseType: 'text',
        headers: {
          cookie: this.awaCookie,
          accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'accept-encoding': 'gzip, deflate, br',
          'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36 Edg/100.0.1185.44',
          referer: 'https://www.alienwarearena.com/steam/quests',
        },
      };
      if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
      await axios(options)
        .then((response) => {
          globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
          if (response.data.includes('aria-valuenow')) {
            const progress = response.data.match(/aria-valuenow="([\d]+?)"/)?.[1];
            if (progress) {
              this.taskStatus[index].progress = progress;
              this.log(chalk.yellow(`${progress}%`), logId);
              this.log({
                type: 'steamTasksStatus',
                data: this.taskStatus,
              });
              return true;
            }
            this.log(chalk.red('进度未找到'), logId);
            return false;
          }
          this.log(chalk.red('进度条未找到'), logId);
          return false;
        })
        .catch((error) => {
          this.log(chalk.red('Error') + netError(error), logId);
          globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
          this.log(error, false);
          return false;
        });
    }
    if (this.taskStatus.filter((e) => parseInt(e.progress || '0', 10) >= 100).length === this.taskStatus.length) {
      this.log(time() + chalk.yellow('Steam') + chalk.green('挂时长任务完成！'));
      this.log({
        type: 'steamTasksStatus',
        data: this.taskStatus,
      });
      this.resume();
      return true;
    }
    this.log({
      type: 'steamTasksStatus',
      data: this.taskStatus,
    });
    await sleep(60 * 5);
    return await this.checkStatus();
  }
  async getOwnedGames(): Promise<boolean> {
    if (!await this.getSteamQuests()) return false;
    if (this.gamesInfo.length === 0) return true;
    const logId = this.log(`${time()}正在匹配${chalk.yellow('Steam')}游戏库...`);
    const options: AxiosRequestConfig = {
      url: this.asfUrl,
      method: 'POST',
      headers: this.headers,
      data: `{"Command":"!owns ${this.botname} ${this.gamesInfo.map((e) => e.id).join(',')}"}`,
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          if (response.data.Success === true && response.data.Message === 'OK' && response.data.Result) {
            this.ownedGames = [...new Set(response.data.Result.split('\n').filter((e: string) => e.includes('|')).map((e: string) => e.trim().match(/app\/([\d]+)/)?.[1])
              .filter((e: undefined | string) => e))] as Array<string>;
            this.maxArp = this.ownedGames.map((id) => this.gamesInfo.find((info) => info.id === id)?.arp || 0).reduce((acr, cur) => acr + cur);
            this.maxPlayTimes = Math.max(...this.ownedGames.map((id) => this.gamesInfo.find((info) => info.id === id)?.time || 2));
            this.taskStatus = this.ownedGames.map((id) => this.gamesInfo.find((info) => info.id === id)).filter((e) => e) as Array<steamGameInfo>;
            this.log(chalk.green('OK'), logId);
            return true;
          }
          if (response.data.Message) {
            this.log(chalk.blue(response.data.Message), logId);
            return false;
          }
          this.log(chalk.blue('Error'), logId);
          this.log(response.data, false);
          return false;
        }
        this.log(chalk.red(`Error: ${response.status}`), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  async playGames(): Promise<boolean> {
    if (!await this.getOwnedGames()) return false;
    if (this.ownedGames.length === 0) {
      this.log(time() + chalk.yellow('当前账号游戏库中没有任务中的游戏，停止挂游戏时长！'));
      this.status = 'stopped';
      return false;
    }
    const logId = this.log(`${time()}正在调用${chalk.yellow('ASF')}挂游戏时长...`);
    const options: AxiosRequestConfig = {
      url: this.asfUrl,
      method: 'POST',
      headers: this.headers,
      data: `{"Command":"!play ${this.botname} ${this.ownedGames.join(',')}"}`,
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    const started = await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          if (response.data.Success === true && response.data.Message === 'OK' && response.data.Result) {
            this.status = 'running';
            this.log(chalk.green('OK'), logId);
            return true;
          }
          if (response.data.Message) {
            this.log(chalk.blue(response.data.Message));
            return false;
          }
          this.log(chalk.blue('Error'), logId);
          this.log(response.data, false);
          return false;
        }
        this.log(chalk.red(`Error: ${response.status}`), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
    if (!started) return false;
    this.log({
      type: 'steamTasksStatus',
      data: this.taskStatus,
    });
    await sleep(5 * 60);
    return await this.checkStatus();
  }
  async resume(): Promise<boolean> {
    if (this.status === 'stopped') return true;
    const logId = this.log(`${time()}正在停止挂游戏时长...`);
    const options: AxiosRequestConfig = {
      url: this.asfUrl,
      method: 'POST',
      headers: this.headers,
      data: `{"Command":"!resume ${this.botname}"}`,
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          if (response.data.Success === true && response.data.Message === 'OK' && response.data.Result) {
            this.status = 'stopped';
            this.log(chalk.green(response.data.Result), logId);
            return true;
          }
          if (response.data.Message) {
            this.log(chalk.blue(response.data.Message), logId);
            return false;
          }
          this.log(chalk.blue('Error'), logId);
          this.log(response.data, false);
          return false;
        }
        this.log(chalk.red(`Error: ${response.status}`), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
}

export { SteamQuest };
