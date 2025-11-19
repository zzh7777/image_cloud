<template>
  <div class="verify-code-container">
    <canvas 
      ref="canvas" 
      :width="width" 
      :height="height"
      @click="refreshCode"
      class="verify-code-canvas"
    ></canvas>
    <div class="verify-code-actions">
      <span class="refresh-text" @click="refreshCode">看不清？点击刷新</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VerifyCode',
  props: {
    width: {
      type: Number,
      default: 120
    },
    height: {
      type: Number,
      default: 40
    },
    codeLength: {
      type: Number,
      default: 4
    }
  },
  data() {
    return {
      code: ''
    }
  },
  mounted() {
    this.generateCode()
  },
  methods: {
    generateCode() {
      // 生成随机验证码
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code = ''
      for (let i = 0; i < this.codeLength; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      this.code = code
      this.drawCode()
      this.$emit('update:code', code)
    },
    drawCode() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      
      // 清空画布
      ctx.clearRect(0, 0, this.width, this.height)
      
      // 设置背景色
      ctx.fillStyle = '#f5f7fa'
      ctx.fillRect(0, 0, this.width, this.height)
      
      // 绘制验证码文字
      ctx.font = 'bold 20px Arial'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      
      // 绘制每个字符
      const charWidth = this.width / this.codeLength
      for (let i = 0; i < this.code.length; i++) {
        // 随机颜色
        ctx.fillStyle = this.getRandomColor()
        // 随机旋转角度
        const angle = (Math.random() - 0.5) * 0.4
        ctx.save()
        ctx.translate(charWidth * i + charWidth / 2, this.height / 2)
        ctx.rotate(angle)
        ctx.fillText(this.code[i], 0, 0)
        ctx.restore()
      }
      
      // 绘制干扰线
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = this.getRandomColor(100, 200)
        ctx.beginPath()
        ctx.moveTo(Math.random() * this.width, Math.random() * this.height)
        ctx.lineTo(Math.random() * this.width, Math.random() * this.height)
        ctx.stroke()
      }
      
      // 绘制干扰点
      for (let i = 0; i < 20; i++) {
        ctx.fillStyle = this.getRandomColor(100, 200)
        ctx.beginPath()
        ctx.arc(
          Math.random() * this.width,
          Math.random() * this.height,
          1,
          0,
          2 * Math.PI
        )
        ctx.fill()
      }
    },
    getRandomColor(min = 0, max = 255) {
      const r = Math.floor(Math.random() * (max - min) + min)
      const g = Math.floor(Math.random() * (max - min) + min)
      const b = Math.floor(Math.random() * (max - min) + min)
      return `rgb(${r}, ${g}, ${b})`
    },
    refreshCode() {
      this.generateCode()
    },
    validate(inputCode) {
      return inputCode.toUpperCase() === this.code.toUpperCase()
    }
  }
}
</script>

<style scoped>
.verify-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.verify-code-canvas {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  background-color: #f5f7fa;
}

.verify-code-actions {
  width: 100%;
}

.refresh-text {
  font-size: 12px;
  color: #409EFF;
  cursor: pointer;
  text-align: center;
  display: block;
}

.refresh-text:hover {
  color: #66b1ff;
  text-decoration: underline;
}
</style>

