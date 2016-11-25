function showAjaxMsg(msg, noTimeout) {

	if (typeof showAjaxMsgTimeout != 'undefined')
		clearTimeout(showAjaxMsgTimeout);
	$('#ajaxMsg').text(msg);
	$('#ajaxMsg').show();
	if (!noTimeout)
		showAjaxMsgTimeout = setTimeout(function(){$('#ajaxMsg').fadeOut();}, 3000);
}

function showErrorMsg(data) {
	showAjaxMsg("Error: " + data.responseJSON.error);
}

function successWrapper(callback) {

	return function(data, textStatus, jqXHR) {
		$('#ajaxMsg').hide();	
		$(".ajax-mask").hide();
		callback(data, textStatus, jqXHR);
	}
}

function errorWrapper(callback) {

	
	return function(jqXHR, textStatus, errorThrown) {
		showErrorMsg(jqXHR);
		$(".ajax-mask").hide();
		callback(jqXHR, textStatus, errorThrown);
	};
}

function qRequest(msgBeforeRequest, type, url, data, success, error) {


	//display the a msg before ajax request
	showAjaxMsg(msgBeforeRequest, true);
	$(".ajax-mask").show();

	$.ajax({
		type: type,
		contentType : 'application/json',
		url: url,
		dataType: 'json',
		data: data,
		success: successWrapper(success),
		error: errorWrapper(error)
	});

}