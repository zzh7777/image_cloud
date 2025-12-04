const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/api': {
        target: 'https://nadene-civilisable-genevive.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        // 跳过 ngrok 的浏览器提示页面，直接转发到后端
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
        // 添加这些选项来处理可能的响应格式问题
        logLevel: 'debug',
        // 处理 WebSocket 升级请求
        ws: true,
        // 超时设置
        timeout: 30000,
        // 代理错误处理
        onError: (err, req, res) => {
          console.error('代理错误:', err.message)
          console.error('请求方法:', req.method)
          console.error('请求路径:', req.url)
        },
        // 代理响应处理
        onProxyRes: (proxyRes, req, res) => {
          // 对于 DELETE 请求，确保响应头格式正确
          if (req.method === 'DELETE') {
            // 如果返回 204 No Content，确保响应头正确
            if (proxyRes.statusCode === 204) {
              // 确保 Content-Length 为 0（如果缺失）
              if (!proxyRes.headers['content-length']) {
                proxyRes.headers['content-length'] = '0'
              }
              // 确保 Content-Type 存在（204 通常不需要，但有些代理需要）
              if (!proxyRes.headers['content-type']) {
                proxyRes.headers['content-type'] = 'text/plain'
              }
            }
            // 对于所有 DELETE 响应，确保响应头完整
            // 移除可能导致问题的响应头
            delete proxyRes.headers['transfer-encoding']
            // 确保 Connection 头正确
            if (!proxyRes.headers['connection']) {
              proxyRes.headers['connection'] = 'close'
            }
          }
        },
        // 代理请求处理
        onProxyReq: (proxyReq, req, res) => {
          // 对于 DELETE 请求，确保请求头正确
          if (req.method === 'DELETE') {
            // 确保 Content-Length 为 0（DELETE 请求通常没有请求体）
            proxyReq.setHeader('Content-Length', '0')
            // 移除可能导致问题的请求头
            proxyReq.removeHeader('Transfer-Encoding')
          }
        }
      }
    }
  }
})
