var optionsArray = [{'text': 'all category', 'value':''}];

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

    durationMin: 0,
    durationMax: 0,

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
      var gridData = this.gridData;
      var newEntry = {
        name: this.newEntryName,
        duration: this.newEntryDuration? parseInt(this.newEntryDuration): '', 
        category: this.newEntryCategory, 
        link: this.newEntryLink,
        note: this.newEntryNote
      };

      $.ajax({
          type: "POST",
          contentType : 'application/json',
          url: 'api/data',
          dataType: 'json',
          data: JSON.stringify(newEntry),
          success: function (data) {
            console.log('Add entry success, id: '+ data.id);
            newEntry.id = data.id;
            gridData.push(newEntry);
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
  
  //del whole entry
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


