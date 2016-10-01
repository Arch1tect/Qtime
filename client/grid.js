var DURATION_MIN = 0;
var DURATION_MAX = 200;
// var DURATION_INF = 'INF';

$.get("/api/data", function(jsonData, status){

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
        previousVal: '',
        sortOrders: sortOrders,
        durationMin: DURATION_MIN,
        durationMax: DURATION_MAX,
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


      startEdit: function(event) {
        $(event.target).addClass('editingBackground');
        previousVal = $.trim($(event.target).text());
      },

      cellContentChanged: function (event, entry) {
                
        $(event.target).removeClass('editingBackground');
        var val = $.trim($(event.target).text());
        if (val === previousVal)
          return;

        var colName = event.target.dataset.name;
        var rowIndex = qtime.$data.gridData.indexOf(entry);
        if(rowIndex<0){
          return; // user clicks deleted cell
        }

        // search to find real index back in gridData[], is there better way?

        // console.log('row '+rowIndex);
        // console.log('val '+val);
        
        
        //del row
        if (val==='xxx') {
          // delete qtimeData
          // console.log('deleting');
          qtime.$data.gridData.splice(rowIndex, 1);
          $.ajax({
            type: "DELETE",
            contentType : 'application/json',
            url: 'api/data',
            dataType: 'json',
            data: JSON.stringify({ "id": entry.id}),
            success: function () {}
          });

        }else{
          
          // console.log('assigning');
          qtime.$data.gridData[rowIndex][colName] = val;
          $(event.target).text(val); //added this line because of a bug
          // The bug is when adding a cell that's empty then edit that cell
          // the value can be saved correctly to gridData, but rendered twice,
          // so entering 'a' will show 'aa'

          //request server to update change
          $.ajax({
            type: "PUT",
            contentType : 'application/json',
            url: 'api/data',
            dataType: 'json',
            data: JSON.stringify({ "id": entry.id, "colName" :colName, "val": val }),
            success: function () {}
          });

        }

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
      gridData: jsonData.array,
      newEntryTitle: '',
      newEntryDuration: '',
      newEntryCategory: '',
      newEntryNote: ''
    },
    methods: {
      addEntry: function (event) {

        var newEntry = {
          title: this.newEntryTitle,
          duration: this.newEntryDuration, 
          category: this.newEntryCategory, 
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
        
        this.newEntryTitle = '';
        this.newEntryDuration = '';
        this.newEntryCategory = '';
        this.newEntryNote = '';
      }
    }
  })

  window.myQtime = qtime;

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
      qtime.$children[0].$set('durationMax',values[handle]);
    } else {
      qtime.$children[0].$set('durationMin',values[handle]);
    }
  });
    
});



