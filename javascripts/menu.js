currentTab='bars'

function switchTab(id) {
	if (currentTab=='bars') {
		document.getElementById('otherTab').style.top='5em'
	} else {
		hideElement('tab'+currentTab)
	}
	updateClass(currentTab+'button','long')
	currentTab=id
	if (currentTab=='bars') {
		document.getElementById('otherTab').style.top='-100%'
	} else {
		showElement('tab'+currentTab)
	}
	updateClass(currentTab+'button','long chosen')
}