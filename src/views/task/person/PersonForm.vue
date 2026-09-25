<template>
  <Dialog :title="dialogTitle" v-model="dialogVisible">
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="100px"
      v-loading="formLoading"
    >
      <el-form-item label="姓名" prop="name">
        <el-input v-model="formData.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="电话号码" prop="number">
        <el-input v-model="formData.number" placeholder="请输入电话号码" />
      </el-form-item>
      <el-form-item label="出生年月" prop="birthday">
        <el-date-picker
          v-model="formData.birthday"
          type="month"
          value-format="YYYY-MM-DD"
          placeholder="请选择出生年月"
          class="!w-100%"
        />
      </el-form-item>
      <el-form-item v-if="showAccount" label="登录账号">
        <el-input v-model="formData.username" disabled placeholder="保存后自动生成" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="submitForm" type="primary" :disabled="formLoading">确 定</el-button>
      <el-button @click="dialogVisible = false">取 消</el-button>
    </template>
  </Dialog>
</template>
<script setup lang="ts">
import { PersonApi, Person } from '@/api/task/person'

/** 任务人员 表单 */
defineOptions({ name: 'PersonForm' })

const { t } = useI18n() // 国际化
const message = useMessage() // 消息弹窗

const dialogVisible = ref(false) // 弹窗的是否展示
const dialogTitle = ref('') // 弹窗的标题
const formLoading = ref(false) // 表单的加载中：1）修改时的数据加载；2）提交的按钮禁用
const formType = ref('') // 表单的类型：create - 新增；update - 修改
const selfMode = ref(false) // 是否为「当前登录账号补充人员信息」
const showAccount = computed(() => !selfMode.value && formType.value === 'update')
const formData = ref<Person>({
  name: undefined,
  number: undefined,
  birthday: undefined,
  username: undefined
})
const formRules = reactive({
  name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
  number: [{ required: true, message: '电话号码不能为空', trigger: 'blur' }],
  birthday: [{ required: true, message: '出生年月不能为空', trigger: 'change' }]
})
const formRef = ref() // 表单 Ref

/** 打开弹窗 */
const open = async (type: string, id?: number, self = false) => {
  dialogVisible.value = true
  selfMode.value = self
  dialogTitle.value = self ? '补充人员信息' : t('action.' + type)
  formType.value = type
  resetForm()
  // 修改时，设置数据
  if (id) {
    formLoading.value = true
    try {
      formData.value = await PersonApi.getPerson(id)
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
    const data = formData.value as Person
    if (selfMode.value) {
      await PersonApi.createMyPerson(data)
      message.success('人员信息已补充')
    } else if (formType.value === 'create') {
      await PersonApi.createPerson(data)
      message.success(t('common.createSuccess'))
    } else {
      await PersonApi.updatePerson(data)
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
    name: undefined,
    number: undefined,
    birthday: undefined,
    username: undefined
  }
  formRef.value?.resetFields()
}
</script>