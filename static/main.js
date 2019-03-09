const gameDOM = document.querySelector('.game');
const ctx = gameDOM.getContext('2d');

class Game{
	constructor(){
		this.running = false;
		this.gameLoop = 0;
		this.frame = 0;
		this.characters = [];
		this.players = [];
		this.visibleChars = [];
	}

	start(){
		this.running = true;
		let update = this.update.bind(this)
		this.gameLoop = setInterval(update, 1000/60);
	}

	stop(){
		this.running = false;
		clearInterval(this.gameLoop);
	}

	update(){
		this.visibleChars = [];
		let aliveCharacters = [];
		ctx.clearRect(0, 0, gameDOM.offsetWidth, gameDOM.offsetHeight);
		this.characters.forEach(char => {
			char.update();
			if(char.checkVisibility()){
				this.visibleChars.push(char);
			}
			if(char.alive){
				aliveCharacters.push(char);
			}
		});

		this.characters =  aliveCharacters;

		this.visibleChars.forEach(char => {
			char.draw();
		});
		this.frame += 1;
	}

	addCharacter(char){
		if(char.alreadyAdded){
			console.log('Player already added')
			return false;
		}
		char.alreadyAdded = true;
		this.characters.push(char);
	}
}

class Character{
	constructor(x = 0, y = 0 ){
		this.x = x;
		this.y = y;
		this.relativeX = 0;
		this.relativeY = 0;
		this.alreadyAdded = false;
		this.mouseX = 0;
		this.mouseY = 0;
		this.r = 10;
		this.damage = 10;
		this.speed = 5;
		this.visionR= 100;
		this.curDeg = -Math.PI/1.2;
		this.rotateLeft = false;
		this.rotateRight = false;
		this.rotatingSpeed = 0.1;
		this.bullets = [];
		this.alive = true;
		this.health = 100;
		this.circularSectorColor = 'rgba(255, 255, 0, 0.5)';
		this.drawRangeOn = true;
		this.meele = false;
	}

	rotatingHandler(){
		this.correctDegreeToMousePosition();
		this.rotate();
		this.updateRotatingDirection();
	}

	correctDegreeToMousePosition(){
		let correction = Math.abs(this.requestedDeg) - Math.abs(this.curDeg);
		if(this.curDeg / this.requestedDeg > 0 && (correction > 0 && correction < this.rotatingSpeed || correction < 0 && correction > -0.1 )){
			this.curDeg = this.requestedDeg
		}
	}

	rotate(){
		if(this.rotateRight){
			this.curDeg += this.rotatingSpeed;
		}
		else if(this.rotateLeft){
			this.curDeg -= this.rotatingSpeed;
		}
	}

	update(){
		if(this.alive){	
			this.rotatingHandler();
			this.updateBullets();
			this.updateMovement();
			this.checkHealthBarVisibility();
		}

	}

	updateRotatingDirection(){
		if(this.curDeg < this.requestedDeg - this.rotatingSpeed && (Math.PI - this.curDeg + this.requestedDeg)/2 < Math.PI  || this.curDeg - Math.PI >= this.requestedDeg){
			if(this.curDeg > this.requestedDeg && this.curDeg > Math.PI){
				this.curDeg = 0 - this.curDeg 
			}
			this.rotateRight = true;
			this.rotateLeft = false;
		}
		else if(this.curDeg > this.requestedDeg + this.rotatingSpeed || this.curDeg + Math.PI < this.requestedDeg){
			if(this.curDeg < -Math.PI && this.curDeg < this.requestedDeg){
				this.curDeg += (2*Math.PI)
			}
			this.rotateLeft = true;
			this.rotateRight = false;
		}
		else{
			this.rotateLeft = false;
			this.rotateRight = false;
		}
	}

	updateBullets(){
		this.bullets = this.bullets.filter(bullet => bullet.exist)

		this.bullets.forEach(bullet => {
			bullet.update();
			bullet.draw();
		});
	}

	updateMovement(){
		this.updateRelativePosTo(player);
		this.selfMovement();
	}

	selfMovement(){
		if(this.movingLeft){
			this.x -= this.speed;
		}
		if(this.movingRight){
			this.x += this.speed;
		}
		if(this.movingUp){
			this.y -= this.speed;
		}
		if(this.movingDown){
			this.y += this.speed;
		}
	}

	updateRelativePosTo(player){
		if(this == player){
			this.relativeX = gameDOM.width / 2;
			this.relativeY = gameDOM.height / 2;
		}
		else{	
			this.relativeX = this.x - player.x + gameDOM.width/2;
			this.relativeY = this.y - player.y + gameDOM.height/2;
		}
	}

	checkHealthBarVisibility(){
		this.healthBarDisplayed = (this.healthBarExpire && this.healthBarExpire > game.frame);
	}

	checkVisibility(){
		return this.relativeX - this.r - this.visionR < gameDOM.width && this.relativeX + this.r + this.visionR > 0 && this.relativeY + this.r + this.visionR > 0 && this.relativeY - this.relativeY - this.visionR < gameDOM.height;
	}

	draw(){
		if(this.alive){
			ctx.strokeStyle="0";
			this.drawSelf();
			this.drawRange();
			this.drawGun();
			this.drawHealthBar();
		}
		//console.log(Math.atan2(this.y-this.mouseY,this.x-this.mouseX))
	}

	drawSelf(){
		if(this.selfColor){
			ctx.strokeStyle = this.selfColor;
		}
		ctx.beginPath();
		ctx.arc(this.relativeX,this.relativeY,this.r,0,2*Math.PI);
		ctx.stroke();
		ctx.strokeStyle = "black";
	}

	drawRange(){
		if(this.drawRangeOn){	
			ctx.beginPath();
			ctx.moveTo(this.relativeX, this.relativeY);
			let line1x = this.relativeX - Math.cos(this.curDeg+(30*360/Math.PI))*this.visionR;
			let line1y = this.relativeY - Math.sin(this.curDeg+(30*360/Math.PI))*this.visionR;
			ctx.lineTo(line1x, line1y);
			ctx.moveTo(this.relativeX, this.relativeY);
			let line2x = this.relativeX - Math.cos(this.curDeg-(30*360/Math.PI))*this.visionR;
			let line2y = this.relativeY - Math.sin(this.curDeg-(30*360/Math.PI))*this.visionR;
			ctx.lineTo(line2x, line2y);
			ctx.arc(this.relativeX,this.relativeY,this.visionR, this.curDeg - 3.98,Math.atan2(line2y - line1y, line2x - line1x) - 3.87);
			ctx.fillStyle = this.circularSectorColor;
			ctx.fill();
			ctx.fillStyle = "black"
		}
	}

	drawGun(){
		let gunX = this.relativeX - Math.cos(this.curDeg)*20;
		let gunY = this.relativeY - Math.sin(this.curDeg)*20;
		ctx.beginPath();
		ctx.moveTo(this.relativeX, this.relativeY);
		ctx.lineTo(gunX, gunY);
		ctx.stroke();
	}

	drawHealthBar(){
		if(this.healthBarDisplayed){
			let healthBarPosX = this.relativeX - 50;
			let healthBarPosY = this.relativeY - 40;

			ctx.rect(healthBarPosX, healthBarPosY, 100, 10);
			ctx.fillStyle = 'green';
			ctx.fillRect(healthBarPosX, healthBarPosY,this.health,10);
			ctx.stroke();
			ctx.fillStyle = 'black';
		}
	}

	movingUpStart(){
		this.movingUp = true;
	}

	movingDownStart(){
		this.movingDown = true;
	}

	movingLeftStart(){
		this.movingLeft = true;
	}

	movingRightStart(){
		this.movingRight= true;
	}

	movingUpStop(){
		this.movingUp = false;
	}

	movingDownStop(){
		this.movingDown = false;
	}

	movingLeftStop(){
		this.movingLeft = false;
	}

	movingRightStop(){
		this.movingRight= false;
	}


	shoot(){
		this.bullets.push(new Bullet(this));
	}

	takeDamage(by){	//
		this.health -= by.damage
		if(this.health <= 0){
			this.alive = false;
			return;
		}
		this.healthBarDisplayed = true;
		this.healthBarExpire = game.frame + 70;
	}

}


class Player extends Character{
	constructor(x, y){
		super(x, y);
		game.players.push(this);
		this.circularSectorColor = 'rgba(0, 0, 255, 0.8)'
	}

	addControls(e){
		gameDOM.addEventListener('mousemove', (e) => {
			this.mouseHandler(e);
		});

		gameDOM.addEventListener('mousedown', (e) => {
			if(!this.meele){
				this.shoot();
			}
			else{
				this.slice();
			}
		});

		document.addEventListener('keydown', (e) => {
			this.keydownHandler(e);
		});

		document.addEventListener('keyup', (e) => {
			this.keyupHandler(e);
		});
	}

	mouseHandler(e){
		this.mouseX = e.offsetX;
		this.mouseY = e.offsetY;
		if(this.mouseX && this.mouseY){
			this.requestedDeg = Math.atan2(this.relativeY-this.mouseY,this.relativeX-this.mouseX);
		}
	}

	keydownHandler(e){
		switch(e.code){
			case "KeyW":
				this.movingUpStart();
			break;

			case "KeyS":
				this.movingDownStart();
			break;

			case "KeyA":
				this.movingLeftStart();
			break;

			case "KeyD":
				this.movingRightStart();
			break;
		}
	}

	keyupHandler(e){
		switch(e.code){
			case "KeyW":
				this.movingUpStop();
			break;

			case "KeyS":
				this.movingDownStop();
			break;

			case "KeyA":
				this.movingLeftStop();
			break;

			case "KeyD":
				this.movingRightStop();
			break;
		}
	}
}

class Enemy extends Character{
	constructor(x, y){
		super(x, y);
		this.circularSectorColor = 'rgba(255, 0, 0, 0.8)'
	}

	update(){
		super.update();
		this.findPlayer();
		this.moveTowardPlayer();
	}

	moveTowardPlayer(){
		if(player.x < this.x){
			this.movingLeftStart();
		}
		else{
			this.movingLeftStop();
		}
		if(player.x > this.x){
			this.movingRightStart();
		}
		else{
			this.movingRightStop();
		}
		if(player.y < this.y){
			this.movingUpStart();
		}
		else{
			this.movingUpStop();
		}
		if(player.y > this.y){
			this.movingDownStart();
		}
		else{
			this.movingDownStop();
		}
	}


	findPlayer(){
		this.requestedDeg = Math.atan2(this.y-player.y,this.x-player.x)	
	}
}

class Bullet{
	constructor(parent){
		this.parent = parent;
		this.exist = true;
		this.deg = parent.curDeg;
		this.speed = 20;
		this.liveTime = Math.sqrt(gameDOM.width**2 + gameDOM.height**2)/this.speed;
		this.frameEnd = game.frame +  this.liveTime;
		this.distancePassed = 10;
		this.startX = this.parent.x;
		this.startY = this.parent.y;
	}

	update(){
		if(game.frame > this.frameEnd){
			this.exist = false
		}
		if(this.exist){
			//bullet still exists
			this.distancePassed += this.speed;
			this.x = this.startX - Math.cos(this.deg)*this.distancePassed;
			this.y = this.startY - Math.sin(this.deg)*this.distancePassed;
			this.updateRelativePosTo(player);
			this.checkForAnyHit();
		}
	}

	updateRelativePosTo(player){
		this.relativeX = this.x - player.x + gameDOM.width/2;
		this.relativeY = this.y - player.y + gameDOM.height/2;
	}

	checkForAnyHit(){
		game.characters.forEach(char => {
			if((this.x - char.x)**2 + (this.y - char.y)**2 < char.r**2 * 2 && this.exist){	// hitbox * 2.0
				this.handleHit(char);
				return true;
			}
		});
	}

	handleHit(object){
		//object.dosomething
		console.log('woo');
		this.exist = false;
		object.takeDamage(this.parent);
	}

	draw(){
		if(this.exist){
			//bullet still exists

			ctx.beginPath();
			ctx.arc(this.relativeX,this.relativeY,1,0,2*Math.PI);
			ctx.stroke();
		}
	}
}

class Zombie extends Enemy{
	constructor(x,y,speed){
		super();
		this.selfColor = "green";
		this.circularSectorColor = "rgba(0,95,0,0.5)";
		this.speed = speed;
		this.x = x;
		this.y = y;
		this.drawRangeOn = false;
	}

	update(){
		super.update();
		this.moveTowardPlayer();
		this.findPlayer();
	}
	moveTowardPlayer(){
		let desiredX = this.x - Math.cos(this.curDeg)*this.speed;
		let desiredY = this.y - Math.sin(this.curDeg)*this.speed;
		for(let i = 0; i < game.characters.length; i+= 1){	//non blocking
			let zombie = game.characters[i];
			if((zombie.x - desiredX)**2 + (zombie.y - desiredY)**2 < zombie.r**2  && zombie != this){
				return
			}
		}
			this.x = desiredX;
			this.y = desiredY;
	}
}


const game = new Game;
let player = new Player(0, 0);
new Character;
game.addCharacter(player);
player.addControls();
game.start();

let testChar = new Character(20, 50)
game.addCharacter(testChar);


for(let i = 0; i < 400; i+= 1){	
	setTimeout(() => {
		game.addCharacter(new Zombie(Math.random()*1000, Math.random()*1000, Math.random()*2+1));
		//game.addCharacter(new Zombie(0,0,1));
	}, i*5)
}

//let enemyTest = new Enemy(213, 7)
//game.addCharacter(enemyTest);