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

	// Go fetch the data
	// populate the grid and also category options
	$.get("/api/data", function(jsonData, status){
	  
	  var optionsSet = {};
	  // load categories into optionsArray
	  for (var i=0; i<jsonData.array.length; i++) {
	    var entry = jsonData.array[i];
	    if (! (entry.category in optionsSet))
	      optionsSet[entry.category] = true;
	  }

	  for (var key in optionsSet) {
	    optionsArray.push({'text':key, 'value': key});
	  }

	  qtime.gridData = jsonData['array'];
	    
	});


});