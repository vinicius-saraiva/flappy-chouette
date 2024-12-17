// At the start of game.js
// const baseUrl = window.location.origin;
// const isLocalhost = baseUrl.includes('localhost');

if (typeof supabaseClient === 'undefined') {
    console.error('Supabase client not initialized');
    window.location.href = window.baseUrl;
}

var game = new Phaser.Game(320,505,Phaser.AUTO,'game'); //实例化game
game.States = {}; //存放state对象

game.States.boot = function(){
	this.preload = function(){
		if(!game.device.desktop){//移动设备适应
			this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
			this.scale.forcePortrait = true;
			this.scale.refresh();
		}
		game.load.image('loading','assets/preloader.gif');
	};
	this.create = function(){
		game.state.start('preload'); //跳转到资源加载页面
	};
}

game.States.preload = function(){
	this.preload = function(){
		var preloadSprite = game.add.sprite(35,game.height/2,'loading'); //创建显示loading进度的sprite
		game.load.setPreloadSprite(preloadSprite);
		//以下为要加载的资源
		const assetPath = './assets/';
		
		game.load.image('background', `${assetPath}background.png`);
		game.load.image('ground', `${assetPath}ground.png`);
		game.load.image('title', `${assetPath}title.png`);
		game.load.spritesheet('bird', `${assetPath}bird.png`, 34, 24, 3);
		game.load.image('btn', `${assetPath}start-button.png`);
		game.load.spritesheet('pipe', `${assetPath}pipes.png`, 54, 320, 2);
		game.load.bitmapFont('flappy_font', `${assetPath}fonts/flappyfont/flappyfont.png`, `${assetPath}fonts/flappyfont/flappyfont.fnt`);
		game.load.audio('fly_sound', `${assetPath}flap.wav`);
		game.load.audio('score_sound', `${assetPath}score.wav`);
		game.load.audio('hit_pipe_sound', `${assetPath}pipe-hit.wav`);
		game.load.audio('hit_ground_sound', `${assetPath}ouch.wav`);

		game.load.image('ready_text', `${assetPath}get-ready.png`);
		game.load.image('play_tip', `${assetPath}instructions.png`);
		game.load.image('game_over', `${assetPath}gameover.png`);
		game.load.image('score_board', `${assetPath}scoreboard.png`);
	}
	this.create = function(){
		game.state.start('menu');
	}
}

game.States.menu = function(){
	this.create = function(){
		
		game.add.tileSprite(0,0,game.width,game.height,'background').autoScroll(-10,0); //背景图
		game.add.tileSprite(0,game.height-112,game.width,112,'ground').autoScroll(-100,0); //地板
		var titleGroup = game.add.group(); //创建存放标题的组
		titleGroup.create(0,0,'title'); //标题
		var bird = titleGroup.create(190, 10, 'bird'); //添加bird到组里
		bird.animations.add('fly'); //添加动画
		bird.animations.play('fly',12,true); //播放动画
		titleGroup.x = 35;
		titleGroup.y = 100;
		game.add.tween(titleGroup).to({ y:120 },1000,null,true,0,Number.MAX_VALUE,true); //标题的缓动动画
		var btn = game.add.button(game.width/2,game.height/2,'btn',function(){//开始按钮
			game.state.start('play');
		});
		btn.anchor.setTo(0.5,0.5);
	}
}

game.States.play = {
	create: function() {
		this.bg = game.add.tileSprite(0,0,game.width,game.height,'background');
		this.pipeGroup = game.add.group();
		this.pipeGroup.enableBody = true;
		this.ground = game.add.tileSprite(0,game.height-112,game.width,112,'ground');
		this.bird = game.add.sprite(50,150,'bird');
		this.bird.animations.add('fly');
		this.bird.animations.play('fly',12,true);
		this.bird.anchor.setTo(0.5, 0.5);
		
		game.physics.enable(this.bird,Phaser.Physics.ARCADE);
		this.bird.body.gravity.y = 0;
		
		game.physics.enable(this.ground,Phaser.Physics.ARCADE);
		this.ground.body.immovable = true;

		this.soundFly = game.add.sound('fly_sound');
		this.soundFly.volume = 3.0;
		this.soundScore = game.add.sound('score_sound');
		this.soundScore.volume = 0.5;
		this.soundHitPipe = game.add.sound('hit_pipe_sound');
		this.soundHitGround = game.add.sound('hit_ground_sound');
		this.scoreText = game.add.bitmapText(game.world.centerX-20, 30, 'flappy_font', '0', 36);

		this.readyText = game.add.image(game.width/2, 40, 'ready_text');
		this.playTip = game.add.image(game.width/2,300,'play_tip');
		this.readyText.anchor.setTo(0.5, 0);
		this.playTip.anchor.setTo(0.5, 0);

		this.hasStarted = false;
		game.time.events.loop(900, this.generatePipes, this);
		game.time.events.stop(false);
		game.input.onDown.addOnce(this.statrGame, this);
	},

	update: function() {
		if(!this.hasStarted) return;
		
		// Add boundary check for bird going too high
		if(this.bird.y < 0) {  // If bird goes above the game frame
			this.hitBoundary();
		}
		
		game.physics.arcade.collide(this.bird,this.ground, this.hitGround, null, this);
		game.physics.arcade.overlap(this.bird, this.pipeGroup, this.hitPipe, null, this);
		if(this.bird.angle < 90) this.bird.angle += 2.5;
		this.pipeGroup.forEachExists(this.checkScore,this);
	},

	statrGame: function() {
		this.gameSpeed = 200;
		this.gameIsOver = false;
		this.hasHitGround = false;
		this.hasStarted = true;
		this.score = 0;
		this.bg.autoScroll(-(this.gameSpeed/10),0);
		this.ground.autoScroll(-this.gameSpeed,0);
		this.bird.body.gravity.y = 1150;
		this.readyText.destroy();
		this.playTip.destroy();
		game.input.onDown.add(this.fly, this);
		game.time.events.start();
	},

	stopGame: function() {
		this.bg.stopScroll();
		this.ground.stopScroll();
		this.pipeGroup.forEachExists(function(pipe){
			pipe.body.velocity.x = 0;
		}, this);
		this.bird.animations.stop('fly', 0);
		game.input.onDown.remove(this.fly, this);
		game.time.events.stop(true);
	},

	fly: function() {
		this.bird.body.velocity.y = -350;
		game.add.tween(this.bird).to({angle:-30}, 100, null, true, 0, 0, false);
		this.soundFly.play();
	},

	hitPipe: function() {
		if(this.gameIsOver) return;
		this.soundHitPipe.play();
		this.gameOver();
	},

	hitGround: function() {
		if(this.gameIsOver) return;
		this.hasHitGround = true;
		this.soundHitGround.play();
		this.gameOver();
	},

	gameOver: function() {
		if (this.gameIsOver) return;
		
		this.gameIsOver = true;
		
		// Show game over text FIRST
		this.showGameOverText();
		
		// Then stop game and save score
		this.stopGame();
		this.saveScore(this.score);
	},

	saveScore: function(score) {
		const username = localStorage.getItem('username');
		const userId = localStorage.getItem('userId');
		
		if (!username || !userId) {
			console.error('User not properly authenticated');
			return;
		}

		console.log('Saving score:', {
			user_id: userId,
			username: username,
			score: score
		});

		supabaseClient
			.from('scores')
			.insert([
				{
					user_id: userId,
					username: username,
					score: score
				}
			])
			.then(response => {
				if (response.error) {
					console.error('Error saving score:', response.error);
				} else {
					console.log('Score saved successfully:', response.data);
				}
			})
			.catch(error => {
				console.error('Error saving score:', error);
			});
	},

	showGameOverText: function(){
		this.scoreText.destroy();
		game.bestScore = game.bestScore || 0;
		if(this.score > game.bestScore) game.bestScore = this.score;
		
		this.gameOverGroup = game.add.group();
		
		// Add game over elements to group
		var gameOverText = this.gameOverGroup.create(game.width/2, 0, 'game_over');
		var scoreboard = this.gameOverGroup.create(game.width/2, 70, 'score_board');
		var currentScoreText = game.add.bitmapText(game.width/2 + 60, 105, 'flappy_font', this.score+'', 20, this.gameOverGroup);
		var bestScoreText = game.add.bitmapText(game.width/2 + 60, 153, 'flappy_font', game.bestScore+'', 20, this.gameOverGroup);
		
		// Add replay button
		var replayBtn = game.add.button(game.width/2, 210, 'btn', function(){
			game.state.start('play');
		}, this, null, null, null, null, this.gameOverGroup);
		
		// Set anchors
		gameOverText.anchor.setTo(0.5, 0);
		scoreboard.anchor.setTo(0.5, 0);
		replayBtn.anchor.setTo(0.5, 0);
		
		// Position the group
		this.gameOverGroup.y = 30;
	},

	generatePipes: function(gap){ //制造管道
		gap = gap || 100; //上下管道之间的间隙宽度
		var position = (505 - 320 - gap) + Math.floor((505 - 112 - 30 - gap - 505 + 320 + gap) * Math.random());
		var topPipeY = position-360;
		var bottomPipeY = position+gap;

		if(this.resetPipe(topPipeY,bottomPipeY)) return;

		var topPipe = game.add.sprite(game.width, topPipeY, 'pipe', 0, this.pipeGroup);
		var bottomPipe = game.add.sprite(game.width, bottomPipeY, 'pipe', 1, this.pipeGroup);
		this.pipeGroup.setAll('checkWorldBounds',true);
		this.pipeGroup.setAll('outOfBoundsKill',true);
		this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);
	},

	resetPipe: function(topPipeY,bottomPipeY){//重置出了边界的管道，做到利用
		var i = 0;
		this.pipeGroup.forEachDead(function(pipe){
			if(pipe.y<=0){ //topPipe
				pipe.reset(game.width, topPipeY);
				pipe.hasScored = false; //重置为未得分
			}else{
				pipe.reset(game.width, bottomPipeY);
			}
			pipe.body.velocity.x = -this.gameSpeed;
			i++;
		}, this);
		return i == 2; //如果 i==2 代表有一组管道已经出了边界，可以回收这组管道了
	},

	checkScore: function(pipe){//负责分数的检测和更新
		if(!pipe.hasScored && pipe.y<=0 && pipe.x<=this.bird.x-17-54){
			pipe.hasScored = true;
			this.scoreText.text = ++this.score;
			this.soundScore.play();
			return true;
		}
		return false;
	},

	// Add new method for boundary collision
	hitBoundary: function() {
		if(this.gameIsOver) return;
		this.soundHitPipe.play();  // Reuse pipe hit sound
		this.gameOver();
	}
}

//添加state到游戏
game.state.add('boot',game.States.boot);
game.state.add('preload',game.States.preload);
game.state.add('menu',game.States.menu);
game.state.add('play',game.States.play);
game.state.start('boot'); //启动游戏

