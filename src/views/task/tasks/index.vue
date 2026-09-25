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
      <el-form-item label="标题" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入标题"
          clearable
          @keyup.enter="handleQuery"
          class="!w-240px"
        />
      </el-form-item>
      <el-form-item label="任务状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择任务状态" clearable class="!w-200px">
          <el-option
            v-for="item in TASK_STATUS_OPTIONS"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="是否置顶" prop="topFlag">
        <el-select v-model="queryParams.topFlag" placeholder="请选择是否置顶" clearable class="!w-200px">
          <el-option label="置顶" :value="1" />
          <el-option label="不置顶" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="queryParams.startTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
        />
      </el-form-item>
      <el-form-item label="截止时间" prop="endTime">
        <el-date-picker
          v-model="queryParams.endTime"
          value-format="YYYY-MM-DD HH:mm:ss"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="[new Date('1 00:00:00'), new Date('1 23:59:59')]"
          class="!w-220px"
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
        <el-button
          type="primary"
          plain
          @click="openForm('create')"
          v-hasPermi="['task:s:create']"
        >
          <Icon icon="ep:plus" class="mr-5px" /> 新增
        </el-button>
        <el-button
          type="success"
          plain
          @click="handleExport"
          :loading="exportLoading"
          v-hasPermi="['task:s:export']"
        >
          <Icon icon="ep:download" class="mr-5px" /> 导出
        </el-button>
        <el-button
          type="danger"
          plain
          :disabled="isEmpty(checkedIds)"
          @click="handleDeleteBatch"
          v-hasPermi="['task:s:delete']"
        >
          <Icon icon="ep:delete" class="mr-5px" /> 批量删除
        </el-button>
      </el-form-item>
    </el-form>
  </ContentWrap>

  <!-- 列表 -->
  <ContentWrap>
    <el-table
      row-key="id"
      v-loading="loading"
      :data="list"
      :stripe="true"
      :show-overflow-tooltip="true"
      @selection-change="handleRowCheckboxChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column label="编号" align="center" prop="id" width="80px" />
      <el-table-column label="标题" align="center" prop="title" min-width="140px" />
      <el-table-column
        label="发布时间"
        align="center"
        prop="publishTime"
        :formatter="dateFormatter"
        width="170px"
      />
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
      <el-table-column label="名额限制" align="center" prop="quota" width="90px" />
      <el-table-column label="发布人" align="center" prop="publisherName" width="110px" />
      <el-table-column label="是否置顶" align="center" width="90px">
        <template #default="scope">
          <el-tag v-if="scope.row.topFlag === 1" type="warning">置顶</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="任务状态" align="center" width="100px">
        <template #default="scope">
          <el-tag :type="statusTagType(scope.row.status)">
            {{ statusLabel(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        align="center"
        prop="createTime"
        :formatter="dateFormatter"
        width="170px"
      />
      <el-table-column label="操作" align="center" min-width="220px">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="openForm('update', scope.row.id)"
            v-hasPermi="['task:s:update']"
          >
            编辑
          </el-button>
          <el-button
            v-if="scope.row.status === TASK_STATUS.DRAFT"
            link
            type="success"
            @click="handlePublish(scope.row)"
            v-hasPermi="['task:s:update']"
          >
            发布
          </el-button>
          <el-button
            link
            type="warning"
            @click="handleToggleTop(scope.row)"
            v-hasPermi="['task:s:update']"
          >
            {{ scope.row.topFlag === 1 ? '取消置顶' : '置顶' }}
          </el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row.id)"
            v-hasPermi="['task:s:delete']"
          >
            删除
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

  <!-- 表单弹窗：添加/修改 -->
  <sForm ref="formRef" @success="getList" />
</template>

<script setup lang="ts">
import { isEmpty } from '@/utils/is'
import { dateFormatter } from '@/utils/formatTime'
import download from '@/utils/download'
import { TaskApi, Task, TASK_STATUS, TASK_STATUS_OPTIONS } from '@/api/task/tasks'
import sForm from './sForm.vue'

/** 任务 列表 */
defineOptions({ name: 'TaskManage' })

const message = useMessage() // 消息弹窗
const { t } = useI18n() // 国际化

const loading = ref(true) // 列表的加载中
const list = ref<Task[]>([]) // 列表的数据
const total = ref(0) // 列表的总页数
const queryParams = reactive({
  pageNo: 1,
  pageSize: 10,
  title: undefined,
  status: undefined,
  topFlag: undefined,
  startTime: [],
  endTime: [],
  createTime: []
})
const queryFormRef = ref() // 搜索的表单
const exportLoading = ref(false) // 导出的加载中

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
    const data = await TaskApi.getTaskPage(queryParams)
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

/** 添加/修改操作 */
const formRef = ref()
const openForm = (type: string, id?: number) => {
  formRef.value.open(type, id)
}

/** 发布任务 */
const handlePublish = async (row: Task) => {
  try {
    await message.confirm('确认发布该任务吗？发布后将记录发布时间与发布人。')
    await TaskApi.publishTask(row.id!)
    message.success('发布成功')
    await getList()
  } catch {}
}

/** 切换置顶 */
const handleToggleTop = async (row: Task) => {
  try {
    const topFlag = await TaskApi.toggleTaskTopFlag(row.id!)
    message.success(topFlag === 1 ? '已置顶' : '已取消置顶')
    await getList()
  } catch {}
}

/** 删除按钮操作 */
const handleDelete = async (id: number) => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    // 发起删除
    await TaskApi.deleteTask(id)
    message.success(t('common.delSuccess'))
    // 刷新列表
    await getList()
  } catch {}
}

/** 批量删除任务 */
const handleDeleteBatch = async () => {
  try {
    // 删除的二次确认
    await message.delConfirm()
    await TaskApi.deleteTaskList(checkedIds.value)
    checkedIds.value = []
    message.success(t('common.delSuccess'))
    await getList()
  } catch {}
}

const checkedIds = ref<number[]>([])
const handleRowCheckboxChange = (records: Task[]) => {
  checkedIds.value = records.map((item) => item.id!)
}

/** 导出按钮操作 */
const handleExport = async () => {
  try {
    // 导出的二次确认
    await message.exportConfirm()
    // 发起导出
    exportLoading.value = true
    const data = await TaskApi.exportTask(queryParams)
    download.excel(data, '任务.xls')
  } catch {
  } finally {
    exportLoading.value = false
  }
}

/** 初始化 **/
onMounted(() => {
  getList()
})
</script>