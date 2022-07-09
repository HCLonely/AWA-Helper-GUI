import * as fs from 'fs';
import { parse, stringify } from 'yaml';

const readSetting = (congifFilePath = './resources/config.yml') => {
  if (!fs.existsSync(congifFilePath)) {
    return null;
  }

  /*
  if (!fs.existsSync('version') || (fs.readFileSync('version').toString() !== version && fs.existsSync('CHANGELOG.txt'))) {
    log(chalk.green('此版本更新内容：'));
    console.table(fs.readFileSync('CHANGELOG.txt').toString().trim()
      .split('\n')
      .map((e) => e.trim().replace('- ', '')));
    fs.writeFileSync('version', version);
  }
  */

  const defaultConfig: config = {
    awaHost: 'www.alienwarearena.com',
    awaBoosterNotice: true,
    awaQuests: ['每日任务', 'AWA在线', 'Twitch在线', 'Steam挂机'],
    asfProtocol: 'http',
  };
  const configString = fs.readFileSync(congifFilePath).toString();
  try {
    return { ...defaultConfig, ...parse(configString) };
  } catch (e) {
    return null;
  }
};
const readDefaultSetting = (congifFilePath = './resources/config.example.yml') => {
  if (!fs.existsSync(congifFilePath)) {
    return null;
  }

  return parse(fs.readFileSync(congifFilePath).toString());
};
const saveSetting = (config: config) => {
  fs.writeFileSync('./resources/config.yml', stringify(config));
  return true;
};

export { readSetting, readDefaultSetting, saveSetting };
