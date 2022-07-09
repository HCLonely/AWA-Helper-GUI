/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
/* global questStatus, proxy */
import type { AxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { load } from 'cheerio';
import FormData from 'form-data';
import { log, sleep, random, time, netError, ask, http as axios, formatProxy, chalk } from './tool';
import type { TwitchTrack } from './TwitchTrack';
import type { SteamQuest } from './SteamQuest';
import * as fs from 'fs';

class DailyQuest {
  // eslint-disable-next-line no-undef
  questInfo: questInfo = {};
  posts!: Array<string>;
  trackError = 0;
  trackTimes = 0;
  headers: AxiosRequestHeaders;
  httpsAgent!: AxiosRequestConfig['httpsAgent'];
  userId: string;
  borderId: string;
  badgeIds: Array<string>;
  avatar: string;
  questStatus: questStatus = {};
  dailyQuestLink!: string;
  host: string;
  awaBoosterNotice: boolean;
  log: any = log;
  asker: any = ask;
  dailyQuestNumber = 0;
  userInfo = {
    username: 'Unknown',
    tier: 'Unknown',
    arpTotal: 'Unknown',
    arpLifetime: 'Unknown',
  };
  // USTaskInfo?: Array<{ url: string; progress: Array<string>; }>;

  constructor({ awaCookie, awaHost, awaUserId, awaBorderId, awaBadgeIds, awaAvatar, awaBoosterNotice, proxy, log, asker }: { awaCookie: string, awaHost?: string, awaUserId: string, awaBorderId: string, awaBadgeIds: string, awaAvatar: string, awaBoosterNotice: boolean, proxy?: proxy, log?: any, asker?: any }) {
    this.host = awaHost || 'www.alienwarearena.com';
    this.userId = awaUserId;
    this.borderId = awaBorderId;
    this.avatar = awaAvatar;
    this.awaBoosterNotice = awaBoosterNotice ?? true;
    this.badgeIds = awaBadgeIds.split(',');
    this.headers = {
      cookie: awaCookie,
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36 Edg/100.0.1185.39',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
    };
    if (proxy?.enable?.includes('awa') && proxy.host && proxy.port) {
      this.httpsAgent = formatProxy(proxy);
    }
    if (log) {
      this.log = log;
    }
    if (asker) {
      this.asker = asker;
    }
  }
  async init(): Promise<number> {
    const REMEMBERME = (this.headers.cookie as string).split(';').find((e) => e.includes('REMEMBERME'));
    if (REMEMBERME) {
      await this.updateCookie(REMEMBERME);
    } else {
      this.log(`${time()}检测到${chalk.yellow('awaCookie')}中没有${chalk.blue('REMEMBERME')}，可能会导致连续签到天数获取错误，不影响其他功能`);
    }
    if ((this.headers.cookie as string).includes('REMEMBERME=deleted')) {
      return 402;
    }
    return this.updateDailyQuests(true);
  }
  async listen(twitch: TwitchTrack | null, steamQuest: SteamQuest | null, check = false): Promise<void> {
    if (await this.updateDailyQuests() === 200) {
      if (this.questInfo.steamQuest && steamQuest && parseInt(this.questInfo.steamQuest, 10) >= steamQuest.maxArp) {
        if (steamQuest.status === 'running') {
          await steamQuest.resume();
        }
        this.questStatus.steamQuest = 'complete';
      }
      if (steamQuest?.status === 'stopped' || (!check && !steamQuest)) {
        this.questStatus.steamQuest = 'complete';
      }
      if (twitch?.complete || (!check && !twitch)) {
        this.questStatus.watchTwitch = 'complete';
      }
      if ((this.questStatus.dailyQuest === 'complete' || this.questStatus.dailyQuest === 'skip' || this.questInfo.dailyQuest?.status === 'complete') && (this.questStatus.timeOnSite === 'complete' || this.questInfo.timeOnSite?.addedArp === this.questInfo.timeOnSite?.maxArp) && this.questStatus.watchTwitch === 'complete' && this.questStatus.steamQuest === 'complete') {
        this.log(time() + chalk.green('今日所有任务已完成！'));
        return;
      }
      if (check) return;
      await sleep(60 * 5);
      this.listen(twitch, steamQuest);
    }
  }
  async updateCookie(REMEMBERME: string): Promise<boolean> {
    const logId = this.log(`${time()}正在更新${chalk.yellow('AWA')} Cookie...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/`,
      method: 'GET',
      headers: {
        ...this.headers,
        cookie: REMEMBERME,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
      maxRedirects: 0,
      validateStatus: (status) => status === 302 || status === 200,
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200 && response.data.toLowerCase().includes('we have detected an issue with your network')) {
          this.log(chalk.red('当前IP被禁止访问，请尝试更换代理！'), logId);
          return false;
        }
        if (response.status === 302 && response.headers['set-cookie']?.length) {
          this.headers.cookie = `REMEMBERME=${Object.fromEntries((this.headers.cookie as string).trim().split(';').map((e) => e.split('='))).REMEMBERME};${response.headers['set-cookie'].map((e) => e.split(';')[0].trim()).join(';')}`;
          if (this.headers.cookie.includes('REMEMBERME=deleted')) {
            this.log(chalk.red(`Error: ${chalk.yellow('awaCookie')} 已过期, 请重新获取!`), logId);
            return false;
          }
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red('Error'), logId);
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
  async updateDailyQuests(verify = false): Promise<number> {
    const logId = this.log(time() + (verify ? `正在验证${chalk.yellow('AWA')} Token...` : '正在获取任务信息...'));
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/`,
      method: 'GET',
      headers: {
        ...this.headers,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return axios(options)
      .then(async (response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          if (response.data.toLowerCase().includes('we have detected an issue with your network')) {
            this.log(chalk.red('当前IP被禁止访问，请尝试更换代理！'), logId);
            return 410;
          }
          const $ = load(response.data);
          if ($('a.nav-link-login').length > 0) {
            this.log(chalk.red('Token已过期'), logId);
            return 401;
          }
          this.log(chalk.green('OK'), logId);
          const [, , username = 'Unknown'] = response.data.match(/(var|let)[\s]+?user_username[\s]*?=[\s]*?"(.+)";/);
          const [, , tier = 'Unknown'] = response.data.match(/(var|let)[\s]+?arp_tier[\s]*?=[\s]*?([\d]+);/);
          const [, , arpTotal = 'Unknown'] = response.data.match(/(var|let)[\s]+?arp_balance[\s]*?=[\s]*?([\d]+);/);
          const [, , arpLifetime = 'Unknown'] = response.data.match(/(var|let)[\s]+?arp_lifetime[\s]*?=[\s]*?([\d]+);/);
          this.userInfo = {
            username,
            tier,
            arpTotal,
            arpLifetime,
          };
          this.log({
            type: 'userInfo',
            data: this.userInfo,
          });
          if (verify) {
            // 连续签到
            const consecutiveLoginsText = response.data.match(/consecutive_logins.*?=.*?({.+?})/)?.[1];
            if (consecutiveLoginsText) {
              try {
                const consecutiveLogins = JSON.parse(consecutiveLoginsText);
                const rewardArp = $(`#streak-days .advent-calendar__day[data-day="${consecutiveLogins.count}"] .advent-calendar__reward h1`).text().trim();
                if (rewardArp) {
                  this.log(`${time()}已连续登录${chalk.yellow(consecutiveLogins.count)}天，获得${chalk.green(rewardArp)}ARP`);
                }
              } catch (e) {
                //
              }
            }
            // 月签到
            const monthlyLoginsText = response.data.match(/monthly_logins.*?=.*?({.+?})/)?.[1];
            if (monthlyLoginsText) {
              try {
                const monthlyLogins = JSON.parse(monthlyLoginsText);
                if (monthlyLogins.count < 29) {
                  const week = Math.ceil(monthlyLogins.count / 7);
                  const rewardArp = $(`#monthly-days-${week} .advent-calendar__day[data-day="${monthlyLogins.count}"] .advent-calendar__reward h1`).text().trim();
                  const rewardItem = $(`#monthly-days-${week} .advent-calendar__day[data-day="${monthlyLogins.count}"] .advent-calendar__day-overlay`).eq(0).text()
                    .trim();
                  if (rewardArp) {
                    this.log(`${time()}本月已登录${chalk.yellow(monthlyLogins.count)}天，获得${chalk.green(rewardArp)}ARP`);
                  }
                  if (rewardItem) {
                    this.log(`${time()}本月已登录${chalk.yellow(monthlyLogins.count)}天，获得${chalk.green(rewardItem)}`);
                  }
                } else {
                  this.log(`${time()}本月已登录${chalk.yellow(monthlyLogins.count)}天，获得${chalk.green(monthlyLogins.extra_arp)}ARP`);
                }
              } catch (e) {
                //
              }
            }
          }
          // 每日任务
          const [status, arp] = $('div.quest-item').filter((i, e) => !$(e).text().includes('ARP 6.0') && $(e).find('a[href^="/quests/"]').length === 0).find('.quest-item-progress')
            .map((i, e) => $(e).text().trim()
              .toLowerCase());
          this.questInfo.dailyQuest = {
            status, arp,
          };
          this.dailyQuestNumber = $('div.quest-item').filter((i, e) => $(e).find('a[href^="/quests/"]').length === 0).find('.quest-item-progress')
            .map((i, e) => $(e).text().trim()
              .toLowerCase())
            .filter((i, e) => e === 'incomplete').length;
          if (verify && this.awaBoosterNotice && this.dailyQuestNumber > 1) {
            const userArpBoostText = response.data.match(/userArpBoost.*?=.*?({.+?})/)?.[1];
            let boostEnabled = false;
            if (userArpBoostText) {
              try {
                const userArpBoost = JSON.parse(userArpBoostText);
                if (new Date() < userArpBoost.end) {
                  boostEnabled = true;
                }
              } catch (e) {
                //
              }
            }
            if (!boostEnabled) {
              const answer = await this.asker(`检测到未完成的每日任务大于1个，请确认是否要使用${chalk.blue('ARP 助推器')}(${chalk.yellow('需要自行开启！！！')})。`);
              if (!answer) {
                this.questStatus.dailyQuest = 'skip';
              }
            }
          }
          // AWA 在线任务
          const [maxArp, addedArp] = $('section.tutorial__um-community').filter((i, e) => $(e).text().includes('Time on Site')).find('center')
            .toArray()
            .map((e) => parseInt($(e).text().trim()
              .match(/[\d]+/)?.[0] || '0', 10));
          if (this.questInfo.timeOnSite) {
            this.questInfo.timeOnSite.addedArp = addedArp;
          } else if (maxArp !== 0) {
            this.questInfo.timeOnSite = {
              maxArp, addedArp,
            };
          }
          // Twitch 在线任务
          const twitchArp = $('section.tutorial__um-community').filter((i, e) => $(e).text().includes('Watch Twitch')).find('center b')
            .last()
            .text()
            .trim();
          this.questInfo.watchTwitch = twitchArp;
          // Steam 挂机任务
          const steamArp = $('section.tutorial__um-community').filter((i, e) => $(e).text().includes('Steam Quests')).find('center b')
            .last()
            .text()
            .trim();
          this.questInfo.steamQuest = steamArp;
          const formatQuestInfo = this.formatQuestInfo();
          fs.appendFileSync('log.txt', `${JSON.stringify(formatQuestInfo, null, 2)}\n`);
          this.log({
            message: JSON.stringify(formatQuestInfo),
            type: 'taskInfo',
          });

          this.posts = $('.tile-slider__card a[href*="/ucf/show/"]').toArray()
            .map((e) => $(e).attr('href')?.match(/ucf\/show\/([\d]+)/)?.[1])
            .filter((e) => e) as Array<string>;
          if ($('a.quest-title').length > 0) {
            this.dailyQuestLink = new URL($('a.quest-title[href]').attr('href') as string, `https://${this.host}/`).href;
            this.log({
              message: this.dailyQuestLink,
              type: 'dailyQuestLink',
            });
          }
          return 200;
        }
        this.log(chalk.red('Net Error'), logId);
        return response.status;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return 0;
      });
  }
  async do(): Promise<void> {
    if (this.questStatus.dailyQuest === 'skip') {
      return this.log(time() + chalk.yellow('已跳过每日任务！'));
    }
    if (this.questInfo.dailyQuest?.status === 'complete') {
      this.questStatus.dailyQuest = 'complete';
      return this.log(time() + chalk.green('每日任务已完成！'));
    }
    await this.changeBorder();
    await this.changeBadge();
    await this.changeAvatar();
    this.log({
      message: 'doing',
      type: 'viewPosts',
    }, 'viewPosts');
    const viewPostsReault = await this.viewPosts();
    this.log({
      message: 'done',
      success: viewPostsReault,
      type: 'viewPosts',
    }, 'viewPosts');
    this.log({
      message: 'doing',
      type: 'viewNews',
    }, 'viewNews');
    const viewNewsReault = await this.viewNews();
    this.log({
      message: 'done',
      success: viewNewsReault,
      type: 'viewNews',
    }, 'viewNews');
    this.log({
      message: 'doing',
      type: 'sharePosts',
    }, 'sharePosts');
    const sharePostsResult = await this.sharePosts();
    this.log({
      message: 'done',
      success: sharePostsResult,
      type: 'sharePosts',
    }, 'sharePosts');
    if (this.dailyQuestLink) {
      this.log({
        message: 'doing',
        type: 'openLink',
      }, 'openLink');
      const openLinkResult = await this.openLink(this.dailyQuestLink);
      const postId = this.dailyQuestLink.match(/ucf\/show\/([\d]+)/)?.[1];
      if (postId) {
        await this.viewPost(postId);
      }
      this.log({
        message: 'done',
        success: openLinkResult,
        type: 'openLink',
      }, 'openLink');
    }
    await this.openLink(`https://${this.host}/rewards/leaderboard`);
    await sleep(random(1, 3));
    await this.openLink(`https://${this.host}/rewards`);
    await sleep(random(1, 3));
    await this.openLink(`https://${this.host}/marketplace/`);
    await this.updateDailyQuests();
    if (this.questInfo.dailyQuest?.status === 'complete') {
      this.questStatus.dailyQuest = 'complete';
      if (this.dailyQuestNumber < 2) {
        return this.log(time() + chalk.green('每日任务已完成！'));
      }
    }
    await this.replyPost();
    await this.updateDailyQuests();
    if (this.questInfo.dailyQuest?.status === 'complete') {
      this.questStatus.dailyQuest = 'complete';
      if (this.dailyQuestNumber < 2) {
        return this.log(time() + chalk.green('每日任务已完成！'));
      }
    }
    this.questStatus.dailyQuest = 'complete';
    return this.log(time() + chalk.red('每日任务未完成！'));
  }
  async changeBorder(): Promise<boolean> {
    const logId = this.log(`${time()}正在更换${chalk.yellow('Border')}...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/border/select`,
      method: 'POST',
      headers: {
        ...this.headers,
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: `https://${this.host}`,
        referer: `https://${this.host}/account/personalization`,
      },
      data: { id: this.borderId },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.success) {
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red('Error'), logId);
        this.log(response.data?.message || response, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }

  async changeBadge(): Promise<boolean> {
    const logId = this.log(`${time()}正在更换${chalk.yellow('Badge')}...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/badges/update/${this.userId}`,
      method: 'POST',
      headers: {
        ...this.headers,
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: `https://${this.host}`,
        referer: `https://${this.host}/account/personalization`,
      },
      data: JSON.stringify(this.badgeIds.slice(0, 5)),
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.success) {
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red('Error'), logId);
        this.log(response.data?.message || response, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }

  async changeAvatar(): Promise<boolean> {
    const logId = this.log(`${time()}正在更换${chalk.yellow('Avatar')}...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/ajax/user/avatar/save/${this.userId}`,
      method: 'POST',
      headers: {
        ...this.headers,
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: `https://${this.host}`,
        referer: `https://${this.host}/avatar/edit/hat`,
      },
      data: this.avatar,
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.success) {
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red('Error'), logId);
        this.log(response.data?.message || response, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }

  async sendViewTrack(link: string): Promise<boolean> {
    const logId = this.log(`${time()}正在发送浏览${chalk.yellow(link)}心跳...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/tos/track`,
      method: 'POST',
      headers: {
        ...this.headers,
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: `https://${this.host}`,
        referer: link,
      },
      data: JSON.stringify({ url: link }),
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.success) {
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red('Error'), logId);
        this.log(response.data?.message || response, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }

  async track(): Promise<void> {
    if (this.trackTimes % 3 === 0) {
      // await this.updateDailyQuests();
      if (!this.questInfo.timeOnSite) {
        return this.log(time() + chalk.yellow('没有获取到在线任务信息，跳过此任务'));
      }
      if (this.questInfo.timeOnSite.addedArp >= this.questInfo.timeOnSite.maxArp) {
        this.questStatus.timeOnSite = 'complete';
        return this.log(time() + chalk.green('每日在线任务完成！'));
      }
      // this.log(`${time()}当前每日在线任务进度：${chalk.blue(`${this.questInfo.timeOnSite.addedArp}/${this.questInfo.timeOnSite.maxArp}`)}`);
    }
    if (this.trackError >= 6) {
      return this.log(time() + chalk.red('发送') + chalk.yellow('[AWA]') + chalk.red('在线心跳连续失败超过6次，跳过此任务'));
    }
    await this.sendTrack();
    await sleep(60);
    this.track();
  }

  async sendTrack(link?: string): Promise<boolean> {
    const logId = link ? this.log(`${time()}正在发送浏览帖子心跳...`) : this.log(`${time()}正在发送${chalk.yellow('AWA')}在线心跳...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/tos/track`,
      method: 'POST',
      headers: {
        ...this.headers,
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
        origin: `https://${this.host}`,
        referer: link || `https://${this.host}/account/personalization`,
      },
      data: JSON.stringify({ url: link || `https://${this.host}/account/personalization` }),
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (!link) {
          if (response.data.success) {
            this.log(chalk.green('OK'), logId);
            this.trackError = 0;
            this.trackTimes++;
            return true;
          }
          this.log(chalk.red('Error'), logId);
          this.log(response.data?.message || response, false);
          this.trackError++;
          return false;
        }
        this.log(chalk.green('OK'), logId);
        return true;
      })
      .catch((error) => {
        if (!link) {
          this.log(chalk.red('Error'), logId);
          globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
          this.log(error, false);
          this.trackError++;
          return false;
        }
        return true;
      });
  }

  async viewPost(postId?: string): Promise<boolean> {
    await this.openLink(`https://${this.host}/ucf/show/${postId}`);
    const logId = this.log(`${time()}正在发送浏览帖子${chalk.yellow(postId)}记录...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/ucf/increment-views/${postId}`,
      method: 'POST',
      headers: {
        ...this.headers,
        origin: `https://${this.host}`,
        referer: `https://${this.host}/ucf/show/${postId}`,
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return await axios(options)
      .then(async (response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data === 'success') {
          await this.sendTrack(`https://${this.host}/ucf/show/${postId}`);
          this.log(chalk.green('OK'), logId);
          return true;
        }
        this.log(chalk.red('Error'), logId);
        this.log(response.data || response.statusText, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  async viewPosts(postIds?: Array<string>): Promise<boolean> {
    const posts = postIds || this.posts;
    if (!posts?.length) {
      return false;
    }
    for (const post of posts.slice(0, 3)) {
      await this.viewPost(post);
      await sleep(random(1, 5));
    }
    return true;
  }
  async replyPost(postId?: string): Promise<boolean> {
    const logId = this.log(`${time()}正在获取每日任务相关帖子...`);
    const getOptions: AxiosRequestConfig = {
      url: `https://${this.host}/forums/board/113/awa-on-topic`,
      method: 'GET',
      headers: {
        ...this.headers,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        referer: `https://${this.host}/`,
      },
    };
    if (this.httpsAgent) getOptions.httpsAgent = this.httpsAgent;

    const post = postId || await axios(getOptions)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const $ = load(response.data);
          const topicPost = $('.card-title a.forums__topic-link').toArray()
            .filter((e) => /Daily[\s]*?Quest/gi.test($(e).text()))
            .map((e) => $(e).attr('href')?.match(/ucf\/show\/([\d]+)/)?.[1])
            .filter((e) => e);
          if (topicPost.length > 0) {
            this.log(chalk.green('OK'), logId);
            return topicPost[0];
          }
          this.log(chalk.gray('没有找到相关帖子，跳过此步骤！'), logId);
          return false;
        }
        this.log(chalk.red('Net Error'), logId);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });

    if (!post) {
      return false;
    }

    const logId2 = this.log(`${time()}正在回复帖子${chalk.yellow(post)}...`);
    const form = new FormData();

    form.append('topic_post[content]', '<p>Thanks!</p>');
    form.append('topic_post[quotedPostIds]', '');
    form.append('topic_post[parentPost]', '');
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/comments/${post}/new/ucf`,
      method: 'POST',
      headers: {
        ...this.headers,
        origin: `https://${this.host}`,
        referer: `https://${this.host}/ucf/show/${post}`,
        ...form.getHeaders(),
      },
      data: form,
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.data.success) {
          this.log(chalk.green('OK'), logId2);
          return true;
        }
        this.log(chalk.red('Error'), logId2);
        this.log(response.data?.message || response, false);
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId2);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }

  sharePost(postId: string): Promise<boolean> {
    const logId = this.log(`${time()}正在分享帖子${chalk.yellow(postId)}...`);
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/arp/quests/share/${postId}`,
      method: 'POST',
      headers: {
        ...this.headers,
        origin: `https://${this.host}`,
        referer: `https://${this.host}/ucf/show/${postId}`,
      },
      responseType: 'json',
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;

    return axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        try {
          if (JSON.stringify(response.data) === '{}') {
            this.log(chalk.green('OK'), logId);
            return true;
          }
          this.log(chalk.red('Error'), logId);
          this.log(response.data, false);
          return false;
        } catch {
          this.log(chalk.red('Error'), logId);
          this.log(response.data, false);
          return false;
        }
      })
      .catch((error) => {
        this.log(chalk.red('Error'), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return false;
      });
  }
  async sharePosts(postIds?: Array<string>): Promise<boolean> {
    const posts = postIds || this.posts;
    if (!posts?.length) {
      return false;
    }
    for (const post of posts.slice(0, 3)) {
      await this.sharePost(post);
      await sleep(random(1, 5));
    }
    return true;
  }
  async viewNews(): Promise<boolean> {
    const options: AxiosRequestConfig = {
      url: `https://${this.host}/ucf/show/2162951/boards/awa-information/News/arp-6-0`,
      method: 'GET',
      headers: {
        ...this.headers,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    await axios(options)
      .then((response) => globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|'))
      .catch(() => null);
    return await this.viewPost('2162951');
  }
  async openLink(link: string): Promise<void> {
    const logId = this.log(`${time()}正在浏览页面[${chalk.yellow(link)}]...`);
    const options: AxiosRequestConfig = {
      url: link,
      method: 'GET',
      headers: {
        ...this.headers,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const $ = load(response.data);
          if ($('a.nav-link-login').length > 0) {
            this.log(chalk.red('Token已过期'), logId);
            return;
          }
          this.log(chalk.green('OK'), logId);
          return;
        }
        this.log(chalk.red('Net Error'), logId);
        return;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return;
      });
  }

  /*
  async getUSTaskInfo(url: string): Promise<string | false> {
    this.log(`${time()}正在获取美区任务[${chalk.yellow(url.match(/[\d]+/)?.[0] || url)}] render...`, false);
    const getOptions: AxiosRequestConfig = {
      url,
      method: 'GET',
      headers: {
        ...this.headers,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*\/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        referer: `https://${this.host}/`
      }
    };
    if (this.httpsAgent) getOptions.httpsAgent = this.httpsAgent;

    return axios(getOptions)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const render = response.data.match(/https:\/\/www\.google\.com\/recaptcha\/enterprise\.js\?render=(.*?)'/)?.[1];
          if (render) {
            this.log(chalk.green('OK'));
            return render;
          }
          this.log(chalk.red('Error'));
          return false;
        }
        this.log(chalk.red('Net Error'));
        return false;
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error));
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error);
        return false;
      });
  }
  async doUSTask(url: string) {
    const render = await this.getUSTaskInfo(url);
    if (!render) return false;
  }
  */
  async getPersonalization(): Promise<{[name: string]: any}> {
    const logId = this.log(`${time()}获取用户自定义信息...`);
    const options: AxiosRequestConfig = {
      url: 'https://www.alienwarearena.com/account/personalization',
      method: 'GET',
      headers: {
        ...this.headers,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const $ = load(response.data);
          if ($('a.nav-link-login').length > 0) {
            this.log(chalk.red('Token已过期'), logId);
            return {
              showClose: true,
              message: 'Token已过期',
              type: 'error',
            };
          }
          const [, , awaUserId] = response.data.match(/(var|let)[\s]+?user_id[\s]*?=[\s]*?([\d]+);/);
          const [, , awaBorderId] = response.data.match(/(var|let)[\s]+?selectedBorder[\s]*?=[\s]*?([\d]+);/);
          const [, , awaBadgeIds] = response.data.match(/(var|let)[\s]+?selectedBadges[\s]*?=[\s]*?\[(([\d]+)(,[\d]+)*?)\];/);
          this.log(chalk.green('OK'), logId);
          return {
            awaUserId,
            awaBorderId,
            awaBadgeIds,
          };
        }
        this.log(chalk.red('Net Error'), logId);
        return {
          showClose: true,
          message: '网络错误',
          type: 'error',
        };
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return {
          showClose: true,
          message: '未知错误: ' + error.message,
          type: 'error',
        };
      });
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getAvatar(): Promise<{ [name: string]: any }> {
    const logId = this.log(`${time()}获取用户头像信息...`);
    const options: AxiosRequestConfig = {
      url: 'https://www.alienwarearena.com/avatar/edit',
      method: 'GET',
      headers: {
        ...this.headers,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      },
    };
    if (this.httpsAgent) options.httpsAgent = this.httpsAgent;
    return await axios(options)
      .then((response) => {
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(response.headers['set-cookie'] || []).map((e) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        if (response.status === 200) {
          const $ = load(response.data);
          if ($('a.nav-link-login').length > 0) {
            this.log(chalk.red('Token已过期'), logId);
            return {
              showClose: true,
              message: 'Token已过期',
              type: 'error',
            };
          }
          const awaAvatar = `${JSON.stringify({
            body: null, hat: null, top: null, item: null, legs: null, ...Object.fromEntries($('.drag-drop').toArray().map((e) => {
              const slotType = $(e).attr('data-slot-type')?.split('-')[0];
              const altimg = $(e).attr('data-altImg');
              const data: {
                id?: string
                img?: string
                slotType?: string
                altimg?: string
              } = {
                id: $(e).attr('data-id'),
                img: $(e).attr('data-img'),
                slotType: $(e).attr('data-slot-type'),
              };
              if (altimg) {
                data.altimg = altimg;
              }
              return [slotType, data];
            })),
          })}`;
          this.log(chalk.green('OK'), logId);
          return {
            awaAvatar,
          };
        }
        this.log(chalk.red('Net Error'), logId);
        return {
          showClose: true,
          message: '网络错误',
          type: 'error',
        };
      })
      .catch((error) => {
        this.log(chalk.red('Error') + netError(error), logId);
        globalThis.secrets = [...new Set([...globalThis.secrets.split('|'), ...(error.response?.headers?.['set-cookie'] || []).map((e: string) => e.split(';')[0].trim().split('=')[1]).filter((e: any) => e && e.length > 5)])].join('|');
        this.log(error, false);
        return {
          showClose: true,
          message: '未知错误: ' + error.message,
          type: 'error',
        };
      });
  }
  formatQuestInfo() {
    return {
      dailyTask: {
        // eslint-disable-next-line no-nested-ternary
        status: this.questInfo.dailyQuest?.status === 'complete' ? 'done' : (this.questStatus.dailyQuest === 'skip' ? 'skip' : 'undone'),
        arp: parseInt(this.questInfo.dailyQuest?.arp || '0', 10),
        maxArp: parseInt(this.questInfo.dailyQuest?.arp || '0', 10),
      },
      timeOnSite: {
        status: this.questInfo.timeOnSite?.addedArp === this.questInfo.timeOnSite?.maxArp ? 'done' : 'undone',
        arp: this.questInfo.timeOnSite?.addedArp,
        maxArp: this.questInfo.timeOnSite?.maxArp,
      },
      watchTwitch: {
        status: this.questInfo.watchTwitch === '15' ? 'done' : 'undone',
        arp: parseInt(this.questInfo.watchTwitch || '0', 10),
        maxArp: 15,
      },
      steamQuest: {
        status: '-',
        arp: parseInt(this.questInfo.steamQuest || '0', 10),
        maxArp: '-',
      },
    };
  }
}

export { DailyQuest };
