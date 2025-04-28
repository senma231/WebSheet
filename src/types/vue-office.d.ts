declare module 'vue-office' {
  import { Plugin } from 'vue'
  
  const VueOffice: Plugin
  
  export default VueOffice
  
  export const VueOfficeDocx: any
  export const VueOfficeXlsx: any
  export const VueOfficePptx: any
  export const VueOfficePdf: any
}
