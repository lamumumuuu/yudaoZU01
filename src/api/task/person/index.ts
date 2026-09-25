import request from '@/config/axios'

/** 任务人员信息 */
export interface Person {
  id?: number; // 编号
  name?: string; // 姓名
  number?: string; // 电话号码
  birthday?: string; // 出生年月，格式 yyyy-MM-dd（页面按「年-月」展示）
  userId?: number; // 关联账号编号（system_users.id）
  username?: string; // 登录账号
  createTime?: string; // 创建时间
}

// 任务人员 API
export const PersonApi = {
  // 查询任务人员分页
  getPersonPage: async (params: any) => {
    return await request.get({ url: `/task/person/page`, params })
  },

  // 查询任务人员详情
  getPerson: async (id: number) => {
    return await request.get({ url: `/task/person/get?id=` + id })
  },

  // 新增任务人员（按电话号码匹配账号，不存在则自动创建）
  createPerson: async (data: Person) => {
    return await request.post({ url: `/task/person/create`, data })
  },

  // 修改任务人员
  updatePerson: async (data: Person) => {
    return await request.put({ url: `/task/person/update`, data })
  },

  // 删除任务人员
  deletePerson: async (id: number) => {
    return await request.delete({ url: `/task/person/delete?id=` + id })
  },

  /** 批量删除任务人员 */
  deletePersonList: async (ids: number[]) => {
    return await request.delete({ url: `/task/person/delete-list?ids=${ids.join(',')}` })
  },

  // 导出任务人员 Excel
  exportPerson: async (params: any) => {
    return await request.download({ url: `/task/person/export-excel`, params })
  },

  // 查询当前登录账号关联的任务人员，未关联时返回 null
  getMyPerson: async () => {
    return await request.get({ url: `/task/person/my` })
  },

  // 当前登录账号补充任务人员信息
  createMyPerson: async (data: Person) => {
    return await request.post({ url: `/task/person/my/create`, data })
  }
}