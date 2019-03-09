class Player{
	static draw(ctx, x, y, r, color = 'black'){
		if(color){
			ctx.strokeStyle = this.selfColor;
		}
		ctx.beginPath();
		ctx.arc(x,y,r,0,2*Math.PI);
		ctx.stroke();
		ctx.strokeStyle = "black";
	}
}