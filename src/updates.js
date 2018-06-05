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
				updateStyle('notFilled_'+color,'width',(filledUp[color]?0:100-player[color].progress*100)+'%')
				updateElement('amountValue_'+color,format(player[color].amount)+(fillGain.rate[color]>10?'':' ('+Math.floor(player[color].progress*100)+'%)'))
				if (player[color].amount<costs.fillGain[color]) updateClass('fillGainUpgrade_'+color,'button_unaffordable')
				else updateClass('fillGainUpgrade_'+color,'button_'+color)
			}
			
			var showUpgrades=false
			if (color=='red') {
				if (player.green!=undefined) showUpgrades=true
			} else if (player.blue!=undefined) showUpgrades=true
			
			if (showUpgrades) {
				for (id=1;id<=upgradesLimit[color];id++) {
					if (!player[color].upgrades.includes(id)) {
						if (player[color].amount<costs.upgrades[color][id-1]) updateClass('upgrade_'+color+'_'+id,'button_unaffordable')
						else updateClass('upgrade_'+color+'_'+id,'button_'+color)
					}
				}
			}
		}
		
		if (player.green==undefined) {
			if (player.red.amount<1000) updateClass('unlockColorButton','button_unaffordable')
			else updateClass('unlockColorButton','button_red')
		} else if (player.blue==undefined) {
			if (player.green.amount<1000) updateClass('unlockColorButton','button_unaffordable')
			else updateClass('unlockColorButton','button_green')
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
				updateElement('fillGainRateIncrease_'+color,format(fillGain.rateIncrease[color],2))
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
			
			var showUpgrades=false
			if (color=='red') {
				if (player.green!=undefined) showUpgrades=true
			} else if (player.blue!=undefined) showUpgrades=true
			
			if (showUpgrades) {
				showElement('upgrades_'+color,'table-cell')
				for (id=1;id<=costs.upgrades[color].length;id++) {
					if (id>1) {
						if (id>upgradesLimit[color]) {
							hideElement('upgradeDescription_'+color+'_'+id)
						} else {
							showElement('upgradeDescription_'+color+'_'+id,'block')
						}
					}
					if (id<=upgradesLimit[color]) {
						updateElement('upgrade_'+color+'_'+id,'Cost: '+format(costs.upgrades[color][id-1]))
						if (player[color].upgrades.includes(id)) updateClass('upgrade_'+color+'_'+id,'upgrade_bought')
						else if (player[color].amount<costs.upgrades[color][id-1]) updateClass('upgrade_'+color+'_'+id,'button_unaffordable')
						else updateClass('upgrade_'+color+'_'+id,'button_'+color)
					}
				}
			} else hideElement('upgrades_red')
		}
		
		if (player.blue==undefined) {
			showElement('unlockColor','table-cell')
			if (player.green==undefined) updateElement('unlockColorDescription','Unlock green by spending with red.')
			else updateElement('unlockColorDescription','Unlock blue by spending with green.')
			updateElement('unlockColorButton','Cost: '+format(1e3))
		} else hideElement('unlockColor')
	}
}

function calculateFillGain(color) { fillGain.rate[color]=fillGain.rateBase[color]+fillGain.rateIncrease[color]*(player[color].fillGainLvl-1) }

function calculateFillGainBaseAndIncrease(color) {
	fillGain.rateBase[color]=fillGain.rateBaseBase[color]
	fillGain.rateIncrease[color]=fillGain.rateIncreaseBase[color]
	
	if (color=='red') {
		if (player.green!=undefined) {
			if (player.green.upgrades.includes(1)) {
				fillGain.rateBase[color]*=2
				fillGain.rateIncrease[color]*=2
			}
		}
		if (player.red.upgrades.includes(2)) {
			fillGain.rateIncrease[color]+=0.2
		}
	}
	if (color=='blue') {
		if (player.green.upgrades.includes(2)) {
			fillGain.rateBase[color]+=fillGain.rate.green*0.01
		}
	}
	if (player.blue!=undefined) {
		if (player.blue.upgrades.includes(1)) {
			fillGain.rateBase[color]*=2
			fillGain.rateIncrease[color]*=2
		}
	}
}

function upgradeFillGain(color) {
	if (player[color].amount>=costs.fillGain[color]) {
		player[color].amount-=costs.fillGain[color]
		costs.fillGain[color]=Math.round(10*Math.pow(getCostMultiplier(),player[color].fillGainLvl))
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
			calculateFillGainBaseAndIncrease('green')
			calculateFillGain('green')
			costs.fillGain.green=10
			
			updateDisplay('colors')
		}
	} else {
		if (player.green.amount>=1000) {
			player.green.amount-=1000
			player.blue={progress:0,amount:0,fillGainLvl:1,upgrades:[]}
			calculateFillGainBaseAndIncrease('blue')
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
		
		if (color=='red') {
			if (id==2) {
				calculateFillGainBaseAndIncrease('red')
				calculateFillGain('red')
			}
		}
		if (color=='green') {
			if (id==1) {
				calculateFillGainBaseAndIncrease('red')
				calculateFillGain('red')
			}
			if (id==2) {
				calculateFillGainBaseAndIncrease('blue')
				calculateFillGain('blue')
			}
		}
		if (color=='blue') {
			if (id==1) {
				calculateFillGainBaseAndIncrease('red')
				calculateFillGainBaseAndIncrease('green')
				calculateFillGainBaseAndIncrease('blue')
				calculateFillGain('red')
				calculateFillGain('green')
				calculateFillGain('blue')
				
				updateUpgradesLimit()
			}
			if (id==2) {
				for (color in colors) {
					color=colors[color]
					costs.fillGain[color]=Math.round(10*Math.pow(1.1,player[color].fillGainLvl-1))
				}
			}
		}
			
		updateDisplay('colors')
	}
}

function updateUpgradesLimit() {
	upgradesLimit.red=1
	upgradesLimit.green=1
	upgradesLimit.blue=1
	if (player.blue!=undefined) if (player.blue.upgrades.includes(1)) {
		upgradesLimit.red=2
		upgradesLimit.green=2
		upgradesLimit.blue=2
	}
}

function getCostMultiplier() {
	if (player.blue!=undefined) if (player.blue.upgrades.includes(2)) return 1.1
	return 1.2
}