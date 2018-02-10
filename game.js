player={version:1,
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
		player.timePlayed=0
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
	
	document.getElementById('bar1number').innerHTML='Red: '+player.red.points
	document.getElementById('bar1progress').style.width=(1-player.red.progress)*100+'%'
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
	},0)
	setInterval(save,60000)
}