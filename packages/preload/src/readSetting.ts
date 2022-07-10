import * as fs from 'fs';
import { parse, stringify } from 'yaml';

const readSetting = (congifFilePath = './resources/config.yml') => {
  if (!fs.existsSync(congifFilePath)) {
    return null;
  }

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
