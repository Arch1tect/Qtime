function showAjaxMsg(msg) {
	if (typeof showAjaxMsgTimeout != 'undefined')
		clearTimeout(showAjaxMsgTimeout);
	$('#ajaxMsg').text(msg);
	$('#ajaxMsg').fadeIn();
	showAjaxMsgTimeout = setTimeout(function(){$('#ajaxMsg').fadeOut();}, 3000);
}

function showErrorMsg(data) {
	showAjaxMsg("Error: " + data.responseJSON.error);
}

function qRequest(type, url, data, success, error) {
	var errorFunc = showErrorMsg;
	if (error)
		errorFunc = error;
	$.ajax({
		type: type,
		contentType : 'application/json',
		url: url,
		dataType: 'json',
		data: data,
		success: success,
		error: errorFunc
	});

}