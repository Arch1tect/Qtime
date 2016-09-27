var DURATION_MIN = 0;
var DURATION_MAX = 200;


// register the grid component
Vue.component('qtime-grid', {
  template: '#grid-template',
  props: {
    data: Array,
    columns: Array,
    filterKey: String

  },
  data: function () {
    var sortOrders = {}
    this.columns.forEach(function (key) {
      sortOrders[key] = 1
    })
    return {
      sortKey: '',
      sortOrders: sortOrders,
      durationMin: 0,
      durationMax: 99,
      selectedCategory: [],
      options: [
        { text: 'None', value: '' },
        { text: 'Movie', value: 'movie' },
        { text: 'Anime', value: 'anime' },
        { text: 'Show', value: 'show' }
      ],
    }
  },
  methods: {

    sortBy: function (key) {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    },

    filterByDuration: function (entry) {
      var durMax = this.durationMax === 'INF' ? 99999 : this.durationMax;
      return entry.duration >= this.durationMin && entry.duration <= durMax;
    },

    filterByCategory: function (entry) {
      // If the entry's category is in the selected categories array, keep the entry
      var i=0;
      for (; i<this.selectedCategory.length; i++) {

        if (entry.category === this.selectedCategory[i]||this.selectedCategory[i]==='')
          return true;
      }

      if (!i) return true;

      return false;
    }
  }
})

// bootstrap the qtime
var qtime = new Vue({
  el: '#qtime',
  data: {
    searchQuery: '',
    gridColumns: ['title', 'duration', 'category', 'note'],
    gridData: [

      { title: 'Watchmen', duration: 186, category: 'movie', note: 'Hulu'},
      { title: 'Mob Psycho 100', duration: 25, category: 'anime', note: 'Bilibili'},
      { title: 'Intersteller', duration: 150, category: 'movie', note: 'Hulu'},
      { title: '东京暗响', duration: 25, category: 'anime', note: 'Hulu'},
      { title: 'South Park', duration: 20, category: 'show', note: 'Hulu'},
      { title: '齐神', duration: 5, category: 'anime', note: 'Bilibili'}
    ]
  }
})

// create duration slider
var durationSlider = document.getElementById('durationSlider');

noUiSlider.create(durationSlider, {
  start: [ 0, 100 ], // Handle start position
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
      if(value>=DURATION_MAX)
        return 'INF';
    return value;
    },
    from: function ( value ) {
      return value;
    }
  }

});
// When the slider value changes, update the input and span
durationSlider.noUiSlider.on('update', function( values, handle ) {
  if ( handle ) {
    qtime.$children[0].$set('durationMax',values[handle]);
  } else {
    qtime.$children[0].$set('durationMin',values[handle]);
  }
});



