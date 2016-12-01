var DURATION_MIN = 0;
var DURATION_MAX = 150;

// create duration slider
var durationSlider = document.getElementById('durationSlider');
var largerOrEqualToMax = "&infin;";
noUiSlider.create(durationSlider, {
  start: [ DURATION_MIN, DURATION_MAX ], // Handle start position
  step: 1, // Slider moves in increments of '10'
  margin: 5, // Handles must be more than '20' apart
  connect: true, // Display a colored bar between the handles
  behaviour: 'tap-drag', // Move handle on tap, bar is draggable
  range: { // Slider can select '0' to '100'
    'min': DURATION_MIN,
    'max': DURATION_MAX
  },
  tooltips: true,
  format: { 
    to: function ( value ) {
      if (value==DURATION_MAX)
        return largerOrEqualToMax;
      return Math.round(value);
    },
    from: function ( value ) {
      return Math.round(value);
    }
  }

});

// When the slider value changes, update the input and span
durationSlider.noUiSlider.on('update', function( values, handle ) {
  if (handle) {
    if (values[handle] === largerOrEqualToMax)
      qtime.durationMax = DURATION_MAX;
    else
      qtime.durationMax = values[handle];
  }else 
    qtime.durationMin = values[handle];
});