var DURATION_MIN = 0;
var DURATION_MAX = 200;

// create duration slider
var durationSlider = document.getElementById('durationSlider');

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
      return value;
    },
    from: function ( value ) {
      return value;
    }
  }

});

// When the slider value changes, update the input and span
durationSlider.noUiSlider.on('update', function( values, handle ) {
  if ( handle ) 
    qtime.durationMax = values[handle];
   else 
    qtime.durationMin = values[handle];
});