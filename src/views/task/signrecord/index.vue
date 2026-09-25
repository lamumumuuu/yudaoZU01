<template>
  <ContentWrap>
    <!-- 搜索工作栏 -->
    <el-form
      class="-mb-15px"
      :model="queryParams"
      ref="queryFormRef"
      :inline="true"
      label-width="80px"
    >
      <el-form-item label="任务标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入任务标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker
          v-model="queryParams.createTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item>
        <el-button @click="handleQuery"><Icon icon="ep:search" class="mr-5px" /> 搜索</el-button>
        <el-button @click="resetQuery"><Icon icon="ep:refresh" class="mr-5px" /> 重置</el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表：按任务汇总报名进度，草稿任务不参与 -->
  <ContentWrap>
    <el-table v-loading="loading" :data="list" :stripe="true" :show-overflow-tooltip="true">
      <el-table-column label="任务编号" align="center" prop="taskId" width="100px" />
      <el-table-column label="任务标题" align="center" prop="taskTitle" min-width="140px" />
      <el-table-column label="任务状态" align="center" width="100px">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.taskStatus)">
            {{ statusLabel(scope.row.taskStatus) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="已报名" align="center" prop="personSum" width="90px" />
      <el-table-column label="名额上限" align="center" prop="personMax" width="90px" />
      <el-table-column label="报名进度" align="center" min-width="200px">
        <template #default="scope">
          <el-progress
            :percentage="scope.row.percent ?? 0"
            :status="(scope.row.percent ?? 0) >= 100 ? 'success' : undefined"
          />
        </template>
      </el-table-column>
      <el-table-column label="报名状态" align="center" width="100px">
        <template #default="scope">
          <el-tag :type="scope.row.status === SIGN_STATUS.FULL ? 'danger' : 'success'">
            {{ scope.row.status === SIGN_STATUS.FULL ? '已满' : '未满' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="110px">
        <template #default="scope">
          <el-button link type="primary" @click="openDetail(scope.row)">报名明细</el-button>
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

  <!-- 报名明细弹窗：只读看板 -->
  <Dialog v-model="detailVisible" :title="`报名明细 - ${detailTask.taskTitle || ''}`" width="820px">
    <el-form :inline="true" label-width="80px" class="mb-10px">
      <el-form-item label="报名状态">
        <el-select
          v-model="recordParams.status"
          placeholder="全部"
          clearable
          class="!w-160px"
          @change="handleRecordQuery"
        >
          <el-option label="已报名" :value="SIGN_RECORD_STATUS.SIGNED" />
          <el-option label="已取消" :value="SIGN_RECORD_STATUS.CANCELED" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-table v-loading="recordLoading" :data="recordList" :stripe="true">
      <el-table-column label="姓名" align="center" prop="personName" />
      <el-table-column label="电话号码" align="center" prop="personNumber" />
      <el-table-column
        label="报名时间"
        align="center"
        prop="signTime"
        :formatter="dateFormatter"
        width="170px"
      />
      <el-table-column label="报名状态" align="center" width="100px">
        <template #default="scope">
          <el-tag :type="scope.row.status === SIGN_RECORD_STATUS.SIGNED ? 'success' : 'info'">
            {{ scope.row.status === SIGN_RECORD_STATUS.SIGNED ? '已报名' : '已取消' }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>
    <Pagination
      :total="recordTotal"
      v-model:page="recordParams.pageNo"
      v-model:limit="recordParams.pageSize"
      @pagination="getRecordList"
    />
  </Dialog>
</template>

<script setup lang="ts">
import { dateFormatter } from '@/utils/formatTime'
import { TASK_STATUS, TASK_STATUS_OPTIONS } from '@/api/task/tasks'
import { SignApi, Sign, SIGN_STATUS } from '@/api/task/sign'
import { SignRecordApi, SignRecord, SIGN_RECORD_STATUS } from '@/api/task/signrecord'

/** 报名进度：管理员只读看板，按任务汇总报名占比并下钻报名明细 */
defineOptions({ name: 'SignRecord' })

const loading = ref(true) // 列表的加载中
const list = ref<Sign[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  createTime: []
})
const queryFormRef = ref() // 搜索的表单

/** 状态展示 */
const statusLabel = (status?: number) =>
  TASK_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? '-'
const statusTagType = (status?: number) => {
  if (status === TASK_STATUS.DRAFT) return 'info'
  if (status === TASK_STATUS.PUBLISHED) return 'success'
  return 'danger'
}

/** 查询列表 */
const getList = async () => {
  loading.value = true
  try {
    const data = await SignApi.getSignPage(queryParams)
    list.value = data.list
    total.value = data.total
  } finally {
    loading.value = false
  }
}

/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.pageNo = 1
  getList()
}

/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields()
  handleQuery()
}

/** 报名明细弹窗 */
const detailVisible = ref(false)
const detailTask = ref<Sign>({})
const recordLoading = ref(false)
const recordList = ref<SignRecord[]>([])
const recordTotal = ref(0)
const recordParams = reactive({
  pageNo: 1,
  pageSize: 10,
  taskId: undefined as number | undefined,
  status: undefined as number | undefined
})

const openDetail = async (row: Sign) => {
  detailTask.value = row
  recordParams.taskId = row.taskId
  recordParams.status = undefined
  recordParams.pageNo = 1
  detailVisible.value = true
  await getRecordList()
}

/** 查询该任务的报名明细 */
const getRecordList = async () => {
  recordLoading.value = true
  try {
    const data = await SignRecordApi.getSignRecordPage(recordParams)
    recordList.value = data.list
    recordTotal.value = data.total
  } finally {
    recordLoading.value = false
  }
}

/** 明细筛选条件变更后回到第一页 */
const handleRecordQuery = () => {
  recordParams.pageNo = 1
  getRecordList()
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>