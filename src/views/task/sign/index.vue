<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form class="-mb-15px" :model="queryParams" :inline="true" label-width="80px">
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表：只展示处于「已发布」状态的任务 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="编号" align="center" prop="id" width="80px" />
      <el-table-column label="标题" align="center" prop="title" min-width="140px" />
      <el-table-column
        label="开始时间"
        align="center"
        prop="startTime"
        :formatter="dateFormatter"
        width="170px"
      />
      <el-table-column
        label="截止时间"
        align="center"
        prop="endTime"
        :formatter="dateFormatter"
        width="170px"
      />
      <el-table-column label="名额" align="center" prop="quota" width="80px" />
      <el-table-column label="已报名 / 名额" align="center" width="130px">
        <template #default="scope">
          {{ metaMap[scope.row.id!]?.personSum ?? 0 }} / {{ metaMap[scope.row.id!]?.personMax ?? 0 }}
        </template>
      </el-table-column>
      <el-table-column label="报名状态" align="center" width="110px">
        <template #default="scope">
          <el-tag v-if="isSigned(scope.row)" type="success">已报名</el-tag>
          <el-tag v-else-if="isFull(scope.row)" type="danger">已满</el-tag>
          <el-tag v-else type="info">可报名</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" min-width="120px">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row)">查看</el-button>
          <el-button
            v-if="isSigned(scope.row)"
            link
            type="danger"
            @click="handleCancel(scope.row)"
            v-hasPermi="['task:sign:join']"
          >
            取消报名
          </el-button>
          <el-button
            v-else-if="isFull(scope.row)"
            link
            type="info"
            disabled
          >
            名额已满
          </el-button>
          <el-button
            v-else-if="isExpired(scope.row)"
            link
            type="info"
            disabled
          >
            已截止
          </el-button>
          <el-button
            v-else
            link
            type="success"
            @click="handleJoin(scope.row)"
            v-hasPermi="['task:sign:join']"
          >
            接取任务
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 分页 -->
    <Pagination
      :total="total"
      v-model:page="queryParams.pageNo"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />
  </ContentWrap>

  <!-- 任务详情 -->
  <Dialog v-model="detailVisible" title="任务详情" width="700px">
    <el-descriptions :column="2" border>
      <el-descriptions-item label="标题">{{ detail.title }}</el-descriptions-item>
      <el-descriptions-item label="发布人">{{ detail.publisherName || '-' }}</el-descriptions-item>
      <el-descriptions-item label="开始时间">
        {{ formatDate(detail.startTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="截止时间">
        {{ formatDate(detail.endTime) }}
      </el-descriptions-item>
      <el-descriptions-item label="名额限制">{{ detail.quota }}</el-descriptions-item>
      <el-descriptions-item label="已报名">
        {{ metaMap[detail.id!]?.personSum ?? 0 }} 人
      </el-descriptions-item>
    </el-descriptions>
    <div class="mt-10px mb-5px font-bold">任务内容</div>
    <!-- eslint-disable-next-line vue/no-v-html -->
    <div v-html="detail.content"></div>
  </Dialog>

  <!-- 人员信息补充：当前登录账号尚未登记为任务人员时弹出 -->
  <PersonForm ref="personFormRef" @success="handlePersonCreated" />
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { dateFormatter, formatDate } from '@/utils/formatTime'
import { TaskApi, Task } from '@/api/task/tasks'
import { SignApi, Sign, SIGN_STATUS } from '@/api/task/sign'
import { PersonApi } from '@/api/task/person'
import PersonForm from '../person/PersonForm.vue'

/** 任务报名：非管理员自助报名入口，只展示已发布的任务 */
defineOptions({ name: 'Sign' })

const message = useMessage() // 消息弹窗

const loading = ref(true) // 列表的加载中
const list = ref<Task[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const metaMap = ref<Record<number, Sign>>({}) // 任务编号 -> 报名进度与当前账号报名状态
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined
})

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await TaskApi.getPublishedTaskPage(queryParams)
    list.value = data.list
    total.value = data.total
    await loadMeta()
  } finally {
    loading.value = false
  }
}

/** 批量加载报名进度与「我是否已报名」，一次请求覆盖当前页 */
const loadMeta = async () => {
  const taskIds = list.value.map((item) => item.id!).filter(Boolean)
  const metas: Sign[] = await SignApi.getSignMetaList(taskIds)
  const map: Record<number, Sign> = {}
  metas.forEach((item) => {
    if (item.taskId != null) {
      map[item.taskId] = item
    }
  })
  metaMap.value = map
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryParams.title = undefined
  handleQuery()
}

/** 报名状态判断 */
const isSigned = (row: Task) => metaMap.value[row.id!]?.signed === true
const isFull = (row: Task) => metaMap.value[row.id!]?.status === SIGN_STATUS.FULL
const isExpired = (row: Task) => !!row.endTime && dayjs(row.endTime).isBefore(dayjs())

/** 任务详情 */
const detailVisible = ref(false)
const detail = ref<Task>({})
const openDetail = (row: Task) => {
  detail.value = row
  detailVisible.value = true
}

/** 接取任务：先确认当前账号已登记为任务人员，未登记则先补充信息 */
const personFormRef = ref()
const pendingTaskId = ref<number>()
const handleJoin = async (row: Task) => {
  const person = await PersonApi.getMyPerson()
  if (!person) {
    pendingTaskId.value = row.id
    message.warning('当前账号尚未登记任务人员信息，请先补充后再接取任务')
    personFormRef.value.open('create', undefined, true)
    return
  }
  await doJoin(row.id!)
}

const doJoin = async (taskId: number) => {
  try {
    await SignApi.joinTask(taskId)
    message.success('接取任务成功')
    await getList()
  } catch {}
}

/** 人员信息补充成功后，自动继续刚才的报名动作 */
const handlePersonCreated = async () => {
  message.success('人员信息已补充')
  const taskId = pendingTaskId.value
  pendingTaskId.value = undefined
  if (taskId) {
    await doJoin(taskId)
  }
}

/** 取消报名 */
const handleCancel = async (row: Task) => {
  try {
    await message.confirm(`确认取消「${row.title}」的报名吗？`)
    await SignApi.cancelTask(row.id!)
    message.success('已取消报名')
    await getList()
  } catch {}
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>