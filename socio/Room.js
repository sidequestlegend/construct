var Room = function(){
    this.setup();
};
Room.prototype.setup=function(){
    this.scene = new Scene(this);
    this.dataChannel = new DataChannel(this);
    this.multiplayer = new MultiplayerMode(this);
    this.airmouse = new AirMouse(this);
    this.content = new Content(this);
    this.selfieCamera = new SelfieCamera(this);
    
    this.menu = new Menu(this);
    this.sphere = new Sphere(this._scene);
};