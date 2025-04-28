<template>
  <div class="text-editor">
    <div class="toolbar">
      <el-button-group>
        <el-button :icon="DocumentAdd" title="新建" @click="newDocument" />
        <el-button :icon="Upload" title="打开" @click="openDocument" />
        <el-button :icon="Download" title="保存" @click="saveDocument" />
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-button-group>
        <el-button :icon="ArrowLeft" title="撤销" @click="undo" />
        <el-button :icon="ArrowRight" title="重做" @click="redo" />
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-select v-model="fontFamily" placeholder="字体" @change="applyFontFamily">
        <el-option label="Arial" value="Arial" />
        <el-option label="Times New Roman" value="Times New Roman" />
        <el-option label="Courier New" value="Courier New" />
        <el-option label="Georgia" value="Georgia" />
        <el-option label="Verdana" value="Verdana" />
        <el-option label="微软雅黑" value="Microsoft YaHei" />
        <el-option label="宋体" value="SimSun" />
        <el-option label="黑体" value="SimHei" />
      </el-select>
      
      <el-select v-model="fontSize" placeholder="字号" @change="applyFontSize">
        <el-option label="8" value="8" />
        <el-option label="9" value="9" />
        <el-option label="10" value="10" />
        <el-option label="11" value="11" />
        <el-option label="12" value="12" />
        <el-option label="14" value="14" />
        <el-option label="16" value="16" />
        <el-option label="18" value="18" />
        <el-option label="20" value="20" />
        <el-option label="22" value="22" />
        <el-option label="24" value="24" />
        <el-option label="26" value="26" />
        <el-option label="28" value="28" />
        <el-option label="36" value="36" />
        <el-option label="48" value="48" />
        <el-option label="72" value="72" />
      </el-select>
      
      <el-divider direction="vertical" />
      
      <el-button-group>
        <el-button :icon="Bold" title="加粗" @click="toggleBold" />
        <el-button :icon="Italic" title="斜体" @click="toggleItalic" />
        <el-button :icon="Underline" title="下划线" @click="toggleUnderline" />
        <el-button :icon="DeleteFilled" title="删除线" @click="toggleStrikethrough" />
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-color-picker
        v-model="textColor"
        size="small"
        show-alpha
        @change="applyTextColor"
      />
      
      <el-color-picker
        v-model="highlightColor"
        size="small"
        show-alpha
        @change="applyHighlightColor"
      />
      
      <el-divider direction="vertical" />
      
      <el-button-group>
        <el-button :icon="AlignLeft" title="左对齐" @click="applyAlignment('left')" />
        <el-button :icon="AlignCenter" title="居中对齐" @click="applyAlignment('center')" />
        <el-button :icon="AlignRight" title="右对齐" @click="applyAlignment('right')" />
        <el-button :icon="Operation" title="两端对齐" @click="applyAlignment('justify')" />
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-button-group>
        <el-button :icon="Bottom" title="下标" @click="toggleSubscript" />
        <el-button :icon="Top" title="上标" @click="toggleSuperscript" />
      </el-button-group>
      
      <el-divider direction="vertical" />
      
      <el-dropdown trigger="click" @command="handleInsertCommand">
        <el-button>
          插入
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="image">图片</el-dropdown-item>
            <el-dropdown-item command="table">表格</el-dropdown-item>
            <el-dropdown-item command="link">链接</el-dropdown-item>
            <el-dropdown-item command="pageBreak">分页符</el-dropdown-item>
            <el-dropdown-item command="specialChar">特殊字符</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    
    <div class="editor-container" ref="editorContainer">
      <!-- 这里将集成富文本编辑器，如 TinyMCE、CKEditor 或 Quill -->
      <div class="editor-placeholder">
        <p>富文本编辑器将在这里集成</p>
        <p>支持文本格式化、表格和图片插入等功能</p>
      </div>
    </div>
    
    <!-- 插入表格对话框 -->
    <el-dialog
      v-model="showTableDialog"
      title="插入表格"
      width="400px"
    >
      <el-form :model="tableForm" label-width="100px">
        <el-form-item label="行数">
          <el-input-number v-model="tableForm.rows" :min="1" :max="20" />
        </el-form-item>
        
        <el-form-item label="列数">
          <el-input-number v-model="tableForm.cols" :min="1" :max="10" />
        </el-form-item>
        
        <el-form-item label="表格宽度">
          <el-input v-model="tableForm.width">
            <template #append>
              <el-select v-model="tableForm.widthUnit" style="width: 80px">
                <el-option label="像素" value="px" />
                <el-option label="百分比" value="%" />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="边框宽度">
          <el-input-number v-model="tableForm.border" :min="0" :max="10" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showTableDialog = false">取消</el-button>
        <el-button type="primary" @click="insertTable">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 插入链接对话框 -->
    <el-dialog
      v-model="showLinkDialog"
      title="插入链接"
      width="400px"
    >
      <el-form :model="linkForm" label-width="100px">
        <el-form-item label="显示文本">
          <el-input v-model="linkForm.text" />
        </el-form-item>
        
        <el-form-item label="链接地址">
          <el-input v-model="linkForm.url" placeholder="https://" />
        </el-form-item>
        
        <el-form-item label="打开方式">
          <el-radio-group v-model="linkForm.target">
            <el-radio label="_blank">新窗口</el-radio>
            <el-radio label="_self">当前窗口</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showLinkDialog = false">取消</el-button>
        <el-button type="primary" @click="insertLink">确定</el-button>
      </template>
    </el-dialog>
    
    <!-- 插入特殊字符对话框 -->
    <el-dialog
      v-model="showSpecialCharDialog"
      title="插入特殊字符"
      width="500px"
    >
      <div class="special-char-grid">
        <div
          v-for="char in specialChars"
          :key="char"
          class="special-char-item"
          @click="insertSpecialChar(char)"
        >
          {{ char }}
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentAdd, Upload, Download, ArrowLeft, ArrowRight, Bold, Italic, Underline, DeleteFilled, AlignLeft, AlignCenter, AlignRight, Operation, Bottom, Top, ArrowDown } from '@element-plus/icons-vue'

// 状态
const editorContainer = ref<HTMLElement | null>(null)
const fontFamily = ref('Arial')
const fontSize = ref('12')
const textColor = ref('#000000')
const highlightColor = ref('')

// 对话框状态
const showTableDialog = ref(false)
const showLinkDialog = ref(false)
const showSpecialCharDialog = ref(false)

// 表单数据
const tableForm = ref({
  rows: 3,
  cols: 3,
  width: '100',
  widthUnit: '%',
  border: 1
})

const linkForm = ref({
  text: '',
  url: '',
  target: '_blank'
})

// 特殊字符
const specialChars = [
  '©', '®', '™', '€', '£', '¥', '¢', '§', '¶', '•', '‣', '⁃', '⁎', '⁕',
  '†', '‡', '°', '′', '″', '‴', '←', '↑', '→', '↓', '↔', '↕', '↖', '↗',
  '↘', '↙', '↚', '↛', '↜', '↝', '↞', '↟', '↠', '↡', '↢', '↣', '↤', '↥',
  '↦', '↧', '↨', '↩', '↪', '↫', '↬', '↭', '↮', '↯', '↰', '↱', '↲', '↳',
  '↴', '↵', '↶', '↷', '↸', '↹', '↺', '↻', '↼', '↽', '↾', '↿', '⇀', '⇁',
  '⇂', '⇃', '⇄', '⇅', '⇆', '⇇', '⇈', '⇉', '⇊', '⇋', '⇌', '⇍', '⇎', '⇏',
  '⇐', '⇑', '⇒', '⇓', '⇔', '⇕', '⇖', '⇗', '⇘', '⇙', '⇚', '⇛', '⇜', '⇝',
  '⇞', '⇟', '⇠', '⇡', '⇢', '⇣', '⇤', '⇥', '⇦', '⇧', '⇨', '⇩', '⇪', '⇫',
  '⇬', '⇭', '⇮', '⇯', '⇰', '⇱', '⇲', '⇳', '⇴', '⇵', '⇶', '⇷', '⇸', '⇹',
  '⇺', '⇻', '⇼', '⇽', '⇾', '⇿', '∀', '∁', '∂', '∃', '∄', '∅', '∆', '∇',
  '∈', '∉', '∊', '∋', '∌', '∍', '∎', '∏', '∐', '∑', '−', '∓', '∔', '∕',
  '∖', '∗', '∘', '∙', '√', '∛', '∜', '∝', '∞', '∟', '∠', '∡', '∢', '∣',
  '∤', '∥', '∦', '∧', '∨', '∩', '∪', '∫', '∬', '∭', '∮', '∯', '∰', '∱',
  '∲', '∳', '∴', '∵', '∶', '∷', '∸', '∹', '∺', '∻', '∼', '∽', '∾', '∿'
]

// 生命周期钩子
onMounted(() => {
  // 初始化编辑器
  initEditor()
})

onBeforeUnmount(() => {
  // 销毁编辑器
  destroyEditor()
})

// 方法
function initEditor() {
  // 这里将初始化富文本编辑器
  // 例如 TinyMCE、CKEditor 或 Quill
  console.log('初始化富文本编辑器')
}

function destroyEditor() {
  // 销毁编辑器实例
  console.log('销毁编辑器实例')
}

function newDocument() {
  // 创建新文档
  console.log('创建新文档')
  ElMessage.success('已创建新文档')
}

function openDocument() {
  // 打开文档
  console.log('打开文档')
  // 这里应该打开文件选择对话框
}

function saveDocument() {
  // 保存文档
  console.log('保存文档')
  ElMessage.success('文档已保存')
}

function undo() {
  // 撤销操作
  console.log('撤销操作')
}

function redo() {
  // 重做操作
  console.log('重做操作')
}

function applyFontFamily() {
  // 应用字体
  console.log('应用字体:', fontFamily.value)
}

function applyFontSize() {
  // 应用字号
  console.log('应用字号:', fontSize.value)
}

function toggleBold() {
  // 切换加粗
  console.log('切换加粗')
}

function toggleItalic() {
  // 切换斜体
  console.log('切换斜体')
}

function toggleUnderline() {
  // 切换下划线
  console.log('切换下划线')
}

function toggleStrikethrough() {
  // 切换删除线
  console.log('切换删除线')
}

function applyTextColor() {
  // 应用文本颜色
  console.log('应用文本颜色:', textColor.value)
}

function applyHighlightColor() {
  // 应用高亮颜色
  console.log('应用高亮颜色:', highlightColor.value)
}

function applyAlignment(alignment: string) {
  // 应用对齐方式
  console.log('应用对齐方式:', alignment)
}

function toggleSubscript() {
  // 切换下标
  console.log('切换下标')
}

function toggleSuperscript() {
  // 切换上标
  console.log('切换上标')
}

function handleInsertCommand(command: string) {
  switch (command) {
    case 'image':
      // 插入图片
      // 这里应该打开文件选择对话框
      console.log('插入图片')
      break
    case 'table':
      // 打开插入表格对话框
      showTableDialog.value = true
      break
    case 'link':
      // 打开插入链接对话框
      showLinkDialog.value = true
      break
    case 'pageBreak':
      // 插入分页符
      console.log('插入分页符')
      ElMessage.success('已插入分页符')
      break
    case 'specialChar':
      // 打开特殊字符对话框
      showSpecialCharDialog.value = true
      break
  }
}

function insertTable() {
  // 插入表格
  console.log('插入表格:', tableForm.value)
  ElMessage.success('已插入表格')
  showTableDialog.value = false
}

function insertLink() {
  // 插入链接
  console.log('插入链接:', linkForm.value)
  ElMessage.success('已插入链接')
  showLinkDialog.value = false
}

function insertSpecialChar(char: string) {
  // 插入特殊字符
  console.log('插入特殊字符:', char)
  ElMessage.success(`已插入字符: ${char}`)
  showSpecialCharDialog.value = false
}
</script>

<style scoped>
.text-editor {
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

.editor-container {
  flex: 1;
  overflow: auto;
  padding: 20px;
  position: relative;
}

.editor-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--text-color-secondary);
}

.special-char-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.special-char-item {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color-light);
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
}

.special-char-item:hover {
  background-color: var(--background-color-base);
  border-color: var(--primary-color);
}
</style>
