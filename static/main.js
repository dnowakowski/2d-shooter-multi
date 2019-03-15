const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

ctx.font = "12px arial"

const socket = io();
let game = null;

let pickableWeapons = {};


let allBullets = {};
let lastPlayersState = {};
let clientPlayer = {
	moving:{	
		up:false,
		down:false,
		left:false,
		right:false,
	},
};

	function drawGun(player){
		let gunX = player.relativeX - Math.cos(player.curDeg)*20;
		let gunY = player.relativeY - Math.sin(player.curDeg)*20;
		ctx.beginPath();
		ctx.moveTo(player.relativeX, player.relativeY);
		ctx.lineTo(gunX, gunY);
		ctx.stroke();
	}

socket.on('newPlayersState', (data) => {

	lastPlayersState = data;
	clientPlayer.x = data[socket.id].x;
	clientPlayer.y = data[socket.id].y;
	let playerCount = Object.keys(data).length;
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	drawAll(data);
	for(let player in data){
		drawScoreBoard(data[player], playerCount);
		if(!data[player].alive){ //actually dead players
			if( socket.id == player && (data[player].respawnDate - Date.now())/1000 >= 0){
				ctx.font = '60px Arial'
				ctx.fillText(`${Math.floor((data[player].respawnDate - Date.now())/1000)}`, canvas.width/2 - 10, 200)
				deathScreenHandler();
				ctx.font = '12px Arial'
			}
			continue;
		}
		let loopedPlayer = data[player];
		lastPlayersState[player].relativeX = loopedPlayer.x - data[socket.id].x + canvas.width/2;
		lastPlayersState[player].relativeY = loopedPlayer.y - data[socket.id].y + canvas.height/2;

		Player.draw(ctx, lastPlayersState[player].relativeX, lastPlayersState[player].relativeY, loopedPlayer.r, 'black');
		drawGun(lastPlayersState[player]);
	}

});

drawScoreBoard = ((player, playerCount) => {
	let iterator = 1;

	return (player, playerCount) =>{
		ctx.fillText(`${player.id.slice(0,4)}: ${player.kills}`, canvas.width - 50, 20*iterator);
		if(socket.id == player.id){
			ctx.beginPath();
			ctx.moveTo(canvas.width-50, 20*iterator + 3);
			ctx.lineTo(canvas.width-5, 20*iterator + 3)
			ctx.stroke();
		}
		iterator += 1;
		if(iterator > playerCount ){
			iterator = 1;
		}
	}

	return show;

})();

function drawBullets(bullets){
	for(let bullet in bullets){
		let loopedBullet = bullets[bullet];
		drawBullet(loopedBullet.x, loopedBullet.y, 1);
	}
}

function drawBullet(x,y,r){
		ctx.beginPath();
		ctx.arc(x-clientPlayer.x + canvas.width/2,y - clientPlayer.y + canvas.height/2,r,0,2*Math.PI);
		ctx.stroke();
}

function drawWeapons(weapons){
	for(let weapon in weapons){
		drawWeapon(pickableWeapons[weapon].x, pickableWeapons[weapon].y, pickableWeapons[weapon].name)
	}
}

function drawWeapon(x,y, name){	
	ctx.beginPath();
	ctx.arc(x-clientPlayer.x + canvas.width/2,y - clientPlayer.y + canvas.height/2,10,0,2*Math.PI);
	ctx.fill();
	let nameLength = name.length;
	ctx.fillText(name, x-clientPlayer.x + canvas.width/2 - nameLength*3.2, y - clientPlayer.y + canvas.height/2 + 20);
}

function writeAmmoState(player){
	ctx.fillText(`Ammo left: ${player.equippedWeapon.bulletsLeft.toString()}`, canvas.width - 75, canvas.height - 5);
}

function drawAll(data){
	drawWeapons(pickableWeapons);
	drawBullets(allBullets);
	writeAmmoState(data[socket.id]);
	drawEquipment(data[socket.id]);
}

function drawEquipment(player){
	drawEqWeapons(player.weapons)
}

function drawEqWeapons(weapons){ //todo
	for(let weapon in weapons){
	//		ctx.fillRect(100,0, 50, 20);
	}
}

socket.on('bulletsState', (bullets) => {
	allBullets = bullets;
});

socket.on('weaponsPosition', (weapons) => {
	pickableWeapons = weapons;
})


socket.on('playerDied', (id, respawnTime) =>{
	if(socket.id === id){
		clientPlayer.respawnTime = Date.now() + respawnTime;
	}
});

function deathScreenHandler(){
	ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
	ctx.fillRect(0,0, canvas.width, canvas.height);
	ctx.fillText("You Died, Wait for Respawn", 50, 50);
}

function getMovementFromKey(key){
	switch(key){
		case 'w':
			return clientPlayer.moving.up;
		break;
		case 's':
			return clientPlayer.moving.down;
		break;
		case 'a':
			return clientPlayer.moving.left;
		break;
		case 'd':
			return clientPlayer.moving.right;
		break;
	}
}

function keyHandler(key, keyDown){
	switch(key){
		case 'w':
			clientPlayer.moving.up = keyDown;
		break;
		case 's':
			clientPlayer.moving.down = keyDown;
		break;
		case 'a':
			clientPlayer.moving.left = keyDown;
		break;
		case 'd':
			clientPlayer.moving.right = keyDown;
		break;
	}
		socket.emit('movement', clientPlayer.moving);
}


function mouseMoveHandler(e){
	clientPlayer.mouseX = e.offsetX;
	clientPlayer.mouseY = e.offsetY;
	if(clientPlayer.mouseX && clientPlayer.mouseY){
		clientPlayer.requestedDeg = Math.atan2(canvas.height/2-clientPlayer.mouseY,canvas.width/2-clientPlayer.mouseX);
	}
	socket.emit('newRequestedDeg', clientPlayer.requestedDeg)
}

canvas.addEventListener('mousemove', (e) => {
	mouseMoveHandler(e);
});

document.addEventListener('keydown', (e) => {
	if(getMovementFromKey(e.key.toLowerCase()) == false)
	keyHandler(e.key.toLowerCase(), true);
});

document.addEventListener('keyup', (e) => {
	keyHandler(e.key.toLowerCase(), false);
});

canvas.addEventListener('mousedown', (e) => {
	socket.emit("mouseDown");
});

canvas.addEventListener('mouseup', (e) => {
	socket.emit('mouseUp')
});