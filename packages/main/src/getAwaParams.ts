
import { DailyQuest } from './DailyQuest';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getAwaParams = async (log: any, host: string, cookie: string, proxy?: proxy) => {
  const quest = new DailyQuest({
    awaCookie: cookie,
    awaHost: host,
    proxy,
    log,
    awaUserId: '1',
    awaBorderId: '1',
    awaBadgeIds: '1',
    awaAvatar: '1',
    awaBoosterNotice: false,
  });
  if (await quest.init() !== 200) {
    return {
      showClose: true,
      message: '初始化失败, 请重新输入Cookie！',
      type: 'error',
    };
  }
  return {...await quest.getPersonalization(), ...await quest.getAvatar() };
};

export { getAwaParams };
