document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  const window_height = window.innerHeight * 0.8;
  const window_width = window.innerWidth * 0.8;

  canvas.height = window_height;
  canvas.width = window_width;

  const repoName = "canvas-soccer-game";
  const basePath = `https://luisangeles4.github.io/${repoName}/assets/`;
  const images = {
    canvasBackground: `${basePath}fondo-canvas.jpg`,
    circleBackground: `${basePath}fondo-circle.png`,
    cursor: `${basePath}fondo-cursor.png`,
  };

  const loadedImages = {};

  let imagesLoaded = 0;
  const totalImages = Object.keys(images).length;

  for (const key in images) {
    const img = new Image();
    img.src = images[key];
    img.onload = () => {
      loadedImages[key] = img;
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        startGame();
      }
    };
  }

  let mouseX = 0;
  let mouseY = 0;
  let maxScore = localStorage.getItem("maxScore") || 0;
  let clickedCirclesCount = 0;
  let outOfBoundsCirclesCount = 0;
  let gameRunning = true;
  let arrayCircle = [];
  let circleId = 0;

  const resetGame = () => {
    clickedCirclesCount = 0;
    outOfBoundsCirclesCount = 0;
    gameRunning = true;
    arrayCircle = [];
    circleId = 0;
    for (let i = 0; i < 10; i++) {
      generateCircle();
    }
  };

  class Circle {
    constructor(x, y, radius, text, speed) {
      this.posX = x;
      this.posY = y;
      this.radius = radius;
      this.text = text;
      this.speed = speed;
      this.dx = speed;
      this.dy = 0;
    }

    draw(context) {
      context.save();
      context.beginPath();
      context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false);
      context.clip();
      context.drawImage(
        loadedImages.circleBackground,
        this.posX - this.radius,
        this.posY - this.radius,
        this.radius * 2,
        this.radius * 2
      );
      context.strokeStyle = "#000";
      context.lineWidth = 2;
      context.stroke();
      context.closePath();
      context.restore();
    }

    update(context) {
      this.draw(context);
      this.posX += this.dx;
      return this.posX + this.radius <= window_width;
    }

    handleCollision(otherCircle) {
      const dx = otherCircle.posX - this.posX;
      const dy = otherCircle.posY - this.posY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = this.radius + otherCircle.radius;

      if (distance < minDistance) {
        const angle = Math.atan2(dy, dx);
        const sin = Math.sin(angle);
        const cos = Math.cos(angle);

        const thisVx = this.dx * cos + this.dy * sin;
        const thisVy = this.dy * cos - this.dx * sin;

        const otherVx = otherCircle.dx * cos + otherCircle.dy * sin;
        const otherVy = otherCircle.dy * cos - otherCircle.dx * sin;

        const newThisVx = otherVx;
        const newOtherVx = thisVx;
        const newThisVy = thisVy;
        const newOtherVy = otherVy;

        this.dx = newThisVx * cos - newThisVy * sin;
        this.dy = newThisVy * cos + newThisVx * sin;
        otherCircle.dx = newOtherVx * cos - newOtherVy * sin;
        otherCircle.dy = newOtherVy * cos + newOtherVx * sin;

        const moveX = (minDistance - distance) * Math.cos(angle);
        const moveY = (minDistance - distance) * Math.sin(angle);

        this.posX += moveX;
        this.posY += moveY;
        otherCircle.posX -= moveX;
        otherCircle.posY -= moveY;
      }
    }
  }

  const generateCircle = () => {
    const randomRadius = Math.floor(Math.random() * 30 + 10);
    const randomY =
      Math.random() * (window_height - 2 * randomRadius) + randomRadius;
    const randomX = -randomRadius;

    const myCircle = new Circle(
      randomX,
      randomY,
      randomRadius,
      circleId++,
      1.5
    );
    arrayCircle.push(myCircle);
  };

  const position = (posX1, posY1, posX2, posY2) => {
    return Math.sqrt(Math.pow(posX2 - posX1, 2) + Math.pow(posY2 - posY1, 2));
  };

  const updateCircle = () => {
    if (!gameRunning) return;

    requestAnimationFrame(updateCircle);

    ctx.drawImage(
      loadedImages.canvasBackground,
      0,
      0,
      window_width,
      window_height
    );

    for (let i = 0; i < arrayCircle.length; i++) {
      const stillInBounds = arrayCircle[i].update(ctx);
      if (!stillInBounds) {
        arrayCircle.splice(i, 1);
        outOfBoundsCirclesCount++;
        console.log(`Circles out of bounds: ${outOfBoundsCirclesCount}`);
        i--;
      }
    }

    while (arrayCircle.length < 10 && gameRunning) {
      generateCircle();
    }

    for (let i = 0; i < arrayCircle.length; i++) {
      for (let j = i + 1; j < arrayCircle.length; j++) {
        const distance = position(
          arrayCircle[i].posX,
          arrayCircle[i].posY,
          arrayCircle[j].posX,
          arrayCircle[j].posY
        );
        if (distance <= arrayCircle[i].radius + arrayCircle[j].radius) {
          arrayCircle[i].handleCollision(arrayCircle[j]);
        }
      }
    }

    ctx.font = "20px Arial";
    ctx.fillStyle = "#fff";
    ctx.fillText(`Puntuación: ${clickedCirclesCount}`, 70, 20);
    ctx.fillText(`GOLES EN CONTRA: ${outOfBoundsCirclesCount}`, 70, 55);
    ctx.fillText(`Puntuación máxima: ${maxScore}`, 70, 85);

    if (outOfBoundsCirclesCount >= 1 && gameRunning) {
      console.log("Juego terminado");
      gameRunning = false;
      resetGame();
    }

    ctx.drawImage(
      loadedImages.cursor,
      mouseX - loadedImages.cursor.width / 2,
      mouseY - loadedImages.cursor.height / 2
    );

    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 5, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.closePath();
  };

  const startGame = () => {
    resetGame();
    updateCircle();
  };

  canvas.addEventListener("mousemove", (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
    console.log(`Mouse position: (${mouseX}, ${mouseY})`);
  });

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let i = arrayCircle.length - 1; i >= 0; i--) {
      const circle = arrayCircle[i];
      const dx = mouseX - circle.posX;
      const dy = mouseY - circle.posY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= circle.radius) {
        arrayCircle.splice(i, 1);
        clickedCirclesCount++;
        break;
      }
    }

    if (clickedCirclesCount > maxScore) {
      maxScore = clickedCirclesCount;
      localStorage.setItem("maxScore", maxScore);
    }
  });
});
