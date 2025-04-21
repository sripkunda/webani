import { WebaniFPSDisplay } from "../rendering/webani-fps-display.class";
import { LoadCanvas } from "../api/animate";

const __canvas__ = document.querySelector("canvas");
__canvas__.width = window.innerWidth;
__canvas__.height = window.innerHeight;
const __webaniCanvas__ = await LoadCanvas({ canvas: __canvas__ });
new WebaniFPSDisplay(document.querySelector("#fps"), __webaniCanvas__);