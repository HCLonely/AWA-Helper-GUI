<script lang="ts" setup>
import SettingForm from '/@/components/RenderSetting.vue';
</script>
<template>
  <el-tabs type="border-card">
    <el-tab-pane>
      <template #label>
        <span
          class="custom-tabs-label"
          style="user-select: none"
        >
          <el-icon><ScaleToOriginal /></el-icon>
          <span>主界面</span>
        </span>
      </template>
      <el-table
        :data="userInfoTableData"
        border
        size="small"
        style="width: 100%;text-align: center;"
      >
        <el-table-column
          prop="username"
          label="Username"
        />
        <el-table-column
          prop="tier"
          label="Tier"
        />
        <el-table-column
          prop="arpTotal"
          label="ARP"
        />
        <el-table-column
          prop="arpLifetime"
          label="Lifetime ARP"
        />
      </el-table>
      <div class="common-layout">
        <el-container
          :model="taskInfoData"
          style="border-radius: 4px; border: 1px solid #e4e7ed; padding: 5px"
        >
          <el-aside
            width="200px"
            style="margin: auto"
          >
            <el-row class="mb-4">
              <el-button
                type="primary"
                class="task-name"
                plain
                :disabled="tasksStatus.main === 'doing'"
                @click="startDailyQuest()"
              >
                开始
              </el-button>
              <el-button
                :type="
                  tasksStatus.main === 'done'
                    ? 'success'
                    : tasksStatus.main === 'doing'
                      ? 'primary'
                      : tasksStatus.main === 'error'
                        ? 'danger'
                        : 'warning'
                "
                class="task-status"
                size="small"
                circle
                plain
              >
                <el-icon v-show="tasksStatus.main === 'undone'">
                  <MoreFilled />
                </el-icon>
                <el-icon
                  v-show="tasksStatus.main === 'doing'"
                  class="is-loading"
                >
                  <Loading />
                </el-icon>
                <el-icon v-show="tasksStatus.main === 'done'">
                  <Check />
                </el-icon>
                <el-icon v-show="tasksStatus.main === 'error'">
                  <Close />
                </el-icon>
              </el-button>
            </el-row>
            <el-divider />
            <el-row class="mb-4">
              <el-button
                type="primary"
                class="task-name"
                plain
              >
                每日任务
              </el-button>
              <el-button
                :type="
                  taskInfoData.dailyTask.status === 'done'
                    ? 'success'
                    : taskInfoData.dailyTask.status === 'doing'
                      ? 'primary'
                      : taskInfoData.dailyTask.status === 'error'
                        ? 'danger'
                        : 'warning'
                "
                class="task-status"
                size="small"
                circle
                plain
              >
                <el-icon v-show="taskInfoData.dailyTask.status === 'undone'">
                  <MoreFilled />
                </el-icon>
                <el-icon
                  v-show="taskInfoData.dailyTask.status === 'doing'"
                  class="is-loading"
                >
                  <Loading />
                </el-icon>
                <el-icon v-show="false">
                  <Check />
                </el-icon>
                <el-icon v-show="taskInfoData.dailyTask.status === 'error'">
                  <Close />
                </el-icon>
                {{
                  taskInfoData.dailyTask.status === "done"
                    ? taskInfoData.dailyTask.arp
                    : ""
                }}
              </el-button>
            </el-row>
            <el-row
              v-show="taskInfoData.timeOnSite.show"
              class="mb-4"
            >
              <el-button
                type="primary"
                class="task-name"
                plain
              >
                AWA在线
              </el-button>
              <el-button
                :type="
                  taskInfoData.timeOnSite.status === 'done'
                    ? 'success'
                    : taskInfoData.timeOnSite.status === 'doing'
                      ? 'primary'
                      : taskInfoData.timeOnSite.status === 'error'
                        ? 'danger'
                        : 'warning'
                "
                class="task-status"
                size="small"
                circle
                plain
              >
                <el-icon v-show="taskInfoData.timeOnSite.status === 'undone'">
                  <MoreFilled />
                </el-icon>
                <el-icon
                  v-show="taskInfoData.timeOnSite.status === 'doing'"
                  class="is-loading"
                >
                  <Loading />
                </el-icon>
                <el-icon v-show="false">
                  <Check />
                </el-icon>
                <el-icon v-show="taskInfoData.timeOnSite.status === 'error'">
                  <Close />
                </el-icon>
                {{
                  taskInfoData.timeOnSite.status === "done"
                    ? taskInfoData.timeOnSite.arp
                    : ""
                }}
              </el-button>
            </el-row>
            <el-row
              v-show="taskInfoData.watchTwitch.show"
              class="mb-4"
            >
              <el-button
                type="primary"
                class="task-name"
                plain
              >
                Twitch在线
              </el-button>
              <el-button
                :type="
                  taskInfoData.watchTwitch.status === 'done'
                    ? 'success'
                    : taskInfoData.watchTwitch.status === 'doing'
                      ? 'primary'
                      : taskInfoData.watchTwitch.status === 'error'
                        ? 'danger'
                        : 'warning'
                "
                class="task-status"
                size="small"
                circle
                plain
              >
                <el-icon v-show="taskInfoData.watchTwitch.status === 'undone'">
                  <MoreFilled />
                </el-icon>
                <el-icon
                  v-show="taskInfoData.watchTwitch.status === 'doing'"
                  class="is-loading"
                >
                  <Loading />
                </el-icon>
                <el-icon v-show="false">
                  <Check />
                </el-icon>
                <el-icon v-show="taskInfoData.watchTwitch.status === 'error'">
                  <Close />
                </el-icon>
                {{
                  taskInfoData.watchTwitch.status === "done"
                    ? taskInfoData.watchTwitch.arp
                    : ""
                }}
              </el-button>
            </el-row>
            <el-row
              v-show="taskInfoData.steamQuest.show"
              class="mb-4"
            >
              <el-button
                type="primary"
                class="task-name"
                plain
              >
                Steam挂机
              </el-button>
              <el-button
                :type="
                  tasksStatus.steamQuest === 'done'
                    ? 'success'
                    : tasksStatus.steamQuest === 'doing'
                      ? 'primary'
                      : taskInfoData.steamQuest.status === 'error'
                        ? 'danger'
                        : 'warning'
                "
                class="task-status"
                size="small"
                circle
                plain
              >
                <el-icon v-show="tasksStatus.steamQuest === 'undone'">
                  <MoreFilled />
                </el-icon>
                <el-icon
                  v-show="tasksStatus.steamQuest === 'doing'"
                  class="is-loading"
                >
                  <Loading />
                </el-icon>
                <el-icon v-show="false">
                  <Check />
                </el-icon>
                <el-icon v-show="taskInfoData.steamQuest.status === 'error'">
                  <Close />
                </el-icon>
                {{
                  tasksStatus.steamQuest === "done"
                    ? taskInfoData.steamQuest.arp
                    : ""
                }}
              </el-button>
            </el-row>
          </el-aside>
          <el-main style="padding: 5px; border-left: 1px solid #e4e7ed">
            <el-divider content-position="center">
              每日任务
            </el-divider>
            <div
              class="daily-task-info-area"
              :model="dailyTaskInfo"
            >
              <div class="daily-task-row1">
                <el-button
                  :type="dailyTaskInfo.changeBorder.type"
                  class="task-info"
                  plain
                >
                  更换边框
                  <el-icon
                    v-show="dailyTaskInfo.changeBorder.status === 'undone'"
                  >
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeBorder.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeBorder.status === 'done'"
                  >
                    <Check />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeBorder.status === 'error'"
                  >
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.changeBadge.type"
                  class="task-info"
                  plain
                >
                  更换徽章
                  <el-icon
                    v-show="dailyTaskInfo.changeBadge.status === 'undone'"
                  >
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeBadge.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.changeBadge.status === 'done'">
                    <Check />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeBadge.status === 'error'"
                  >
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.changeAvatar.type"
                  class="task-info"
                  plain
                >
                  更换头像
                  <el-icon
                    v-show="dailyTaskInfo.changeAvatar.status === 'undone'"
                  >
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeAvatar.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeAvatar.status === 'done'"
                  >
                    <Check />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.changeAvatar.status === 'error'"
                  >
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.viewPosts.type"
                  class="task-info"
                  plain
                >
                  浏览帖子
                  <el-icon v-show="dailyTaskInfo.viewPosts.status === 'undone'">
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.viewPosts.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.viewPosts.status === 'done'">
                    <Check />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.viewPosts.status === 'error'">
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.viewNews.type"
                  class="task-info"
                  plain
                >
                  浏览新闻
                  <el-icon v-show="dailyTaskInfo.viewNews.status === 'undone'">
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.viewNews.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.viewNews.status === 'done'">
                    <Check />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.viewNews.status === 'error'">
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.sharePosts.type"
                  class="task-info"
                  plain
                >
                  分享帖子
                  <el-icon v-show="dailyTaskInfo.viewNews.status === 'undone'">
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.viewNews.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.viewNews.status === 'done'">
                    <Check />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.viewNews.status === 'error'">
                    <Close />
                  </el-icon>
                </el-button>
              </div>
              <div class="daily-task-row2">
                <el-button
                  v-show="dailyTaskInfo.openLink.show"
                  :type="dailyTaskInfo.openLink.type"
                  class="task-info"
                  plain
                >
                  任务链接
                  <el-icon v-show="dailyTaskInfo.openLink.status === 'undone'">
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openLink.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.openLink.status === 'done'">
                    <Check />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.openLink.status === 'error'">
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.openLeaderboard.type"
                  class="task-info"
                  plain
                >
                  访问排行榜
                  <el-icon
                    v-show="dailyTaskInfo.openLeaderboard.status === 'undone'"
                  >
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openLeaderboard.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openLeaderboard.status === 'done'"
                  >
                    <Check />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openLeaderboard.status === 'error'"
                  >
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.openRewards.type"
                  class="task-info"
                  plain
                >
                  访问奖励页面
                  <el-icon
                    v-show="dailyTaskInfo.openRewards.status === 'undone'"
                  >
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openRewards.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.openRewards.status === 'done'">
                    <Check />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openRewards.status === 'error'"
                  >
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.openMarketplacek.type"
                  class="task-info"
                  plain
                >
                  访问商店
                  <el-icon
                    v-show="dailyTaskInfo.openMarketplacek.status === 'undone'"
                  >
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openMarketplacek.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openMarketplacek.status === 'done'"
                  >
                    <Check />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.openMarketplacek.status === 'error'"
                  >
                    <Close />
                  </el-icon>
                </el-button>
                <el-button
                  :type="dailyTaskInfo.replyPost.type"
                  class="task-info"
                  plain
                >
                  评论帖子
                  <el-icon v-show="dailyTaskInfo.replyPost.status === 'undone'">
                    <MoreFilled style="margin-left: 2px" />
                  </el-icon>
                  <el-icon
                    v-show="dailyTaskInfo.replyPost.status === 'doing'"
                    class="is-loading"
                  >
                    <Loading />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.replyPost.status === 'done'">
                    <Check />
                  </el-icon>
                  <el-icon v-show="dailyTaskInfo.replyPost.status === 'error'">
                    <Close />
                  </el-icon>
                </el-button>
              </div>
            </div>
            <el-divider
              v-show="taskInfoData.timeOnSite.show"
              content-position="center"
            >
              AWA在线
            </el-divider>
            <el-progress
              v-show="taskInfoData.timeOnSite.show"
              :text-inside="true"
              :percentage="
                Math.floor(
                  (taskInfoData.timeOnSite.arp /
                    taskInfoData.timeOnSite.maxArp) *
                    10000
                ) / 100
              "
              :stroke-width="20"
              :color="colors"
            />
            <el-divider
              v-show="taskInfoData.watchTwitch.show"
              content-position="center"
            >
              Twitch在线
            </el-divider>
            <el-progress
              v-show="taskInfoData.watchTwitch.show"
              :text-inside="true"
              :percentage="
                Math.floor(
                  (taskInfoData.watchTwitch.arp /
                    taskInfoData.watchTwitch.maxArp) *
                    10000
                ) / 100
              "
              :stroke-width="20"
              :color="colors"
            />
            <el-divider
              v-show="
                taskInfoData.steamQuest.show && steamTasksStatus.length > 0
              "
              content-position="center"
            >
              Steam挂机
            </el-divider>
            <el-row v-show="!!steamTasksStatus[0]">
              <el-col
                :span="8"
                style="text-align: right; padding-right: 10px; color: #4e4f52"
              >
                {{
                  steamTasksStatus[0]?.link
                    ? steamTasksStatus[0].link.match(
                      /steam\/quests\/(.+)/
                    )?.[1] ||
                      (steamTasksStatus[0]?.id
                        ? `app/${steamTasksStatus[0].id}`
                        : "-")
                    : "-"
                }}
              </el-col>
              <el-col :span="16">
                <el-progress
                  :text-inside="true"
                  :percentage="
                    parseInt(steamTasksStatus[0]?.progress || '0', 10) > 100
                      ? 100
                      : parseInt(steamTasksStatus[0]?.progress || '0', 10)
                  "
                  :stroke-width="20"
                  :color="colors"
                />
              </el-col>
            </el-row>
            <el-row v-show="!!steamTasksStatus[1]">
              <el-col
                :span="8"
                style="text-align: right; padding-right: 10px; color: #4e4f52"
              >
                {{
                  steamTasksStatus[1]?.link
                    ? steamTasksStatus[1].link.match(
                      /steam\/quests\/(.+)/
                    )?.[1] ||
                      (steamTasksStatus[1]?.id
                        ? `app/${steamTasksStatus[1].id}`
                        : "-")
                    : "-"
                }}
              </el-col>
              <el-col :span="16">
                <el-progress
                  :text-inside="true"
                  :percentage="
                    parseInt(steamTasksStatus[0]?.progress || '0', 10) > 100
                      ? 100
                      : parseInt(steamTasksStatus[0]?.progress || '0', 10)
                  "
                  :stroke-width="20"
                  :color="colors"
                />
              </el-col>
            </el-row>
            <el-row v-show="!!steamTasksStatus[2]">
              <el-col
                :span="8"
                style="text-align: right; padding-right: 10px; color: #4e4f52"
              >
                {{
                  steamTasksStatus[2]?.link
                    ? steamTasksStatus[2].link.match(
                      /steam\/quests\/(.+)/
                    )?.[1] ||
                      (steamTasksStatus[2]?.id
                        ? `app/${steamTasksStatus[2].id}`
                        : "-")
                    : "-"
                }}
              </el-col>
              <el-col :span="16">
                <el-progress
                  :text-inside="true"
                  :percentage="
                    parseInt(steamTasksStatus[0]?.progress || '0', 10) > 100
                      ? 100
                      : parseInt(steamTasksStatus[0]?.progress || '0', 10)
                  "
                  :stroke-width="20"
                  :color="colors"
                />
              </el-col>
            </el-row>
            <el-row v-show="!!steamTasksStatus[3]">
              <el-col
                :span="8"
                style="text-align: right; padding-right: 10px; color: #4e4f52"
              >
                {{
                  steamTasksStatus[3]?.link
                    ? steamTasksStatus[3].link.match(
                      /steam\/quests\/(.+)/
                    )?.[1] ||
                      (steamTasksStatus[3]?.id
                        ? `app/${steamTasksStatus[3].id}`
                        : "-")
                    : "-"
                }}
              </el-col>
              <el-col :span="16">
                <el-progress
                  :text-inside="true"
                  :percentage="
                    parseInt(steamTasksStatus[0]?.progress || '0', 10) > 100
                      ? 100
                      : parseInt(steamTasksStatus[0]?.progress || '0', 10)
                  "
                  :stroke-width="20"
                  :color="colors"
                />
              </el-col>
            </el-row>
          </el-main>
        </el-container>
        <el-card
          class="box-card"
          shadow="never"
          style="width: 100%; margin: 10px auto"
        >
          <template #header>
            <div
              class="card-header"
              style="text-align: center; display: block; font-weight: bold"
            >
              <span>日志</span>
            </div>
          </template>
          <div
            id="log-area"
            class="text"
            style="height: 200px; overflow-y: auto"
          />
        </el-card>
      </div>
    </el-tab-pane>
    <el-tab-pane>
      <template #label>
        <span
          class="custom-tabs-label"
          style="user-select: none"
        >
          <el-icon><Setting /></el-icon>
          <span>设置</span>
        </span>
      </template>
      <SettingForm />
    </el-tab-pane>
  </el-tabs>
  <footer>
    <el-tag>AWA-Helper-GUI</el-tag>
    <el-tag
      class="ml-2"
      type="success"
    >
      V{{ version }}
    </el-tag>
    <el-tag
      class="ml-2"
      type="warning"
    >
      By {{ author }}
    </el-tag>
  </footer>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { reactive } from 'vue';
import { readSetting, readDefaultSetting, version, author } from '#preload';
import { ElMessageBox, ElNotification  } from 'element-plus';

interface singalTaskInfo {
  status: string;
  arp: number;
  maxArp: number;
  show: boolean;
  doing?: boolean;
}
interface taskInfoType {
  dailyTask: singalTaskInfo;
  timeOnSite: singalTaskInfo;
  watchTwitch: singalTaskInfo;
  steamQuest: singalTaskInfo;
}

const config = reactive(readSetting() || readDefaultSetting());
let taskInfo: taskInfoType = {
  dailyTask: {
    status: 'undone',
    arp: 0,
    maxArp: 5,
    show: true,
  },
  timeOnSite: {
    status: 'undone',
    arp: 0,
    maxArp: 5,
    show: config?.awaQuests?.includes('AWA在线') ?? true,
  },
  watchTwitch: {
    status: 'undone',
    arp: 0,
    maxArp: 15,
    show: config?.awaQuests?.includes('Twitch在线') ?? true,
  },
  steamQuest: {
    status: 'undone',
    arp: 0,
    maxArp: 50,
    show: config?.awaQuests?.includes('Steam挂机') ?? true,
  },
};
const dailyTaskInfo = reactive({
  changeBorder: {
    row: 1,
    status: 'undone',
    type: 'primary',
  },
  changeBadge: {
    row: 1,
    status: 'undone',
    type: 'primary',
  },
  changeAvatar: {
    row: 1,
    status: 'undone',
    type: 'primary',
  },
  viewPosts: {
    row: 1,
    status: 'undone',
    type: 'primary',
  },
  viewNews: {
    row: 1,
    status: 'undone',
    type: 'primary',
  },
  sharePosts: {
    row: 2,
    status: 'undone',
    type: 'primary',
  },
  openLink: {
    row: 2,
    status: 'undone',
    type: 'primary',
    show: false,
  },
  openLeaderboard: {
    row: 2,
    status: 'undone',
    type: 'primary',
  },
  openRewards: {
    row: 2,
    status: 'undone',
    type: 'primary',
  },
  openMarketplacek: {
    row: 2,
    status: 'undone',
    type: 'primary',
  },
  replyPost: {
    row: 2,
    status: 'undone',
    type: 'primary',
  },
});
const taskname2id: Array<Array<string>> = [];
const taskInfoData = reactive(taskInfo);
const tasksStatus = reactive({
  main: 'undone',
  dailyTask: 'undone',
  timeOnSite: 'undone',
  watchTwitch: 'undone',
  steamQuest: 'undone',
});
interface steamGameInfo {
  id: string;
  time: number;
  arp: number;
  link: string;
  progress?: string;
}
interface updateInfo {
  link: string;
  version: string;
}
interface userInfo {
  username: string;
  tier: string;
  arpTotal: string;
  arpLifetime: string;
}
const steamTasksStatus = reactive<Array<steamGameInfo>>([]);
const userInfoTableData = reactive<Array<userInfo>>([{
  username: 'Unknown',
  tier: 'Unknown',
  arpTotal: 'Unknown',
  arpLifetime: 'Unknown',
}]);
window.ipcRenderer.on(
  'log',
  (
    event: any,
    message: {
      message: string;
      id: string;
      type?: string;
      success?: boolean;
      console?: any;
      data?: Array<steamGameInfo> | updateInfo | userInfo;
    },
  ) => {
    console.log(message);
    if (!message.type || message.type === 'logLine') {
      const logId = message.id;
      const logLine = document.getElementById(logId);
      if (logLine) {
        logLine.innerHTML += message.message;
        logLine.scrollIntoView(true);
        const dailyTaskId = taskname2id.find((e) => e[1] === logId);
        if (
          dailyTaskId &&
          dailyTaskInfo[dailyTaskId[0] as keyof typeof dailyTaskInfo]
        ) {
          dailyTaskInfo[dailyTaskId[0] as keyof typeof dailyTaskInfo].status =
            message.message.includes('style="color: green;"')
              ? 'done'
              : 'error';
          dailyTaskInfo[dailyTaskId[0] as keyof typeof dailyTaskInfo].type =
            message.message.includes('style="color: green;"')
              ? 'success'
              : 'danger';
        }
        return;
      }
      const logArea = document.getElementById('log-area') as HTMLElement;
      const newLogLine = document.createElement('li');
      newLogLine.innerHTML = message.message;
      newLogLine.setAttribute('id', logId);
      logArea.appendChild(newLogLine);
      newLogLine.scrollIntoView(true);

      if (
        message.message.includes('正在更换') &&
        message.message.includes('Border')
      ) {
        dailyTaskInfo.changeBorder.status = 'doing';
        taskname2id.push(['changeBorder', logId]);
      } else if (
        message.message.includes('正在更换') &&
        message.message.includes('Badge')
      ) {
        dailyTaskInfo.changeBadge.status = 'doing';
        taskname2id.push(['changeBadge', logId]);
      } else if (
        message.message.includes('正在更换') &&
        message.message.includes('Avatar')
      ) {
        dailyTaskInfo.changeAvatar.status = 'doing';
        taskname2id.push(['changeAvatar', logId]);
      } else if (
        message.message.includes('正在发送浏览帖子') &&
        message.message.includes('记录')
      ) {
        if (message.message.includes('2162951')) {
          dailyTaskInfo.viewNews.status = 'doing';
          taskname2id.push(['viewNews', logId]);
        }
      } else if (message.message.includes('正在浏览页面')) {
        if (message.message.includes('rewards/leaderboard')) {
          dailyTaskInfo.openLeaderboard.status = 'doing';
          taskname2id.push(['openLeaderboard', logId]);
        } else if (message.message.includes('rewards')) {
          dailyTaskInfo.openRewards.status = 'doing';
          taskname2id.push(['openRewards', logId]);
        } else if (message.message.includes('marketplace')) {
          dailyTaskInfo.openMarketplacek.status = 'doing';
          taskname2id.push(['openMarketplacek', logId]);
        }
      } else if (message.message.includes('正在回复帖子')) {
        dailyTaskInfo.replyPost.status = 'doing';
        taskname2id.push(['replyPost', logId]);
      } else if (message.message.includes('今日所有任务已完成')) {
        tasksStatus.main = 'done';
      } else if (message.message.includes('每日任务未完成')) {
        tasksStatus.dailyTask = 'error';
      } else if (
        message.message.includes('正在初始化') &&
        message.message.includes('ASF')
      ) {
        tasksStatus.steamQuest = 'doing';
      } else if (
        (message.message.includes('Steam') &&
          message.message.includes('挂时长任务完成')) ||
        message.message.includes('当前账号游戏库中没有任务中的游戏')
      ) {
        tasksStatus.steamQuest = 'done';
      }
    } else if (message.type === 'taskInfo') {
      for (const [key, value] of Object.entries(JSON.parse(message.message))) {
        taskInfoData[key as keyof typeof taskInfoData] = {
          ...(value as singalTaskInfo),
          status:
            (value as singalTaskInfo).status === 'done'
              ? 'done'
              : tasksStatus[key as keyof typeof tasksStatus],
          show: taskInfoData[key as keyof typeof taskInfoData].show,
        } as singalTaskInfo;
      }
    } else if (message.type === 'dailyQuestLink') {
      dailyTaskInfo.openLink.show = true;
    } else if (message.type === 'tasksStatus') {
      tasksStatus[message.message[0] as keyof typeof tasksStatus] =
        message.message[1];
    } else if (message.type === 'viewPosts') {
      if (message.message === 'doing') {
        dailyTaskInfo.viewPosts.status = 'doing';
      } else if (message.message === 'done') {
        dailyTaskInfo.viewPosts.status = message.success ? 'done' : 'error';
        dailyTaskInfo.viewPosts.type = message.success ? 'success' : 'error';
      }
    } else if (message.type === 'viewNews') {
      if (message.message === 'doing') {
        dailyTaskInfo.viewNews.status = 'doing';
      } else if (message.message === 'done') {
        dailyTaskInfo.viewNews.status = message.success ? 'done' : 'error';
        dailyTaskInfo.viewNews.type = message.success ? 'success' : 'error';
      }
    } else if (message.type === 'sharePosts') {
      if (message.message === 'doing') {
        dailyTaskInfo.sharePosts.status = 'doing';
      } else if (message.message === 'done') {
        dailyTaskInfo.sharePosts.status = message.success ? 'done' : 'error';
        dailyTaskInfo.sharePosts.type = message.success ? 'success' : 'error';
      }
    } else if (message.type === 'openLink') {
      if (message.message === 'doing') {
        dailyTaskInfo.openLink.status = 'doing';
      } else if (message.message === 'done') {
        dailyTaskInfo.openLink.status = message.success ? 'done' : 'error';
        dailyTaskInfo.openLink.type = message.success ? 'success' : 'danger';
      }
    } else if (message.type === 'steamTasksStatus' && message.data) {
      for (const value of (message.data as Array<steamGameInfo>)) {
        if (steamTasksStatus.find((task) => task.id === value.id)) {
          steamTasksStatus[
            steamTasksStatus.findIndex((task) => task.id === value.id)
          ] = value;
        } else {
          steamTasksStatus.push(value);
        }
      }
      if (message.message === 'doing') {
        dailyTaskInfo.openLink.status = 'doing';
      } else if (message.message === 'done') {
        dailyTaskInfo.openLink.status = message.success ? 'done' : 'error';
        dailyTaskInfo.openLink.type = message.success ? 'success' : 'error';
      }
    } else if (message.type === 'updateNotice' && message.data) {
      const notification = ElNotification({
        title: '检测到新版本 V' + (message.data as updateInfo).version,
        message: `更新链接: ${(message.data as updateInfo).link}`,
        position: 'bottom-right',
        duration: 0,
        type: 'warning',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        'on-click': () => {
          window.open((message.data as updateInfo).link);
          notification.close();
        },
      });
    } else if (message.type === 'userInfo' && message.data) {
      userInfoTableData[0] = message.data as userInfo;
    } else if (message.type === 'error') {
      if (message.message) {
        const logId = message.id;
        const logLine = document.getElementById(logId);
        if (logLine) {
          logLine.innerHTML += message.message;
          logLine.scrollIntoView(true);
          return;
        }
        const logArea = document.getElementById('log-area') as HTMLElement;
        const newLogLine = document.createElement('li');
        newLogLine.innerHTML = message.message;
        newLogLine.setAttribute('id', logId);
        logArea.appendChild(newLogLine);
        newLogLine.scrollIntoView(true);
      }
      if (message.console) {
        console.error(message.console);
      }
      tasksStatus.main = 'error';
    }
  },
);
const ask = async (
  question: string,
  title?: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'warning',
) => {
  return ElMessageBox.confirm(question, title, {
    confirmButtonText: '继续任务',
    cancelButtonText: '跳过每日任务',
    type,
    dangerouslyUseHTMLString: true,
    center: true,
  })
    .then(() => true)
    .catch(() => false);
};
window.ipcRenderer.on(
  'question',
  async (event: any, { id, question }: { id: string; question: string }) => {
    const answer = await ask(question, '注意');
    window.ipcRenderer.invoke('answer-' + id, answer);
  },
);
const startDailyQuest = () => {
  tasksStatus.main = 'doing';
  const newConfig = readSetting();
  if (newConfig) {
    taskInfoData.timeOnSite.show = newConfig.awaQuests.includes('AWA在线');
    taskInfoData.watchTwitch.show = newConfig.awaQuests.includes('Twitch在线');
    taskInfoData.steamQuest.show = newConfig.awaQuests.includes('Steam挂机');
  }
  window.ipcRenderer.invoke('startDailyQuest').catch(() => startDailyQuest());
};
window.onload = function () {
  if (config.startOnOpen) {
    startDailyQuest();
  }
};
const colors = [
  { color: '#909399', percentage: 20 },
  { color: '#f56c6c', percentage: 40 },
  { color: '#e6a23c', percentage: 60 },
  { color: '#409eff', percentage: 80 },
  { color: '#67c23a', percentage: 100 },
];
</script>

<style>
.el-icon {
  vertical-align: middle;
}
.el-row {
  margin-bottom: 10px;
}
.el-row button.task-name {
  width: 160px;
}
.el-row button.task-status {
  margin-left: 5px;
  margin-top: 3px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}

.box-card {
  width: 480px;
}
.daily-task-info-area {
  margin: auto;
  width: max-content;
}
.daily-task-info-area button {
  margin-bottom: 12px;
}
.daily-task-row1,
.daily-task-row2 {
  width: max-content;
  margin: auto;
}
.el-divider.el-divider--horizontal {
  margin: 15px 0;
}
.el-notification__content {
  text-align: left !important;
}
.el-table .cell {
  text-align: center !important;
  line-height: 15px !important;
}
footer {
  text-align: center;
  margin-top: 10px;
}
.ml-2 {
  margin-left: 0.5rem;
}
</style>
