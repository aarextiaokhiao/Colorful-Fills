function gameTick() {
	var tickTime=new Date().getTime()
	if (player.lastTick>0) {
		if (simulated) var delta=simulatedTickLength
		else {
			var delta=(tickTime-player.lastTick)/1000
			sinceLastSave=Math.floor((tickTime-lastSave)/1000)
		}
		if (sinceLastSave>59) {
			saveGame()
		}
		player.statistics.playtime+=delta
		
		var extraGain=0
		for (color in colors) {
			color=colors[color]
			if (player[color]!=undefined) {
				player[color].progress+=delta*fillGain.rate[color]+extraGain
				extraGain=0
				if (player[color].progress>=1) {
					var totalGain=Math.floor(player[color].progress)
					player[color].amount+=totalGain
					player[color].progress-=totalGain
					if (player.statistics[color+'Total']==undefined) player.statistics[color+'Total']=totalGain
					else player.statistics[color+'Total']+=totalGain
					filledUp[color]=true
					
					if (color=='red') {
						if (player.red.upgrades.includes(1)) extraGain=Math.min(totalGain*0.05,delta)
					}
				} else filledUp[color]=false
			}
		}
				
		if (simulated) return
	}
	player.lastTick=tickTime
	
	if (currentTab!=oldTab) {
		hideElement('tab_'+oldTab)
		showElement('tab_'+currentTab,currentTab=='colors'?'table':'inline-block')
		updateClass('tabButton_'+oldTab,'')
		updateClass('tabButton_'+currentTab,'button_tabChosen')
		oldTab=currentTab
		
		hideElement('exportSave')
	}
	if (currentTab=='colors') {
		for (color in colors) {
			color=colors[color]
			if (player[color]!=undefined) {
				updateStyle('notFilled_'+color,'height',(filledUp[color]?0:100-player[color].progress*100)+'%')
				updateElement('amountValue_'+color,format(player[color].amount))
				if (player[color].amount<costs.fillGain[color]) updateClass('fillGainUpgrade_'+color,'button_unaffordable')
				else updateClass('fillGainUpgrade_'+color,'button_'+color)
			}
		}
		
		if (player.green==undefined) {
			if (player.red.amount<1000) updateClass('unlockColorButton','button_unaffordable')
			else updateClass('unlockColorButton','button_red')
		} else if (player.blue==undefined) {
			if (player.green.amount<1000) updateClass('unlockColorButton','button_unaffordable')
			else updateClass('unlockColorButton','button_green')
		}
		
		if (player.green!=undefined) {
			for (id=1;id<=costs.upgrades.red.length;id++) {
				updateElement('upgrade_red_'+(id),'Cost: '+format(costs.upgrades.red[id-1]))
				if (!player.red.upgrades.includes(id)) {
					if (player.red.amount<costs.upgrades.red[id-1]) updateClass('upgrade_red_'+id,'button_unaffordable')
					else updateClass('upgrade_red_'+id,'button_red')
				}
			}
		}
		if (player.blue!=undefined) {
			for (id=1;id<=costs.upgrades.green.length;id++) {
				updateElement('upgrade_green_'+(id),'Cost: '+format(costs.upgrades.green[id-1]))
				if (!player.green.upgrades.includes(id)) {
					if (player.green.amount<costs.upgrades.green[id-1]) updateClass('upgrade_green_'+id,'button_unaffordable')
					else updateClass('upgrade_green_'+id,'button_green')
				}
			}
		}
	}
	if (currentTab=='options') {
		updateElement('saveGame','Save ('+(sinceLastSave==1?'a second':sinceLastSave+' seconds')+' ago)')
	}
	if (currentTab=='statistics') {
		updateElement('statsValue_Playtime',formatTime(player.statistics.playtime))
		for (color in colors) {
			color=colors[color]
			if (player.statistics[color+'Total']==undefined) hideElement('stats_'+color+'Total')
			else {
				showElement('stats_'+color+'Total','table-row')
				updateElement('statsValue_'+color+'Total',format(player.statistics[color+'Total']))
			}
		}
	}
}

function updateDisplay(tab) {
	if (tab=='colors') {
		for (color in colors) {
			color=colors[color]
			if (player[color]!=undefined) {
				updateElement('fillGainLvl_'+color,player[color].fillGainLvl)
				updateElement('fillGainRate_'+color,format(fillGain.rate[color],2))
				var fillGainRateIncreaseTemp=fillGain.rateIncrease[color]
				if (player.green!=undefined) if (color=='red') if (player.green.upgrades.includes(1)) fillGainRateIncreaseTemp*=2
				updateElement('fillGainRateIncrease_'+color,format(fillGainRateIncreaseTemp,2))
				updateElement('fillGainUpgrade_'+color,'Cost: '+format(costs.fillGain[color]))
			}
			if (color!='red') {
				if (player[color]!=undefined) {
					showElement('fill_'+color,'table-cell')
					showElement('amount_'+color,'table-cell')
					showElement('fillGain_'+color,'table-cell')
				} else {
					hideElement('fill_'+color)
					hideElement('amount_'+color)
					hideElement('fillGain_'+color)
				}
			}
		}
		
		if (player.blue==undefined) {
			showElement('unlockColor','table-cell')
			if (player.green==undefined) updateElement('unlockColorDescription','Unlock green by spending with red.')
			else updateElement('unlockColorDescription','Unlock blue by spending with green.')
			updateElement('unlockColorButton','Cost: '+format(1e3))
		} else hideElement('unlockColor')
		
		if (player.green==undefined) hideElement('upgrades_red')
		else {
			showElement('upgrades_red','table-cell')
			for (id=1;id<=costs.upgrades.red.length;id++) {
				updateElement('upgrade_red_'+id,'Cost: '+format(costs.upgrades.red[id-1]))
				if (player.red.upgrades.includes(id)) updateClass('upgrade_red_'+id,'upgrade_bought')
			}
		}
		if (player.blue==undefined) hideElement('upgrades_green')
		else {
			showElement('upgrades_green','table-cell')
			for (id=1;id<=costs.upgrades.green.length;id++) {
				updateElement('upgrade_green_'+id,'Cost: '+format(costs.upgrades.green[id-1]))
				if (player.green.upgrades.includes(id)) updateClass('upgrade_green_'+id,'upgrade_bought')
			}
		}
	}
}

function calculateFillGain(color) {
	var fillGainTemp
	if (color=='red') {
		fillGainTemp=(player.red.fillGainLvl+4)/5
		if (player.green!=undefined) if (player.green.upgrades.includes(1)) fillGainTemp*=2
	} else if (color=='green') fillGainTemp=(player.green.fillGainLvl+4)/50
	else fillGainTemp=(player.blue.fillGainLvl+4)/500
	
	fillGain.rate[color]=fillGainTemp
}

function upgradeFillGain(color) {
	if (player[color].amount>=costs.fillGain[color]) {
		player[color].amount-=costs.fillGain[color]
		costs.fillGain[color]=Math.round(10*Math.pow(1.5,player[color].fillGainLvl))
		player[color].fillGainLvl++
		calculateFillGain(color)
		
		updateDisplay('colors')
	}
}

function unlockColor() {
	if (player.green==undefined) {
		if (player.red.amount>=1000) {
			player.red.amount-=1000
			player.green={progress:0,amount:0,fillGainLvl:1,upgrades:[]}
			calculateFillGain('green')
			costs.fillGain.green=10
			
			updateDisplay('colors')
		}
	} else {
		if (player.green.amount>=1000) {
			player.green.amount-=1000
			player.blue={progress:0,amount:0,fillGainLvl:1,upgrades:[]}
			calculateFillGain('blue')
			costs.fillGain.blue=10
			
			updateDisplay('colors')
		}
	}
}

function buyUpgrade(color,id) {
	if (player[color].amount>=costs.upgrades[color][id-1]&&!player[color].upgrades.includes(id)) {
		player[color].amount-=costs.upgrades[color][id-1]
		player[color].upgrades.push(id)
		
		if (color=='green'||id==2) calculateFillGain('red')
			
		updateDisplay('colors')
	}
}