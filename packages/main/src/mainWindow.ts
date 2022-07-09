/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserWindow, ipcMain, Menu } from 'electron';
import { join } from 'path';
import { URL } from 'url';
import { getAwaParams } from './getAwaParams';
import { DailyQuest } from './DailyQuest';
import { TwitchTrack } from './TwitchTrack';
import { SteamQuest } from './SteamQuest';
import { chalk, time, log, checkUpdate } from './tool';
import * as fs from 'fs';
import * as yamlLint from 'yaml-lint';
import { parse } from 'yaml';
import { v4 as uuidv4 } from 'uuid';
const version = '__APP_VERSION__';

async function createWindow() {
  const browserWindow = new BrowserWindow({
    show: false, // Use 'ready-to-show' event to show window
    width: 1100,
    height: 830,
    webPreferences: {
      webviewTag: false, // The webview tag is not recommended. Consider alternatives like iframe or Electron's BrowserView. https://www.electronjs.org/docs/latest/api/webview-tag#warning
      preload: join(__dirname, '../../preload/dist/index.cjs'),
    },
  });

  /**
   * If you install `show: true` then it can cause issues when trying to close the window.
   * Use `show: false` and listener events `ready-to-show` to fix these issues.
   *
   * @see https://github.com/electron/electron/issues/25012
   */
  browserWindow.on('ready-to-show', () => {
    Menu.setApplicationMenu(null);
    browserWindow?.show();

    if (import.meta.env.DEV) {
      browserWindow?.webContents.openDevTools();
    }
  });

  /**
   * URL for main window.
   * Vite dev server for development.
   * `file://../renderer/index.html` for production and test
   */
  const pageUrl = import.meta.env.DEV && import.meta.env.VITE_DEV_SERVER_URL !== undefined
    ? import.meta.env.VITE_DEV_SERVER_URL
    : new URL('../renderer/dist/index.html', 'file://' + __dirname).toString();


  await browserWindow.loadURL(pageUrl);

  return browserWindow;
}

/**
 * Restore existing BrowserWindow or Create new BrowserWindow
 */
export async function restoreOrCreateWindow() {
  let window = BrowserWindow.getAllWindows().find(w => !w.isDestroyed());

  if (window === undefined) {
    window = await createWindow();
  }

  if (window.isMinimized()) {
    window.restore();
  }

  window.focus();

  const asker = async (question: string) => {
    return new Promise((resolve) => {
      const questionId = uuidv4();
      (window as Electron.BrowserWindow).webContents.send('question', {
        id: questionId,
        question,
      });
      ipcMain.handleOnce('answer-' + questionId, (event, answer: boolean) => {
        resolve(answer);
      });
    });
  };
  const logger = (data: any, argv?: any) => {
    if ((data.type && data.type !== 'taskInfo') || !data.type) {
      log(data.message || data);
    }
    if (!window || argv === false) {
      return;
    }
    let logId = uuidv4();
    if (typeof argv === 'string') {
      logId = argv;
    }
    let sendData = data;
    if (typeof data === 'string') {
      sendData = {
        message: data,
        id: logId,
      };
    }
    if (!sendData.id) {
      sendData.id = logId;
    }
    window.webContents.send('log', sendData);
    return sendData.id;
  };

  ipcMain.handle('getAwaParams', async (event, ...args: [string, string, proxy?]) => {
    return await getAwaParams(logger, ...args);
  });

  ipcMain.handle('startDailyQuest', async () => {
    try {
      if (!fs.existsSync('./resources/config.yml')) {
        console.log('1');
        logger({
          message: time() + chalk.red(`没有找到配置文件[${chalk.yellow('./resources/config.yml')}], 请先在设置中配置并保存!`),
          type: 'error',
        });
        return false;
      }
      console.log('2');

      const defaultConfig: config = {
        awaHost: 'www.alienwarearena.com',
        awaBoosterNotice: true,
        awaQuests: ['每日任务', 'AWA在线', 'Twitch在线', 'Steam挂机'],
        asfProtocol: 'http',
      };
      const configString = fs.readFileSync('./resources/config.yml').toString();
      let config: config | null = null;
      await yamlLint
        .lint(configString)
        .then(() => {
          config = { ...defaultConfig, ...parse(configString) };
        })
        .catch((error) => {
          logger({
            message: time() + chalk.red(`配置文件第 ${chalk.blue(error.mark.line + 1)} 行格式错误, ${chalk.yellow('以下是错误原因及错误位置')}`),
            type: 'error',
            console: error.message,
          });
        });
      if (!config) {
        return;
      }
      const {
        awaCookie,
        awaHost,
        awaUserId,
        awaBorderId,
        awaBadgeIds,
        awaAvatar,
        awaBoosterNotice,
        awaQuests,
        twitchCookie,
        asfProtocol,
        asfHost,
        asfPort,
        asfPassword,
        asfBotname,
        proxy,
      }: config = config;

      await checkUpdate(version, logger, proxy);

      const missingAwaParams = Object.entries({
        awaCookie,
        awaUserId,
        awaBorderId,
        awaBadgeIds,
      }).filter(([name, value]) => name !== 'proxy' && !value).map(([name]) => name);
      if (missingAwaParams.length > 0) {
        return logger({
          message: time() + chalk.red('配置文件缺少参数: ') + missingAwaParams.map((e) => chalk.blue(e)).join(','),
          type: 'error',
        });
      }
      const quest = new DailyQuest({
        awaCookie: awaCookie as string,
        awaHost: awaHost as string,
        awaUserId: awaUserId as string,
        awaBorderId: awaBorderId as string,
        awaBadgeIds: awaBadgeIds as string,
        awaAvatar: awaAvatar as string,
        awaBoosterNotice: awaBoosterNotice as boolean,
        proxy,
        log: logger,
        asker,
      });
      if (await quest.init() !== 200) {
        return logger({
          message: time() + chalk.red('初始化失败！'),
          type: 'error',
        });
      }
      await quest.listen(null, null, true);
      if (awaQuests.includes('每日任务') && quest.questInfo.dailyQuest?.status !== 'complete') {
        logger({
          message: ['dailyQuest', 'doing'],
          type: 'tasksStatus',
        });
        await quest.do();
      }
      if (awaQuests.includes('AWA在线') && quest.questInfo.timeOnSite?.addedArp !== quest.questInfo.timeOnSite?.maxArp) {
        logger({
          message: ['timeOnSite', 'doing'],
          type: 'tasksStatus',
        });
        quest.track();
      }

      let twitch: TwitchTrack | null = null;
      if (awaQuests.includes('Twitch在线')) {
        if (quest.questInfo.watchTwitch !== '15') {
          if (twitchCookie) {
            twitch = new TwitchTrack({ awaHost, cookie: twitchCookie, proxy, log: logger });
            if (await twitch.init() === true) {
              logger({
                message: ['watchTwitch', 'doing'],
                type: 'tasksStatus',
              });
              twitch.sendTrack();
            }
          } else {
            logger(time() + chalk.yellow(`缺少${chalk.blue('["twitchCookie"]')}参数，跳过Twitch相关任务！`));
          }
        } else {
          logger(time() + chalk.green('Twitch在线任务已完成！'));
        }
      }

      let steamQuest: SteamQuest | null = null;
      const missingAsfParams = Object.entries({
        asfProtocol,
        asfHost,
        asfPort,
        asfBotname,
      }).filter(([name, value]) => name !== 'proxy' && !value).map(([name]) => name);
      if (awaQuests.includes('Steam挂机')) {
        if (missingAsfParams.length > 0) {
          logger(time() + chalk.yellow(`缺少${chalk.blue(JSON.stringify(missingAsfParams))}参数，跳过Steam相关任务！`));
        } else {
          steamQuest = new SteamQuest({
            awaCookie: quest.headers.cookie as string,
            awaHost,
            asfProtocol,
            asfHost: asfHost as string,
            asfPort: asfPort as number,
            asfPassword,
            asfBotname: asfBotname as string,
            proxy,
            log: logger,
          });
          if (await steamQuest.init()) {
            logger({
              message: ['steamQuest', 'doing'],
              type: 'tasksStatus',
            });
            steamQuest.playGames();
          } else {
            logger({
              message: ['steamQuest', 'error'],
              type: 'tasksStatus',
            });
          }
        }
      }
      quest.listen(twitch, steamQuest);
    } catch (e) {
      console.log(e);
      return e;
    }
  });
}
