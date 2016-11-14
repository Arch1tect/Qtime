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
	
	// try to login if cookies are there, 
	// if login fail, fetch public data

	username = Cookies.get('username')
	token = Cookies.get('token')

	if (username && token) {

		qRequest('GET', 'token-login', null, 
			function() {qtime.$emit('login success')},
			function() {qtime.getPublicData(); Cookies.remove('token');}
		)

	}else 
		qtime.getPublicData();

});




