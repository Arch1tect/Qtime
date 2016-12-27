function showAjaxMsg(msg, noTimeout) {

	if (typeof showAjaxMsgTimeout != 'undefined')
		clearTimeout(showAjaxMsgTimeout);
	$('#ajaxMsg').text(msg);
	$('#ajaxMsg').show();
	if (!noTimeout)
		showAjaxMsgTimeout = setTimeout(function(){$('#ajaxMsg').fadeOut();}, 3000);
}

function showErrorMsg(data) {
	var msg = 'Unknown';
	var error = 'Error';

	if (Cookies.get('lang')==='cn') {
		msg = '不详';
		error = '错误';
	}
	if (data && data.responseJSON)
		msg = data.responseJSON.error;

	showAjaxMsg(error + ": " + msg);
}

function successWrapper(callback) {

	return function(data, textStatus, jqXHR) {
		$('#ajaxMsg').hide();	
		$(".ajax-mask").hide();
		if (callback)
			callback(data, textStatus, jqXHR);
	}
}

function errorWrapper(callback) {

	
	return function(jqXHR, textStatus, errorThrown) {
		showErrorMsg(jqXHR);
		$(".ajax-mask").hide();
		if (callback)
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

function placeFooter() {
	    // var height = $('#leftWrapper').position().top+Math.max($('#leftWrapper').height(), $('#rightWrapper').height());
        var height = $('body').height();
        height = Math.max(height+30, $(window).height()-50);
        $('footer').css('top', height);
}













