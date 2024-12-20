// At the start of game.js
const calculateGameSize = () => {
    const maxHeight = 750;
    const windowHeight = window.innerHeight;
    const gameHeight = Math.min(windowHeight, maxHeight);
    
    // For desktop, use window width, detect desktop using window width as a simple heuristic
    const isDesktop = window.innerWidth > 768;
    const gameWidth = isDesktop ? window.innerWidth : Math.floor(gameHeight * (320/505));
    
    return { 
        width: gameWidth, 
        height: gameHeight,
        isDesktop: isDesktop 
    };
};

const gameSize = calculateGameSize();
var game = new Phaser.Game(gameSize.width, gameSize.height, Phaser.AUTO, 'game');

// Store isDesktop as a global game property
game.isDesktop = gameSize.isDesktop;

if (typeof supabaseClient === 'undefined') {
    console.error('Supabase client not initialized');
    window.location.href = window.baseUrl;
}

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
		// Identify user when game starts
		const username = localStorage.getItem('username');
		if (username && window.posthog) {
			posthog.identify(username, {
				username: username,
				$name: username
			});
		}
		
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
		game.load.image('start-button', 'assets/start-button.png');
		game.load.image('ranking-button', 'assets/ranking-button.png');
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
		
		// Start game function
		const startGame = function() {
			game.state.start('play');
		};
		
		// Add button and spacebar controls
		var btn = game.add.button(game.width/2,game.height/2,'btn', startGame);
		btn.anchor.setTo(0.5,0.5);
		
		// Add spacebar control
		var spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		spaceKey.onDown.addOnce(startGame);
	}
}

game.States.play = {
	create: function() {
		// Start recording when game starts
		if (window.posthog) {
			posthog.startSessionRecording();
		}
		this.bg = game.add.tileSprite(0,0,game.width,game.height,'background');
		this.pipeGroup = game.add.group();
		this.pipeGroup.enableBody = true;
		this.ground = game.add.tileSprite(0,game.height-112,game.width,112,'ground');
		
		// Position bird relative to screen width for desktop
		const birdX = game.isDesktop ? window.innerWidth * 0.2 : 50;
		this.bird = game.add.sprite(birdX, 150, 'bird');
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
		const pipeInterval = game.isDesktop ? 1000 : 900; // Reduced from 1500 to 1200 for desktop
		game.time.events.loop(pipeInterval, this.generatePipes, this);
		game.time.events.stop(false);

		// Make sure both input methods are properly bound
		game.input.onDown.addOnce(this.statrGame, this);
		this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.spaceKey.onDown.addOnce(this.statrGame, this);

		this.gameStartTime = null;  // Will be set when game actually starts
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
		if (this.hasStarted) return;
		
		this.gameIsOver = false;
		this.hasHitGround = false;
		this.hasStarted = true;
		this.score = 0;
		
		// Adjust game speed based on screen width for desktop
		if(game.isDesktop) {
			this.gameSpeed = 350 * (game.width / 1920); // Increased base speed for desktop
		} else {
			this.gameSpeed = 200;
		}

		this.bg.autoScroll(-(this.gameSpeed/10), 0);
		this.ground.autoScroll(-this.gameSpeed, 0);
		this.bird.body.gravity.y = 1150;
		this.readyText.destroy();
		this.playTip.destroy();

		// Add both input methods for flapping
		game.input.onDown.add(this.fly, this);
		this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.spaceKey.onDown.add(this.fly, this);

		game.time.events.start();

		this.gameStartTime = Date.now();  // Record when game actually starts
	},

	stopGame: function() {
		this.bg.stopScroll();
		this.ground.stopScroll();
		this.pipeGroup.forEachExists(function(pipe) {
			pipe.body.velocity.x = 0;
		}, this);
		this.bird.animations.stop('fly', 0);

		// Remove both input methods
		game.input.onDown.remove(this.fly, this);
		if (this.spaceKey) {
			this.spaceKey.onDown.remove(this.fly, this);
		}
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
		
		const username = localStorage.getItem('username');
		const gameDuration = this.gameStartTime ? Math.floor((Date.now() - this.gameStartTime) / 1000) : 0; // Duration in seconds
		
		try {
			if (typeof posthog !== 'undefined') {
				posthog.capture('game_completed', {
					username: username,
					score: this.score,
					duration_seconds: gameDuration
				});
			}
		} catch (e) {
			console.error('PostHog error:', e);
		}

		this.stopGame();
		this.saveScore(this.score);
		
		supabaseClient
			.from('scores')
			.select('score')
			.eq('username', username)
			.order('score', { ascending: false })
			.limit(1)
			.then(response => {
				if (response.error) {
					console.error('Error fetching best score:', response.error);
					this.showGameOverScreen(0); // Show 0 as best score if error
				} else {
					const bestScore = response.data.length > 0 ? response.data[0].score : 0;
					this.showGameOverScreen(bestScore);
				}
			})
			.catch(error => {
				console.error('Error:', error);
				this.showGameOverScreen(0); // Show 0 as best score if error
			});
	},

	showGameOverScreen: function(bestScore) {
		// Create game over group
		this.gameOverGroup = game.add.group();
		
		// Add game over elements to group
		var gameOverText = this.gameOverGroup.create(game.width/2, 0, 'game_over');
		var scoreboard = this.gameOverGroup.create(game.width/2, 70, 'score_board');
		
		// Add score texts
		var currentScoreText = game.add.bitmapText(game.width/2 + 60, 105, 'flappy_font', this.score+'', 20, this.gameOverGroup);
		var bestScoreText = game.add.bitmapText(game.width/2 + 60, 153, 'flappy_font', bestScore+'', 20, this.gameOverGroup);
		
		// Set anchors for game over elements
		gameOverText.anchor.setTo(0.5, 0);
		scoreboard.anchor.setTo(0.5, 0);
		
		// Position the group
		this.gameOverGroup.y = 30;

		// Create restart button (image only)
		this.restartBtn = game.add.button(game.width/2, game.height/2, 'start-button', this.restartGame, this);
		this.restartBtn.anchor.setTo(0.5, 0.5);
		
		// Add ranking button (image only)
		this.rankingBtn = game.add.button(game.width/2, game.height/2 + 80, 'ranking-button', function(){
			window.location.href = window.baseUrl;
		}, this);
		this.rankingBtn.anchor.setTo(0.5, 0.5);

		// Add spacebar control for restart
		this.spaceKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
		this.spaceKey.onDown.addOnce(this.restartGame, this);
	},

	saveScore: function(score) {
		const username = localStorage.getItem('username');
		
		if (!username) {
			console.error('Username not found');
			return;
		}

		// Generate a random user_id if needed
		const userId = Math.random().toString(36).substring(2) + Date.now().toString(36);

		console.log('Saving score:', {
			username: username,
			user_id: userId,
			score: score
		});

		supabaseClient
			.from('scores')
			.insert([
				{
					username: username,
					user_id: userId,
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

	generatePipes: function(gap) {
		// Adjust gap size based on platform
		if(game.isDesktop) {
			gap = 100; // Slightly larger than mobile but not too large
		} else {
			gap = gap || 100; // Original gap for mobile
		}
		
		const position = (505 - 320 - gap) + Math.floor((505 - 112 - 30 - gap - 505 + 320 + gap) * Math.random());
		const topPipeY = position - 360;
		const bottomPipeY = position + gap;

		if(this.resetPipe(topPipeY, bottomPipeY)) return;

		const startX = game.width;
		
		var topPipe = game.add.sprite(startX, topPipeY, 'pipe', 0, this.pipeGroup);
		var bottomPipe = game.add.sprite(startX, bottomPipeY, 'pipe', 1, this.pipeGroup);
		this.pipeGroup.setAll('checkWorldBounds', true);
		this.pipeGroup.setAll('outOfBoundsKill', true);
		this.pipeGroup.setAll('body.velocity.x', -this.gameSpeed);
	},

	resetPipe: function(topPipeY,bottomPipeY){//重置���了边界的管道，做到利用
		var i = 0;
		const startX = game.isDesktop ? game.width : game.width;
		
		this.pipeGroup.forEachDead(function(pipe){
			if(pipe.y<=0){ //topPipe
				pipe.reset(startX, topPipeY);
				pipe.hasScored = false; //重置为未得分
			}else{
				pipe.reset(startX, bottomPipeY);
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
	},

	// Add new method for restarting
	restartGame: function() {
		game.state.start('play');
	},

	shutdown: function() {
		// Make sure recording stops if game state changes
		if (window.posthog) {
			posthog.stopSessionRecording();
		}
		// ... any other shutdown code ...
	}
}

// Remove the separate 'over' state since we're handling game over in the play state
game.state.remove('over');

// Update the state additions at the bottom of the file
game.state.add('boot', game.States.boot);
game.state.add('preload', game.States.preload);
game.state.add('menu', game.States.menu);
game.state.add('play', game.States.play);
// Remove the 'over' state addition

game.state.start('boot'); //启动游戏

