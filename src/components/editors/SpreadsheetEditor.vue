<template>
  <div class="spreadsheet-editor">
    <div class="toolbar">
      <el-button-group>
        <el-button :icon="Bold" title="加粗" @click="applyFormat('bold')" />
        <el-button :icon="Italic" title="斜体" @click="applyFormat('italic')" />
        <el-button :icon="Underline" title="下划线" @click="applyFormat('underline')" />
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-button-group>
        <el-button :icon="AlignLeft" title="左对齐" @click="applyAlignment('left')" />
        <el-button :icon="AlignCenter" title="居中对齐" @click="applyAlignment('center')" />
        <el-button :icon="AlignRight" title="右对齐" @click="applyAlignment('right')" />
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-color-picker
        v-model="textColor"
        size="small"
        show-alpha
        @change="applyTextColor"
      />
      
      <el-color-picker
        v-model="fillColor"
        size="small"
        show-alpha
        @change="applyFillColor"
      />
      
      <el-divider direction="vertical" />
      
      <el-dropdown trigger="click" @command="handleMergeCommand">
        <el-button>
          合并单元格
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="merge">合并选中单元格</el-dropdown-item>
            <el-dropdown-item command="unmerge">取消合并</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <el-divider direction="vertical" />
      
      <el-dropdown trigger="click" @command="handleInsertCommand">
        <el-button>
          插入
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="row-above">在上方插入行</el-dropdown-item>
            <el-dropdown-item command="row-below">在下方插入行</el-dropdown-item>
            <el-dropdown-item divided command="column-left">在左侧插入列</el-dropdown-item>
            <el-dropdown-item command="column-right">在右侧插入列</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <el-dropdown trigger="click" @command="handleDeleteCommand">
        <el-button>
          删除
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="row">删除行</el-dropdown-item>
            <el-dropdown-item command="column">删除列</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <el-divider direction="vertical" />
      
      <el-dropdown trigger="click" @command="handleFormatCommand">
        <el-button>
          格式
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="number">数字</el-dropdown-item>
            <el-dropdown-item command="currency">货币</el-dropdown-item>
            <el-dropdown-item command="percentage">百分比</el-dropdown-item>
            <el-dropdown-item command="date">日期</el-dropdown-item>
            <el-dropdown-item command="time">时间</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <el-divider direction="vertical" />
      
      <el-button :icon="Sort" title="排序" @click="showSortDialog = true" />
      <el-button :icon="Filter" title="筛选" @click="toggleFilter" />
      
      <el-divider direction="vertical" />
      
      <el-button :icon="Document" title="数据验证" @click="showValidationDialog = true" />
    </div>
    
    <div class="formula-bar">
      <div class="cell-reference">{{ activeCellRef }}</div>
      <el-input
        v-model="formulaInput"
        placeholder="输入公式"
        @input="updateFormula"
        @keydown.enter="applyFormula"
      >
        <template #prepend>
          <span class="formula-icon">=</span>
        </template>
      </el-input>
    </div>
    
    <div class="spreadsheet-container" ref="spreadsheetContainer">
      <!-- 这里将集成第三方表格组件，如 x-spreadsheet 或自定义实现 -->
      <div class="spreadsheet-placeholder">
        <p>表格编辑器将在这里集成</p>
        <p>支持单元格合并、样式设置、数据验证等高级功能</p>
      </div>
    </div>
    
    <div class="sheet-tabs">
      <div
        v-for="(sheet, index) in sheets"
        :key="index"
        :class="['sheet-tab', { active: activeSheet === index }]"
        @click="switchSheet(index)"
      >
        {{ sheet.name }}
      </div>
      <div class="add-sheet" @click="addSheet">
        <el-icon><Plus /></el-icon>
      </div>
    </div>
    
    <!-- 排序对话框 -->
    <el-dialog
      v-model="showSortDialog"
      title="排序"
      width="500px"
    >
      <el-form :model="sortForm" label-width="100px">
        <el-form-item label="排序依据">
          <el-select v-model="sortForm.column" placeholder="选择列">
            <el-option
              v-for="col in columns"
              :key="col.value"
              :label="col.label"
              :value="col.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="排序方式">
          <el-radio-group v-model="sortForm.order">
            <el-radio label="asc">升序</el-radio>
            <el-radio label="desc">降序</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSortDialog = false">取消</el-button>
        <el-button type="primary" @click="applySort">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 数据验证对话框 -->
    <el-dialog
      v-model="showValidationDialog"
      title="数据验证"
      width="500px"
    >
      <el-form :model="validationForm" label-width="100px">
        <el-form-item label="验证类型">
          <el-select v-model="validationForm.type" placeholder="选择验证类型">
            <el-option label="数字" value="number" />
            <el-option label="列表" value="list" />
            <el-option label="日期" value="date" />
            <el-option label="文本长度" value="textLength" />
            <el-option label="自定义公式" value="custom" />
          </el-select>
        </el-form-item>
        
        <template v-if="validationForm.type === 'number'">
          <el-form-item label="条件">
            <el-select v-model="validationForm.operator" placeholder="选择条件">
              <el-option label="大于" value=">" />
              <el-option label="小于" value="<" />
              <el-option label="等于" value="=" />
              <el-option label="大于等于" value=">=" />
              <el-option label="小于等于" value="<=" />
              <el-option label="不等于" value="!=" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="值">
            <el-input v-model.number="validationForm.value" type="number" />
          </el-form-item>
        </template>
        
        <template v-else-if="validationForm.type === 'list'">
          <el-form-item label="列表值">
            <el-input
              v-model="validationForm.listValue"
              type="textarea"
              placeholder="输入列表值，用逗号分隔"
            />
          </el-form-item>
        </template>
        
        <template v-else-if="validationForm.type === 'date'">
          <el-form-item label="条件">
            <el-select v-model="validationForm.operator" placeholder="选择条件">
              <el-option label="早于" value="<" />
              <el-option label="晚于" value=">" />
              <el-option label="等于" value="=" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="日期">
            <el-date-picker
              v-model="validationForm.dateValue"
              type="date"
              placeholder="选择日期"
            />
          </el-form-item>
        </template>
        
        <template v-else-if="validationForm.type === 'textLength'">
          <el-form-item label="条件">
            <el-select v-model="validationForm.operator" placeholder="选择条件">
              <el-option label="大于" value=">" />
              <el-option label="小于" value="<" />
              <el-option label="等于" value="=" />
              <el-option label="大于等于" value=">=" />
              <el-option label="小于等于" value="<=" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="长度">
            <el-input v-model.number="validationForm.value" type="number" min="0" />
          </el-form-item>
        </template>
        
        <template v-else-if="validationForm.type === 'custom'">
          <el-form-item label="公式">
            <el-input
              v-model="validationForm.formula"
              placeholder="输入自定义公式"
            />
          </el-form-item>
        </template>
        
        <el-form-item label="错误提示">
          <el-input
            v-model="validationForm.errorMessage"
            placeholder="输入错误提示信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showValidationDialog = false">取消</el-button>
        <el-button type="primary" @click="applyValidation">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ArrowDown, Sort, Filter, Document, Plus } from '@element-plus/icons-vue'

// 状态
const spreadsheetContainer = ref<HTMLElement | null>(null)
const activeCellRef = ref('A1')
const formulaInput = ref('')
const textColor = ref('#000000')
const fillColor = ref('')
const activeSheet = ref(0)
const sheets = ref([
  { name: 'Sheet1', data: [] },
  { name: 'Sheet2', data: [] },
  { name: 'Sheet3', data: [] }
])

// 对话框状态
const showSortDialog = ref(false)
const showValidationDialog = ref(false)

// 表单数据
const sortForm = ref({
  column: '',
  order: 'asc'
})

const validationForm = ref({
  type: 'number',
  operator: '>',
  value: 0,
  listValue: '',
  dateValue: '',
  formula: '',
  errorMessage: '输入的值不符合要求'
})

// 模拟数据
const columns = ref([
  { label: '列A', value: 'A' },
  { label: '列B', value: 'B' },
  { label: '列C', value: 'C' },
  { label: '列D', value: 'D' },
  { label: '列E', value: 'E' }
])

// 生命周期钩子
onMounted(() => {
  // 初始化表格
  initSpreadsheet()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  // 移除事件监听
  window.removeEventListener('resize', handleResize)
})

// 方法
function initSpreadsheet() {
  // 这里将初始化第三方表格组件
  // 例如 x-spreadsheet 或其他库
  console.log('初始化表格编辑器')
}

function handleResize() {
  // 调整表格大小
  console.log('调整表格大小')
}

function applyFormat(format: string) {
  // 应用文本格式
  console.log('应用格式:', format)
  ElMessage.success(`已应用${format}格式`)
}

function applyAlignment(alignment: string) {
  // 应用对齐方式
  console.log('应用对齐:', alignment)
  ElMessage.success(`已应用${alignment}对齐`)
}

function applyTextColor() {
  // 应用文本颜色
  console.log('应用文本颜色:', textColor.value)
  ElMessage.success('已应用文本颜色')
}

function applyFillColor() {
  // 应用填充颜色
  console.log('应用填充颜色:', fillColor.value)
  ElMessage.success('已应用填充颜色')
}

function handleMergeCommand(command: string) {
  if (command === 'merge') {
    // 合并单元格
    console.log('合并单元格')
    ElMessage.success('已合并单元格')
  } else if (command === 'unmerge') {
    // 取消合并
    console.log('取消合并')
    ElMessage.success('已取消合并')
  }
}

function handleInsertCommand(command: string) {
  switch (command) {
    case 'row-above':
      console.log('在上方插入行')
      ElMessage.success('已在上方插入行')
      break
    case 'row-below':
      console.log('在下方插入行')
      ElMessage.success('已在下方插入行')
      break
    case 'column-left':
      console.log('在左侧插入列')
      ElMessage.success('已在左侧插入列')
      break
    case 'column-right':
      console.log('在右侧插入列')
      ElMessage.success('已在右侧插入列')
      break
  }
}

function handleDeleteCommand(command: string) {
  if (command === 'row') {
    // 删除行
    console.log('删除行')
    ElMessage.success('已删除行')
  } else if (command === 'column') {
    // 删除列
    console.log('删除列')
    ElMessage.success('已删除列')
  }
}

function handleFormatCommand(command: string) {
  // 应用单元格格式
  console.log('应用格式:', command)
  ElMessage.success(`已应用${command}格式`)
}

function toggleFilter() {
  // 切换筛选
  console.log('切换筛选')
  ElMessage.success('已切换筛选')
}

function updateFormula() {
  // 更新公式
  console.log('更新公式:', formulaInput.value)
}

function applyFormula() {
  // 应用公式
  console.log('应用公式:', formulaInput.value)
  ElMessage.success('已应用公式')
}

function switchSheet(index: number) {
  // 切换工作表
  activeSheet.value = index
  console.log('切换到工作表:', sheets.value[index].name)
}

function addSheet() {
  // 添加新工作表
  const newSheetIndex = sheets.value.length + 1
  sheets.value.push({
    name: `Sheet${newSheetIndex}`,
    data: []
  })
  activeSheet.value = sheets.value.length - 1
  console.log('添加新工作表:', sheets.value[activeSheet.value].name)
  ElMessage.success('已添加新工作表')
}

function applySort() {
  // 应用排序
  console.log('应用排序:', sortForm.value)
  ElMessage.success(`已按${sortForm.value.column}列${sortForm.value.order === 'asc' ? '升序' : '降序'}排序`)
  showSortDialog.value = false
}

function applyValidation() {
  // 应用数据验证
  console.log('应用数据验证:', validationForm.value)
  ElMessage.success('已应用数据验证')
  showValidationDialog.value = false
}
</script>

<style scoped>
.spreadsheet-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.toolbar {
  padding: 8px;
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.formula-bar {
  padding: 8px;
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  gap: 8px;
}

.cell-reference {
  min-width: 60px;
  padding: 0 8px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background-color-base);
  border-radius: 4px;
  font-family: monospace;
}

.formula-icon {
  font-weight: bold;
  font-family: monospace;
}

.spreadsheet-container {
  flex: 1;
  overflow: auto;
  position: relative;
}

.spreadsheet-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-color-secondary);
}

.sheet-tabs {
  height: 36px;
  border-top: 1px solid var(--border-color-light);
  display: flex;
  align-items: center;
  padding: 0 8px;
  background-color: var(--background-color-base);
}

.sheet-tab {
  padding: 0 16px;
  height: 28px;
  display: flex;
  align-items: center;
  border-right: 1px solid var(--border-color-light);
  cursor: pointer;
  user-select: none;
}

.sheet-tab.active {
  background-color: #fff;
  border-bottom: 2px solid var(--primary-color);
}

.add-sheet {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: 8px;
}

.add-sheet:hover {
  color: var(--primary-color);
}
</style>
