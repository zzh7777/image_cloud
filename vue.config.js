const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    // 允许内网穿透（ngrok）访问
    // Vue CLI 5.x 使用 allowedHosts 替代已废弃的 disableHostCheck
    allowedHosts: 'all', // 允许所有主机访问（适用于内网穿透）
    // 或者可以指定特定的域名模式：
    // allowedHosts: ['.ngrok.io', '.ngrok-free.app', '.ngrok-free.dev'],
    // 如果需要更严格的限制，可以只允许特定的 ngrok 域名
    host: '0.0.0.0', // 允许外部访问
    port: 8080, // 开发服务器端口（确保与 ngrok 映射的端口一致）
    // 配置 WebSocket 以支持 HTTPS（解决通过 ngrok HTTPS 访问时的 WebSocket 错误）
    // 当通过 HTTPS 访问时，WebSocket 必须使用 wss://
    // 使用 'auto' 让 webpack-dev-server 自动检测协议（HTTP -> ws, HTTPS -> wss）
    client: {
      webSocketURL: 'auto://0.0.0.0:0/ws'
    },
    proxy: {
      '/api': {
        // 直接连接后端服务器
        // 请根据实际后端端口修改（常见端口：8000, 8080, 3000等）
        target: 'http://10.198.236.252:8000',
        changeOrigin: true,
        secure: false,
        // 如果需要HTTPS，取消下面的注释并设置 secure: true
        // target: 'https://10.198.236.252:8443',
        // 路径重写（如果需要）
        // pathRewrite: {
        //   '^/api': '/api'  // 保持路径不变
        // },
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
          console.error('目标服务器:', 'http://10.198.236.252:8000')
          console.error('完整URL:', `http://10.198.236.252:8000${req.url}`)
          // 返回友好的错误信息
          if (!res.headersSent) {
            res.writeHead(500, {
              'Content-Type': 'application/json'
            })
            res.end(JSON.stringify({
              code: 500,
              message: `代理错误: ${err.message}。请检查：1. 后端服务是否启动 2. 端口号是否正确 3. 网络是否连通`,
              error: err.message
            }))
          }
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
