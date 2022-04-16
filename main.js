import {SVGPathData} from "https://cdn.jsdelivr.net/npm/svg-pathdata@6.0.3/lib/SVGPathData.module.js";

function renderSVG() {
	var svgText = document.getElementById("pathText").value;
	document.getElementById("pathPreview").setAttribute("d", svgText);
	
	var pathData = new SVGPathData(svgText);
	var absolutePath = pathData.toAbs();
	
	var ptsgrp = document.getElementById("pointsGroup");
	while(ptsgrp.firstChild) {
		ptsgrp.removeChild(ptsgrp.firstChild);
	}
	
	// Calculate viewport
	var minx = absolutePath.commands[0].x ?? 9e999;
	var maxx = absolutePath.commands[0].x ?? -9e999;
	var miny = absolutePath.commands[0].y ?? 9e999;
	var maxy = absolutePath.commands[0].y ?? -9e999;
	
	for(var cmd of absolutePath.commands) {
		if(cmd.type != 1) {			
			minx = Math.min(cmd.x ?? minx, minx);
			miny = Math.min(cmd.y ?? miny, miny);
			maxx = Math.max(cmd.x ?? maxx, maxx);
			maxy = Math.max(cmd.y ?? maxy, maxy);
		}
	}
	
	var previewElt = document.getElementById("preview");
	
	var width = maxx-minx;
	var height = maxy-miny;
	var asp = previewElt.clientWidth/previewElt.clientHeight;
	var svgasp = width/height;
	
	// Update viewport
	width = width * 1.1 * Math.max(svgasp/asp, 1);
	height = width * 1.1 * Math.max(asp/svgasp, 1);
	
	previewElt.setAttribute("viewBox", (minx+maxx-width)/2+" "+(miny+maxy-height)/2+" "+width+" "+height);
	
	const scaleFactor = .004*width;
	
	var lastx = 0;
	var lasty = 0;
	// Add points
	for(var cmdidx in absolutePath.commands) {
		var cmd = absolutePath.commands[cmdidx];
		if(cmd.type != 1) {
			var pt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
			pt.setAttribute("r", 3*scaleFactor);
			pt.setAttribute("cx", cmd.x ?? lastx);
			pt.setAttribute("cy", cmd.y ?? lasty);
			pt.setAttribute("class", "point");
			pt.idx = cmdidx;
			pt.addEventListener("click", setStart);
			ptsgrp.appendChild(pt);
			
			minx = Math.min(cmd.x, minx);
			miny = Math.min(cmd.y, miny);
			maxx = Math.max(cmd.x, maxx);
			maxy = Math.max(cmd.y, maxy);
			
			lastx = cmd.x ?? lastx;
			lasty = cmd.y ?? lasty;
		}
	}
	
	document.getElementById("startPoint").setAttribute("cx", absolutePath.commands[0].x);
	document.getElementById("startPoint").setAttribute("cy", absolutePath.commands[0].y);
	document.getElementById("startPoint").setAttribute("r", 4*scaleFactor);	
	
	// Update line thickness
	document.getElementById("pathPreview").setAttribute("stroke-width", scaleFactor);
	
}

function setStart(e) {
	console.log(e.currentTarget.idx);
	
	var svgText = document.getElementById("pathText").value;
	var pathData = new SVGPathData(svgText);
	
	// 1. Recalculate m/M
	// 2. If we end with a z/Z, change to an l/L
	// 3. Reorder commands: Keep index 0, but move next n to end
}

document.addEventListener("DOMContentLoaded", e => {
	document.getElementById("pathText").addEventListener("input", renderSVG);
	renderSVG();
});