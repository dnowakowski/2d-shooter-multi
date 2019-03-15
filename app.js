//TODO: RELOAD FOR R

const BULLET_SPEED = 10;
const BULLET_RANGE = 800;
const RESPAWN_TIME = 4000;

let bulletsFired = 0; //id
let pickableWeaponsCounter = 0;


const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

app.set('port', 5000);
app.use('/static', express.static(__dirname + '/static'));

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname + '/static/', 'index.html'));
});

server.listen(5000, () => {
	console.log('server started');
});


class Player{
	constructor(socketId){
		this.id = socketId;
		this.x = Math.random()*200;
		this.y = 0;
		this.r = 10;
		this.speed = 5;
		this.damage = 10;
		this.visionR = 100;
		this.alive = true;
		this.curDeg = -Math.PI/1.2;
		this.moving = {
			left: false,
			right: false,
			up: false,
			down: false,
		}
		this.rotatingLeft = false;
		this.rotatingRight = false;
		this.requestedDeg = this.curDeg;
		this.kills = 0;
		this.deaths = 0;
		this.mousePressed = false;
		this.alreadyFired = false;
		//0 - pistol 1 - rifle 2 - sniper 3 - shotgun
		this.resetWeapons()
		//this.equippedWeapon = new Shotgun(this.id, 10, 5, 550, 1, 300);
		//this.resetWeapons();
	}

	shoot(){
		this.equippedWeapon.attemptFire();
	}

	resetWeapons(){
		this.weapons = [];
		this.weapons.push(new SemiAutoWeapon("Glock", this.id, 10, 15, 150, 1, 300));
		this.equippedWeapon = this.weapons[0];
	}

	die(){
		this.alive = false;
		this.respawnDate = Date.now() + RESPAWN_TIME;
		this.resetWeapons();
		this.deaths += 1;
	}

	checkForRespawn(){
		if(Date.now() > this.respawnDate && !this.alive){
			this.respawn();
		}
	}

	respawn(){
		this.setRespawnPos();
		this.alive = true;
	}

	setRespawnPos(){
		this.x = Math.random()*200;
		this.y = Math.random()*0;
	}

	pickUpWeapon(weapon){
		this.weapons.push(weapon);
		this.equippedWeapon = weapon;
	}
}

class Game{
	constructor(){
		this.players = {};
		this.bullets = {};
		this.pickableWeapons = {};
	}
}

class Bullet{
	constructor(id, initX, initY, deg, speed, createdAt, parentId){
		this.id = id;
		this.parentId = parentId
		this.createdAt = createdAt;
		this.initX = initX;
		this.initY = initY;
		this.deg = deg;
		this.distancePassed = speed;
		this.speed = speed;
		this.x = this.initX - Math.cos(this.deg)*this.distancePassed;
		this.y = this.initY - Math.sin(this.deg)*this.distancePassed;
		this.maxRange = BULLET_RANGE;
	};


	updateMovement(){
		this.distancePassed += this.speed;
		this.x = this.initX - Math.cos(this.deg)*this.distancePassed;
		this.y = this.initY - Math.sin(this.deg)*this.distancePassed;
	}

	checkForDestroy(){
		if(this.distancePassed >= this.maxRange){
			this.destroy();
		}
	}

	destroy(){
		delete game.bullets[`bullet${this.id}`];
	}

	checkIfHit(object){	
		if(object.id != this.parentId && (this.x - object.x)**2 + (this.y - object.y)**2 < object.r**2 * 2){	// hitbox * 2.0
			return true;
		}
	}
}

class Weapon{
	constructor(name, ownerId = null, damage, ammoClip, shootingTimeout, bulletsPerShoot, reloadTime ){
		this.name = name;
		this.ownerId = ownerId;
		this.id = `weapon-${pickableWeaponsCounter}`
		if(!ownerId){
			game.pickableWeapons[this.id] = this;
		}
		this.type = 0;
		this.damage = damage;
		this.ammoClip = ammoClip;
		this.shootingTimeout = shootingTimeout;
		this.bulletsLeft = ammoClip;
		this.lastShootTime = 0;
		this.nextShootAvailable = 0;
		this.bulletsPerShoot = bulletsPerShoot;
		this.reloading = false;
		this.reloadTime = reloadTime
		this.timesFired = 0;
		this.pickedUp = false;
		this.x = Math.random()*500;
		this.y = Math.random()*500;
		pickableWeaponsCounter += 1;
	}

	checkIfPickedUp(by){
		if((this.x - by.x)**2 + (this.y - by.y)**2 < 14**2){
			return true;
		}
	}

	gotPickedUp(by){
		this.ownerId = by.id;
		this.pickedUp = true;
		by.pickUpWeapon(this);
		delete game.pickableWeapons[this.id];
	}

	fireBullet(relativeDeg){
		game.bullets[`bullet${bulletsFired}`] = new Bullet(bulletsFired, game.players[this.ownerId].x, game.players[this.ownerId].y, game.players[this.ownerId].curDeg + relativeDeg, BULLET_SPEED, Date.now(), this.ownerId);
		bulletsFired += 1;
	}

	fire(){
			this.lastShootTime = Date.now();
			this.nextShootAvailable = this.lastShootTime + this.shootingTimeout;
			this.bulletsLeft -= this.bulletsPerShoot;
			this.fireBullet(0);
			this.timesFired += 1;
			game.players[this.ownerId].alreadyFired = true
	}

	attemptFire(){
		if(!this.reloading && this.bulletsLeft >= 0 + this.bulletsPerShoot && Date.now() > this.nextShootAvailable){
			this.fire();
		}
	}

	reload(){
		this.reloading = true;
		setTimeout(() => {
			this.reloading = false;
			this.bulletsLeft = this.ammoClip;
		}, this.reloadTime);
	}
}

class SemiAutoWeapon extends Weapon{
		constructor(name, ownerId, type, damage, ammoClip, shootingRate){
		super(name, ownerId, type, damage, ammoClip, shootingRate);
	}

	attemptFire(){
		if(!game.players[this.ownerId].alreadyFired){
			super.attemptFire();
		}
	}
}


class AutoShotgun extends Weapon{
	constructor(name, ownerId, type, damage, ammoClip, shootingRate){
		super(name, ownerId, type, damage, ammoClip, shootingRate);

	}
	fire(){
		super.fire();
		this.fireBullet(0.05)
		this.fireBullet(0.1)
		this.fireBullet(-0.05)
		this.fireBullet(-0.1)
	}
	attemptFire(){
			super.attemptFire();
	}
}

class Shotgun extends AutoShotgun{
	constructor(name, ownerId, type, damage, ammoClip, shootingRate){
		super(name, ownerId, type, damage, ammoClip, shootingRate);
	}

	attemptFire(){
		if(!game.players[this.ownerId].alreadyFired){
			super.attemptFire();
		}
	}
}


const game = new Game();

io.on('connection',  (socket) => {
	socket.on('disconnect', () => {
		delete game.players[socket.id]
	});

	game.players[socket.id] = new Player(socket.id);
	socket.emit('playerAdded', game.players[socket.id]);

	socket.on('movement', (movementData) => {
		if(game.players[socket.id].alive == false){
			return;
		}
		if(game.players[socket.id])
		game.players[socket.id].moving = movementData;
	});

	socket.on('mouseDown', () =>{
		game.players[socket.id].mousePressed = true;
	});

	socket.on('mouseUp', () =>{
		game.players[socket.id].mousePressed = false;
		game.players[socket.id].alreadyFired = false;
	});

	socket.on('newRequestedDeg', (reqDeg) => {
		if(game.players[socket.id]){
			game.players[socket.id].requestedDeg = reqDeg;
			game.players[socket.id].curDeg = reqDeg;//mousePos = Aim pos
		}
	});

});



//main loop
setInterval(() => {
	io.sockets.emit('newPlayersState', game.players);	//TODO: emit only visible players position
	for(let player in game.players){	//players loop
		game.players[player].checkForRespawn();
		if(!game.players[player].alive){
			continue
		}
		updateMovement(game.players[player])
		processShooting(game.players[player]);
		//check if weapon picked up
		for(let weapon in game.pickableWeapons){
			if( game.pickableWeapons[weapon].checkIfPickedUp(game.players[player])){
				game.pickableWeapons[weapon].gotPickedUp(game.players[player]);
			}
		}
	}

	for(let bullet in game.bullets){
		game.bullets[bullet].updateMovement();
		game.bullets[bullet].checkForDestroy();
		for(let player in game.players){	//check for hit for every player
			if(game.bullets[bullet] && game.bullets[bullet].checkIfHit(game.players[player]) && game.players[player].alive){	//hit 
				io.sockets.emit('playerDied', player);
				game.players[player].die();
				let bulletParentId = game.bullets[bullet].parentId;
				if(game.players[game.bullets[bullet].parentId]){ //if player still in game
					game.players[game.bullets[bullet].parentId].kills += 1;
				}
				game.bullets[bullet].destroy();
				//delete game.players[player];
			}
		}
	}

	io.sockets.emit('weaponsPosition', game.pickableWeapons)

	io.sockets.emit('bulletsState', game.bullets);
}, 1000/60)




function updateMovement(player){
		if(player.moving.up){
			player.y -= player.speed;
		}
		if(player.moving.down){
			player.y += player.speed;
		}
		if(player.moving.left){
			player.x -= player.speed;
		}
		if(player.moving.right){
			player.x += player.speed;
		}
		return player;
}

function processShooting(player){
	if(player.mousePressed){
		player.shoot();
	}
}

//name, ownerId, type, damage, ammoClip, shootingRate
new Shotgun("Shotgun", this.id, 10, 5, 550, 1, 300);
new Shotgun("Shotgun", this.id, 10, 5, 550, 1, 300);
new Shotgun("Shotgun", this.id, 10, 5, 550, 1, 300);
new Shotgun("Shotgun", this.id, 10, 5, 550, 1, 300);
new AutoShotgun("Auto-Shotgun", this.id, 10, 7, 250, 1, 300);
new Weapon("AK-47", this.id, 15, 30, 100, 1, 300);
new Weapon("M4A1", this.id, 15, 20, 66, 1, 300);