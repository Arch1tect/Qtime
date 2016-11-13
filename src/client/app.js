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
			success: function (data) {
				qtime.$emit('login success');
			},
			error: function (data) {
				qtime.getPublicData();
			}
		});

	}else 
		qtime.getPublicData();

});




