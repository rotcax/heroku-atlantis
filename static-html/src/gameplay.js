var game = new Phaser.Game(1136, 640, Phaser.CANVAS);
var AMOUNT_DIAMONDS = 30;
var AMOUNT_BOOBLES = 30;

GamePlayManager = {  
  init() {
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    game.scale.pageAlignHorizontally = true;
    game.scale.pageAlignVertically = true;

    this.flagFirstMouseDown = false;
    this.amountDiamondCaught = 0;
    this.endGame = false;

    this.countSmile = -1;
  },
  preload() {
    loadResource(game)
  },
  create() {
    game.add.sprite(0, 0, 'background');

    this.boobleArray = [];

    for(let i = 0; i< AMOUNT_BOOBLES; i++) {
      const xBooble = game.rnd.integerInRange(1, 1140);
      const yBooble = game.rnd.integerInRange(600, 950);

      const booble = game.add.sprite(xBooble, yBooble, 'booble' + game.rnd.integerInRange(1, 2));
      booble.vel = 0.2 + game.rnd.frac() * 2;
      booble.alpha = 0.9;
      booble.scale.setTo(0.2 + game.rnd.frac());

      this.boobleArray[i] = booble;
    }

    this.mollusk = game.add.sprite(500, 150, 'mollusk');
    this.shark = game.add.sprite(500, 20, 'shark');
    this.fishes = game.add.sprite(100, 550, 'fishes');

    this.horse = game.add.sprite(0, 0, 'horse');
    this.horse.frame = 0;
    this.horse.x = game.width / 2;
    this.horse.y = game.height / 2;
    this.horse.anchor.setTo(0.5);

    game.input.onDown.add(this.onTap, this);

    this.diamonds = [];

    for(let i = 0; i < AMOUNT_DIAMONDS; i++) {
      const diamond = game.add.sprite(100, 100, 'diamonds');
      diamond.frame = game.rnd.integerInRange(0, 3);
      diamond.scale.setTo(0.30 + game.rnd.frac());
      diamond.anchor.setTo(0.5);

      diamond.x = game.rnd.integerInRange(50, 1050);
      diamond.y = game.rnd.integerInRange(50, 600);

      this.diamonds[i] = diamond;
  
      let rectCurrentDiamond = this.getBoundsDiamond(diamond);
      let rectHorse = this.getBoundsDiamond(this.horse);
  
      while(this.isOverlapingOtherDiamond(i, rectCurrentDiamond) || this.isRectanglesOverlapping(rectHorse, rectCurrentDiamond)) {
        diamond.x = game.rnd.integerInRange(50, 1050);
        diamond.y = game.rnd.integerInRange(50, 600);

        rectCurrentDiamond = this.getBoundsDiamond(diamond);
      }
    }

    this.explosionGroup = game.add.group();

    for(let i = 0; i < 10; i++) {
      this.explosion = this.explosionGroup.create(100, 100, 'explosion');
  
      this.explosion.tweenScale = game.add.tween(this.explosion.scale).to({
        x: [0.4, 0.8, 0.4],
        y: [0.4, 0.8, 0.4]
      }, 600, Phaser.Easing.Exponential.Out, false, 0, 0, false);
  
      this.explosion.tweenAlpha = game.add.tween(this.explosion).to({
        alpha: [1, 0.6, 0]
      }, 600, Phaser.Easing.Exponential.Out, false, 0, 0, false);
  
      this.explosion.anchor.setTo(0.5);
      this.explosion.kill();
    }

    this.currentScore = 0;

    const style = {
      font: 'bold 30pt Arial',
      fill: '#FFF',
      align: 'center'
    }

    this.scoreText = game.add.text(game.width / 2, 40, '0', style);
    this.scoreText.anchor.setTo(0.5);

    this.totalTime = 30;
    this.timerText = game.add.text(1000, 40, `${this.totalTime} `, style);
    this.timerText.anchor.setTo(0.5);

    this.timerGameOver = game.time.events.loop(Phaser.Timer.SECOND, function() {
      if(this.flagFirstMouseDown) {
        this.totalTime--;
        this.timerText.text = `${this.totalTime} `;

        if(this.totalTime <= 0) {
          game.time.events.remove(this.timerGameOver);
          this.endGame = true;
          this.showFinalMessage('GAME OVER');
        }
      }
    }, this);
  },
  increaseScore() {
    this.countSmile = 0;
    this.horse.frame = 1;

    this.currentScore += 100;
    this.scoreText.text = this.currentScore;

    this.amountDiamondCaught += 1;

    if(this.amountDiamondCaught >= AMOUNT_DIAMONDS) {
      game.time.events.remove(this.timerGameOver);
      this.endGame = true;
      this.showFinalMessage('CONGRATULATIONS');
    }
  },
  showFinalMessage(msg) {
    const bgAlpha = game.add.bitmapData(game.width, game.height);
    bgAlpha.ctx.fillStyle = '#000';
    bgAlpha.ctx.fillRect(0, 0, game.width, game.height);

    const bg = game.add.sprite(0, 0, bgAlpha);
    bg.alpha = 0.5;

    const style = {
      font: 'bold 60pt Arial',
      fill: '#FFF',
      align: 'center'
    }

    this.textFieldFinalMsg = game.add.text(game.width / 2, game.height / 2, msg, style);
    this.textFieldFinalMsg.anchor.setTo(0.5);
  },
  onTap() {
    if(!this.flagFirstMouseDown) {
      this.tweenMollusk = game.add.tween(this.mollusk.position).to({
        y: -0.001
      }, 5800, Phaser.Easing.Cubic.InOut, true, 0, 1000, true).loop(true);
    }

    this.flagFirstMouseDown = true;
  },
  getBoundsDiamond(currentDiamond) {
    return new Phaser.Rectangle(currentDiamond.left, currentDiamond.top, currentDiamond.width, currentDiamond.height);
  },
  isRectanglesOverlapping(rect1, rect2) {
    if(rect1.x > rect2.x + rect2.width || rect2.x > rect1.x + rect1.width) {
      return false;
    }

    if(rect1.y > rect2.y + rect2.height || rect2.y > rect1.y + rect1.height) {
      return false;
    }

    return true;
  },
  isOverlapingOtherDiamond(index, rect2) {
    for(let i = 0; i < index; i++) {
      const rect1 = this.getBoundsDiamond(this.diamonds[i]);
      if(this.isRectanglesOverlapping(rect1, rect2)) {
        return true;
      }
    }

    return false;
  },
  getBoundsHorse() {
    const x0 = this.horse.x - Math.abs(this.horse.width) / 4;
    const width = Math.abs(this.horse.width) / 2;
    const y0 = this.horse.y - this.horse.height / 2;
    const height = this.horse.height;

    return new Phaser.Rectangle(x0, y0, width, height);
  },
  update() {
    if(this.flagFirstMouseDown && !this.endGame) {
      for(let i = 0; i < AMOUNT_BOOBLES; i++) {
        const booble = this.boobleArray[i];
        booble.y -= booble.vel;

        if(booble.y < -50) {
          booble.y = 700;
          booble.x = game.rnd.integerInRange(1, 1140);
        }
      }

      if(this.countSmile >= 0) {
        this.countSmile++;
        if(this.countSmile > 50) {
          this.countSmile = -1;
          this.horse.frame = 0;
        }
      }

      this.shark.x--;
      if(this.shark.x < -300) {
        this.shark.x = 1300;
      }

      this.fishes.x += 0.3;
      if(this.fishes > 1300) {
        this.fishes.x = -300;
      }

      const pointerX = game.input.x;
      const pointerY = game.input.y;
    
      const distX = pointerX - this.horse.x;
      const distY = pointerY - this.horse.y;
    
      if(distX > 0) {
        this.horse.scale.setTo(1, 1);
      } else {
        this.horse.scale.setTo(-1, 1);
      }
    
      this.horse.x += distX * 0.02;
      this.horse.y += distY * 0.02;

      for(var i = 0; i < AMOUNT_DIAMONDS; i++) {
        const rectHorse = this.getBoundsHorse();
        const rectDiamond = this.getBoundsDiamond(this.diamonds[i])
  
        if(this.diamonds[i].visible && this.isRectanglesOverlapping(rectHorse, rectDiamond)) {
          this.increaseScore();
          this.diamonds[i].visible = false;

          const explosion = this.explosionGroup.getFirstDead();

          if(explosion != null) {
            explosion.reset(this.diamonds[i].x, this.diamonds[i].y);
            explosion.tweenScale.start();
            explosion.tweenAlpha.start();

            explosion.tweenAlpha.onComplete.add(function (currentTarget, currentTween) {
              currentTarget.kill();
            }, this);
          }
        }
      }
    }
  }
}

game.state.add('gameplay', GamePlayManager);
game.state.start('gameplay');
