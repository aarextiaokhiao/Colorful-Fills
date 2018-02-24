function showElement(id,type='inline') {
	document.getElementById(id).style.display=type
}

function hideElement(id) {
	document.getElementById(id).style.display='none'
}

function updateElement(id,message) {
	document.getElementById(id).innerHTML=message
}

function updateClass(id,className) {
	document.getElementById(id).className=className
}