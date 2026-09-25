<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="formData.title" placeholder="请输入标题" />
      </el-form-item>
      <el-form-item label="内容" prop="content">
        <Editor v-model="formData.content" height="150px" />
      </el-form-item>
      <el-form-item label="开始时间" prop="startTime">
        <el-date-picker
          v-model="formData.startTime"
          type="datetime"
          value-format="x"
          placeholder="请选择开始时间"
          class="!w-100%"
        />
      </el-form-item>
      <el-form-item label="截止时间" prop="endTime">
        <el-date-picker
          v-model="formData.endTime"
          type="datetime"
          value-format="x"
          placeholder="请选择截止时间"
          class="!w-100%"
        />
      </el-form-item>
      <el-form-item label="名额限制" prop="quota">
        <el-input-number v-model="formData.quota" :min="1" placeholder="请输入名额限制" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { TaskApi, Task } from '@/api/task/tasks'

/** 任务 表单 */
defineOptions({ name: 'TaskForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const formData = ref<Task>({
  title: undefined,
  content: undefined,
  startTime: undefined,
  endTime: undefined,
  quota: undefined
})
const formRules = reactive({
  title: [{ required: true, message: '标题不能为空', trigger: 'blur' }],
  content: [{ required: true, message: '内容不能为空', trigger: 'blur' }],
  startTime: [{ required: true, message: '开始时间不能为空', trigger: 'change' }],
  endTime: [{ required: true, message: '截止时间不能为空', trigger: 'change' }],
  quota: [{ required: true, message: '名额限制不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number) => {
  dialogVisible.value = true
  dialogTitle.value = t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await TaskApi.getTask(id)
    } finally {
      formLoading.value = false
    }
  }
}
defineExpose({ open }) // 提供 open 方法，用于打开弹窗

/** 提交表单 */
const emit = defineEmits(['success']) // 定义 success 事件，用于操作成功后的回调
const submitForm = async () => {
  // 校验表单
  await formRef.value.validate()
  // 提交请求
  formLoading.value = true
  try {
    const data = formData.value as Task
    if (formType.value === 'create') {
      await TaskApi.createTask(data)
      message.success('任务已保存为草稿，可在列表中发布')
    } else {
      await TaskApi.updateTask(data)
      message.success(t('common.updateSuccess'))
    }
    dialogVisible.value = false
    // 发送操作成功的事件
    emit('success')
  } finally {
    formLoading.value = false
  }
}

/** 重置表单 */
const resetForm = () => {
  formData.value = {
    title: undefined,
    content: undefined,
    startTime: undefined,
    endTime: undefined,
    quota: undefined
  }
  formRef.value?.resetFields()
}
</script>