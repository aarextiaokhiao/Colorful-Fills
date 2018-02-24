player={version:0.11,
build:1,
time:0,
timePlayed:0,
red:{points:0,progress:0}}

function save() {
	try {
		localStorage.setItem('saveIB',btoa(JSON.stringify(player)))
		console.log('Game saved!')
	} catch (e) {
		console.log('Well, we tried.')
	}
}

function load(savefile) {
	try {
		savefile=JSON.parse(atob(savefile))
		
		if (savefile.version==1&&savefile.build==1) savefile.version=0.11
		
		savefile.version=player.version
		savefile.build=player.build
		player=savefile
		console.log('Game loaded!')
	} catch (e) {
		console.log('Your save failed to load: '+e)
	}
}

function exportSave() {
	var savefile=btoa(JSON.stringify(player))
	showElement('exportSave','block')
	document.getElementById("exportText").value=btoa(JSON.stringify(player))
}

function importSave() {
	var input=prompt('Copy and paste in your exported file and press enter.')
	if (load(input)) {
		if (input!=null) {
			alert('Your save was invalid or caused a game-breaking bug. :(')
		}
	}
}

function reset() {
	if (confirm('Are you sure to reset your save? You can\'t undo your action!')) {
		player.red={points:0,progress:0}
		player.timePlayed=0
	}
}

function formatTime(s) {
	if (s < 1) {
		return Math.floor(s*1000)+' milliseconds'
	} else if (s < 60) {
		return Math.floor(s*100)/100+' seconds'
	} else if (s < 3600) {
		return Math.floor(s/60)+' minutes and '+Math.floor(s%60)+' seconds'
	} else if (s < 86400) {
		return Math.floor(s/3600)+' hours, '+Math.floor(s/60%60)+' minutes, and '+Math.floor(s%60)+' seconds'
	} else if (s < 2629746) {
		return Math.floor(s/86400)+' days, '+Math.floor(s/3600%24)+' hours, '+Math.floor(s/60%60)+' minutes, and '+Math.floor(s%60)+' seconds'
	} else if (s < 31556952) {
		return Math.floor(s/2629746)+' months, '+Math.floor(s%2629746/86400)+' days, '+Math.floor(s%2629746/3600%24)+' hours, '+Math.floor(s%2629746/60%60)+' minutes, and '+Math.floor(s%2629746%60)+' seconds'
	} else if (s < Number.POSITIVE_INFINITY) {
		return Math.floor(s/31556952)+' years, '+Math.floor(s/2629746%12)+' months, '+Math.floor(s%2629746/86400)+' days, '+Math.floor(s%2629746/3600%24)+' hours, '+Math.floor(s%2629746/60%60)+' minutes, and '+Math.floor(s%2629746%60)+' seconds'
	} else {
		return 'Infinite'
	}
}

function gameTick() {
	var newTime=new Date().getTime()
	if (player.time>0) {
		var diff=(newTime-player.time)/1000
		player.timePlayed+=diff
		player.red.progress+=diff
		
		var pointGain=Math.floor(player.red.progress)
		player.red.points+=pointGain
		player.red.progress-=pointGain
	}
	player.time=newTime
	
	updateElement('bar1number','Red: '+player.red.points)
	document.getElementById('bar1progress').style.width=(1-player.red.progress)*100+'%'
	
	if (currentTab=='stats') {
		updateElement('timePlayed','You have played this game for '+formatTime(player.timePlayed)+'.')
	}
}

function gameInit() {
	var tickspeed=0
	load(localStorage.getItem('saveIB'))
	updated=true
	setInterval(function(){
		if (updated) {
			updated=false
			setTimeout(function(){
				var startTime=new Date().getTime()
				try {
					gameTick()
				} catch (e) {
					console.log('A game error has been occured: '+e)
				}
				tickspeed=(new Date().getTime()-startTime)*0.2+tickspeed*0.8
				updated=true
			},tickspeed)
		}
	},50)
	setInterval(save,60000)
}