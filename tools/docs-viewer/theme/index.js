import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import DrawioViewer from './components/DrawioViewer.vue'
import CsvViewer from './components/CsvViewer.vue'
import PdfViewer from './components/PdfViewer.vue'
import ImageView from './components/ImageView.vue'
import FileDownload from './components/FileDownload.vue'
import PlantUmlViewer from './components/PlantUmlViewer.vue'
import FolderBrowser from './components/FolderBrowser.vue'
import DiffBrowser from './components/DiffBrowser.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DrawioViewer', DrawioViewer)
    app.component('CsvViewer', CsvViewer)
    app.component('PdfViewer', PdfViewer)
    app.component('ImageView', ImageView)
    app.component('FileDownload', FileDownload)
    app.component('PlantUmlViewer', PlantUmlViewer)
    app.component('FolderBrowser', FolderBrowser)
    app.component('DiffBrowser', DiffBrowser)
  },
}
