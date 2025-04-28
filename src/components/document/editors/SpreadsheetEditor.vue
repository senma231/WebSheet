<template>
  <div class="spreadsheet-editor">
    <div class="editor-toolbar" v-if="!readOnly">
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="formatBold" :class="{ active: isBold }">
            <el-icon><Bold /></el-icon>
          </el-button>
          <el-button @click="formatItalic" :class="{ active: isItalic }">
            <el-icon><Italic /></el-icon>
          </el-button>
          <el-button @click="formatUnderline" :class="{ active: isUnderline }">
            <el-icon><TextUnderline /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="formatAlign('left')" :class="{ active: textAlign === 'left' }">
            <el-icon><AlignLeft /></el-icon>
          </el-button>
          <el-button @click="formatAlign('center')" :class="{ active: textAlign === 'center' }">
            <el-icon><AlignCenter /></el-icon>
          </el-button>
          <el-button @click="formatAlign('right')" :class="{ active: textAlign === 'right' }">
            <el-icon><AlignRight /></el-icon>
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-color-picker v-model="textColor" size="small" @change="formatTextColor" />
        <el-color-picker v-model="backgroundColor" size="small" @change="formatBackgroundColor" />
      </div>
      
      <div class="toolbar-group">
        <el-select v-model="fontSize" placeholder="字号" @change="formatFontSize">
          <el-option v-for="size in fontSizes" :key="size" :label="`${size}px`" :value="size" />
        </el-select>
      </div>
      
      <div class="toolbar-group">
        <el-button-group>
          <el-button @click="insertRow">
            <el-icon><Plus /></el-icon> 行
          </el-button>
          <el-button @click="insertColumn">
            <el-icon><Plus /></el-icon> 列
          </el-button>
          <el-button @click="deleteRow">
            <el-icon><Minus /></el-icon> 行
          </el-button>
          <el-button @click="deleteColumn">
            <el-icon><Minus /></el-icon> 列
          </el-button>
        </el-button-group>
      </div>
      
      <div class="toolbar-group">
        <el-button @click="mergeCells" :disabled="!canMergeCells">
          <el-icon><MergeCells /></el-icon> 合并单元格
        </el-button>
        <el-button @click="unmergeCells" :disabled="!canUnmergeCells">
          <el-icon><SplitCells /></el-icon> 拆分单元格
        </el-button>
      </div>
      
      <div class="toolbar-group">
        <el-button @click="showFormulaDialog = true">
          <el-icon><Histogram /></el-icon> 公式
        </el-button>
      </div>
    </div>
    
    <div class="editor-container">
      <div ref="gridRef" class="grid-container"></div>
    </div>
    
    <!-- 公式对话框 -->
    <el-dialog v-model="showFormulaDialog" title="插入公式" width="500px">
      <el-form :model="formulaForm" label-width="80px">
        <el-form-item label="公式">
          <el-input v-model="formulaForm.formula" placeholder="例如: =SUM(A1:A5)" />
        </el-form-item>
        <el-form-item label="常用公式">
          <el-select v-model="formulaForm.selected" placeholder="选择公式" @change="selectFormula">
            <el-option label="求和 (SUM)" value="SUM" />
            <el-option label="平均值 (AVERAGE)" value="AVERAGE" />
            <el-option label="计数 (COUNT)" value="COUNT" />
            <el-option label="最大值 (MAX)" value="MAX" />
            <el-option label="最小值 (MIN)" value="MIN" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormulaDialog = false">取消</el-button>
        <el-button type="primary" @click="insertFormula">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, defineProps, defineEmits, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Bold, Italic, TextUnderline, AlignLeft, AlignCenter, AlignRight,
  Plus, Minus, Histogram
} from '@element-plus/icons-vue'
import { RevoGrid } from '@revolist/vue3-datagrid'
import '@revolist/revogrid/dist/revogrid.css'

// 定义属性
const props = defineProps({
  documentId: {
    type: String,
    required: true
  },
  content: {
    type: Object,
    default: null
  },
  readOnly: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['change', 'cursor-change'])

// 状态
const gridRef = ref<HTMLElement | null>(null)
const grid = ref<any>(null)
const isInitialized = ref(false)
const selectedCell = ref<any>(null)
const selectedRange = ref<any>(null)

// 格式化状态
const isBold = ref(false)
const isItalic = ref(false)
const isUnderline = ref(false)
const textAlign = ref('left')
const textColor = ref('#000000')
const backgroundColor = ref('#ffffff')
const fontSize = ref(14)
const fontSizes = [10, 12, 14, 16, 18, 20, 24]

// 公式对话框
const showFormulaDialog = ref(false)
const formulaForm = ref({
  formula: '',
  selected: ''
})

// 计算属性
const canMergeCells = ref(false)
const canUnmergeCells = ref(false)

// 自定义图标组件
const MergeCells = {
  name: 'MergeCells',
  render() {
    return (
      <svg viewBox="0 0 24 24" width="1em" height="1em">
        <path fill="currentColor" d="M3 5h18v2H3V5zm0 4h6v10H3V9zm8 0h10v2H11V9zm0 4h10v2H11v-2zm0 4h10v2H11v-2z" />
      </svg>
    )
  }
}

const SplitCells = {
  name: 'SplitCells',
  render() {
    return (
      <svg viewBox="0 0 24 24" width="1em" height="1em">
        <path fill="currentColor" d="M3 5h18v2H3V5zm0 4h4v10H3V9zm6 0h4v10H9V9zm6 0h6v10h-6V9z" />
      </svg>
    )
  }
}

// 初始化表格
onMounted(async () => {
  await initGrid()
  
  // 如果有内容，加载内容
  if (props.content) {
    loadContent()
  }
})

// 监听内容变化
watch(() => props.content, () => {
  if (props.content && isInitialized.value) {
    loadContent()
  }
}, { deep: true })

// 监听只读状态变化
watch(() => props.readOnly, () => {
  if (grid.value) {
    grid.value.readonly = props.readOnly
  }
})

// 初始化表格
async function initGrid() {
  if (!gridRef.value) return
  
  // 创建表格
  grid.value = new RevoGrid.create({
    element: gridRef.value,
    columns: generateDefaultColumns(26),
    source: generateDefaultData(100, 26),
    resize: true,
    readonly: props.readOnly,
    columnTypes: {
      default: {
        editor: 'text'
      },
      numeric: {
        editor: 'number'
      }
    }
  })
  
  // 监听选择变化
  grid.value.addEventListener('beforeRangeEdit', (e: any) => {
    selectedRange.value = e.detail.range
    selectedCell.value = e.detail.cell
    
    // 更新格式状态
    updateFormatState()
    
    // 检查是否可以合并/拆分单元格
    checkMergePossibility()
    
    // 发送光标位置
    emit('cursor-change', {
      x: e.detail.cell.x,
      y: e.detail.cell.y,
      selection: e.detail.range
    })
  })
  
  // 监听内容变化
  grid.value.addEventListener('afterEdit', (e: any) => {
    const content = getContent()
    emit('change', content)
  })
  
  isInitialized.value = true
}

// 生成默认列
function generateDefaultColumns(count: number) {
  const columns = []
  for (let i = 0; i < count; i++) {
    columns.push({
      prop: i.toString(),
      name: getColumnName(i),
      size: 100,
      cellProperties: (data: any) => {
        return {
          style: data.style || {}
        }
      }
    })
  }
  return columns
}

// 获取列名 (A, B, C, ..., Z, AA, AB, ...)
function getColumnName(index: number) {
  let name = ''
  let a = index
  while (a >= 0) {
    name = String.fromCharCode(a % 26 + 65) + name
    a = Math.floor(a / 26) - 1
  }
  return name
}

// 生成默认数据
function generateDefaultData(rows: number, cols: number) {
  const data = []
  for (let i = 0; i < rows; i++) {
    const row: Record<string, any> = {}
    for (let j = 0; j < cols; j++) {
      row[j.toString()] = ''
    }
    data.push(row)
  }
  return data
}

// 加载内容
function loadContent() {
  if (!grid.value || !props.content) return
  
  try {
    const { columns, data } = props.content
    
    // 设置列
    if (columns && Array.isArray(columns)) {
      grid.value.columns = columns
    }
    
    // 设置数据
    if (data && Array.isArray(data)) {
      grid.value.source = data
    }
  } catch (error) {
    console.error('Failed to load content', error)
    ElMessage.error('加载表格内容失败')
  }
}

// 更新格式状态
function updateFormatState() {
  if (!grid.value || !selectedCell.value) return
  
  const cell = getCellData(selectedCell.value.y, selectedCell.value.x)
  if (!cell) return
  
  const style = cell.style || {}
  
  isBold.value = style.fontWeight === 'bold'
  isItalic.value = style.fontStyle === 'italic'
  isUnderline.value = style.textDecoration === 'underline'
  textAlign.value = style.textAlign || 'left'
  textColor.value = style.color || '#000000'
  backgroundColor.value = style.backgroundColor || '#ffffff'
  fontSize.value = parseInt(style.fontSize) || 14
}

// 获取单元格数据
function getCellData(rowIndex: number, colIndex: number) {
  if (!grid.value) return null
  
  const data = grid.value.source
  if (!data || !data[rowIndex]) return null
  
  return data[rowIndex][colIndex.toString()]
}

// 设置单元格样式
function setCellStyle(rowIndex: number, colIndex: number, style: Record<string, any>) {
  if (!grid.value) return
  
  const data = [...grid.value.source]
  if (!data || !data[rowIndex]) return
  
  const cell = data[rowIndex][colIndex.toString()]
  if (!cell) return
  
  // 更新样式
  data[rowIndex][colIndex.toString()] = {
    ...cell,
    style: {
      ...(cell.style || {}),
      ...style
    }
  }
  
  // 更新数据
  grid.value.source = data
  
  // 触发变更事件
  const content = getContent()
  emit('change', content)
}

// 设置选中范围的样式
function setRangeStyle(style: Record<string, any>) {
  if (!grid.value || !selectedRange.value) return
  
  const { x, y, x1, y1 } = selectedRange.value
  
  for (let rowIndex = y; rowIndex <= y1; rowIndex++) {
    for (let colIndex = x; colIndex <= x1; colIndex++) {
      setCellStyle(rowIndex, colIndex, style)
    }
  }
}

// 格式化加粗
function formatBold() {
  isBold.value = !isBold.value
  setRangeStyle({ fontWeight: isBold.value ? 'bold' : 'normal' })
}

// 格式化斜体
function formatItalic() {
  isItalic.value = !isItalic.value
  setRangeStyle({ fontStyle: isItalic.value ? 'italic' : 'normal' })
}

// 格式化下划线
function formatUnderline() {
  isUnderline.value = !isUnderline.value
  setRangeStyle({ textDecoration: isUnderline.value ? 'underline' : 'none' })
}

// 格式化对齐方式
function formatAlign(align: string) {
  textAlign.value = align
  setRangeStyle({ textAlign: align })
}

// 格式化文本颜色
function formatTextColor(color: string) {
  textColor.value = color
  setRangeStyle({ color })
}

// 格式化背景颜色
function formatBackgroundColor(color: string) {
  backgroundColor.value = color
  setRangeStyle({ backgroundColor: color })
}

// 格式化字体大小
function formatFontSize(size: number) {
  fontSize.value = size
  setRangeStyle({ fontSize: `${size}px` })
}

// 插入行
function insertRow() {
  if (!grid.value || !selectedCell.value) return
  
  const rowIndex = selectedCell.value.y
  const data = [...grid.value.source]
  
  // 创建新行
  const newRow: Record<string, any> = {}
  for (let i = 0; i < grid.value.columns.length; i++) {
    newRow[i.toString()] = ''
  }
  
  // 插入新行
  data.splice(rowIndex, 0, newRow)
  
  // 更新数据
  grid.value.source = data
  
  // 触发变更事件
  const content = getContent()
  emit('change', content)
}

// 插入列
function insertColumn() {
  if (!grid.value || !selectedCell.value) return
  
  const colIndex = selectedCell.value.x
  const columns = [...grid.value.columns]
  const data = [...grid.value.source]
  
  // 创建新列
  const newColumn = {
    prop: columns.length.toString(),
    name: getColumnName(columns.length),
    size: 100,
    cellProperties: (data: any) => {
      return {
        style: data.style || {}
      }
    }
  }
  
  // 插入新列
  columns.splice(colIndex, 0, newColumn)
  
  // 更新所有行的数据
  for (let i = 0; i < data.length; i++) {
    const row = { ...data[i] }
    
    // 移动列数据
    for (let j = columns.length - 1; j > colIndex; j--) {
      row[j.toString()] = row[(j - 1).toString()] || ''
    }
    
    // 设置新列数据
    row[colIndex.toString()] = ''
    
    data[i] = row
  }
  
  // 更新数据
  grid.value.columns = columns
  grid.value.source = data
  
  // 触发变更事件
  const content = getContent()
  emit('change', content)
}

// 删除行
function deleteRow() {
  if (!grid.value || !selectedCell.value) return
  
  const rowIndex = selectedCell.value.y
  const data = [...grid.value.source]
  
  // 删除行
  data.splice(rowIndex, 1)
  
  // 更新数据
  grid.value.source = data
  
  // 触发变更事件
  const content = getContent()
  emit('change', content)
}

// 删除列
function deleteColumn() {
  if (!grid.value || !selectedCell.value) return
  
  const colIndex = selectedCell.value.x
  const columns = [...grid.value.columns]
  const data = [...grid.value.source]
  
  // 删除列
  columns.splice(colIndex, 1)
  
  // 更新所有行的数据
  for (let i = 0; i < data.length; i++) {
    const row = { ...data[i] }
    
    // 移动列数据
    for (let j = colIndex; j < columns.length; j++) {
      row[j.toString()] = row[(j + 1).toString()] || ''
    }
    
    // 删除最后一列
    delete row[columns.length.toString()]
    
    data[i] = row
  }
  
  // 更新数据
  grid.value.columns = columns
  grid.value.source = data
  
  // 触发变更事件
  const content = getContent()
  emit('change', content)
}

// 检查是否可以合并/拆分单元格
function checkMergePossibility() {
  if (!selectedRange.value) {
    canMergeCells.value = false
    canUnmergeCells.value = false
    return
  }
  
  const { x, y, x1, y1 } = selectedRange.value
  
  // 如果选择了多个单元格，可以合并
  canMergeCells.value = x !== x1 || y !== y1
  
  // 检查是否可以拆分（当前仅支持合并的单元格可以拆分）
  canUnmergeCells.value = false // 暂不支持拆分
}

// 合并单元格
function mergeCells() {
  if (!grid.value || !selectedRange.value || !canMergeCells.value) return
  
  // 暂不支持实际合并单元格，仅模拟效果
  ElMessage.info('合并单元格功能开发中')
}

// 拆分单元格
function unmergeCells() {
  if (!grid.value || !selectedRange.value || !canUnmergeCells.value) return
  
  // 暂不支持实际拆分单元格，仅模拟效果
  ElMessage.info('拆分单元格功能开发中')
}

// 选择公式
function selectFormula(formula: string) {
  if (!selectedRange.value) return
  
  const { x, y, x1, y1 } = selectedRange.value
  const range = `${getColumnName(x)}${y + 1}:${getColumnName(x1)}${y1 + 1}`
  
  formulaForm.value.formula = `=${formula}(${range})`
}

// 插入公式
function insertFormula() {
  if (!grid.value || !selectedCell.value || !formulaForm.value.formula) return
  
  const { x, y } = selectedCell.value
  
  // 设置单元格值
  const data = [...grid.value.source]
  if (!data || !data[y]) return
  
  const cell = data[y][x.toString()]
  if (!cell) return
  
  // 更新值
  data[y][x.toString()] = {
    ...cell,
    value: formulaForm.value.formula
  }
  
  // 更新数据
  grid.value.source = data
  
  // 关闭对话框
  showFormulaDialog.value = false
  
  // 重置表单
  formulaForm.value = {
    formula: '',
    selected: ''
  }
  
  // 触发变更事件
  const content = getContent()
  emit('change', content)
}

// 获取内容
function getContent() {
  if (!grid.value) return null
  
  return {
    columns: grid.value.columns,
    data: grid.value.source
  }
}

// 应用远程更改
function applyRemoteChanges(content: any, user: any) {
  if (!grid.value || !content) return
  
  try {
    const { columns, data } = content
    
    // 设置列
    if (columns && Array.isArray(columns)) {
      grid.value.columns = columns
    }
    
    // 设置数据
    if (data && Array.isArray(data)) {
      grid.value.source = data
    }
  } catch (error) {
    console.error('Failed to apply remote changes', error)
    ElMessage.error('应用远程更改失败')
  }
}

// 跳转到光标位置
function jumpToCursor(cursor: any) {
  if (!grid.value || !cursor) return
  
  // 滚动到光标位置
  if (cursor.x !== undefined && cursor.y !== undefined) {
    grid.value.scrollToCell(cursor.y, cursor.x)
  }
}

// 应用解决的冲突
function applyResolvedConflict(operation: any) {
  if (!grid.value || !operation) return
  
  // 应用操作
  if (operation.type === 'content_change' && operation.data.content) {
    applyRemoteChanges(operation.data.content, null)
  }
}

// 暴露方法
defineExpose({
  getContent,
  applyRemoteChanges,
  jumpToCursor,
  applyResolvedConflict
})

// 组件卸载前清理
onBeforeUnmount(() => {
  if (grid.value) {
    grid.value.removeEventListener('beforeRangeEdit')
    grid.value.removeEventListener('afterEdit')
  }
})
</script>

<style scoped>
.spreadsheet-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #f5f7fa;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.editor-container {
  flex: 1;
  overflow: hidden;
}

.grid-container {
  width: 100%;
  height: 100%;
}

.active {
  color: #409eff;
  background-color: #ecf5ff;
}
</style>
