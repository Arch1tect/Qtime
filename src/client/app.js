$(document).ready(function(){


	$("#entryGrid").on("mouseover","td",function() {

		// highlight the row
		$(this).closest("tr").addClass("highlightRow");

		// only show tooltip for long content
		if ($(this)[0].scrollWidth > $(this).innerWidth()) 
			$(this).children(".contentTooltip").show();
	});
	$("#entryGrid").on("mouseout","td",function() {

		$(this).closest("tr").removeClass("highlightRow");

		$(this).children(".contentTooltip").hide();
	});
	
	// try to login

	username = Cookies.get('username')
	token = Cookies.get('token')

	if (username && token) {
		$.ajax({
			type: "POST",
			contentType : 'application/json',
			url: 'login',
			dataType: 'json',
			headers: {"Authorization": "Basic " + btoa(username + ":" + token)},
			success: function (data) {
				token = data.token;
				qtime.$emit('login', username, token);
				Cookies.set('username', username, { expires: 100 });
				Cookies.set('token', token, { expires: 30 });
				
			},
			error: function (data) {
				Cookies.remove('token');
				qtime.getPublicData();
			}
		});

	}else 
		qtime.getPublicData();

});




