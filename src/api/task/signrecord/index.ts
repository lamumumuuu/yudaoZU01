import request from '@/config/axios'

/** 报名记录信息（报名明细） */
export interface SignRecord {
  id?: number; // 编号
  taskId?: number; // 任务编号
  taskTitle?: string; // 任务标题
  personId?: number; // 报名人员编号
  personName?: string; // 报名人员姓名
  personNumber?: string; // 报名人员电话号码
  signTime?: string; // 报名时间
  status?: number; // 报名状态 0已报名 1已取消
}

/** 报名记录状态枚举，与后端 SignRecordStatusEnum 保持一致 */
export const SIGN_RECORD_STATUS = {
  SIGNED: 0,
  CANCELED: 1
} as const

// 报名记录 API：写入统一由报名 / 取消报名接口完成，这里只提供查询
export const SignRecordApi = {
  // 查询报名记录分页
  getSignRecordPage: async (params: any) => {
    return await request.get({ url: `/task/sign-record/page`, params })
  }
}