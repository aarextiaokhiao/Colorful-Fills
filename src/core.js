function showElement(elementID,style) {
	document.getElementById(elementID).style.display=style
}
	
function hideElement(elementID) {
	document.getElementById(elementID).style.display='none'
}
	
function moveElement(elementID,moveTo) {
	document.getElementById(moveTo).appendChild(document.getElementById(elementID))
}
	
function updateClass(elementID,value) {
	document.getElementById(elementID).className=value
}
	
function updateStyle(elementID,styleID,value) {
	document.getElementById(elementID).style[styleID]=value
}

function updateElement(elementID,value) {
	document.getElementById(elementID).innerHTML=value
}

function switchTab(id) {
	currentTab=id
}

function format(value,dpBefore1000) {
	if (value == Number.POSITIVE_INFINITY) return '&#x221e;'
	if (Number.isNaN(value)) return '?'
	if (value<9.995) {
		return value.toFixed(dpBefore1000)
	} else if (value<99.95) {
		return value.toFixed(Math.max(dpBefore1000-1,0))
	} else if (value<999.5) {
		return value.toFixed(Math.max(dpBefore1000-2,0))
	} else if (player.options.notation!=3) {
		var exponent=Math.floor(Math.log10(value))
		var mantissa=value/Math.pow(10,exponent)
		if (mantissa>9.995) {
			mantissa=1
			exponent++
		}
		if (player.options.notation!=0) {
			var difference=exponent%3
			var group=(exponent-difference)/3
			mantissa=mantissa*Math.pow(10,difference)
		}
	}
	if (player.options.notation==0) {
		//Scientific
		return mantissa.toFixed(2)+'e'+exponent
	} else if (player.options.notation==1) {
		//Engineering
		return mantissa.toFixed(2-difference)+'e'+group*3
	} else if (player.options.notation==2) {
		//Standard
		return mantissa.toFixed(2-difference)+standardAbbs[group-1]
	} else if (player.options.notation==3) {
		//Logarithm
		return 'e'+Math.log10(value).toFixed(2)
	} else if (player.options.notation==4) {
		//Letters
		return mantissa.toFixed(2-difference)+lettersAbbs[group-1]
	} else if (player.options.notation==5) {
		//Mobile
		return mantissa.toFixed(2-difference)+mobileAbbs[group-1]
	}
	return '?'
}

function formatTime(s) {
	if (s < 1) {
		if (s < 0.002) return '1 millisecond'
		return Math.floor(s*1000)+' milliseconds'
	} else if (s < 59.5) {
		if (s < 1.005) return '1 second'
		return s.toPrecision(2)+' seconds'
	} else if (s < Number.POSITIVE_INFINITY) {
		var timeFormat=''
		var lastTimePart=''
		var needAnd=false
		var needComma=false
		for (id in timeframes) {
			if (id=='second') {
				s=Math.floor(s)
				if (s>0) {
					if (lastTimePart!='') {
						if (timeFormat=='') {
							timeFormat=lastTimePart
							needAnd=true
						} else {
							timeFormat=timeFormat+', '+lastTimePart
							needComma=true
						}
					}
					lastTimePart=s+(s==1?' second':' seconds')
				}
			} else if (id=='year') {
				var amount=Math.floor(s/31556952)
				if (amount>0) {
					s-=amount*31556952
					lastTimePart=format(amount,2,1)+(amount==1?' year':' years')
				}
			} else {
				var amount=Math.floor(s/timeframes[id])
				if (amount>0) {
					s-=amount*timeframes[id]
					if (lastTimePart!='') {
						if (timeFormat=='') {
							timeFormat=lastTimePart
							needAnd=true
						} else {
							timeFormat=timeFormat+', '+lastTimePart
							needComma=true
						}
					}
					lastTimePart=amount+' '+id+(amount==1?'':'s')
				}
			}
		}
		return timeFormat+(needComma?',':'')+(needAnd?' and ':'')+lastTimePart
	} else {
		return 'eternity'
	}
}

function loadGame() {
	var undecodedSave=localStorage.getItem("MTUyNzg4MDAyOTg4OA==")
	if (undecodedSave==null) gameLoopInterval=setInterval(gameLoop,50)
	else loadSave(undecodedSave)
	updateStyle('loading','top','-100%')
	setTimeout(function(){hideElement('loading')},2000)
	gameLoop()
}

function saveGame() {
	try {
		localStorage.setItem("MTUyNzg4MDAyOTg4OA==",btoa(JSON.stringify(player)))
		lastSave=new Date().getTime()
	} catch (e) {
		console.log('A error has been occurred while saving:')
		console.error(e)
	}
}

function loadSave(savefile) {
	clearInterval(gameLoopInterval)
		
	try {
		savefile=JSON.parse(atob(savefile))
		
		if (savefile.version<=1) {
			if (savefile.beta<3) {
				for (color in colors) {
					color=colors[color]
					if (player[color]!=undefined) player[color].fillGainLvl=Math.min(player[color].fillGainLvl,100)
				}
			}
		}
		
		if (savefile.version>player.version) throw 'This savefile, which has version '+savefile.version+' saved, was incompatible to version '+player.version+'.'
		else if (savefile.version==player.version) {
			if (savefile.beta>player.beta) throw 'This savefile, which has beta '+savefile.beta+' saved, was incompatible to beta '+player.beta+'.'			
		}
		savefile.version=player.version
		savefile.beta=player.beta
		
		player=savefile
		
		if (player.blue!=undefined) if (player.blue.upgrades.includes(2)) costMultiplier=1.1
		for (color in colors) {
			color=colors[color]
			if (player[color]!=undefined) {
				costs.fillGain[color]=Math.round(10*Math.pow(costMultiplier,player[color].fillGainLvl-1))
				calculateFillGainBaseAndIncrease(color)
				calculateFillGain(color)
			}
		}
		if (player.clockSpeed!=undefined) nextClockSpeedThreshold=1e4*Math.pow(player.clockSpeed,3)
		updateUpgradesLimit()
		updateDisplay('colors')
		
		updateElement('option_notation','Notation: '+notationArray[player.options.notation])
		updateElement('option_updateRate','Update rate: '+(player.options.updateRate==Number.MAX_VALUE?'Unlimited':player.options.updateRate+' TPS'))
		
		hideElement('exportSave')
		
		tickAfterSimulated=new Date().getTime()
		simulated=true
		simulatedTickLength=(tickAfterSimulated-player.lastTick)/1e6
		simulatedTicksLeft=1000
		while (simulatedTicksLeft>0) {
			gameTick()
			simulatedTicksLeft--
		}
		simulated=false
		player.lastTick=tickAfterSimulated
		maxMillisPerTick=1000/player.options.updateRate
		saveGame()
	} catch (e) {
		console.log('A error has been occurred while loading:')
		console.error(e)
	}
	
	gameLoopInterval=setInterval(gameLoop,maxMillisPerTick)
}

function exportSave() {
	var savefile=btoa(JSON.stringify(player))
	showElement('exportSave','block')
	document.getElementById("exportText").value=btoa(JSON.stringify(player))
}

function importSave() {
	var savefile=prompt('Copy and paste in your exported file and press enter.')
	if (savefile!='') loadSave(savefile)
}

function resetGame() {
	if (confirm("Are you sure to reset the game? Everything would be lost!")) {
		clearInterval(gameLoopInterval)
			
		player.red={progress:0,amount:0,fillGainLvl:1,upgrades:[]}
		delete player.green
		delete player.blue
		delete player.clockSpeed
		player.statistics={playtime:0}
		player.options={notation:0,
			updateRate:20}
		player.lastTick=new Date().getTime()
			
		filledUp={}
		costs={fillGain:{red:10},upgrades:{red:[5000,2e4,3e5],green:[2000,1e4,3e4],blue:[25,100,2e3]}}
		fillGain={rate:{red:1},rateIncrease:{red:0.2},rateBase:{red:1},rateBaseBase:{red:1,green:0.1,blue:0.01},rateIncreaseBase:{red:0.2,green:0.05,blue:0.01}}
		upgradesLimit={red:1,green:1,blue:1}
		costMultiplier=1.2

		updateDisplay('colors')
	
		updateElement('option_notation','Notation: Scientific')
		updateElement('option_updateRate','Update rate: 20 TPS')
		
		localStorage.clear("MTUyNzg4MDAyOTg4OA==")
		
		hideElement('exportSave')
		
		gameLoopInterval=setInterval(gameLoop,maxMillisPerTick)
		saveGame()
	}
}

function changeUpdateRate() {
	clearInterval(gameLoopInterval)
	
	player.options.updateRate+=5
	if (player.options.updateRate==Number.MAX_VALUE) player.options.updateRate=5
	if (player.options.updateRate==65) player.options.updateRate=Number.MAX_VALUE
	
	updateElement('option_updateRate','Update rate: '+(player.options.updateRate==Number.MAX_VALUE?'Unlimited':player.options.updateRate+' TPS'))
	
	maxMillisPerTick=1000/player.options.updateRate
	gameLoopInterval=setInterval(gameLoop,maxMillisPerTick)
}

function switchNotation() {
	player.options.notation++
	if (player.options.notation==notationArray.length) player.options.notation=0
		
	updateDisplay('colors')
	
	updateElement('option_notation','Notation: '+notationArray[player.options.notation])
}

function gameLoop() {
	if (tickDone) {
		tickDone=false
		setTimeout(function(){
			var startTime=new Date().getTime()
			try {
				gameTick()
			} catch (e) {
				console.log('A game error has occured:')
				console.error(e)
			}
			tickSpeed=Math.max((new Date().getTime()-startTime)*0.2+tickSpeed*0.8,maxMillisPerTick)
			startTime=new Date().getTime()
			tickDone=true
		},tickSpeed-maxMillisPerTick)
	}
}