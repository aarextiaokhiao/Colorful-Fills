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
						if (player.red.upgrades.includes(1)) extraGain=Math.min(totalGain*(player.green.upgrades.includes(3)?0.1:0.05),player.red.upgrades.includes(3)?Number.POSITIVE_INFINITY:delta)
					}
				} else filledUp[color]=false
			}
		}
		
		if (player.clockSpeed!=undefined) {
			multiplied=Math.cbrt(player.red.amount)*Math.cbrt(player.green.amount)*Math.cbrt(player.blue.amount)
			if (multiplied>=nextClockSpeedThreshold) {
				player.clockSpeed*=2
				nextClockSpeedThreshold=1e4*Math.pow(player.clockSpeed,3)
				updateDisplay("colors")
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
		
		if (player.clockSpeed!=undefined) {
			updateElement('multiplier_red',format(player.red.amount))
			updateElement('multiplier_green',format(player.green.amount))
			updateElement('multiplier_blue',format(player.blue.amount))
			updateElement('multiplied',format(multiplied))
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
				var averageFillGain=fillGain.rate[color]
				if (color=='green') if (player.red.upgrades.includes(1)) averageFillGain+=Math.min(fillGain.rate.red*(player.green.upgrades.includes(3)?0.1:0.05),player.red.upgrades.includes(3)?Number.POSITIVE_INFINITY:1)
				if (player[color].fillGainLvl<50*(player[color].ascension==undefined?2:2+player[color].ascension)) {
					updateElement('fillGainLvl_'+color,player[color].ascension==undefined?'Lv. '+player[color].fillGainLvl:player[color].fillGainLvl+', A'+player[color].ascension)
					updateElement('fillGainRate_'+color,format(averageFillGain,2)+'/s (+'+format(fillGain.rateIncrease[color],2)+'/s)')
					updateElement('fillGainUpgrade_'+color,'Cost: '+format(costs.fillGain[color]))
				} else {
					updateElement('fillGainLvl_'+color,'MAX'+(player[color].ascension==undefined?'':', A'+player[color].ascension))
					updateElement('fillGainRate_'+color,format(averageFillGain,2)+'/s')
					updateElement('fillGainUpgrade_'+color,'Ascend: '+format(costs.fillGain[color]))
				}
				if (player[color].ascension==undefined) hideElement('fillGainUpgradeAll_'+color)
				else showElement('fillGainUpgradeAll_'+color,'block')
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
			} else hideElement('upgrades_'+color)
		}
		
		if (player.blue==undefined) {
			showElement('unlockColor','table-cell')
			if (player.green==undefined) updateElement('unlockColorDescription','Unlock green by spending with red.')
			else updateElement('unlockColorDescription','Unlock blue by spending with green.')
			updateElement('unlockColorButton','Cost: '+format(1e3))
		} else hideElement('unlockColor')
		
		if (player.clockSpeed==undefined) hideElement('clock')
		else {
			showElement('clock','table-row')
			updateElement('clockSpeed',format(player.clockSpeed))
			updateElement('nextClockSpeedThreshold',format(nextClockSpeedThreshold))
		}
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
	if (player.blue!=undefined) {
		if (player.blue.upgrades.includes(1)) {
			fillGain.rateBase[color]*=2
			fillGain.rateIncrease[color]*=2
		}
	}
	if (player[color].ascension!=undefined) {
		fillGain.rateBase[color]*=Math.pow(2,player[color].ascension)
		fillGain.rateIncrease[color]*=Math.pow(2,player[color].ascension)
	}
	if (player.clockSpeed!=undefined) {
		fillGain.rateBase[color]*=player.clockSpeed
		fillGain.rateIncrease[color]*=player.clockSpeed
	}
	if (color=='blue') if (player.green.upgrades.includes(2)) fillGain.rateBase[color]+=fillGain.rate.green*0.01
}

function upgradeFillGain(color,buyAll=false) {
	if (player[color].amount>=costs.fillGain[color]) {
		var maxLevel=50*(player[color].ascension==undefined?2:2+player[color].ascension)
		if (player[color].fillGainLvl<maxLevel) {
			var buying=1
			if (buyAll) buying=Math.min(Math.floor(Math.log10(player[color].amount/costs.fillGain[color]*(costMultiplier-1)+1)/Math.log10(costMultiplier)),maxLevel-player[color].fillGainLvl)
			player[color].amount-=costs.fillGain[color]*(Math.pow(costMultiplier,buying)-1)/(costMultiplier-1)
			player[color].fillGainLvl+=buying
			costs.fillGain[color]=Math.round(10*Math.pow(costMultiplier,player[color].fillGainLvl-1))
		} else {
			player[color].amount=0
			costs.fillGain[color]=10
			player[color].fillGainLvl=0
			player[color].ascension=(player[color].ascension==undefined?1:player[color].ascension+1)
			calculateFillGainBaseAndIncrease(color)
			
			if (color=='red') if (player[color].ascension==1) updateUpgradesLimit()
		}
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
				costMultiplier=1.1
				for (color in colors) {
					color=colors[color]
					costs.fillGain[color]=Math.round(10*Math.pow(costMultiplier,player[color].fillGainLvl-1))
				}
			}
			if (id==3) {
				player.clockSpeed=1
				nextClockSpeedThreshold=1e4
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
	if (player.red.ascension!=undefined) {
		upgradesLimit.red=3
		upgradesLimit.green=3
		upgradesLimit.blue=3
	}
}