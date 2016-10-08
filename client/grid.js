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
    filterKey: String,
    selectedCategory: Array,
    durationMin: Number,
    durationMax: Number

  },
  data: function () {
    var sortOrders = {};
    this.columns.forEach(function (key) {
      sortOrders[key] = 1;
    })
    return {
      sortKey: '',
      sortOrders: sortOrders
    }
  },

  computed: {
    filteredData: function () {
      var sortKey = this.sortKey
      var filterKey = this.filterKey && this.filterKey.toLowerCase()
      var order = this.sortOrders[sortKey] || 1
      var data = this.data
      var durationMin = this.durationMin;
      var durationMax = this.durationMax;
      var selectedCategory = this.selectedCategory;
      // filter search key
      if (filterKey) {
        data = data.filter(function (row) {
          return Object.keys(row).some(function (key) {
            return String(row[key]).toLowerCase().indexOf(filterKey) > -1
          })
        })
      }
      // filter duration
      data = data.filter(function(entry){
        if (!entry.duration||isNaN(entry.duration))
          return true;
        var dur = parseInt(entry.duration);
        return dur >= durationMin && ( durationMax === DURATION_MAX || dur <= durationMax );
      });

      // filter category
      if (selectedCategory.length > 0 && selectedCategory.indexOf("") ==-1) {

        data = data.filter(function (entry) {
          // If the entry's category is in the selected categories array, keep the entry
          return selectedCategory.indexOf(entry.category) > -1 ;
        });
      }

      if (sortKey) {
        data = data.slice().sort(function (a, b) {
          a = a[sortKey]
          b = b[sortKey]
          return (a === b ? 0 : a > b ? 1 : -1) * order
        })
      }
      return data
    }
  },
  filters: {
    capitalize: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1)
    }
  },
  methods: {

    sortBy: function (key) {
      this.sortKey = key
      this.sortOrders[key] = this.sortOrders[key] * -1
    }
  }
})


Vue.component('modal', {
  template: '#modal-template',
  props: {
    header: String,
    cellObj: Object
  }
})

// bootstrap the qtime
var qtime = new Vue({
  el: '#qtime',
  data: {
    showModal: false,
    editCellName: '',
    editCellValObj: {},
    editEntry: '',

    searchQuery: '',
    gridColumns: ['name', 'duration', 'category', 'link', 'note'],
    gridData: [],

    durationMin: DURATION_MIN,
    durationMax: DURATION_MAX,

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
  ready: function () {
    document.addEventListener("keydown", (e) => {

      if (e.keyCode == 27) {

        // close cadidates drop down
        this.closeCandidateDropdown();

        // close edit cell modal
        this.showModal = false;
      }
    })


  },
  methods: {


    newEntryNameChanged: function(event){
      // only fired when user input, on keyup

      if (event.keyCode == 27 || event.keyCode == 32) //except esc and space button
        return;

      var query = this.newEntryName.replace(/\s+/g, '+').toLowerCase();
      if (!query)
        return;

      var that = this;
      $.get("http://www.omdbapi.com/?s="+query, 
        function(jsonData, status){
          that.newEntryCandidates = [];
          if (jsonData.Search){
            that.newEntryCandidates = jsonData.Search;
            $('#addEntryCandidate').show();
          }
          console.log("omdb: "+status);
      })

    },
    closeCandidateDropdown: function () {

      // here we have to use setTimeout because when click on a candidate
      // blur event is fired before click event, so click event won't really be fired
      setTimeout(function() {
        this.newEntryCandidates = [];
        $('#addEntryCandidate').hide();
      },200);

    },
    pickCandidate: function (candidate) {
      console.log('click candidate');
      console.log(candidate);
      this.newEntryName = candidate.Title;
      this.newEntryCategory = candidate.Type;
      this.newEntryLink = "http://www.imdb.com/title/"+candidate.imdbID;
      if (candidate.Year)
        this.newEntryNote = "Made in " + candidate.Year;
      this.closeCandidateDropdown();
    },
    addEntry: function (event) {

      var newEntry = {
        name: this.newEntryName,
        duration: this.newEntryDuration? parseInt(this.newEntryDuration): '', 
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
  this.editCellValObj = {val:entry[key]}; // hacky way, wonder what's better way
  this.showModal = true;

  Vue.nextTick(function () {
    $('textarea').focus();
    $('textarea').select();
  });

});

qtime.$on('save', function () {

  var entry = this.editEntry;
  var key = this.editCellName;
  var val = this.editCellValObj.val; // hacky way, wonder what's better way
  



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
        qtime.gridData.splice(qtime.gridData.indexOf(entry),1);
      },
      error: function () {
        alert('error');
      }
    });

  }else{
    if (val && key === 'duration')
      val = parseInt(val);
    console.log('changing entry value from '+entry[key]+'to '+val);
    
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
  if ( handle ) 
    qtime.durationMax = values[handle];
   else 
    qtime.durationMin = values[handle];
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

  qtime.gridData = jsonData['array'];
    
});



