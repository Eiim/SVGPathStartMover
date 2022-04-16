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
		if(cmd.type != SVGPathData.CLOSE_PATH) {
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
	const idx = e.currentTarget.idx;
	
	var svgText = document.getElementById("pathText").value;
	var pathData = new SVGPathData(svgText);
	
	console.log(JSON.parse(JSON.stringify(pathData.commands)));
	
	// 1. Recalculate m/M
	var startx = 0;
	var starty = 0;
	
	for(var i = 0; i <= idx; i++) {
		if(pathData.commands[i].relative) {
			startx += pathData.commands[i].x ?? 0;
			starty += pathData.commands[i].y ?? 0;
		} else {
			startx = pathData.commands[i].x ?? startx;
			starty = pathData.commands[i].y ?? starty;
		}
	}
	
	const origx = pathData.commands[0].x;
	const origy = pathData.commands[0].y;
	
	pathData.commands[0].x = startx;
	pathData.commands[0].y = starty;
	
	console.log(JSON.parse(JSON.stringify(pathData.commands)));
	
	// 2. If we end with a z/Z, change to an L
	// Otherwise, create an L back home or things will break
	if(pathData.commands[pathData.commands.length-1].type == SVGPathData.CLOSE_PATH) {
		pathData.commands[pathData.commands.length-1].type = SVGPathData.LINE_TO;
		pathData.commands[pathData.commands.length-1].relative = false;
		pathData.commands[pathData.commands.length-1].x = origx;
		pathData.commands[pathData.commands.length-1].y = origy;
	} else {
		pathData.commands.push({type: SVGPathData.LINE_TO, relative: false, x: origx, y: origy});
	}
	
	console.log(JSON.parse(JSON.stringify(pathData.commands)));
	
	// 3. Reorder commands: Keep index 0, but move next n to end
	
	const mComm = pathData.commands.shift();
	for(var i = 0; i < idx; i++) {
		pathData.commands.push(pathData.commands.shift());
	}
	pathData.commands.unshift(mComm);
	
	console.log(JSON.parse(JSON.stringify(pathData.commands)));
	
	// Put data back
	document.getElementById("pathText").value = pathData.sanitize().encode();
	renderSVG();
}

document.addEventListener("DOMContentLoaded", e => {
	document.getElementById("pathText").addEventListener("input", renderSVG);
	renderSVG();
});