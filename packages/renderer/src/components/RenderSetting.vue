<template>
  <el-form
    ref="ruleFormRef"
    :model="ruleForm"
    :rules="rules"
    label-width="170px"
    :size="formSize"
    status-icon
  >
    <el-divider content-position="center">
      全局设置
    </el-divider>
    <el-form-item
      label="启动时立即开始任务"
      prop="startOnOpen"
    >
      <el-switch v-model="ruleForm.startOnOpen" />
    </el-form-item>
    <el-divider content-position="center">
      AWA 设置
    </el-divider>
    <el-form-item
      label="外星人论坛Host"
      prop="awaHost"
    >
      <el-select
        v-model="ruleForm.awaHost"
        placeholder="外星人论坛Host"
      >
        <el-option
          label="www.alienwarearena.com"
          value="www.alienwarearena.com"
        />
        <el-option
          label="na.alienwarearena.com"
          value="na.alienwarearena.com"
        />
      </el-select>
      <el-popover
        placement="top-start"
        :width="200"
        trigger="hover"
        content="输入AWA Cookie后, 点击此按钮可自动获取AWA相关参数"
      >
        <template #reference>
          <el-button @click="syncAwaParams()">
            获取AWA参数
          </el-button>
        </template>
      </el-popover>
    </el-form-item>
    <el-form-item
      label="外星人论坛Cookie"
      prop="awaCookie"
    >
      <el-input
        v-model="ruleForm.awaCookie"
        type="textarea"
      />
    </el-form-item>
    <el-form-item
      label="外星人论坛用户Id"
      prop="awaUserId"
    >
      <el-input v-model="ruleForm.awaUserId" />
    </el-form-item>
    <el-form-item
      label="外星人论坛BorderId"
      prop="awaBorderId"
    >
      <el-input v-model="ruleForm.awaBorderId" />
    </el-form-item>
    <el-form-item
      label="外星人论坛BadgeIds"
      prop="awaBadgeIds"
    >
      <el-input v-model="ruleForm.awaBadgeIds" />
    </el-form-item>
    <el-form-item
      label="外星人论坛awaAvatar"
      prop="awaAvatar"
    >
      <el-input
        v-model="ruleForm.awaAvatar"
        type="textarea"
      />
    </el-form-item>
    <el-form-item
      label="任务大于1个提醒"
      prop="awaBoosterNotice"
    >
      <el-switch v-model="ruleForm.awaBoosterNotice" />
    </el-form-item>
    <el-form-item
      label="自动做任务类型"
      prop="awaQuests"
    >
      <el-checkbox-group v-model="ruleForm.awaQuests">
        <el-checkbox
          label="每日任务"
          name="dailyQuest"
        />
        <el-checkbox
          label="AWA在线"
          name="timeOnSite"
        />
        <el-checkbox
          label="Twitch在线"
          name="watchTwitch"
        />
        <el-checkbox
          label="Steam挂机"
          name="steamQuest"
        />
      </el-checkbox-group>
    </el-form-item>
    <el-divider content-position="center">
      Twitch 设置
    </el-divider>
    <el-form-item
      label="Twitch Cookie"
      prop="twitchCookie"
    >
      <el-input
        v-model="ruleForm.twitchCookie"
        type="textarea"
      />
    </el-form-item>
    <el-divider content-position="center">
      ASF 设置
    </el-divider>
    <el-form-item
      label="ASF 协议"
      prop="asfProtocol"
    >
      <el-select
        v-model="ruleForm.asfProtocol"
        placeholder="ASF 协议"
      >
        <el-option
          label="http"
          value="http"
        />
        <el-option
          label="https"
          value="https"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      label="ASF Host"
      prop="asfHost"
    >
      <el-input v-model="ruleForm.asfHost" />
    </el-form-item>
    <el-form-item
      label="ASF 端口"
      prop="asfPort"
    >
      <el-input v-model="ruleForm.asfPort" />
    </el-form-item>
    <el-form-item
      label="ASF 密码"
      prop="asfPassword"
    >
      <el-input
        v-model="ruleForm.asfPassword"
        type="password"
      />
    </el-form-item>
    <el-form-item
      label="ASF Bot Name"
      prop="asfBotname"
    >
      <el-input v-model="ruleForm.asfBotname" />
    </el-form-item>
    <el-divider content-position="center">
      代理设置
    </el-divider>
    <el-form-item
      label="启用代理"
      prop="proxyEnable"
    >
      <el-checkbox-group v-model="ruleForm.proxy.enable">
        <el-checkbox
          label="github"
          name="github"
        />
        <el-checkbox
          label="twitch"
          name="twitch"
        />
        <el-checkbox
          label="awa"
          name="awa"
        />
        <el-checkbox
          label="asf"
          name="asf"
        />
      </el-checkbox-group>
    </el-form-item>
    <el-form-item
      label="代理协议"
      prop="proxyProtocol"
    >
      <el-select
        v-model="ruleForm.proxy.protocol"
        placeholder="代理协议"
      >
        <el-option
          label="http"
          value="http"
        />
        <el-option
          label="https"
          value="https"
        />
        <el-option
          label="socks4"
          value="socks4"
        />
        <el-option
          label="socks5"
          value="socks5"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      label="代理 Host"
      prop="proxyHost"
    >
      <el-input v-model="ruleForm.proxy.host" />
    </el-form-item>
    <el-form-item
      label="代理端口"
      prop="proxyPort"
    >
      <el-input v-model="ruleForm.proxy.port" />
    </el-form-item>
    <el-form-item
      label="代理用户名"
      prop="proxyUsername"
    >
      <el-input v-model="ruleForm.proxy.username" />
    </el-form-item>
    <el-form-item
      label="代理密码"
      prop="proxyPassword"
    >
      <el-input
        v-model="ruleForm.proxy.password"
        type="password"
      />
    </el-form-item>

    <el-form-item>
      <el-button
        type="primary"
        @click="submitForm(ruleFormRef)"
      >
        保存
      </el-button>
      <el-button @click="resetForm(ruleFormRef)">
        重置
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
/* eslint-disable @typescript-eslint/no-explicit-any */

import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage, ElLoading } from 'element-plus';
import { readDefaultSetting, readSetting, saveSetting } from '#preload';

let config = readSetting();
if (!config) {
  config = readDefaultSetting();
}

const formSize = ref('default');
const ruleFormRef = ref<FormInstance>();
const ruleForm = reactive(config);

const rules = reactive<FormRules>({
  awaHost: [{ required: true }],
  awaCookie: [
    { required: true, message: '请输入外星人论坛Cookie', trigger: 'blur' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === '') {
          callback(new Error('请输入外星人论坛Cookie'));
        } else if (
          !/REMEMBERME=.+/.test(value) &&
          !(/PHPSESSID=.+/.test(value) && /sc=.+/.test(value))
        ) {
          callback(
            new Error(
              '可以只有`REMEMBERME`, 没有`REMEMBERME`则必须有`PHPSESSID`和`sc`, 但会导致连续签到天数获取错误，不会影响其他功能！',
            ),
          );
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  awaUserId: [
    { required: true, message: '请输入外星人论坛用户Id', trigger: 'blur' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === '') {
          callback(new Error('请输入外星人论坛用户Id'));
        } else if (!/^[\d]+$/.test(value)) {
          callback(new Error('格式错误, 必须是纯数字!'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  awaBorderId: [
    {
      required: true,
      message: '请输入外星人论坛当前的BorderId',
      trigger: 'blur',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === '') {
          callback(new Error('请输入外星人论坛BorderId'));
        } else if (!/^[\d]+$/.test(value)) {
          callback(new Error('格式错误, 必须是纯数字!'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  awaBadgeIds: [
    {
      required: true,
      message: '请输入外星人论坛当前的BadgeIds',
      trigger: 'blur',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === '') {
          callback(new Error('请输入外星人论坛BadgeIds'));
        } else if (!/^[\d]+(.[\d]+)*$/.test(value)) {
          callback(new Error('格式错误, 必须是纯数字或"数字,数字,数字..."!'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  awaAvatar: [
    {
      required: true,
      message: '请输入外星人论坛当前的Avatar',
      trigger: 'blur',
    },
  ],
  awaQuests: [{ required: true }],
  twitchCookie: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === '') {
          callback();
        } else if (
          !(/unique_id=.+/.test(value) && /auth-token=.+/.test(value))
        ) {
          callback(new Error('必须包括`unique_id` 和 `auth-token`'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  asfPort: [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value === '') {
          callback();
        } else if (!/^[\d]+$/.test(value)) {
          callback(new Error('格式错误, 必须是纯数字!'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  proxy: {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    port: [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {
        validator: (rule: any, value: string, callback: any) => {
          if (value === '') {
            callback();
          } else if (!/^[\d]+$/.test(value)) {
            callback(new Error('格式错误, 必须是纯数字!'));
          } else {
            callback();
          }
        },
        trigger: 'blur',
      },
    ],
  },
});

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid) => {
    if (valid) {
      if (saveSetting(config)) {
        ElMessage({
          showClose: true,
          message: '保存成功！',
          type: 'success',
        });
      } else {
        ElMessage({
          showClose: true,
          message: '保存失败！',
          type: 'error',
        });
      }
    } else {
      ElMessage({
        showClose: true,
        message: '格式错误！',
        type: 'error',
      });
    }
  });
};

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  formEl.resetFields();
};

const syncAwaParams = () => {
  const loading = ElLoading.service({
    lock: true,
    text: 'Loading',
  });
  window.ipcRenderer
    .invoke('getAwaParams', config.awaHost, config.awaCookie, config.proxy)
    .then((data: any) => {
      loading.close();
      if (data.type === 'error') {
        return ElMessage(data);
      }
      for (const [key, value] of Object.entries(data)) {
        if (Object.keys(config).includes(key)) {
          ruleForm[key] = value;
        }
      }
      ElMessage({
        showClose: true,
        message: '获取成功！',
        type: 'success',
      });
    })
    .catch((resp: any) => {
      ElMessage({
        showClose: true,
        message: '获取失败！',
        type: 'error',
      });
      console.warn(resp);
    });
};
</script>
