import { Setup } from './app/setup.class';
export class Main{
    setup:Setup;
    constructor(){
        this.setup = new Setup();
    }
}
var main = new Main();