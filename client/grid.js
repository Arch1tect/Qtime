var DURATION_MIN = 0;
var DURATION_MAX = 200;

// var Events = new Vue({}); //for components communicaion, or just use root vue


var optionsArray = [{'text': 'all category', 'value':''}];

// register the grid component
Vue.component('qtime-grid', {
  template: '#grid-template',
  props: {
    data: Array,
    columns: Array,
    filterKey: String

  },
  data: function () {
    var sortOrders = {};
    this.columns.forEach(function (key) {
      sortOrders[key] = 1;
    })
    return {
      sortKey: '',
      previousVal: '',
      sortOrders: sortOrders,
      durationMin: DURATION_MIN,
      durationMax: DURATION_MAX
    }
  },
  methods: {

    renderCellHTML: function (entry, key) {

      var val = entry[key];
      if (key === 'link') {
        val = "<a src='"+val+"'>url</a>";
      }

      return val;
    },

    sortBy: function (key) {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    },

    filterByDuration: function (entry) {
      if (isNaN(entry.duration))
        return true;
      return entry.duration >= this.durationMin && ( this.durationMax === DURATION_MAX || entry.duration <= this.durationMax );
    },

    filterByCategory: function (entry) {
      // If the entry's category is in the selected categories array, keep the entry
      var i=0;
      for (; i<this.$parent.selectedCategory.length; i++) {

        if (entry.category === this.$parent.selectedCategory[i]||this.$parent.selectedCategory[i]==='')
          return true;
      }

      if (!i) return true;

      return false;
    }
  }
})


Vue.component('modal', {
  template: '#modal-template',
  props: {
    header: String,
    cellval: {twoWay: true} // wonder if this is discouraged by vue.js
  }
})

// bootstrap the qtime
var qtime = new Vue({
  el: '#qtime',
  data: {
    showModal: false,
    editCellName: '',
    editCellVal: '',
    editEntry: '',

    searchQuery: '',
    gridColumns: ['name', 'duration', 'category', 'link', 'note'],
    gridData: [],


    newEntryName: '',
    newEntryDuration: '',
    newEntryCategory: '',
    newEntryLink: '',
    newEntryNote: '',

    newEntryCandidates: [], // parse from imdb
    options: optionsArray,
    selectedCategory: []

  },
  watch: {

  },
  methods: {


    newEntryNameChanged: function(event){
      // only fired when user input, on keyup
      var query = this.newEntryName.replace(/\s+/g, '+').toLowerCase();
      if (!query)
        return;
      var that = this;
      $.get("http://www.omdbapi.com/?s="+query, 
        function(jsonData, status){
          if (jsonData.Search){
            that.newEntryCandidates = jsonData.Search;
            $('#addEntryCandidate').show();
          }
          console.log("omdb: "+status);
      })

    },
    pickCandidate: function (candidate) {
      this.newEntryName = candidate.Title;
      this.newEntryCategory = candidate.Type;
      this.newEntryLink = "http://www.imdb.com/title/"+candidate.imdbID;
      if (candidate.Year)
        this.newEntryNote = "Made in " + candidate.Year;
      this.newEntryCandidates = [];
      $('#addEntryCandidate').hide();
    },
    addEntry: function (event) {

      var newEntry = {
        name: this.newEntryName,
        duration: parseInt(this.newEntryDuration), 
        category: this.newEntryCategory, 
        link: this.newEntryLink,
        note: this.newEntryNote
      };

      var that = this;
      $.ajax({
          type: "POST",
          contentType : 'application/json',
          url: 'api/data',
          dataType: 'json',
          data: JSON.stringify(newEntry),
          success: function (data) {
            console.log('Add entry success, id: '+ data.id);
            newEntry.id = data.id;
            that.gridData.push(newEntry);
          }
        });
      
      this.newEntryName = '';
      this.newEntryDuration = '';
      this.newEntryLink = '';
      this.newEntryCategory = '';
      this.newEntryNote = '';
    }
  }
})

qtime.$on('edit', function (entry, key) {
  this.editEntry = entry;
  this.editCellName = key;
  this.editCellVal = entry[key];
  this.showModal = true;
});

qtime.$on('save', function () {

  var entry = this.editEntry;
  var key = this.editCellName;
  var val = this.editCellVal;


  if (key === 'duration')
    val = parseInt(val);

  //del whole
  if (val==='xxx') {
    
    console.log('deleting entry');

    $.ajax({
      type: "DELETE",
      contentType : 'application/json',
      url: 'api/data',
      dataType: 'json',
      data: JSON.stringify({ "id": entry.id}),
      success: function () {
        qtime.$data.gridData.$remove(entry); //TODO: better way to access?
      },
      error: function () {
        alert('error');
      }
    });

  }else{
    
    console.log('changing entry value');
    
    //request server to update change
    $.ajax({
      type: "PUT",
      contentType : 'application/json',
      url: 'api/data',
      dataType: 'json',
      data: JSON.stringify({ "id": entry.id, "colName" :key, "val": val }),
      success: function () {
        entry[key] = val;
      },
      error: function () {
        alert('error');
      }
    });

  }

  this.showModal = false;

});

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
  if ( handle ) {
    // change this code asap, very bad to assume grid component is the first child component
    qtime.$children[0].$set('durationMax',values[handle]);
  } else {
    qtime.$children[0].$set('durationMin',values[handle]);
  }
});

$(document).on("mouseover","td",function() {
   // only show tooltip for long content
  if ($(this)[0].scrollWidth > $(this).innerWidth()) 
    $(this).children(".contentTooltip").show();
   
});
$(document).on("mouseout","td",function() {
 
  $(this).children(".contentTooltip").hide();
  
});
// Go fetch the data
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

  qtime.$set('gridData', jsonData['array']);

    
});



