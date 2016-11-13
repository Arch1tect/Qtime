function qRequest(type, url, data, success, error) {
	
	$.ajax({
		type: type,
		contentType : 'application/json',
		url: url,
		dataType: 'json',
		data: data,
		success: success,
		error: error
	});

}