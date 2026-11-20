import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5173,
    /*
     * 端口被占用时直接报错，不要自动换成 5174 / 5175。
     * 自动换端口的后果：双击 启动.bat 打开的是 5174，
     * 而收藏夹 / 旧标签页还停在 5173 那个旧实例上，看到的永远是改之前的内容，
     * 于是误以为「改了不生效、必须重启」。
     */
    strictPort: true,
    host: true,
    // 启动后自动打开浏览器
    open: true,
    // 开发期响应一律不缓存，改完按 F5 一定是最新
    headers: { 'Cache-Control': 'no-store' },
    /*
     * 中文路径 + 编辑器「原子保存」（先写临时文件再改名）时，
     * Windows 的 fs.watch 偶尔会丢事件，改了文件页面却不更新。
     * 改用轮询监听，400ms 扫一次，保存后立刻触发热更新。
     */
    watch: {
      usePolling: true,
      interval: 400,
      binaryInterval: 900
    }
  }
})
