import request from '@/config/axios'

/** 任务信息 */
export interface Task {
  id?: number; // 编号
  title?: string; // 标题
  content?: string; // 内容
  startTime?: Date; // 开始时间
  endTime?: Date; // 截止时间
  quota?: number; // 名额限制
  publishTime?: Date; // 发布时间
  publisher?: number; // 发布人（system_users.id）
  publisherName?: string; // 发布人姓名
  topFlag?: number; // 是否置顶 0否 1是
  status?: number; // 任务状态 0草稿 1已发布 2已结束
  createTime?: string; // 创建时间
}

/** 任务状态枚举，与后端 TaskStatusEnum 保持一致 */
export const TASK_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  FINISHED: 2
} as const

/** 任务状态可选项 */
export const TASK_STATUS_OPTIONS = [
  { label: '草稿', value: TASK_STATUS.DRAFT },
  { label: '已发布', value: TASK_STATUS.PUBLISHED },
  { label: '已结束', value: TASK_STATUS.FINISHED }
]

// 任务 API
export const TaskApi = {
  // 查询任务分页
  getTaskPage: async (params: any) => {
    return await request.get({ url: `/task/s/page`, params })
  },

  // 查询已发布任务分页：供任务报名页使用，只包含已发布的任务
  getPublishedTaskPage: async (params: any) => {
    return await request.get({ url: `/task/s/published-page`, params })
  },

  // 查询任务详情
  getTask: async (id: number) => {
    return await request.get({ url: `/task/s/get?id=` + id })
  },

  // 新增任务（保存为草稿）
  createTask: async (data: Task) => {
    return await request.post({ url: `/task/s/create`, data })
  },

  // 修改任务
  updateTask: async (data: Task) => {
    return await request.put({ url: `/task/s/update`, data })
  },

  // 发布任务：草稿 -> 已发布
  publishTask: async (id: number) => {
    return await request.put({ url: `/task/s/publish?id=` + id })
  },

  // 切换任务置顶状态
  toggleTaskTopFlag: async (id: number) => {
    return await request.put({ url: `/task/s/toggle-top-flag?id=` + id })
  },

  // 删除任务
  deleteTask: async (id: number) => {
    return await request.delete({ url: `/task/s/delete?id=` + id })
  },

  /** 批量删除任务 */
  deleteTaskList: async (ids: number[]) => {
    return await request.delete({ url: `/task/s/delete-list?ids=${ids.join(',')}` })
  },

  // 导出任务 Excel
  exportTask: async (params: any) => {
    return await request.download({ url: `/task/s/export-excel`, params })
  }
}