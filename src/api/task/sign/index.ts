import request from '@/config/axios'

/** 报名进度信息（任务维度汇总） */
export interface Sign {
  id?: number; // 报名进度编号，首次有人报名时创建，未创建时为空
  taskId?: number; // 任务编号
  taskTitle?: string; // 任务标题
  taskStatus?: number; // 任务状态 0草稿 1已发布 2已结束
  personSum?: number; // 已报名人数
  personMax?: number; // 名额上限
  status?: number; // 报名状态 0未满 1已满
  percent?: number; // 报名占比百分比 0-100
  signed?: boolean; // 当前登录账号是否已报名，仅报名元数据接口返回
  startTime?: string; // 任务开始时间
  endTime?: string; // 任务截止时间
  createTime?: string; // 任务创建时间
}

/** 报名状态枚举，与后端 TaskSignStatusEnum 保持一致 */
export const SIGN_STATUS = {
  NOT_FULL: 0,
  FULL: 1
} as const

// 报名进度 API
export const SignApi = {
  // 查询报名进度分页：按任务汇总，包含报名占比百分比
  getSignPage: async (params: any) => {
    return await request.get({ url: `/task/sign/page`, params })
  },

  // 批量查询任务报名元数据：已报人数、名额上限、当前账号是否已报名
  getSignMetaList: async (taskIds: number[]) => {
    if (!taskIds || taskIds.length === 0) {
      return []
    }
    return await request.get({
      url: `/task/sign/meta`,
      params: { taskIds: taskIds.join(',') }
    })
  },

  // 接取任务：当前登录账号自助报名
  joinTask: async (taskId: number) => {
    return await request.post({ url: `/task/sign/join`, params: { taskId } })
  },

  // 取消报名：当前登录账号取消自己的报名
  cancelTask: async (taskId: number) => {
    return await request.post({ url: `/task/sign/cancel`, params: { taskId } })
  }
}