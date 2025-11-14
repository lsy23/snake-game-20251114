/**
 * 贪吃蛇游戏主逻辑
 * 包含游戏状态管理、蛇的移动、食物生成、碰撞检测等功能
 */

class SnakeGame {
    constructor() {
        // 游戏配置
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20; // 网格大小
        this.tileCount = 20; // 网格数量
        
        // 游戏状态
        this.gameState = 'ready'; // ready, playing, paused, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore') || '0');
        
        // 蛇的属性
        this.snake = [
            { x: 10, y: 10 } // 初始位置在中心
        ];
        this.dx = 1; // 水平移动速度（初始向右移动）
        this.dy = 0; // 垂直移动速度
        
        // 食物位置
        this.food = this.generateFood();
        
        // 游戏循环
        this.gameLoop = null;
        this.gameSpeed = 150; // 游戏速度（毫秒）
        
        // 音效
        this.sounds = {
            eat: this.createSound(800, 0.1, 0.1),
            gameOver: this.createSound(200, 0.3, 0.5),
            move: this.createSound(400, 0.05, 0.05)
        };
        
        // 初始化UI
        this.initializeUI();
        this.updateScore();
        this.bindEvents();
    }
    
    /**
     * 创建简单的音效
     * @param {number} frequency - 频率
     * @param {number} duration - 持续时间
     * @param {number} volume - 音量
     * @returns {Function} 播放声音的函数
     */
    createSound(frequency, duration, volume) {
        return () => {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = frequency;
                gainNode.gain.value = volume;
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + duration);
            } catch (error) {
                console.log('音效播放失败:', error);
            }
        };
    }
    
    /**
     * 初始化UI元素
     */
    initializeUI() {
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.overlay = document.getElementById('game-overlay');
        this.overlayTitle = document.getElementById('overlay-title');
        this.overlayMessage = document.getElementById('overlay-message');
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        
        // 按钮事件
        this.startBtn.addEventListener('click', () => this.startGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // 窗口大小变化
        window.addEventListener('resize', () => this.handleResize());
    }
    
    /**
     * 处理键盘输入
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyPress(e) {
        if (this.gameState === 'gameOver') return;
        
        const key = e.key;
        
        // 防止默认行为
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key)) {
            e.preventDefault();
        }
        
        // 空格键暂停/继续
        if (key === ' ') {
            if (this.gameState === 'playing') {
                this.pauseGame();
            } else if (this.gameState === 'paused') {
                this.resumeGame();
            }
            return;
        }
        
        // 方向键控制
        if (this.gameState === 'playing') {
            this.changeDirection(key);
        }
    }
    
    /**
     * 改变蛇的移动方向
     * @param {string} key - 按下的键
     */
    changeDirection(key) {
        const goingUp = this.dy === -1;
        const goingDown = this.dy === 1;
        const goingRight = this.dx === 1;
        const goingLeft = this.dx === -1;
        
        switch (key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                if (!goingRight) {
                    this.dx = -1;
                    this.dy = 0;
                }
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                if (!goingDown) {
                    this.dx = 0;
                    this.dy = -1;
                }
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                if (!goingLeft) {
                    this.dx = 1;
                    this.dy = 0;
                }
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                if (!goingUp) {
                    this.dx = 0;
                    this.dy = 1;
                }
                break;
        }
    }
    
    /**
     * 生成随机食物位置
     * @returns {Object} 食物坐标
     */
    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        
        return newFood;
    }
    
    /**
     * 移动蛇
     */
    moveSnake() {
        if (this.dx === 0 && this.dy === 0) return;
        
        const head = { x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy };
        this.snake.unshift(head);
        
        // 检查是否吃到食物
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            this.food = this.generateFood();
            this.sounds.eat();
            this.updateScore();
            
            // 增加游戏速度
            if (this.gameSpeed > 80) {
                this.gameSpeed -= 2;
                this.restartGameLoop();
            }
        } else {
            this.snake.pop();
        }
        
        // 播放移动音效
        if (this.gameState === 'playing') {
            this.sounds.move();
        }
    }
    
    /**
     * 检查碰撞
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision() {
        const head = this.snake[0];
        
        // 撞墙检测
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }
        
        // 撞自己检测
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 游戏主循环
     */
    gameStep() {
        if (this.gameState !== 'playing') return;
        
        this.moveSnake();
        
        if (this.checkCollision()) {
            this.gameOver();
            return;
        }
        
        this.render();
    }
    
    /**
     * 渲染游戏画面
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = '#f7fafc';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制网格
        this.drawGrid();
        
        // 绘制蛇
        this.drawSnake();
        
        // 绘制食物
        this.drawFood();
    }
    
    /**
     * 绘制网格
     */
    drawGrid() {
        this.ctx.strokeStyle = '#e2e8f0';
        this.ctx.lineWidth = 1;
        
        const tileSize = this.canvas.width / this.tileCount;
        
        for (let i = 0; i <= this.tileCount; i++) {
            // 垂直线
            this.ctx.beginPath();
            this.ctx.moveTo(i * tileSize, 0);
            this.ctx.lineTo(i * tileSize, this.canvas.height);
            this.ctx.stroke();
            
            // 水平线
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * tileSize);
            this.ctx.lineTo(this.canvas.width, i * tileSize);
            this.ctx.stroke();
        }
    }
    
    /**
     * 绘制蛇
     */
    drawSnake() {
        const tileSize = this.canvas.width / this.tileCount;
        
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // 蛇头
                this.ctx.fillStyle = '#2d3748';
                this.ctx.fillRect(
                    segment.x * tileSize + 2,
                    segment.y * tileSize + 2,
                    tileSize - 4,
                    tileSize - 4
                );
                
                // 蛇头高光
                this.ctx.fillStyle = '#4a5568';
                this.ctx.fillRect(
                    segment.x * tileSize + 4,
                    segment.y * tileSize + 4,
                    tileSize - 8,
                    tileSize - 8
                );
            } else {
                // 蛇身
                this.ctx.fillStyle = '#48bb78';
                this.ctx.fillRect(
                    segment.x * tileSize + 2,
                    segment.y * tileSize + 2,
                    tileSize - 4,
                    tileSize - 4
                );
                
                // 蛇身高光
                this.ctx.fillStyle = '#68d391';
                this.ctx.fillRect(
                    segment.x * tileSize + 4,
                    segment.y * tileSize + 4,
                    tileSize - 8,
                    tileSize - 8
                );
            }
        });
    }
    
    /**
     * 绘制食物
     */
    drawFood() {
        const tileSize = this.canvas.width / this.tileCount;
        const centerX = this.food.x * tileSize + tileSize / 2;
        const centerY = this.food.y * tileSize + tileSize / 2;
        const radius = tileSize / 2 - 4;
        
        // 绘制食物圆形
        this.ctx.fillStyle = '#f56565';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // 食物高光
        this.ctx.fillStyle = '#fc8181';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 2, centerY - 2, radius - 2, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    
    /**
     * 更新分数显示
     */
    updateScore() {
        this.scoreElement.textContent = this.score;
        this.highScoreElement.textContent = this.highScore;
        
        // 分数增加动画
        this.scoreElement.classList.add('score-animation');
        setTimeout(() => {
            this.scoreElement.classList.remove('score-animation');
        }, 500);
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        this.gameState = 'playing';
        this.dx = 1; // 确保开始游戏时向右移动
        this.dy = 0;
        this.hideOverlay();
        this.startGameLoop();
        this.render();
    }
    
    /**
     * 暂停游戏
     */
    pauseGame() {
        this.gameState = 'paused';
        this.showOverlay('游戏暂停', '按空格键继续游戏', false);
    }
    
    /**
     * 继续游戏
     */
    resumeGame() {
        this.gameState = 'playing';
        this.hideOverlay();
    }
    
    /**
     * 重新开始游戏
     */
    restartGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.gameSpeed = 150;
        this.snake = [{ x: 10, y: 10 }];
        this.dx = 1; // 重新开始时向右移动
        this.dy = 0;
        this.food = this.generateFood();
        this.updateScore();
        this.hideOverlay();
        this.restartGameLoop();
        this.render();
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.gameState = 'gameOver';
        this.sounds.gameOver();
        
        // 更新最高分
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }
        
        this.showOverlay('游戏结束', `最终得分: ${this.score}`, true);
    }
    
    /**
     * 显示覆盖层
     * @param {string} title - 标题
     * @param {string} message - 消息
     * @param {boolean} showRestart - 是否显示重新开始按钮
     */
    showOverlay(title, message, showRestart) {
        this.overlayTitle.textContent = title;
        this.overlayMessage.textContent = message;
        this.overlay.style.display = 'flex';
        
        if (showRestart) {
            this.startBtn.style.display = 'none';
            this.restartBtn.style.display = 'inline-block';
        } else {
            this.startBtn.style.display = 'inline-block';
            this.restartBtn.style.display = 'none';
        }
    }
    
    /**
     * 隐藏覆盖层
     */
    hideOverlay() {
        this.overlay.style.display = 'none';
    }
    
    /**
     * 开始游戏循环
     */
    startGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.gameLoop = setInterval(() => this.gameStep(), this.gameSpeed);
    }
    
    /**
     * 重新开始游戏循环
     */
    restartGameLoop() {
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }
        this.gameLoop = setInterval(() => this.gameStep(), this.gameSpeed);
    }
    
    /**
     * 处理窗口大小变化
     */
    handleResize() {
        const container = this.canvas.parentElement;
        const maxWidth = Math.min(400, container.clientWidth - 40);
        this.canvas.width = maxWidth;
        this.canvas.height = maxWidth;
        this.render();
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new SnakeGame();
    game.handleResize(); // 初始调整大小
});