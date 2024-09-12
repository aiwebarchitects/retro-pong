const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const menuElement = document.getElementById('menu');
const startButton = document.getElementById('startButton');
const aiStrategyElement = document.getElementById('aiStrategy');

const paddleHeight = 100;
const paddleWidth = 10;
const ballSize = 10;

let playerY = (canvas.height - paddleHeight) / 2;
let aiY = (canvas.height - paddleHeight) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 5;
let ballSpeedY = 5;

let playerScore = 0;
let aiScore = 0;

let gameRunning = false;
let particles = [];

// AI strategies
const aiStrategies = [
    {
        name: "Predictive",
        execute: (aiY, ballY, ballX) => {
            const prediction = ballY + (ballX - (canvas.width - paddleWidth)) * (ballSpeedY / ballSpeedX);
            const targetY = Math.min(Math.max(prediction - paddleHeight / 2, 0), canvas.height - paddleHeight);
            return aiY < targetY ? aiY + 4 : aiY - 4;
        }
    },
    {
        name: "Reactive",
        execute: (aiY, ballY) => {
            const aiCenter = aiY + paddleHeight / 2;
            return aiCenter < ballY - 35 ? aiY + 6 : aiCenter > ballY + 35 ? aiY - 6 : aiY;
        }
    },
    {
        name: "Zone Defense",
        execute: (aiY) => {
            const zones = [0, canvas.height / 3, 2 * canvas.height / 3, canvas.height - paddleHeight];
            const targetZone = zones[Math.floor(Math.random() * zones.length)];
            return aiY < targetZone ? aiY + 3 : aiY > targetZone ? aiY - 3 : aiY;
        }
    },
    {
        name: "Aggressive",
        execute: (aiY, ballY, ballX) => {
            if (ballX > canvas.width / 2) {
                return aiY < ballY - paddleHeight / 4 ? aiY + 7 : aiY > ballY + paddleHeight / 4 ? aiY - 7 : aiY;
            } else {
                return aiY < canvas.height / 2 - paddleHeight / 2 ? aiY + 3 : aiY > canvas.height / 2 + paddleHeight / 2 ? aiY - 3 : aiY;
            }
        }
    }
];

let currentStrategy = aiStrategies[0];
let strategyChangeCounter = 0;

function drawRect(x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawCircle(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2, false);
    ctx.fill();
}

function drawGame() {
    // Clear canvas
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw paddles
    drawRect(0, playerY, paddleWidth, paddleHeight, '#0ff');
    drawRect(canvas.width - paddleWidth, aiY, paddleWidth, paddleHeight, '#0ff');
    
    // Draw ball
    drawCircle(ballX, ballY, ballSize, '#0ff');
    
    // Draw center line
    for (let i = 0; i < canvas.height; i += 40) {
        drawRect(canvas.width / 2 - 1, i, 2, 20, '#0ff');
    }

    // Draw particles
    particles.forEach((p, index) => {
        p.life--;
        if (p.life <= 0) {
            particles.splice(index, 1);
        } else {
            p.x += p.speedX;
            p.y += p.speedY;
            p.size *= 0.95;
            drawCircle(p.x, p.y, p.size, `rgba(0, 255, 255, ${p.life / 20})`);
        }
    });
}

function createParticles(x, y, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            size: Math.random() * 3 + 1,
            speedX: (Math.random() - 0.5) * 8,
            speedY: (Math.random() - 0.5) * 8,
            life: Math.random() * 20 + 10
        });
    }
}

function updateGame() {
    ballX += ballSpeedX;
    ballY += ballSpeedY;
    
    // Ball collision with top and bottom
    if (ballY < 0 || ballY > canvas.height) {
        ballSpeedY = -ballSpeedY;
        createParticles(ballX, ballY, 20);
    }
    
    // Ball collision with paddles
    if (ballX < paddleWidth) {
        if (ballY > playerY && ballY < playerY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            let deltaY = ballY - (playerY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.35;
            createParticles(ballX, ballY, 30);
        } else if (ballX < 0) {
            aiScore++;
            resetBall();
        }
    }
    if (ballX > canvas.width - paddleWidth) {
        if (ballY > aiY && ballY < aiY + paddleHeight) {
            ballSpeedX = -ballSpeedX;
            let deltaY = ballY - (aiY + paddleHeight / 2);
            ballSpeedY = deltaY * 0.35;
            createParticles(ballX, ballY, 30);
        } else if (ballX > canvas.width) {
            playerScore++;
            resetBall();
        }
    }
    
    // AI movement
    aiY = currentStrategy.execute(aiY, ballY, ballX);
    aiY = Math.max(0, Math.min(canvas.height - paddleHeight, aiY));
    
    // Change AI strategy
    strategyChangeCounter++;
    if (strategyChangeCounter >= 500) {
        changeAIStrategy();
        strategyChangeCounter = 0;
    }
    
    scoreElement.textContent = `Player: ${playerScore} | AI: ${aiScore}`;
}

function resetBall() {
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = -ballSpeedX;
    ballSpeedY = 3;
    createParticles(ballX, ballY, 50);
}

function changeAIStrategy() {
    const newStrategy = aiStrategies[Math.floor(Math.random() * aiStrategies.length)];
    if (newStrategy !== currentStrategy) {
        currentStrategy = newStrategy;
        aiStrategyElement.textContent = `AI Strategy: ${currentStrategy.name}`;
        createParticles(canvas.width - paddleWidth, aiY + paddleHeight / 2, 100);
    }
}

function gameLoop() {
    if (gameRunning) {
        updateGame();
        drawGame();
        requestAnimationFrame(gameLoop);
    }
}

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    playerY = e.clientY - rect.top - paddleHeight / 2;
    
    // Keep paddle within canvas
    playerY = Math.max(0, Math.min(canvas.height - paddleHeight, playerY));
});

startButton.addEventListener('click', () => {
    gameRunning = true;
    menuElement.style.display = 'none';
    scoreElement.style.display = 'block';
    aiStrategyElement.style.display = 'block';
    changeAIStrategy();
    gameLoop();
});

// Initial setup
scoreElement.style.display = 'none';
aiStrategyElement.style.display = 'none';
drawGame();
